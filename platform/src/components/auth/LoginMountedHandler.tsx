'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import LoginWorkspaceBackdrop from './LoginWorkspaceBackdrop';
import LoginPanel from './LoginPanel';

interface Props {
  locale: string;
  redirectTo: string;
  error?: string;
}

// Client Component：负责 mounted 状态和入场动画。
// 移动端允许自然滚动，外层容器不再 overflow-hidden。
function LoginMountedHandler({ locale, redirectTo, error }: Props) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const nextLocale = locale === 'en' ? 'zh' : 'en';
  const langLabel = locale === 'en' ? '中文' : 'EN';
  const EASE = 'var(--ease-out-expo)';

  // 切换登录页语言时保留业务回跳目标，并同步替换目标路径的语言前缀
  const localizedRedirectTo = redirectTo === `/${locale}`
    ? `/${nextLocale}`
    : redirectTo.startsWith(`/${locale}/`)
      ? `/${nextLocale}${redirectTo.slice(locale.length + 1)}`
      : redirectTo;
  // 普通登录的目标就是首页，无需写入 callbackUrl；只有业务回跳场景才携带参数
  const languageSwitchHref = redirectTo === `/${locale}`
    ? `/${nextLocale}/profile`
    : `/${nextLocale}/profile?callbackUrl=${encodeURIComponent(localizedRedirectTo)}`;

  return (
    <div
      className="login-bg-fade relative flex min-h-[100dvh] w-full flex-col"
      style={{
        background: `
          radial-gradient(ellipse at 29% 52%, rgba(229, 33, 41, 0.055), transparent 38%),
          linear-gradient(135deg, #f3f2ef 0%, #fafaf9 56%, #f6f6f4 100%),
          #f5f4f1
        `,
      }}
    >
      {/* 左上 Logo */}
      <Link
        href={`/${locale}`}
        className="absolute left-5 top-5 z-20 flex items-center no-underline transition-transform duration-[200ms] var(--ease-standard) hover:-translate-y-0.5 md:left-12 md:top-8"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(-6px)',
          transition: `opacity 420ms ${EASE} 80ms, transform 420ms ${EASE} 80ms`,
        }}
      >
        <div className="flex items-baseline font-extrabold italic tracking-tighter">
          <span className="text-lg text-black transition-colors duration-200 hover:text-gray-800 md:text-2xl">
            iCheng
          </span>
          <span className="text-lg text-[#e52129] transition-colors duration-200 hover:text-[#c91b23] md:text-2xl">
            Hub
          </span>
        </div>
      </Link>

      {/* 右上语言切换 */}
      <Link
        href={languageSwitchHref}
        className="absolute right-5 top-5 z-20 inline-flex min-h-10 items-center rounded-md px-3 text-[14px] font-medium text-gray-500 transition-all duration-[180ms] hover:bg-black/[0.045] hover:text-gray-900 hover:-translate-y-0.5 active:translate-y-0 md:right-12 md:top-8"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(-6px)',
          transition: `opacity 420ms ${EASE} 120ms, transform 420ms ${EASE} 120ms, background-color 180ms var(--ease-standard) 0ms`,
        }}
      >
        {langLabel}
      </Link>

      {/* 项目元素抽象背景（absolute inset-0，自身 overflow-hidden） */}
      <LoginWorkspaceBackdrop mounted={mounted} />

      {/* 登录面板 —— flex-1 让容器自动撑满，移动端自然滚动 */}
      <div className="relative z-10 flex flex-1 items-center justify-center px-4 py-20 sm:py-16 md:justify-start md:pl-[55%] md:pr-[6%] md:py-0">
        <LoginPanel locale={locale} redirectTo={redirectTo} error={error} mounted={mounted} />
      </div>
    </div>
  );
}

export { LoginMountedHandler as default };
