import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import { PrismaAdapter } from '@auth/prisma-adapter';
import prisma from '@/lib/prisma';
import { recordApiError, recordFailed } from '@/app/actions/metricsActions';

function getSafeAuthErrorDetail(error: Error) {
  const cause = error.cause && typeof error.cause === 'object'
    ? error.cause as { err?: unknown; provider?: unknown }
    : null;
  const nestedError = cause?.err instanceof Error ? cause.err : null;
  const nestedCause = nestedError?.cause && typeof nestedError.cause === 'object'
    ? nestedError.cause as { code?: unknown }
    : null;

  return JSON.stringify({
    type: error.name || 'AuthError',
    provider: typeof cause?.provider === 'string' ? cause.provider : undefined,
    code: typeof nestedCause?.code === 'string' ? nestedCause.code : undefined,
  });
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  // 复用项目内 Prisma 单例，会话持久化到 PostgreSQL
  adapter: PrismaAdapter(prisma),
  providers: [GitHub],
  // OAuth 回调失败时回到站内登录页，由 next-intl 中间件补全当前语言前缀。
  // 避免网络波动时向用户展示 Auth.js 默认错误页，并允许直接再次尝试登录。
  pages: {
    error: '/profile',
  },
  // 生产环境经 Nginx 反向代理，信任 X-Forwarded-* 头，避免 UntrustedHost
  trustHost: true,
  logger: {
    error(error) {
      // PM2 保留完整服务端错误，后台面板仅记录脱敏后的诊断字段。
      console.error('[auth][error]', error);
      recordFailed();
      void recordApiError({
        message: `Auth.js ${error.name || 'authentication'} error`,
        status: 500,
        path: '/api/auth',
        method: 'AUTH',
        detail: getSafeAuthErrorDetail(error),
      });
    },
  },
  callbacks: {
    // 数据库策略下 user 为 AdapterUser（含真实 id），显式注入 session.user.id，
    // 服务端业务一律以 session.user.id 作为用户身份，禁止客户端传入 userId。
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
      }
      return session;
    },
  },
});
