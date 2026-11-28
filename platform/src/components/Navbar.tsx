'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ArrowUpRight, Menu, X, User, Globe, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/navigation';
import { GlobalSearch, SearchItem } from './layout/GlobalSearch';
import NotificationBell from './layout/NotificationBell';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useEscapeKey } from '@/hooks/useEscapeKey';

interface NavbarProps {
  locale: string;
  isLoggedIn: boolean;
  userImage: string | null;
}

const Navbar: React.FC<NavbarProps> = ({ locale, isLoggedIn, userImage }) => {
  const t = useTranslations('navbar');
  const pathname = usePathname();
  const nextLocale = locale === 'en' ? 'zh' : 'en';
  const [searchItems, setSearchItems] = useState<SearchItem[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);

  useBodyScrollLock(mobileMenuOpen);
  useEscapeKey(mobileMenuOpen, () => setMobileMenuOpen(false));

  useEffect(() => {
    let rafId = 0;
    let hideTimer: number | null = null;

    const updateScroll = (fromUserScroll: boolean) => {
      rafId = 0;
      const y = window.scrollY || 0;
      setScrolled((prev) => (prev === (y > 12) ? prev : y > 12));
      if (progressRef.current) {
        const scrollable = document.documentElement.scrollHeight - window.innerHeight;
        const ratio = scrollable > 0 ? Math.min(Math.max(y / scrollable, 0), 1) : 0;
        progressRef.current.style.transform = `scaleX(${ratio})`;
      }
      if (fromUserScroll) {
        if (y > 4) {
          setIsScrolling(true);
          if (hideTimer) window.clearTimeout(hideTimer);
          hideTimer = window.setTimeout(() => setIsScrolling(false), 650);
        } else {
          if (hideTimer) window.clearTimeout(hideTimer);
          setIsScrolling(false);
        }
      }
    };

    const onScroll = () => {
      if (!rafId) rafId = window.requestAnimationFrame(() => updateScroll(true));
    };
    const onResize = () => {
      if (!rafId) rafId = window.requestAnimationFrame(() => updateScroll(false));
    };

    updateScroll(false);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      if (rafId) window.cancelAnimationFrame(rafId);
      if (hideTimer) window.clearTimeout(hideTimer);
    };
  }, [pathname]);

  // 获取搜索数据
  useEffect(() => {
    const fetchSearchData = async () => {
      try {
        const response = await fetch('/api/search');
        const data = await response.json();
        setSearchItems(data);
      } catch (error) {
        console.error('Failed to fetch search data:', error);
      }
    };

    fetchSearchData();
  }, []);

  const navLinks = [
    { href: '/', label: t('home') },
    { href: '/tools', label: t('tools') },
    { href: '/links', label: t('links') },
    { href: '/guides', label: t('guides') },
    { href: '/blog', label: t('blog') },
    { href: '/about', label: t('about') },
  ];

  const isProfileActive = pathname === '/profile';
  const profileLabel = isLoggedIn ? t('profile') : t('login');

  return (
    <>
    <nav className={`sticky top-0 z-40 h-16 apple-glass-nav flex justify-between items-center px-4 md:px-8 ${scrolled ? 'apple-glass-nav-scrolled' : ''}`}>
      {/* 极细滚动进度光条（纯 GPU scaleX） */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-[2px] overflow-hidden"
      >
        <div
          ref={progressRef}
          className="h-full w-full origin-left bg-gradient-to-r from-[#e52129]/80 via-[#e52129] to-orange-400/80 transition-opacity duration-500"
          style={{ transform: 'scaleX(0)', opacity: isScrolling ? 1 : 0 }}
        />
      </div>
      {/* 左侧 Logo */}
      <Link href="/" className="flex items-center group no-underline">
        <div className="flex items-baseline font-extrabold italic tracking-tighter">
          <span className="text-xl md:text-2xl lg:text-3xl text-black">
            iCheng
          </span>
          <span className="text-xl md:text-2xl lg:text-3xl text-[#e52129]">
            Hub
          </span>
        </div>
      </Link>

      {/* 桌面端菜单 */}
      <div className="hidden md:flex space-x-1">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted px-3 py-1.5 rounded-md transition-colors"
          >
            {link.label}
          </Link>
        ))}
      </div>

      {/* 桌面端右侧区域 */}
      <div className="hidden md:flex items-center space-x-3">
        {/* 语言切换按钮 */}
        <Link
          href={pathname}
          locale={nextLocale}
          className="text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md transition-colors uppercase tracking-wider"
        >
          {nextLocale === 'en' ? 'EN' : 'ZH'}
        </Link>

        {/* 全局搜索组件 */}
        <GlobalSearch items={searchItems} isEnglish={locale === 'en'} />

        <div className={isLoggedIn ? 'block' : 'session-notification-bell'}>
          <NotificationBell locale={locale} isLoggedIn={isLoggedIn} />
        </div>

        {/* 个人主页入口：已登录显示头像，未登录显示用户图标 */}
        <Link
          href="/profile"
          title={profileLabel}
          aria-label={profileLabel}
          className={`flex h-8 w-8 items-center justify-center rounded-full transition-all ${
            isLoggedIn && userImage
              ? `ring-2 ring-offset-2 ring-offset-background ${
                  isProfileActive ? 'ring-[#e52129]' : 'ring-transparent hover:ring-[#e52129]'
                }`
              : isProfileActive
                ? 'bg-[#e52129]/10 text-[#e52129]'
                : 'text-muted-foreground hover:bg-[#e52129]/10 hover:text-[#e52129]'
          }`}
        >
          <span
            aria-hidden="true"
            className="session-avatar-image h-8 w-8 rounded-full"
            style={userImage ? { display: 'block', backgroundImage: `url("${encodeURI(userImage).replace(/"/g, '%22')}")` } : undefined}
          />
          <User className={`session-default-user h-4 w-4 ${isLoggedIn && userImage ? 'hidden' : ''}`} />
        </Link>

        {/* 行动按钮 */}
        <Link
          href="/submit"
          className="bg-foreground text-background px-4 py-2 rounded-full flex items-center text-sm font-medium hover:opacity-90 transition-opacity"
        >
          {t('submitButton')}
          <ArrowUpRight className="ml-2 h-3 w-3 transform rotate-45" />
        </Link>
      </div>

      {/* 移动端菜单按钮 */}
      <button
        className="md:hidden p-2 rounded-md hover:bg-muted transition-colors"
        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
      >
        {mobileMenuOpen ? (
          <X className="h-6 w-6 text-foreground" />
        ) : (
          <Menu className="h-6 w-6 text-foreground" />
        )}
      </button>
    </nav>

      {/* 移动端菜单：与 nav 平级渲染，避免嵌套 backdrop-filter 导致浏览器禁用毛玻璃模糊 */}
      {mobileMenuOpen && (
        <>
          <div
            aria-hidden="true"
            className="md:hidden fixed inset-0 top-16 bg-black/20 backdrop-blur-[2px] z-40 touch-none"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="md:hidden fixed top-16 left-0 right-0 bg-white/90 dark:bg-zinc-950/90 backdrop-blur-xl backdrop-saturate-150 border-b border-black/[0.08] shadow-xl z-50 max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain">
            <div className="px-4 pt-3.5 pb-5 space-y-3.5">
              {/* 移动端搜索框 */}
              <div>
                <GlobalSearch items={searchItems} isEnglish={locale === 'en'} />
              </div>

              {/* 移动端主导航列表 */}
              <div className="space-y-0.5">
                {navLinks.map((link) => {
                  const isActive =
                    link.href === '/'
                      ? pathname === '/'
                      : pathname === link.href || pathname.startsWith(`${link.href}/`);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-zinc-900/[0.06] text-[#e52129] font-semibold'
                          : 'text-zinc-800 dark:text-zinc-100 hover:bg-black/[0.04]'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span>{link.label}</span>
                      <ChevronRight className={`w-4 h-4 ${isActive ? 'text-[#e52129]/70' : 'text-zinc-400'}`} />
                    </Link>
                  );
                })}
              </div>

              {/* 通知入口（已登录） */}
              {isLoggedIn && (
                <div className="border-t border-zinc-200/70 pt-3">
                  <NotificationBell locale={locale} isLoggedIn={isLoggedIn} showLabel onNavigate={() => setMobileMenuOpen(false)} />
                </div>
              )}

              {/* 语言切换（苹果风分段控件） */}
              <div className="border-t border-zinc-200/70 pt-3 flex items-center justify-between px-1">
                <span className="inline-flex items-center gap-2 text-xs font-medium text-zinc-500">
                  <Globe className="w-4 h-4 text-zinc-400" />
                  {locale === 'en' ? 'Language' : '界面语言'}
                </span>
                <div className="inline-flex items-center rounded-lg bg-zinc-100/90 p-0.5 border border-zinc-200/70">
                  <Link
                    href={pathname}
                    locale="zh"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                      locale === 'zh'
                        ? 'bg-white text-zinc-900 shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-800'
                    }`}
                  >
                    中文
                  </Link>
                  <Link
                    href={pathname}
                    locale="en"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
                      locale === 'en'
                        ? 'bg-white text-zinc-900 shadow-sm'
                        : 'text-zinc-500 hover:text-zinc-800'
                    }`}
                  >
                    EN
                  </Link>
                </div>
              </div>

              {/* 底部双操作按钮：登录/个人主页 + 提交/许愿 */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <Link
                  href="/profile"
                  className="flex items-center justify-center gap-2 rounded-xl border border-zinc-200/90 bg-white/80 px-4 py-2.5 text-sm font-medium text-zinc-800 shadow-sm hover:bg-white transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span
                    aria-hidden="true"
                    className="session-avatar-image h-5 w-5 shrink-0 rounded-full"
                    style={userImage ? { display: 'block', backgroundImage: `url("${encodeURI(userImage).replace(/"/g, '%22')}")` } : undefined}
                  />
                  <User className={`session-default-user h-4 w-4 text-zinc-600 ${isLoggedIn && userImage ? 'hidden' : ''}`} />
                  <span className="truncate">{profileLabel}</span>
                </Link>

                <Link
                  href="/submit"
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="truncate">{t('submitButton')}</span>
                  <ArrowUpRight className="h-3.5 w-3.5 shrink-0 transform rotate-45" />
                </Link>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Navbar;
