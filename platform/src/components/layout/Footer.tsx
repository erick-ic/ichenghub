'use client';

import { Link } from '@/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Mail } from 'lucide-react';

const ICP_NUMBER = '2025085990';
export const EMAIL = 'ichenghub@gmail.com';

interface FooterProps {
  onCopyEmail: () => void;
  copied: boolean;
}

export default function Footer({ onCopyEmail, copied }: FooterProps) {
  const t = useTranslations('footer');
  const locale = useLocale();
  const isEn = locale === 'en';
  const year = new Date().getFullYear();

  const footerLinks = isEn
    ? [
        { href: '/about', label: 'About' },
        { href: '/editorial-policy', label: 'Editorial Policy' },
        { href: '/privacy', label: 'Privacy Policy' },
        { href: '/terms', label: 'Terms' },
        { href: '/contact', label: 'Contact' },
      ]
    : [
        { href: '/about', label: '关于我们' },
        { href: '/editorial-policy', label: '编辑标准' },
        { href: '/privacy', label: '隐私政策' },
        { href: '/terms', label: '服务条款' },
        { href: '/contact', label: '联系我们' },
      ];

  return (
    <footer className="w-full apple-glass-footer">
      <div className="container mx-auto px-4 py-6 md:py-8 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center justify-center md:justify-start gap-3">
            <Link href="/" className="no-underline shrink-0">
              <div className="flex items-baseline font-extrabold italic tracking-tighter">
                <span className="text-base md:text-lg text-black dark:text-white">
                  iCheng
                </span>
                <span className="text-base md:text-lg text-[#e52129]">
                  Hub
                </span>
              </div>
            </Link>
            <span className="hidden md:block w-[1px] h-3 bg-gray-300 dark:bg-gray-800 shrink-0" />
            <span className="hidden md:inline text-xs text-gray-500">
              {isEn
                ? 'Practical Tools, Useful Knowledge, Privacy First.'
                : '实用工具 · 原创指南 · 隐私优先'}
            </span>
          </div>

          <nav
            aria-label={isEn ? 'Footer navigation' : '页脚导航'}
            className="flex flex-wrap items-center justify-center md:justify-end gap-x-5 gap-y-2 text-xs text-gray-500 dark:text-gray-400"
          >
            {footerLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="hover:text-[#e52129] transition-colors no-underline"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="pt-4 border-t border-gray-200/70 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-gray-400 dark:text-gray-500">
          <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-4 gap-y-1">
            <span>{t('copyright', { year })}</span>
            <a
              href="https://beian.miit.gov.cn"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#e52129] transition-colors duration-200 no-underline"
            >
              {t('icp', { number: ICP_NUMBER })}
            </a>
          </div>

          <div className="flex items-center justify-center sm:justify-end">
            <button
              onClick={onCopyEmail}
              className="flex items-center gap-1.5 text-gray-500 hover:text-[#e52129] transition-colors duration-200 cursor-pointer group"
              title={t('emailTooltip')}
            >
              <Mail className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
              <span>{copied ? t('copied') : EMAIL}</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
