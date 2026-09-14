import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import { PrismaAdapter } from '@auth/prisma-adapter';
import prisma from '@/lib/prisma';

export const { handlers, auth, signIn, signOut } = NextAuth({
  // 复用项目内 Prisma 单例，会话持久化到 PostgreSQL
  adapter: PrismaAdapter(prisma),
  providers: [GitHub],
  // 生产环境经 Nginx 反向代理，信任 X-Forwarded-* 头，避免 UntrustedHost
  trustHost: true,
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
