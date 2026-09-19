import { NextResponse } from 'next/server';
import { recordApiError, recordFailed, recordSuccess } from '@/app/actions/metricsActions';

export const dynamic = 'force-dynamic';

const GITEE_OAUTH_ORIGIN = 'https://gitee.com/oauth/authorize';
const CHECK_TIMEOUT_MS = 5000;

// 登录跳转前只检查 Gitee 的 DNS/TCP/TLS/HTTP 链路，不携带 OAuth 凭据。
export async function GET() {
  try {
    const response = await fetch(GITEE_OAUTH_ORIGIN, {
      method: 'HEAD',
      cache: 'no-store',
      signal: AbortSignal.timeout(CHECK_TIMEOUT_MS),
    });
    recordSuccess();
    return NextResponse.json(
      { available: response.status > 0 },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.warn('[auth] Gitee OAuth preflight failed:', error);
    recordFailed();
    const cause = error instanceof Error && error.cause && typeof error.cause === 'object'
      ? error.cause as { code?: unknown }
      : null;
    await recordApiError({
      message: 'Gitee OAuth 服务暂时不可达',
      status: 503,
      path: '/api/auth/gitee-health',
      method: 'GET',
      detail: JSON.stringify({
        type: error instanceof Error ? error.name : 'UnknownError',
        code: typeof cause?.code === 'string' ? cause.code : undefined,
      }),
    });
    return NextResponse.json(
      { available: false },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
