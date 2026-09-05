'use server';

import { cookies } from 'next/headers';
import { headers } from 'next/headers';
import crypto from 'crypto';
import prisma from '@/lib/prisma';

export async function toggleLike(promptId: string) {
  if (!promptId) return { success: false, message: '缺少参数' };

  const cookieStore = await cookies();
  const cookieName = `liked_${promptId}`;

  const hasLock = cookieStore.has(cookieName);

  try {
    const result = await prisma.prompt.update({
      where: { id: promptId },
      data: {
        likes: hasLock ? { decrement: 1 } : { increment: 1 }
      },
      select: { likes: true }
    });

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
    await prisma.prompt.update({
      where: { id: promptId },
      data: { views: { increment: 1 } }
    });

    const now = new Date();
      const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
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
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
  
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
        userAgent
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