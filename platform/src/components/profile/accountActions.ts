'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { Prisma } from '@prisma/client';
import { auth, signIn } from '../../../auth';
import prisma from '@/lib/prisma';

const SUPPORTED_PROVIDERS = new Set(['github', 'gitee']);

function profilePath(locale: string, status?: string) {
  const safeLocale = locale === 'en' ? 'en' : 'zh';
  return `/${safeLocale}/profile${status ? `?account=${status}` : ''}`;
}

export async function linkOAuthAccount(provider: string, locale: string) {
  if (!SUPPORTED_PROVIDERS.has(provider)) redirect(profilePath(locale, 'unsupported'));

  const session = await auth();
  if (!session?.user?.id) redirect(profilePath(locale));

  const existing = await prisma.account.findFirst({
    where: { userId: session.user.id, provider },
    select: { id: true },
  });
  if (existing) redirect(profilePath(locale, 'already-linked'));

  // Auth.js 会读取当前数据库会话。只有已登录用户完成另一平台授权后，
  // 才会把新的 OAuth Account 关联到当前 User.id。
  await signIn(provider, { redirectTo: profilePath(locale, 'linked') });
}

export async function unlinkOAuthAccount(provider: string, locale: string) {
  if (!SUPPORTED_PROVIDERS.has(provider)) redirect(profilePath(locale, 'unsupported'));

  const session = await auth();
  if (!session?.user?.id) redirect(profilePath(locale));
  const userId = session.user.id;

  const unlinkOnce = () => prisma.$transaction(async (tx) => {
    const accounts = await tx.account.findMany({
      where: { userId },
      select: { id: true, provider: true },
    });
    const target = accounts.find((account) => account.provider === provider);
    if (!target) return 'not-linked';
    if (accounts.length <= 1) return 'last-account';

    await tx.account.delete({ where: { id: target.id } });
    return 'unlinked';
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

  let status: string;
  try {
    status = await unlinkOnce();
  } catch (error) {
    // 并发解绑发生序列化冲突时重试一次，确保“至少保留一种登录方式”的约束成立。
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2034') {
      status = await unlinkOnce();
    } else {
      throw error;
    }
  }

  if (status !== 'unlinked') redirect(profilePath(locale, status));

  revalidatePath(profilePath(locale));
  redirect(profilePath(locale, 'unlinked'));
}
