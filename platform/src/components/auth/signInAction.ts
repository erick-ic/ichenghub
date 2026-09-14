'use server';

import { signIn } from '../../../auth';

// 单个 OAuth Provider 的 server action：根据 providerId 触发 signIn 重定向。
// 单独文件 'use server' 标记，可被 Server Component 和 Client Component 同时引用。
export async function signInAction(providerId: string, redirectTo: string) {
  await signIn(providerId, { redirectTo });
}
