import { NextResponse } from 'next/server';
import { recordApiError, recordFailed, recordSuccess } from '@/app/actions/metricsActions';
import { createResilientFetch } from '@/lib/oauth-fetch';

export const dynamic = 'force-dynamic';

const GITHUB_OAUTH_ORIGIN = 'https://github.com/login/oauth/authorize';
// 这里只检查 DNS/TCP/TLS/HTTP 是否可达，不执行真正的 OAuth 请求。
// 单次探测 4 秒，失败后立即重试一次：网络抖动时避免一次探测超时就拦下登录，
// 真正不可达时总耗时仍与原来的 8 秒上限接近。
const githubCheck = createResilientFetch({ timeoutMs: 4000, attempts: 2 });

// OAuth 跳转前的轻量可用性检查。GitHub 不可达时让用户留在站内，
// 避免浏览器进入一个无法结束的外部导航；不返回上游错误细节。
export async function GET() {
  try {
    const response = await githubCheck(GITHUB_OAUTH_ORIGIN, {
      method: 'HEAD',
      cache: 'no-store',
    });

    recordSuccess();

    // 能收到 GitHub 的任意 HTTP 响应就说明网络链路可用。
    return NextResponse.json(
      { available: response.status > 0 },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.warn('[auth] GitHub OAuth preflight failed:', error);
    recordFailed();

    const cause = error instanceof Error && error.cause && typeof error.cause === 'object'
      ? error.cause as { code?: unknown }
      : null;
    await recordApiError({
      message: 'GitHub OAuth 服务暂时不可达',
      status: 503,
      path: '/api/auth/github-health',
      method: 'GET',
      // 仅保存错误类型与网络错误码，避免 URL、OAuth 参数或凭据进入数据库。
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
