'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer, { EMAIL } from '@/components/layout/Footer';
import { copyToClipboard } from '@/lib/copyUtils';

interface ClientLayoutProps {
  children: React.ReactNode;
  locale: string;
  isLoggedIn: boolean;
  userImage: string | null;
}

// ClientLayout 负责条件渲染全局 Navbar/Footer：
// 仅在未登录访问 /[locale]/profile 时隐藏，其余页面正常显示。
// 这样登录页可以是全屏沉浸式，而其他页面（包括已登录个人主页）不受影响。
export default function ClientLayout({ children, locale, isLoggedIn, userImage }: ClientLayoutProps) {
  const pathname = usePathname();
  const t = useTranslations('footer');
  const [copied, setCopied] = useState(false);

  // 登录页判断：profile 路径 + 未登录 → 隐藏 Navbar/Footer
  const isProfilePath = pathname.includes('/profile');
  const hideChrome = isProfilePath && !isLoggedIn;

  const handleCopyEmail = async () => {
    const success = await copyToClipboard(EMAIL);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`flex min-h-screen flex-col ${hideChrome ? '!min-h-0 bg-[#f6f6f4]' : 'bg-background'}`}>
      {!hideChrome && (
        <Navbar locale={locale} isLoggedIn={isLoggedIn} userImage={userImage} />
      )}
      {children}
      {!hideChrome && (
        <Footer onCopyEmail={handleCopyEmail} copied={copied} />
      )}
      {copied && !hideChrome && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-gray-900 px-6 py-3 shadow-lg animate-bounce text-white">
            <Check className="h-5 w-5 text-green-400" />
            <span>{t('copiedEmail')} <span className="font-mono text-gray-300">{EMAIL}</span></span>
          </div>
        </div>
      )}
    </div>
  );
}
