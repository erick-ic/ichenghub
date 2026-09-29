import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/admin-session';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const headers = { 'Cache-Control': 'no-store' };
  if (!await verifyAdminSessionToken(request.cookies.get(ADMIN_SESSION_COOKIE)?.value)) {
    return NextResponse.json({ error: '登录已过期，请重新登录后台后导出' }, { status: 401, headers });
  }

  try {
    // No select or search filter: export every saved scalar field and all statuses.
    const prompts = await prisma.prompt.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }, { id: 'asc' }],
    });
    const generatedAt = new Date().toISOString();
    const body = JSON.stringify({
      formatVersion: 1,
      generatedAt,
      count: prompts.length,
      prompts,
    }, null, 2);

    return new NextResponse(body, {
      headers: {
        ...headers,
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="ichenghub-prompts-${generatedAt.replace(/[:.]/g, '-')}.json"`,
      },
    });
  } catch (error) {
    console.error('[prompts] Export failed:', error);
    return NextResponse.json({ error: '导出失败，请稍后重试' }, { status: 500, headers });
  }
}
