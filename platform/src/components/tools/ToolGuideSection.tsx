import { Link } from '@/navigation';
import {
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  BookOpen,
  Wrench,
  Layers,
  ListChecks,
  Cpu,
} from 'lucide-react';
import type { ToolGuideContent } from '@/data/tool-guides';

interface ToolGuideSectionProps {
  guide: ToolGuideContent;
  locale: string;
}

export default function ToolGuideSection({ guide, locale }: ToolGuideSectionProps) {
  const isEn = locale === 'en';
  const baseUrl = 'https://ichenghub.cn';
  const pageUrl = `${baseUrl}/${locale}${guide.path}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: guide.name,
        description: guide.overview,
        url: pageUrl,
        applicationCategory: guide.applicationCategory,
        operatingSystem: 'Web Browser',
        inLanguage: isEn ? 'en' : 'zh-CN',
        isAccessibleForFree: true,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: isEn ? 'USD' : 'CNY',
        },
        publisher: {
          '@type': 'Organization',
          name: isEn ? 'iChengHub' : 'iChengHub 热荐工坊',
          url: baseUrl,
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          {
            '@type': 'ListItem',
            position: 1,
            name: isEn ? 'Home' : '首页',
            item: `${baseUrl}/${locale}`,
          },
          {
            '@type': 'ListItem',
            position: 2,
            name: isEn ? 'Tools' : '工具分类',
            item: `${baseUrl}/${locale}/tools`,
          },
          {
            '@type': 'ListItem',
            position: 3,
            name: guide.name,
            item: pageUrl,
          },
        ],
      },
    ],
  };

  const quickLinks = [
    { id: 'guide-overview', label: isEn ? 'Overview' : '工具介绍' },
    { id: 'guide-steps', label: isEn ? 'How to Use' : '使用步骤' },
    ...(guide.comparison ? [{ id: 'guide-reference', label: isEn ? 'Comparison' : '参数对比' }] : []),
    { id: 'guide-privacy', label: isEn ? 'Privacy & Tech' : '原理与隐私' },
    { id: 'guide-faq', label: 'FAQ' },
  ];

  return (
    <div className="mt-8 md:mt-10 space-y-7 md:space-y-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />

      {/* Frosted-Glass Transition & Single-Row Horizontal Scroll Quick-Jump Capsule */}
      <div className="relative py-2 sm:py-4">
        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-gradient-to-r from-transparent via-zinc-300/80 to-transparent"
        />
        <nav
          aria-label={isEn ? 'Tool documentation sections' : '工具说明目录'}
          className="relative mx-auto flex w-fit max-w-full flex-nowrap items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar rounded-full apple-glass px-2 py-1.5 sm:px-3"
        >
          <span className="hidden sm:inline-flex shrink-0 items-center gap-1.5 pl-2 pr-2.5 text-xs font-semibold text-zinc-500 border-r border-zinc-200/80 whitespace-nowrap">
            <BookOpen className="w-3.5 h-3.5 text-[#e52129]" />
            {isEn ? 'Guide & Docs' : '使用说明与原理'}
          </span>
          {quickLinks.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 sm:py-1 text-[13px] sm:text-xs font-medium text-zinc-600 transition-colors hover:bg-white/90 hover:text-[#e52129]"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>

      {/* Overview & Key Features */}
      <section id="guide-overview" className="scroll-mt-24 grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8 items-start">
        <div className="lg:col-span-2 space-y-3.5 sm:space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#e52129]">
            <Wrench className="w-4 h-4" />
            <span>{isEn ? 'About This Tool' : '工具介绍'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 leading-[1.4] tracking-tight">
            {guide.overviewTitle}
          </h2>
          <p className="text-zinc-600 text-[15px] md:text-base leading-[1.85] tracking-[0.01em]">
            {guide.overview}
          </p>
        </div>

        <div className="lg:col-span-3 apple-glass-card rounded-2xl p-5 sm:p-6 md:p-8">
          <h3 className="text-base sm:text-lg font-bold text-zinc-900 mb-4 sm:mb-5 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#e52129]" />
            <span>{isEn ? 'Key Capabilities' : '核心功能'}</span>
          </h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            {guide.features.map((feature) => (
              <li key={feature.title} className="rounded-xl bg-zinc-50/80 border border-zinc-100 p-4">
                <div className="font-semibold text-zinc-900 text-[15px] sm:text-sm mb-1.5 leading-snug">{feature.title}</div>
                <p className="text-sm text-zinc-600 leading-[1.75]">{feature.desc}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* How to Use */}
      <section id="guide-steps" className="scroll-mt-24 apple-glass-card rounded-2xl p-5 sm:p-6 md:p-8">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#e52129] mb-2">
          <ListChecks className="w-4 h-4" />
          <span>{isEn ? 'Step-by-Step' : '使用步骤'}</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 leading-[1.4] mb-5 sm:mb-6">
          {guide.howToTitle}
        </h2>
        <ol className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-5">
          {guide.steps.map((step, index) => (
            <li
              key={step.title}
              className="relative flex items-start gap-3.5 md:block rounded-xl border border-zinc-100 bg-zinc-50/60 p-4 sm:p-5"
            >
              <span className="inline-flex items-center justify-center w-6 h-6 sm:w-7 sm:h-7 shrink-0 rounded-full bg-zinc-900 text-white text-xs font-bold mt-0.5 md:mt-0 md:mb-3">
                {index + 1}
              </span>
              <div className="min-w-0">
                <h3 className="font-semibold text-zinc-900 text-[15px] md:text-base mb-1.5 leading-snug">{step.title}</h3>
                <p className="text-sm text-zinc-600 leading-[1.75]">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Technical Comparison / Reference Table */}
      {guide.comparison && (
        <section id="guide-reference" className="scroll-mt-24 apple-glass-card rounded-2xl p-5 sm:p-6 md:p-8">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#e52129] mb-2">
            <Layers className="w-4 h-4" />
            <span>{isEn ? 'Technical Reference' : '参数与格式说明'}</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 leading-[1.4] mb-2.5">
            {guide.comparison.title}
          </h2>
          <p className="text-[15px] md:text-base text-zinc-600 mb-5 sm:mb-6 leading-[1.8]">
            {guide.comparison.description}
          </p>

          {/* Mobile: Stacked Key-Value Cards (no horizontal clipping) */}
          <div className="md:hidden space-y-3.5">
            {guide.comparison.rows.map((row, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-zinc-100 bg-zinc-50/70 p-4 space-y-3"
              >
                <div className="font-semibold text-[15px] text-zinc-900 pb-2.5 border-b border-zinc-200/70 leading-snug">
                  {row[0]}
                </div>
                <dl className="space-y-2.5">
                  {row.slice(1).map((cell, cellIdx) => (
                    <div key={cellIdx} className="space-y-1">
                      <dt className="text-xs font-medium text-zinc-400">
                        {guide.comparison!.headers[cellIdx + 1]}
                      </dt>
                      <dd className="text-sm text-zinc-700 leading-[1.75]">{cell}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}
          </div>

          {/* Desktop / Tablet: Standard Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50/80">
                  {guide.comparison.headers.map((header) => (
                    <th key={header} className="py-3 px-4 font-semibold text-zinc-900 whitespace-nowrap">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {guide.comparison.rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-zinc-50/50">
                    {row.map((cell, cellIdx) => (
                      <td
                        key={cellIdx}
                        className={`py-3 px-4 leading-relaxed ${
                          cellIdx === 0 ? 'font-semibold text-zinc-900 whitespace-nowrap' : 'text-zinc-600'
                        }`}
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* How It Works + Privacy & Security */}
      <section id="guide-privacy" className="scroll-mt-24 grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        <div className="apple-glass-card rounded-2xl p-5 sm:p-6 md:p-8 space-y-3.5 sm:space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-700">
            <Cpu className="w-4 h-4 text-[#e52129]" />
            <span>{isEn ? 'How It Works' : '工作原理'}</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-zinc-900 leading-[1.4]">{guide.howItWorksTitle}</h2>
          <div className="space-y-3 text-[15px] md:text-base text-zinc-600 leading-[1.85]">
            {guide.howItWorksParagraphs.map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>
        </div>

        <div className="bg-emerald-50/60 backdrop-blur-md border border-emerald-200/70 rounded-2xl p-5 sm:p-6 md:p-8 space-y-3.5 sm:space-y-4 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700">
            <ShieldCheck className="w-4 h-4" />
            <span>{isEn ? 'Privacy & Data Handling' : '隐私与数据处理说明'}</span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-zinc-900 leading-[1.4]">{guide.privacyTitle}</h2>
          <ul className="space-y-3 text-[15px] md:text-base text-zinc-700 leading-[1.8]">
            {guide.privacyPoints.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-1.5" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs sm:text-sm text-zinc-500 pt-3 border-t border-emerald-200/60 leading-relaxed">
            {isEn ? 'Read our full ' : '查看完整的 '}
            <Link href="/privacy" className="text-emerald-700 font-medium underline underline-offset-2 hover:text-emerald-800">
              {isEn ? 'Privacy Policy' : '隐私政策'}
            </Link>
            {isEn ? ' for details on site analytics and cookies.' : '，了解站点访问统计与 Cookie 说明。'}
          </p>
        </div>
      </section>

      {/* Practical Use Cases & Limitations */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        <div className="apple-glass-card rounded-2xl p-5 sm:p-6 md:p-8">
          <h2 className="text-lg sm:text-xl font-bold text-zinc-900 mb-3.5 sm:mb-4 leading-[1.4]">
            {isEn ? 'Practical Use Cases' : '典型使用场景'}
          </h2>
          <ul className="space-y-3 text-[15px] md:text-base text-zinc-600 leading-[1.8]">
            {guide.useCases.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#e52129] shrink-0 mt-[11px]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-amber-50/50 backdrop-blur-md border border-amber-200/70 rounded-2xl p-5 sm:p-6 md:p-8 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
          <h2 className="text-lg sm:text-xl font-bold text-zinc-900 mb-3.5 sm:mb-4 flex items-center gap-2 leading-[1.4]">
            <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 shrink-0" />
            <span>{isEn ? 'Current Limitations' : '使用限制与注意事项'}</span>
          </h2>
          <ul className="space-y-3 text-[15px] md:text-base text-zinc-700 leading-[1.8]">
            {guide.limitations.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0 mt-[11px]" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section id="guide-faq" className="scroll-mt-24 apple-glass-card rounded-2xl p-5 sm:p-6 md:p-8">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#e52129] mb-2">
          <HelpCircle className="w-4 h-4" />
          <span>FAQ</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-zinc-900 mb-5 sm:mb-6 leading-[1.4]">
          {isEn ? 'Frequently Asked Questions' : '常见问题'}
        </h2>
        <div className="divide-y divide-zinc-100">
          {guide.faqs.map((faq) => (
            <div key={faq.question} className="py-4 sm:py-5 first:pt-0 last:pb-0">
              <h3 className="text-[15px] sm:text-base font-semibold text-zinc-900 mb-2 leading-[1.5]">{faq.question}</h3>
              <p className="text-sm md:text-base text-zinc-600 leading-[1.85]">{faq.answer}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Related Tools & Related Guides */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
        <div className="apple-glass-card rounded-2xl p-5 sm:p-6">
          <h2 className="text-base sm:text-lg font-bold text-zinc-900 mb-3.5 sm:mb-4 flex items-center gap-2">
            <Wrench className="w-4 h-4 text-[#e52129]" />
            <span>{isEn ? 'Related Browser Tools' : '相关自研工具'}</span>
          </h2>
          <div className="space-y-3">
            {guide.relatedTools.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="group flex items-center justify-between gap-3 sm:gap-4 rounded-xl apple-glass-card p-4"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-zinc-900 text-sm group-hover:text-[#e52129] transition-colors">
                    {tool.name}
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-500 mt-1 leading-relaxed">{tool.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-[#e52129] group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            ))}
          </div>
        </div>

        <div className="apple-glass-card rounded-2xl p-5 sm:p-6">
          <h2 className="text-base sm:text-lg font-bold text-zinc-900 mb-3.5 sm:mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-[#e52129]" />
            <span>{isEn ? 'Related Practical Guides' : '延伸阅读指南'}</span>
          </h2>
          <div className="space-y-3">
            {guide.relatedGuides.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="group flex items-center justify-between gap-3 sm:gap-4 rounded-xl apple-glass-card p-4"
              >
                <div className="min-w-0">
                  <div className="font-semibold text-zinc-900 text-sm group-hover:text-[#e52129] transition-colors">
                    {item.title}
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-500 mt-1 leading-relaxed">{item.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-[#e52129] group-hover:translate-x-0.5 transition-all shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
