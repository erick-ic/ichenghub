import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import type { OAuthConfig, OAuthUserConfig } from 'next-auth/providers';
import { PrismaAdapter } from '@auth/prisma-adapter';
import prisma from '@/lib/prisma';
import { recordApiError, recordFailed } from '@/app/actions/metricsActions';

interface GiteeProfile {
  id: number;
  login: string;
  name: string | null;
  email: string | null;
  avatar_url: string | null;
}

interface GiteeEmail {
  email?: unknown;
  state?: unknown;
  primary?: unknown;
}

function isEmail(value: unknown): value is string {
  return typeof value === 'string' && value.includes('@');
}

function Gitee(config: OAuthUserConfig<GiteeProfile>): OAuthConfig<GiteeProfile> {
  return {
    id: 'gitee',
    name: 'Gitee',
    type: 'oauth',
    authorization: {
      url: 'https://gitee.com/oauth/authorize',
      params: { scope: 'user_info emails' },
    },
    token: 'https://gitee.com/oauth/token',
    userinfo: {
      url: 'https://gitee.com/api/v5/user',
      async request({ tokens }: { tokens: { access_token?: string } }) {
        const accessToken = tokens.access_token;
        if (!accessToken) throw new Error('Gitee did not return an access token');
        const profileResponse = await fetch(
          `https://gitee.com/api/v5/user?access_token=${encodeURIComponent(accessToken)}`,
          { headers: { Accept: 'application/json' } }
        );
        if (!profileResponse.ok) throw new Error(`Gitee user profile request failed: ${profileResponse.status}`);
        // 公开资料中的邮箱不带验证状态，先清空，后续只使用邮箱列表中已确认的地址。
        const profile: GiteeProfile = { ...await profileResponse.json(), email: null };

        // 即使公开资料里有邮箱，也必须通过 emails 权限确认其验证状态。
        const emailResponse = await fetch(
          `https://gitee.com/api/v5/emails?access_token=${encodeURIComponent(accessToken)}`,
          { headers: { Accept: 'application/json' } }
        );
        if (!emailResponse.ok) return profile;
        const emailRecords = await emailResponse.json() as GiteeEmail[];
        if (!Array.isArray(emailRecords)) return profile;
        const confirmed = emailRecords.filter((item) =>
          item != null && isEmail(item.email) && item.state === 'confirmed'
        );
        const preferred = confirmed.find((item) => item.primary === true) ?? confirmed[0];
        return { ...profile, email: isEmail(preferred?.email) ? preferred.email : null };
      },
    },
    client: { token_endpoint_auth_method: 'client_secret_post' },
    checks: ['state'],
    profile(profile) {
      const email = typeof profile.email === 'string' && profile.email.includes('@')
        ? profile.email
        : null;
      return {
        id: String(profile.id),
        name: profile.name || profile.login,
        email,
        image: profile.avatar_url || null,
      };
    },
    style: { bg: '#c71d23', text: '#fff' },
    options: config,
  };
}

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
  providers: [
    GitHub,
    Gitee({
      clientId: process.env.AUTH_GITEE_ID,
      clientSecret: process.env.AUTH_GITEE_SECRET,
    }),
  ],
  // OAuth 回调失败时回到站内登录页，由 next-intl 中间件补全当前语言前缀。
  // 避免网络波动时向用户展示 Auth.js 默认错误页，并允许直接再次尝试登录。
  pages: {
    signIn: '/profile',
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
  events: {
    async signIn({ user, account, profile }) {
      const email = profile && 'email' in profile && isEmail(profile.email)
        ? profile.email
        : null;
      if (account?.provider !== 'gitee' || user.email || !email) return;
      try {
        // 已有关联 Gitee 账号不会由 Adapter 自动刷新资料，下次登录时主动回填邮箱。
        await prisma.user.update({ where: { id: user.id }, data: { email } });
      } catch (error) {
        // 邮箱可能已属于另一个 GitHub 账号；保持安全默认，不自动合并账户或阻断登录。
        console.warn('[auth] Could not backfill Gitee email:', error);
      }
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
