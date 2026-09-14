'use client';

import React, { useState, useEffect } from 'react';
import { ArrowUpRight, Menu, X, Search, User } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/navigation';
import { GlobalSearch, SearchItem } from './layout/GlobalSearch';

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
  const [isLoading, setIsLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 获取搜索数据
  useEffect(() => {
    const fetchSearchData = async () => {
      try {
        const response = await fetch('/api/search');
        const data = await response.json();
        setSearchItems(data);
      } catch (error) {
        console.error('Failed to fetch search data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSearchData();
  }, []);

  const navLinks = [
    { href: '/', label: t('home') },
    { href: '/blog', label: t('blog') },
    { href: '/tools', label: t('tools') },
    { href: '/links', label: t('links') },
    { href: '/about', label: t('about') },
  ];

  const isProfileActive = pathname === '/profile';
  const profileLabel = isLoggedIn ? t('profile') : t('login');

  return (
    <nav className="h-16 bg-background border-b border-border flex justify-between items-center px-4 md:px-8">
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
          {isLoggedIn && userImage ? (
            <img
              src={userImage}
              alt=""
              width={32}
              height={32}
              className="h-8 w-8 rounded-full object-cover"
            />
          ) : (
            <User className="h-4 w-4" />
          )}
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
      >
        {mobileMenuOpen ? (
          <X className="h-6 w-6 text-foreground" />
        ) : (
          <Menu className="h-6 w-6 text-foreground" />
        )}
      </button>

      {/* 移动端菜单 */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-16 left-0 right-0 bg-background border-b border-border shadow-lg z-50">
          <div className="px-4 py-4 space-y-3">
            {/* 移动端搜索框 */}
            <div className="px-2">
              <GlobalSearch items={searchItems} isEnglish={locale === 'en'} />
            </div>

            {/* 移动端语言切换 */}
            <Link
              href={pathname}
              locale={nextLocale}
              className="block text-sm font-medium text-muted-foreground hover:text-foreground px-3 py-2 rounded-md transition-colors uppercase tracking-wider"
              onClick={() => setMobileMenuOpen(false)}
            >
              {nextLocale === 'en' ? 'EN' : 'ZH'}
            </Link>

            {/* 移动端链接 */}
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted px-3 py-2 rounded-md transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            {/* 移动端个人主页入口 */}
            <Link
              href="/profile"
              className="flex items-center gap-3 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted px-3 py-2 rounded-md transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {isLoggedIn && userImage ? (
                <img
                  src={userImage}
                  alt=""
                  width={20}
                  height={20}
                  className="h-5 w-5 rounded-full object-cover"
                />
              ) : (
                <User className="h-5 w-5" />
              )}
              {profileLabel}
            </Link>

            {/* 移动端行动按钮 */}
            <Link
              href="/submit"
              className="block bg-foreground text-background px-4 py-3 rounded-full flex items-center justify-center text-sm font-medium mt-4"
              onClick={() => setMobileMenuOpen(false)}
            >
              {t('submitButton')}
              <ArrowUpRight className="ml-2 h-3 w-3 transform rotate-45" />
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;