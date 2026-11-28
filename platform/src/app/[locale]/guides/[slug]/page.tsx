import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Link } from '@/navigation';
import { ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, Clock, Wrench } from 'lucide-react';
import PageViewTracker from '@/components/PageViewTracker';
import { getAllGuides, getAllGuideSlugs, getGuideBySlug } from '@/data/guides';

type Props = {
  params: Promise<{ locale: string; slug: string }>;
};

export function generateStaticParams() {
  const slugs = getAllGuideSlugs();
  const locales = ['zh', 'en'] as const;
  return locales.flatMap((locale) => slugs.map((slug) => ({ locale, slug })));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const guide = getGuideBySlug(locale, slug);
  const isEn = locale === 'en';

  if (!guide) {
    return { title: isEn ? 'Guide Not Found' : '指南未找到' };
  }

  return {
    title: guide.title,
    description: guide.summary,
    alternates: {
      canonical: `/${locale}/guides/${slug}`,
      languages: {
        zh: `/zh/guides/${slug}`,
        en: `/en/guides/${slug}`,
        'x-default': `/zh/guides/${slug}`,
      },
    },
    openGraph: {
      title: guide.title,
      description: guide.summary,
      url: `https://ichenghub.cn/${locale}/guides/${slug}`,
      siteName: isEn ? 'iChengHub' : 'iChengHub 热荐工坊',
      locale: isEn ? 'en_US' : 'zh_CN',
      type: 'article',
      publishedTime: guide.publishedAt,
      modifiedTime: guide.updatedAt,
      images: [{ url: '/brand/icon-512-v2.png', width: 512, height: 512, alt: guide.title }],
    },
  };
}

