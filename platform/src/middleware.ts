import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { ADMIN_SESSION_COOKIE, verifyAdminSessionToken } from '@/lib/admin-session';

const intlMiddleware = createMiddleware({
  locales: ['en', 'zh'],
  defaultLocale: 'zh',
  localePrefix: 'always'
});

// 站点规范域名，用于把 www 统一到裸域（与 metadata、sitemap 中的地址保持一致）
const CANONICAL_HOST = 'ichenghub.cn';

export default async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // 统一站点域名：www 与裸域同时可直接访问时，OAuth 登录会把 PKCE/state Cookie
  // 写在发起登录的域名上（如 www），而回调地址固定为裸域，导致回调阶段读不到 Cookie，
  // Auth.js 回跳 /profile?error=Configuration，用户看到“登录暂时未完成”。
  // 使用 308 保留请求方法与请求体，避免 Server Action / API 的 POST 在跳转后失效。
  // 仅匹配站点的 www 域名，避免依据可伪造的 Host 头产生开放重定向。
  const forwardedHost = (request.headers.get('x-forwarded-host') ?? request.headers.get('host') ?? '')
    .split(',')[0]
    .trim()
    .toLowerCase();
  if (forwardedHost.split(':')[0] === `www.${CANONICAL_HOST}`) {
    return NextResponse.redirect(
      new URL(`https://${CANONICAL_HOST}${pathname}${request.nextUrl.search}`),
      308
    );
  }

  // 排除 API 路径
  if (pathname.startsWith('/api')) {
    return NextResponse.next();
  }

  if (pathname.startsWith('/ibackend')) {
    // 对于所有管理端路径，添加缓存控制头
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', 'Thu, 01 Jan 1970 00:00:00 GMT');
    response.headers.set('Vary', 'Cookie');
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive');

    // 如果不是登录页面且没有登录，重定向到登录页
    const hasValidAdminSession = await verifyAdminSessionToken(request.cookies.get(ADMIN_SESSION_COOKIE)?.value);
    if (!pathname.startsWith('/ibackendlogin') && !hasValidAdminSession) {
      // 获取协议
      const protocol = request.headers.get('x-forwarded-proto') || request.nextUrl.protocol;

      // 获取主机（包含端口）
      // 开发环境使用请求中的主机（包含端口）
      // 生产环境使用 x-forwarded-host（不包含端口，由 Nginx 传递）
      const forwardedHost = request.headers.get('x-forwarded-host');
      let host = forwardedHost || request.nextUrl.host;

      // 如果是 localhost 且没有端口，使用请求中的端口（开发环境）
      if (!forwardedHost && host === 'localhost') {
        host = request.nextUrl.host;  // 使用请求中的完整主机（包含实际端口）
      }

      const url = new URL('/ibackendlogin', `${protocol}://${host}`);
      return NextResponse.redirect(url);
    }

    return response;
  }

  // 处理国际化路由
  const response = intlMiddleware(request);

  // 强制修正重定向头：线上环境抹除任何可能出现的 :3000 端口
  const location = response.headers.get('location');
  if (location && process.env.NODE_ENV === 'production') {
    let cleanLocation = location.replace(':3000', '');
    cleanLocation = cleanLocation.replace('http://', 'https://');
    response.headers.set('location', cleanLocation);
  }

  return response;
}

export const config = {
  // 显式排除 .ttf 结尾的文件
  matcher: ['/((?!api|_next|_vercel|favicon\\.svg|.*\\.ttf$|.*\\..*).*)']
};
