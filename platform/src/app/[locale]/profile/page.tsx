import { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { auth } from '../../../../auth';
import LoginExperience from '@/components/auth/LoginExperience';
import ProfileConsole from '@/components/profile/ProfileConsole';
import ProfileSidebar from '@/components/profile/ProfileSidebar';
import { getProfileData } from '@/lib/profile-data';
import prisma from '@/lib/prisma';

type Props = {
  params: Promise<{ locale: string }>;
  searchParams?: { callbackUrl?: string; error?: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'Profile' });
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: {
      canonical: `/${locale}/profile`,
      languages: {
        zh: '/zh/profile',
        en: '/en/profile',
        'x-default': '/zh/profile',
      },
    },
  };
}

export default async function ProfilePage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  // 登录后回跳地址：只接受站内相对路径（单斜杠开头、非协议相对 URL），防止开放重定向
  const rawCallback = searchParams?.callbackUrl;
  // 普通登录完成后进入首页；由收藏等业务动作传入 callbackUrl 时仍返回原操作页面
  let redirectTo = `/${locale}`;
  if (
    rawCallback &&
    rawCallback.length <= 255 &&
    rawCallback.startsWith('/') &&
    !rawCallback.startsWith('//') &&
    !rawCallback.includes('\\') &&
    /^\/[\w/\-.,~%?=&+#]*$/.test(rawCallback)
  ) {
    // FavoriteButton 传入的是不含语言前缀的路径；手工带入前缀时保持原样
    redirectTo = rawCallback === `/${locale}` || rawCallback.startsWith(`/${locale}/`)
      ? rawCallback
      : `/${locale}${rawCallback}`;
  }

  // 未登录分支所需的文案已下沉到 LoginExperience / OAuthLoginPanel 内部解析
  const session = await auth();

  const user = session?.user;

  // 已登录：三栏式个人控制台。身份只来自服务端 session，禁止外部传入 userId
  if (user?.id) {
    // session 不含 createdAt，补查用户加入时间；查询失败不阻塞页面
    let dbUser: { createdAt: Date | null } = { createdAt: null };
    try {
      dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { createdAt: true },
      }) ?? { createdAt: null };
    } catch (error) {
      console.error('[profile] failed to load user createdAt:', error);
    }

    // 区块级容错已在数据层内部处理，单区失败返回空列表
    const profileData = await getProfileData(user.id, locale);

    return (
      <div className="min-h-[60vh] bg-[#f5f5f7]">
        <ProfileConsole
          sidebar={<ProfileSidebar user={{ ...user, createdAt: dbUser.createdAt }} />}
          data={profileData}
        />
      </div>
    );
  }

  // 未登录：双栏登录体验（品牌价值区 + OAuth 登录操作区）
  // error 来自 Auth.js 登录失败回跳的 ?error= 参数，仅在已知错误码时展示通用提示
  return (
    <LoginExperience locale={locale} redirectTo={redirectTo} error={searchParams?.error} />
  );
}