export default async function GuideDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  const isEn = locale === 'en';
  const guide = getGuideBySlug(locale, slug);

  if (!guide) {
    notFound();
  }

  const otherGuides = getAllGuides(locale).filter((item) => item.slug !== slug);
  const baseUrl = 'https://ichenghub.cn';
  const pageUrl = `${baseUrl}/${locale}/guides/${slug}`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Article',
        headline: guide.title,
        description: guide.summary,
        datePublished: guide.publishedAt,
        dateModified: guide.updatedAt,
        inLanguage: isEn ? 'en' : 'zh-CN',
        articleSection: guide.category,
        url: pageUrl,
        mainEntityOfPage: { '@type': 'WebPage', '@id': pageUrl },
        author: {
          '@type': 'Organization',
          name: isEn ? 'Heguang Studio' : '和光工作室',
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
          { '@type': 'ListItem', position: 1, name: isEn ? 'Home' : '首页', item: `${baseUrl}/${locale}` },
          { '@type': 'ListItem', position: 2, name: isEn ? 'Guides' : '实用指南', item: `${baseUrl}/${locale}/guides` },
          { '@type': 'ListItem', position: 3, name: guide.title, item: pageUrl },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <PageViewTracker path={`/${locale}/guides/${slug}`} />
      <div className="min-h-screen">
        <article className="container mx-auto px-4 py-8 md:py-12">
          <nav className="flex items-center gap-2 mb-6 sm:mb-8 text-xs sm:text-sm text-zinc-500 min-w-0">
            <Link href="/" className="shrink-0 whitespace-nowrap hover:text-zinc-900 transition-colors">
              {isEn ? 'Home' : '首页'}
            </Link>
            <span className="shrink-0 text-zinc-400">/</span>
            <Link href="/guides" className="shrink-0 whitespace-nowrap hover:text-zinc-900 transition-colors">
              {isEn ? 'Guides' : '实用指南'}
            </Link>
            <span className="shrink-0 text-zinc-400">/</span>
            <span className="min-w-0 truncate text-zinc-900 font-medium" title={guide.title}>
              {guide.title}
            </span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-10 items-start">
            <div className="lg:col-span-3 space-y-8">
              <header className="space-y-4 border-b border-zinc-200/80 pb-8">
                <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                  <span className="px-2.5 py-1 rounded-md bg-red-50 text-[#e52129] font-semibold">
                    {guide.category}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {guide.readingTime}
                  </span>
                  <span>
                    {isEn ? `Updated ${guide.updatedAt}` : `最后更新于 ${guide.updatedAt}`}
                  </span>
                  <span>{isEn ? 'By Heguang Studio' : '作者：和光工作室'}</span>
                </div>

                <h1 className="text-2xl md:text-[28px] font-bold tracking-tight text-zinc-900 leading-snug">
                  {guide.title}
                </h1>

                <p className="text-base md:text-lg text-zinc-600 leading-relaxed">
                  {guide.summary}
                </p>

                <div className="pt-2">
                  <Link
                    href={guide.relatedToolHref}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition-colors"
                  >
                    <Wrench className="w-4 h-4" />
                    {guide.relatedToolLabel}
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </header>

              {/* Main Sections */}
              <div className="space-y-9">
                {guide.sections.map((section) => (
                  <section key={section.id} id={section.id} className="scroll-mt-24 space-y-4">
                    <h2 className="text-xl md:text-2xl font-bold text-zinc-900 leading-[1.4]">
                      {section.heading}
                    </h2>
                    {section.paragraphs.map((paragraph, idx) => (
                      <p key={idx} className="text-[15px] md:text-base text-zinc-700 leading-[1.85] tracking-[0.01em]">
                        {paragraph}
                      </p>
                    ))}
                    {section.bullets && (
                      <ul className="space-y-3 pl-1">
                        {section.bullets.map((bullet, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 text-[15px] md:text-base text-zinc-700 leading-[1.8]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#e52129] shrink-0 mt-[11px]" />
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                    {section.table && (
                      <>
                        {/* Mobile: Stacked Key-Value Cards */}
                        <div className="md:hidden space-y-3.5">
                          {section.table.rows.map((row, rIdx) => (
                            <div
                              key={rIdx}
                              className="rounded-xl border border-zinc-200/80 bg-white p-4 space-y-3"
                            >
                              <div className="font-semibold text-[15px] text-zinc-900 pb-2.5 border-b border-zinc-100 leading-snug">
                                {row[0]}
                              </div>
                              <dl className="space-y-2.5">
                                {row.slice(1).map((cell, cIdx) => (
                                  <div key={cIdx} className="space-y-1">
                                    <dt className="text-xs font-medium text-zinc-400">
                                      {section.table!.headers[cIdx + 1]}
                                    </dt>
                                    <dd className="text-sm text-zinc-700 leading-[1.75]">{cell}</dd>
                                  </div>
                                ))}
                              </dl>
                            </div>
                          ))}
                        </div>

                        {/* Desktop / Tablet: Standard Table */}
                        <div className="hidden md:block overflow-x-auto rounded-xl border border-zinc-200/80 bg-white">
                          <table className="w-full text-left border-collapse text-sm">
                            <thead>
                              <tr className="border-b border-zinc-200 bg-zinc-50">
                                {section.table.headers.map((header) => (
                                  <th key={header} className="py-3 px-4 font-semibold text-zinc-900 whitespace-nowrap">
                                    {header}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                              {section.table.rows.map((row, rIdx) => (
                                <tr key={rIdx}>
                                  {row.map((cell, cIdx) => (
                                    <td
                                      key={cIdx}
                                      className={`py-3 px-4 leading-relaxed ${
                                        cIdx === 0 ? 'font-semibold text-zinc-900 whitespace-nowrap' : 'text-zinc-600'
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
                      </>
                    )}
                  </section>
                ))}
              </div>

              {/* Limitations */}
              <section className="rounded-2xl bg-amber-50/50 backdrop-blur-md border border-amber-200/70 p-5 sm:p-6 space-y-3.5 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <h2 className="text-base sm:text-lg font-bold text-zinc-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600" />
                  <span>{isEn ? 'Limitations & Caveats' : '适用边界与注意事项'}</span>
                </h2>
                <ul className="space-y-2.5 text-[15px] md:text-base text-zinc-700 leading-[1.8]">
                  {guide.limitations.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600 shrink-0 mt-[11px]" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Key Takeaways */}
              <section className="rounded-2xl bg-emerald-50/50 backdrop-blur-md border border-emerald-200/70 p-5 sm:p-6 space-y-3.5 shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <h2 className="text-base sm:text-lg font-bold text-zinc-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                  <span>{isEn ? 'Key Takeaways' : '核心要点总结'}</span>
                </h2>
                <ul className="space-y-2.5 text-[15px] md:text-base text-zinc-700 leading-[1.8]">
                  {guide.keyTakeaways.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-1.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </section>

              {/* Back & Related Guides */}
              <div className="pt-6 border-t border-zinc-200/80 space-y-6">
                <div className="flex items-center justify-between">
                  <Link
                    href="/guides"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    {isEn ? 'Back to All Guides' : '返回全部指南'}
                  </Link>
                </div>

                <div>
                  <h2 className="text-lg font-bold text-zinc-900 mb-4">
                    {isEn ? 'More Practical Guides' : '更多实用指南'}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {otherGuides.map((item) => (
                      <Link
                        key={item.slug}
                        href={`/guides/${item.slug}`}
                        className="group rounded-xl apple-glass-card p-4"
                      >
                        <div className="text-xs text-zinc-400 mb-1.5">{item.category}</div>
                        <div className="font-semibold text-sm text-zinc-900 group-hover:text-[#e52129] transition-colors line-clamp-2">
                          {item.title}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar TOC */}
            <aside className="hidden lg:block lg:col-span-1 sticky top-24">
              <div className="rounded-2xl apple-glass-card p-5 space-y-3">
                <div className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  {isEn ? 'On This Page' : '本页目录'}
                </div>
                <nav className="space-y-2">
                  {guide.sections.map((section) => (
                    <a
                      key={section.id}
                      href={`#${section.id}`}
                      className="block text-xs text-zinc-600 hover:text-[#e52129] leading-relaxed transition-colors"
                    >
                      {section.heading}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>
          </div>
        </article>
      </div>
    </>
  );
}
