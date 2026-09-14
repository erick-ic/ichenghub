'use server';

import { cookies } from 'next/headers';
import { headers } from 'next/headers';
import crypto from 'crypto';
import prisma from '@/lib/prisma';
import { getBeijingTodayStart, getBeijingNextMidnight } from '@/lib/time';
import { incrementCounter, decrementCounter } from '@/lib/counter';
import { auth } from '../../../auth';

export async function toggleLike(promptId: string) {
  if (!promptId) return { success: false, message: '缺少参数' };

  const cookieStore = await cookies();
  const cookieName = `liked_${promptId}`;

  const hasLock = cookieStore.has(cookieName);

  try {
    // 只改 likes 计数，不触发 @updatedAt 刷新（保持与收藏/浏览计数同一口径）。
    // 取消点赞沿用历史行为，不做 >0 守卫（guardPositive=false）。
    const changedLikes = hasLock
      ? await decrementCounter(prisma, 'Prompt', 'likes', promptId, 1, false)
      : await incrementCounter(prisma, 'Prompt', 'likes', promptId);
    if (changedLikes === null) {
      return { success: false, message: '操作失败' };
    }
    const result = { likes: changedLikes };

    if (hasLock) {
      cookieStore.delete(cookieName);
    } else {
      cookieStore.set(cookieName, '1', {
        maxAge: 60 * 60 * 24 * 365,
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });

      // 记录点赞事件（用于后台环比统计），必须 await：action 返回后未完成的异步任务可能被运行时丢弃
      try {
        await logAnalytics(promptId, 'PROMPT', 'LIKE', '');
      } catch (err) {
        console.error('点赞日志记录失败:', err);
      }
    }

    return {
      success: true,
      likesCount: result.likes,
      isLiked: !hasLock
    };
  } catch (error) {
    console.error('点赞更新失败:', error);
    return { success: false, message: '操作失败' };
  }
}

export async function incrementViews(promptId: string, path: string = '') {
  if (!promptId) return;

  const cookieStore = await cookies();
  const cookieName = `pv_lock_${promptId}`;

  const hasLock = cookieStore.has(cookieName);

  if (hasLock) {
    return { success: true, skipped: true };
  }

  try {
    // 只改 views 计数，不触发 @updatedAt 刷新
    await incrementCounter(prisma, 'Prompt', 'views', promptId);

    const now = new Date();
      // 浏览锁到「北京次日 00:00」失效；UTC 服务器用本地午夜会偏到北京早 8 点
      const midnight = getBeijingNextMidnight(now);
      const maxAge = Math.floor((midnight.getTime() - now.getTime()) / 1000);
      
      cookieStore.set(cookieName, '1', {
        maxAge,
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax'
      });

    // 注意：浏览事件日志由客户端在计数实际递增后单独 await 上报
    // （server action 内未 await 的异步任务在函数返回后可能被运行时丢弃，导致日志断流）
    return { success: true };
  } catch (error) {
    console.error('统计更新失败:', error);
    return { success: false };
  }
}

async function getIPHash(): Promise<string> {
  const headerList = headers();
  const ip = headerList.get('x-forwarded-for') || headerList.get('x-real-ip') || '127.0.0.1';
  return hashIP(ip);
}

function hashIP(ip: string | null | undefined): string {
  if (!ip) return 'anonymous';
  return crypto.createHash('sha256').update(ip).digest('hex');
}

async function checkDuplicateLog(
  ipHash: string,
  resourceId: string | null,
  actionType: string,
  resourceType: string
): Promise<boolean> {
  // 去重窗口以北京自然日 00:00 为界（服务器为 UTC 时本地构造会偏到北京 08:00）
  const todayStart = getBeijingTodayStart();
  
  const query: any = {
    ipHash,
    actionType,
    resourceType,
    timestamp: { gte: todayStart }
  };
  
  if (resourceId) {
    query.resourceId = resourceId;
  } else {
    query.resourceId = null;
  }

  const lastRecord = await prisma.analyticsLog.findFirst({
    where: query
  });

  return !!lastRecord;
}

async function logAnalytics(
  resourceId: string | null,
  resourceType: string,
  actionType: string,
  path: string
) {
  try {
    const ipHash = await getIPHash();
    const headerList = headers();
    const userAgent = headerList.get('user-agent') || null;

    // 用户身份只在服务端从会话获取；游客 userId 为 null（继续兼容匿名统计）。
    // 客户端无法也不允许传入 userId。auth() 失败时按游客处理，不阻断埋点。
    let userId: string | null = null;
    try {
      const session = await auth();
      userId = session?.user?.id ?? null;
    } catch (authError) {
      console.error('Analytics auth resolve failed:', authError);
    }

    // 未显式传入 path 时，从 referer 提取路径部分
    let logPath = path;
    if (!logPath) {
      const referer = headerList.get('referer');
      if (referer) {
        try {
          logPath = new URL(referer).pathname;
        } catch {
          logPath = '';
        }
      }
    }

    const isDuplicate = await checkDuplicateLog(ipHash, resourceId, actionType, resourceType);
    if (isDuplicate) {
      console.log(`Skipped duplicated log: ${actionType} - ${resourceType} - ${resourceId || 'null'}`);
      return { success: true, skipped: true };
    }

    await prisma.analyticsLog.create({
      data: {
        actionType,
        resourceType,
        resourceId,
        path: logPath,
        ipHash,
        userAgent,
        userId
      }
    });

    return { success: true, skipped: false };
  } catch (error) {
    console.error('Analytics log failed:', error);
    throw error;
  }
}

export async function trackResourceAction(
  resourceId: string | null,
  resourceType: string,
  actionType: string,
  path: string
) {
  try {
    const result = await logAnalytics(resourceId, resourceType, actionType, path);
    return { success: true, skipped: result?.skipped || false };
  } catch (error) {
    console.error('Track action failed:', error);
    return { success: false };
  }
}