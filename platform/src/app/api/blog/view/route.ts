import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { incrementCounter } from '@/lib/counter';
import { auth } from '../../../../../auth';

export const dynamic = 'force-dynamic';

// 同一用户（登录按 userId / 游客按 ipHash）对同一博客 60 秒内只计一次
const VIEW_WINDOW = 60_000;

export async function POST(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    }

    // 用户身份只来自服务端会话；游客为 null
    let userId: string | null = null;
    try {
      const session = await auth();
      userId = session?.user?.id ?? null;
    } catch (authError) {
      console.error('[blog/view] auth resolve failed:', authError);
    }

    const xff = req.headers.get('x-forwarded-for');
    const ip = xff ? xff.split(',')[0].trim() : req.headers.get('x-real-ip') || '127.0.0.1';
    const ipHash = crypto.createHash('sha256').update(ip).digest('hex');
    const userAgent = req.headers.get('user-agent') || null;

    const now = new Date();
    const windowStart = new Date(now.getTime() - VIEW_WINDOW);

    const result = await prisma.$transaction(async (tx) => {
      // 1. 博客存在且已发布（status=1）
      const blog = await tx.blog.findFirst({
        where: { id, status: 1 },
        select: { views: true },
      });
      if (!blog) {
        return { notFound: true as const, skipped: false, views: 0 };
      }

      // 2. 60 秒窗口去重：登录用户按 userId，游客按 ipHash（且 userId 为 null）
      const duplicateWhere = {
        resourceType: 'BLOG',
        actionType: 'VIEW',
        resourceId: id,
        timestamp: { gte: windowStart },
        ...(userId ? { userId } : { userId: null, ipHash }),
      };

      const existingLog = await tx.analyticsLog.findFirst({
        where: duplicateWhere,
        select: { id: true },
      });
      if (existingLog) {
        return { notFound: false as const, skipped: true, views: blog.views };
      }

      // 3. 写足迹日志（登录用户带 userId，游客为 null；日志与计数在同一事务内提交）
      await tx.analyticsLog.create({
        data: {
          userId,
          ipHash,
          userAgent,
          resourceId: id,
          resourceType: 'BLOG',
          actionType: 'VIEW',
          path: `/blog/${id}`,
        },
      });

      // 4. 增加浏览数。用原生 SQL 只改 views，避免 Prisma update 顺带刷新
      // updatedAt（否则一次浏览就会改变博客列表日期与 sitemap lastModified）
      const nextViews = await incrementCounter(tx, 'Blog', 'views', id);

      return { notFound: false as const, skipped: false, views: nextViews ?? blog.views };
    });

    if (result.notFound) {
      return NextResponse.json({ success: false, error: 'Blog not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, views: result.views, skipped: result.skipped });
  } catch (error) {
    // 追踪失败不影响博客正文访问（客户端 ViewCounter 静默吞掉），仅记录服务端日志
    console.error('[blog/view] track failed:', error);
    return NextResponse.json({ success: false, error: 'Database error' }, { status: 500 });
  }
}
