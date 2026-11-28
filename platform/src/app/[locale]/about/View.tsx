'use client';

import { Link } from '@/navigation';
import { useLocale, useTranslations } from 'next-intl';
import {
  Sparkles,
  ShieldCheck,
  Wrench,
  BookOpenCheck,
  FileText,
  Mail,
  ArrowRight,
} from 'lucide-react';

export default function AboutView() {
  const t = useTranslations('AboutPage');
  const locale = useLocale();
  const isEn = locale === 'en';

  const policyLinks = isEn
    ? [
        {
          href: '/editorial-policy',
          title: 'Editorial Policy & Review Methodology',
          desc: 'How we write guides, verify tool claims, and review third-party directory submissions.',
          icon: BookOpenCheck,
        },
        {
          href: '/privacy',
          title: 'Privacy Policy',
          desc: 'Details on browser-local processing, optional OAuth sign-in, analytics, and Google AdSense.',
          icon: ShieldCheck,
        },
        {
          href: '/terms',
          title: 'Terms of Service',
          desc: 'Usage boundaries for browser utilities, external links, and site content.',
          icon: FileText,
        },
        {
          href: '/contact',
          title: 'Contact Us',
          desc: 'Report bugs, request corrections, or get in touch with Heguang Studio directly.',
          icon: Mail,
        },
      ]
    : [
        {
          href: '/editorial-policy',
          title: '内容编辑规范与审核标准',
          desc: '了解我们如何编写核验指南、审核第三方工具导航及处理错误反馈。',
          icon: BookOpenCheck,
        },
        {
          href: '/privacy',
          title: '隐私政策',
          desc: '如实说明浏览器本地处理机制、可选 OAuth 登录、匿名统计与 Google AdSense 说明。',
          icon: ShieldCheck,
        },
        {
          href: '/terms',
          title: '服务条款',
          desc: '说明在线工具使用边界、第三方链接免责与知识产权归属。',
          icon: FileText,
        },
        {
          href: '/contact',
          title: '联系我们',
          desc: '反馈工具 Bug、内容纠错、隐私咨询或直接联系和光工作室。',
          icon: Mail,
        },
      ];

  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Hero & Studio Story */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-[#e52129] text-xs font-semibold mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            <span>{t('badge')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight leading-snug text-gray-900 mb-6">
            {t('title')}
          </h1>

          <div className="relative border-l-4 border-[#e52129]/20 pl-4 sm:pl-6 space-y-5 text-gray-600 text-[15px] sm:text-base md:text-lg leading-[1.85]">
            <p className="text-base sm:text-lg md:text-xl text-gray-700 font-medium leading-[1.7]">
              {t.rich('subtitle', {
                strong: (chunks) => <strong className="font-semibold text-gray-900">{chunks}</strong>,
                highlight: (chunks) => (
                  <span className="font-semibold text-gray-900 underline decoration-[#e52129]/40 decoration-2 underline-offset-4">
                    {chunks}
                  </span>
                ),
              })}
            </p>
            <p>
              {t.rich('story1', {
                strong: (chunks) => <strong className="font-semibold text-gray-900">{chunks}</strong>,
                highlight: (chunks) => (
                  <span className="font-semibold text-gray-900 underline decoration-[#e52129]/40 decoration-2 underline-offset-4">
                    {chunks}
                  </span>
                ),
              })}
            </p>
            <p>
              {t.rich('story2', {
                strong: (chunks) => <strong className="font-semibold text-gray-900">{chunks}</strong>,
                highlight: (chunks) => (
                  <span className="font-semibold text-gray-900 underline decoration-[#e52129]/40 decoration-2 underline-offset-4">
                    {chunks}
                  </span>
                ),
              })}
            </p>
            <p className="font-medium text-gray-900 italic mt-4">{t('signature')}</p>
          </div>
        </div>

        {/* Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 mb-10">
          <div className="p-5 sm:p-8 apple-glass-card rounded-2xl sm:rounded-3xl">
            <div className="bg-emerald-50 w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-emerald-700 mb-4 sm:mb-5">
              <ShieldCheck size={24} />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2.5 sm:mb-3 leading-[1.4]">
              {isEn ? 'Privacy-Conscious Browser Tools' : '隐私优先的浏览器本地工具'}
            </h2>
            <p className="text-gray-600 text-[15px] md:text-base leading-[1.85]">
              {isEn
                ? 'Our self-developed utilities—Image Compressor, Shape Cropper, QR Code Generator, and AI Quota Tracker—run locally in your browser using Canvas, Web Workers, and localStorage so your everyday files stay on your device.'
                : '自研的图片压缩器、形状裁剪器、二维码生成器与 AI 额度追踪器均基于浏览器本地 Canvas、Web Worker 与 localStorage 构建，尽可能避免不必要的文件上传。'}
            </p>
          </div>

          <div className="p-5 sm:p-8 apple-glass-card rounded-2xl sm:rounded-3xl">
            <div className="bg-red-50 w-11 h-11 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center text-[#e52129] mb-4 sm:mb-5">
              <Wrench size={24} />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-2.5 sm:mb-3 leading-[1.4]">{t('feature1Title')}</h2>
            <p className="text-gray-600 text-[15px] md:text-base leading-[1.85]">
              {t('feature1Desc')}
            </p>
          </div>
        </div>

        {/* Transparency & Policies Grid */}
        <section className="mb-10">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2.5">
            {isEn ? 'Transparency & Site Policies' : '平台规范与透明信息'}
          </h2>
          <p className="text-[15px] md:text-base text-gray-600 leading-[1.8] mb-6">
            {isEn
              ? 'To keep iChengHub sustainable as an independent project, we display non-intrusive advertisements that stay out of the way of core tool workflows.'
              : '作为独立维护的长期项目，本站会以克制、不干扰核心工具操作的方式展示广告以支持服务器与研发成本，并公开完整的编辑与隐私政策。'}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {policyLinks.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="group flex items-start gap-4 p-4 sm:p-5 apple-glass-card rounded-2xl"
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-100 text-gray-700 flex items-center justify-center shrink-0 group-hover:bg-red-50 group-hover:text-[#e52129] transition-colors">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-gray-900 group-hover:text-[#e52129] transition-colors flex items-center justify-between gap-2">
                      <span>{item.title}</span>
                      <ArrowRight className="w-4 h-4 shrink-0 text-gray-400 group-hover:text-[#e52129]" />
                    </div>
                    <p className="text-sm text-gray-500 mt-1.5 leading-[1.75]">
                      {item.desc}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {/* Bottom CTA */}
        <div className="apple-glass rounded-2xl sm:rounded-3xl p-6 sm:p-8 md:p-10 flex flex-col items-center text-center">
          <p className="text-[15px] sm:text-base text-gray-600 leading-[1.8] mb-6 max-w-xl">{t('ctaText')}</p>
          <Link
            href="/submit"
            className="inline-flex items-center px-8 py-3 bg-[#e52129] text-white rounded-full font-medium hover:bg-red-600 transition-all shadow-md"
          >
            {t('ctaButton')}
          </Link>
        </div>
      </div>
    </div>
  );
}
