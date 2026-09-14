import LoginMountedHandler from './LoginMountedHandler';

interface LoginExperienceProps {
  locale: string;
  redirectTo: string;
  error?: string;
}

// 未登录登录页：Server Component 外壳。
// 动画逻辑和 client 状态由 LoginMountedHandler（client component）处理，
// 登录面板 LoginPanel 在 LoginMountedHandler 内部 import（Next.js 允许 client → server）。
export default function LoginExperience({ locale, redirectTo, error }: LoginExperienceProps) {
  return <LoginMountedHandler locale={locale} redirectTo={redirectTo} error={error} />;
}
