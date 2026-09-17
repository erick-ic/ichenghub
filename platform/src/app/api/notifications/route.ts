import { NextRequest, NextResponse } from 'next/server';
import { auth } from '../../../../auth';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [notifications, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
      select: {
        id: true,
        type: true,
        title: true,
        titleEn: true,
        message: true,
        messageEn: true,
        href: true,
        readAt: true,
        createdAt: true,
      },
    }),
    prisma.notification.count({ where: { userId, readAt: null } }),
  ]);

  // 兼容已经入库的旧审核通知：至少定位到“我的提交”；新通知会进一步定位到具体记录。
  const normalizedNotifications = notifications.map((item) => ({
    ...item,
    href:
      (item.type === 'SUBMISSION_REVIEW' || item.type === 'DEMAND_REVIEW') && (!item.href || item.href === '/profile')
        ? '/profile?tab=submissions'
        : item.href,
  }));

  return NextResponse.json({ notifications: normalizedNotifications, unreadCount });
}

export async function PATCH(request: NextRequest) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json().catch(() => ({}));
  const id = typeof body.id === 'string' ? body.id : null;
  const now = new Date();

  if (id) {
    await prisma.notification.updateMany({ where: { id, userId, readAt: null }, data: { readAt: now } });
  } else {
    await prisma.notification.updateMany({ where: { userId, readAt: null }, data: { readAt: now } });
  }

  return NextResponse.json({ success: true });
}
