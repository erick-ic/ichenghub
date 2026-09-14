'use client';

import { useTranslations } from 'next-intl';
import { Github } from 'lucide-react';
import { signInAction } from './signInAction';
import LoginPanelClient from './LoginPanelClient';

interface LoginPanelProps {
  locale: string;
  redirectTo: string;
  error?: string;
  mounted: boolean;
}

// 登录卡片 Client Component：使用 useTranslations() 取文案。
// Next.js 14 不允许 Client Component import Server Component，
// 因此 LoginPanel 必须也是 client。signInAction 通过独立 'use server' 文件调用。
export default function LoginPanel({ locale, redirectTo, error, mounted }: LoginPanelProps) {
  const t = useTranslations('Profile.login');

  // 仅启用 enabled = true 的 Provider（当前只有 GitHub）
  const providers = [
    {
      id: 'github',
      label: t('providers.github'),
      redirectingLabel: t('redirecting.github'),
      icon: <Github className="h-5 w-5" aria-hidden="true" />,
      variant: 'primary' as const,
      action: signInAction.bind(null, 'github', redirectTo) as () => Promise<void>,
    },
  ];

  const showError = Boolean(
    error && ['OAuthSignin', 'OAuthCallback', 'AccessDenied', 'Configuration', 'Default'].includes(error)
  );

  return (
    <LoginPanelClient
      title={t('title')}
      subtitle={t('subtitle')}
      privacy={t('privacy')}
      providers={providers}
      showError={showError}
      errorMessage={t('error.message')}
      errorCloseLabel={t('error.close')}
      mounted={mounted}
    />
  );
}
