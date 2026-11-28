'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Check } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer, { EMAIL } from '@/components/layout/Footer';
import { copyToClipboard } from '@/lib/copyUtils';

interface ClientLayoutProps {
  children: React.ReactNode;
  locale: string;
}

// ClientLayout 负责条件渲染全局 Navbar/Footer：
// 仅在未登录访问 /[locale]/profile 时隐藏，其余页面正常显示。
// 这样登录页可以是全屏沉浸式，而其他页面（包括已登录个人主页）不受影响。
type SessionUser = {
  image?: string | null;
};

const SESSION_AVATAR_STORAGE_KEY = 'ichenghub.session-avatar';
const SESSION_ACTIVE_STORAGE_KEY = 'ichenghub.session-active';

export default function ClientLayout({ children, locale }: ClientLayoutProps) {
  const pathname = usePathname();
  const t = useTranslations('footer');
  const [copied, setCopied] = useState(false);
  const [sessionUser, setSessionUser] = useState<SessionUser | null>(null);
  const [sessionResolved, setSessionResolved] = useState(false);

  // 根布局无法感知语言段，这里按当前 locale 修正 <html lang>，供搜索引擎与读屏软件识别页面语言。
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  // 路由切换时（无锚点 hash）立即回到页面顶部，避免受历史滚动位置或 smooth 滚动动画残留影响。
  useEffect(() => {
    if (typeof window === 'undefined' || window.location.hash) return;
    const scrollTop = () => {
      window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };
    scrollTop();
    const rafId = window.requestAnimationFrame(scrollTop);
    return () => window.cancelAnimationFrame(rafId);
  }, [pathname]);

  // 导航栏只需要展示登录状态和头像。将会话读取放到客户端，避免公共 layout
  // 在服务端读取 Cookie；页面是否缓存仍由各自的数据获取策略决定。
  useEffect(() => {
    let active = true;

    const syncSessionDom = (user: SessionUser | null) => {
      try {
        if (user) {
          window.localStorage.setItem(SESSION_ACTIVE_STORAGE_KEY, '1');
          document.documentElement.classList.add('has-session-user');
          if (user.image) {
            window.localStorage.setItem(SESSION_AVATAR_STORAGE_KEY, user.image);
            document.documentElement.classList.add('has-session-avatar');
            document.documentElement.style.setProperty(
              '--session-avatar-image',
              `url("${encodeURI(user.image).replace(/"/g, '%22')}")`,
            );
          } else {
            window.localStorage.removeItem(SESSION_AVATAR_STORAGE_KEY);
            document.documentElement.classList.remove('has-session-avatar');
            document.documentElement.style.removeProperty('--session-avatar-image');
          }
        } else {
          window.localStorage.removeItem(SESSION_ACTIVE_STORAGE_KEY);
          window.localStorage.removeItem(SESSION_AVATAR_STORAGE_KEY);
          document.documentElement.classList.remove('has-session-user', 'has-session-avatar');
          document.documentElement.style.removeProperty('--session-avatar-image');
        }
      } catch {
        // 本地缓存只是视觉优化，失败时不影响会话状态。
      }
    };

    const handleSessionChanged = (event: Event) => {
      const customEvent = event as CustomEvent<SessionUser | null>;
      // 使当前尚未完成的会话请求失效，避免退出后被旧响应重新写回登录态。
      active = false;
      const nextUser = customEvent.detail ?? null;
      setSessionUser(nextUser);
      syncSessionDom(nextUser);
      setSessionResolved(true);
    };

    window.addEventListener('ichenghub:session-changed', handleSessionChanged);

    // React 接管页面后同步继承 head 脚本已经用于首帧的登录与头像状态。
    try {
      const cachedAvatar = window.localStorage.getItem(SESSION_AVATAR_STORAGE_KEY);
      const cachedActive = window.localStorage.getItem(SESSION_ACTIVE_STORAGE_KEY) === '1';
      if (cachedAvatar) {
        setSessionUser({ image: cachedAvatar });
      } else if (cachedActive) {
        setSessionUser({ image: null });
      }
    } catch {
      // 本地缓存不可用时继续请求真实会话。
    }

    fetch('/api/auth/session', {
      credentials: 'same-origin',
      cache: 'no-store',
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((session) => {
        if (!active) return;

        const user = session?.user ?? null;
        setSessionUser(user);
        syncSessionDom(user);
        setSessionResolved(true);
      })
      .catch(() => {
        // 网络短暂失败时保留缓存头像；所有鉴权操作仍以服务端会话为准。
        if (active) setSessionResolved(true);
      });

    return () => {
      active = false;
      window.removeEventListener('ichenghub:session-changed', handleSessionChanged);
    };
  }, [pathname]);

  const isLoggedIn = !!sessionUser;
  const userImage = sessionUser?.image ?? null;

  // 登录页判断：profile 路径 + 未登录 → 隐藏 Navbar/Footer
  const isProfilePath = pathname.includes('/profile');
  const hideChrome = isProfilePath && sessionResolved && !isLoggedIn;
  const chromePending = isProfilePath && !sessionResolved;

  const handleCopyEmail = async () => {
    const success = await copyToClipboard(EMAIL);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`flex min-h-screen flex-col ${isProfilePath ? 'bg-[#f6f6f4]' : 'apple-glass-bg'}`}>
      {!hideChrome && (
        <div className={chromePending ? 'profile-session-pending' : 'contents'}>
          <Navbar locale={locale} isLoggedIn={isLoggedIn} userImage={userImage} />
        </div>
      )}
      {children}
      {!hideChrome && (
        <div className={chromePending ? 'profile-session-pending' : 'contents'}>
          <Footer onCopyEmail={handleCopyEmail} copied={copied} />
        </div>
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
