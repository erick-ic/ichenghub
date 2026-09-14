import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { incrementCounter, decrementCounter } from '@/lib/counter';
import { withMetrics } from '@/app/actions/withMetrics';
import { trackResourceAction } from '@/app/actions/statsActions';
import { auth } from '../../../../auth';

export const dynamic = 'force-dynamic';

type FavoriteResourceType = 'BLOG' | 'PROMPT';

interface FavoriteResponse {
  success: boolean;
  favorited: boolean;
  favoritesCount: number;
  requiresLogin?: boolean;
  message?: string;
}

// 统一用户收藏开关：只接受资源类型 + 资源 ID，userId 一律由服务端会话解析。
// 收藏关系与全局计数在同一个事务内提交，保证一致。
const POST = withMetrics(async function POST(request: Request) {
  let body: { resourceType?: unknown; resourceId?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, favorited: false, favoritesCount: 0, message: '请求参数无效' },
      { status: 400 },
    );
  }

  const resourceType = body.resourceType as FavoriteResourceType;
  const resourceId = typeof body.resourceId === 'string' ? body.resourceId : '';

  if (resourceType !== 'BLOG' && resourceType !== 'PROMPT') {
    return NextResponse.json(
      { success: false, favorited: false, favoritesCount: 0, message: '不支持的收藏类型' },
      { status: 400 },
    );
  }
  if (!resourceId) {
    return NextResponse.json(
      { success: false, favorited: false, favoritesCount: 0, message: '缺少资源 ID' },
      { status: 400 },
    );
  }

  // 用户身份只来自服务端会话，禁止信任请求体中的 userId
  let userId: string | null = null;
  try {
    const session = await auth();
    userId = session?.user?.id ?? null;
  } catch (authError) {
    console.error('[favorite] auth resolve failed:', authError);
  }

  try {
    // 校验资源存在且已发布，同时取当前计数
    let favoritesCount = 0;
    if (resourceType === 'PROMPT') {
      const prompt = await prisma.prompt.findFirst({
        where: { id: resourceId, status: 1 },
        select: { favorites: true },
      });
      if (!prompt) {
        return NextResponse.json(
          { success: false, favorited: false, favoritesCount: 0, message: '提示词不存在或未发布' },
          { status: 404 },
        );
      }
      favoritesCount = prompt.favorites;
    } else {
      const blog = await prisma.blog.findFirst({
        where: { id: resourceId, status: 1 },
        select: { favorites: true },
      });
      if (!blog) {
        return NextResponse.json(
          { success: false, favorited: false, favoritesCount: 0, message: '博客不存在或未发布' },
          { status: 404 },
        );
      }
      favoritesCount = blog.favorites;
    }

    // 所有收藏操作均需登录：未登录不写任何数据，返回 requiresLogin 由前端引导登录
    if (!userId) {
      return NextResponse.json({
        success: true,
        favorited: false,
        favoritesCount,
        requiresLogin: true,
      } satisfies FavoriteResponse);
    }

    const existing =
      resourceType === 'PROMPT'
        ? await prisma.userPromptFavorite.findUnique({
            where: { userId_promptId: { userId, promptId: resourceId } },
            select: { userId: true },
          })
        : await prisma.userBlogFavorite.findUnique({
            where: { userId_blogId: { userId, blogId: resourceId } },
            select: { userId: true },
          });

    let favorited: boolean;

    if (existing) {
      // 已收藏 → 删除关系并将计数减 1（同一事务；count > 0 守卫防止减成负数）
      await prisma.$transaction(async (tx) => {
        if (resourceType === 'PROMPT') {
          await tx.userPromptFavorite.delete({
            where: { userId_promptId: { userId, promptId: resourceId } },
          });
          // 计数只改数字，不触发 @updatedAt 刷新；内置 >0 守卫防止减成负数
          await decrementCounter(tx, 'Prompt', 'favorites', resourceId);
        } else {
          await tx.userBlogFavorite.delete({
            where: { userId_blogId: { userId, blogId: resourceId } },
          });
          await decrementCounter(tx, 'Blog', 'favorites', resourceId);
        }
      });
      favorited = false;
    } else {
      // 未收藏 → 建关系并计数加 1；并发双击若撞联合主键唯一约束，按“已收藏”处理且不重复计数
      try {
        await prisma.$transaction(async (tx) => {
          if (resourceType === 'PROMPT') {
            await tx.userPromptFavorite.create({
              data: { userId, promptId: resourceId },
            });
            // 计数只改数字，不触发 @updatedAt 刷新
            await incrementCounter(tx, 'Prompt', 'favorites', resourceId);
          } else {
            await tx.userBlogFavorite.create({
              data: { userId, blogId: resourceId },
            });
            await incrementCounter(tx, 'Blog', 'favorites', resourceId);
          }
        });
      } catch (createError) {
        if (
          createError instanceof Prisma.PrismaClientKnownRequestError &&
          createError.code === 'P2002'
        ) {
          // 并发重复创建：关系已存在，计数保持不变
          const current =
            resourceType === 'PROMPT'
              ? await prisma.prompt.findUniqueOrThrow({
                  where: { id: resourceId },
                  select: { favorites: true },
                })
              : await prisma.blog.findUniqueOrThrow({
                  where: { id: resourceId },
                  select: { favorites: true },
                });
          return NextResponse.json({
            success: true,
            favorited: true,
            favoritesCount: current.favorites,
          } satisfies FavoriteResponse);
        }
        throw createError;
      }
      favorited = true;

      // 仅保留改动前就存在的 PROMPT + FAVORITE 埋点（后台环比统计依赖）。
      // BLOG + FAVORITE 是新组合，不新增；取消收藏不写 UNFAVORITE。
      // 用户收藏状态一律以 UserPromptFavorite / UserBlogFavorite 为准。
      if (resourceType === 'PROMPT') {
        try {
          await trackResourceAction(resourceId, 'PROMPT', 'FAVORITE', '');
        } catch {
          // 日志失败不阻断
        }
      }
    }

    const latest =
      resourceType === 'PROMPT'
        ? await prisma.prompt.findUniqueOrThrow({
            where: { id: resourceId },
            select: { favorites: true },
          })
        : await prisma.blog.findUniqueOrThrow({
            where: { id: resourceId },
            select: { favorites: true },
          });
    favoritesCount = latest.favorites;

    return NextResponse.json({ success: true, favorited, favoritesCount } satisfies FavoriteResponse);
  } catch (error) {
    console.error('[favorite] toggle failed:', error);
    return NextResponse.json(
      { success: false, favorited: false, favoritesCount: 0, message: '服务器错误，请稍后重试' },
      { status: 500 },
    );
  }
});

export { POST };
