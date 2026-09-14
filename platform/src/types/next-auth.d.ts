import type { DefaultSession } from 'next-auth';

// 扩展 NextAuth Session：在保留 name/email/image 的基础上增加用户真实 ID
declare module 'next-auth' {
  interface Session {
    user?: {
      id: string;
    } & DefaultSession['user'];
  }
}
