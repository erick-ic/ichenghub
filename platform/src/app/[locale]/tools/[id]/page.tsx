import { Metadata } from 'next';
import Image from 'next/image';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Link } from '@/navigation';
import { Tag, ArrowRight, ExternalLink } from 'lucide-react';
import PageViewTracker from '@/components/PageViewTracker';

export const revalidate = 0;

export async function generateMetadata(
  { params }: { params: { id: string; locale: string } }
): Promise<Metadata> {
  const { id, locale } = params;
  const tool = await prisma.toolCard.findUnique({ where: { id } });

  if (!tool || tool.status !== 1) {
    return { title: locale === 'en' ? 'Tool Not Found' : '工具未找到' };
  }

  const isEnglish = locale === 'en';
  const title = isEnglish && tool.nameEn ? tool.nameEn : tool.name;
  const description = isEnglish && tool.descEn ? tool.descEn : tool.desc;
  const siteName = isEnglish ? 'iChengHub' : 'iChengHub 热荐工坊';
  const category = isEnglish && tool.categoryEn ? tool.categoryEn : tool.category;
  const ogTitle = `${title} - ${siteName}`;

  return {
    title: title,
    description: description,
    keywords: [title, category, ...(isEnglish ? ['AI tool', 'AI tools directory'] : ['AI工具', '工具导航'])].filter(Boolean),
    alternates: {
      canonical: `/${locale}/tools/${id}`,
      languages: {
        zh: `/zh/tools/${id}`,
        en: `/en/tools/${id}`,
        'x-default': `/zh/tools/${id}`,
      },
    },
    openGraph: {
      title: ogTitle,
      description: description,
      url: `https://ichenghub.cn/${locale}/tools/${id}`,
      siteName: siteName,
      locale: isEnglish ? 'en_US' : 'zh_CN',
      type: 'website',
      images: [{ url: '/brand/icon-512-v2.png', width: 512, height: 512, alt: ogTitle }],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description: description,
      images: ['/brand/icon-512-v2.png'],
    },
  };
}

export default async function ToolDetailPage({ params }: { params: { id: string; locale: string } }) {
  const { id, locale } = params;
  const isEnglish = locale === 'en';

  const tool = await prisma.toolCard.findUnique({ where: { id } });

  if (!tool || tool.status !== 1) {
    notFound();
  }

  const title = isEnglish && tool.nameEn ? tool.nameEn : tool.name;
  const description = isEnglish && tool.descEn ? tool.descEn : tool.desc;
  const category = isEnglish && tool.categoryEn ? tool.categoryEn : tool.category;

  const relatedTools = await prisma.toolCard.findMany({
    where: {
      status: 1,
      category: tool.category,
      id: { not: tool.id },
    },
    orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    take: 4,
  });

  const lastVerifiedDate = tool.updatedAt.toISOString().slice(0, 10);

  // 结构化数据：仅声明真实可确认的字段，不再输出虚构的评分数据，避免触发搜索引擎的富媒体摘要惩罚
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: title,
    description: description,
    url: `https://ichenghub.cn/${locale}/tools/${id}`,
    applicationCategory: category || 'Productivity',
    operatingSystem: 'Web',
    inLanguage: isEnglish ? 'en' : 'zh-CN',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'CNY',
    },
  };

  return (
    <>
      <PageViewTracker path={`/${locale}/tools/${id}`} resourceId={id} resourceType="TOOL" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />

      <div className="min-h-screen">
        <section className="container mx-auto px-4 py-8 md:py-12">
          <nav className="flex items-center gap-2 mb-6 sm:mb-10 text-xs sm:text-sm text-zinc-500 min-w-0">
            <Link href="/" className="shrink-0 whitespace-nowrap hover:text-zinc-800 transition-colors font-medium">
              {isEnglish ? 'Home' : '首页'}
            </Link>
            <span className="shrink-0 text-zinc-400">/</span>
            <Link href="/tools" className="shrink-0 whitespace-nowrap hover:text-zinc-800 transition-colors font-medium">
              {isEnglish ? 'Tools' : '工具导航'}
            </Link>
            <span className="shrink-0 text-zinc-400">/</span>
            <span className="min-w-0 truncate text-zinc-800 font-semibold" title={title}>
              {title}
            </span>
          </nav>

          <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden">
              {tool.logoUrl ? (
                <Image 
                  src={tool.logoUrl} 
                  alt={title}
                  className="w-full h-full object-contain p-2"
                  width={80}
                  height={80}
                />
              ) : (
                <span className="text-2xl font-bold text-gray-400">
                  {title.charAt(0)}
                </span>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-2xl md:text-[28px] font-bold tracking-tight leading-[1.35] text-zinc-900 mb-2.5 sm:mb-3">
                {title}
              </h1>
              <p className="text-[15px] sm:text-lg text-zinc-600 leading-[1.8] mb-4">
                {description}
              </p>
              
              {category && (
                <span className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-full px-3.5 py-1.5 sm:px-4 sm:py-2">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                    <Tag className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-blue-600">{category}</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-4 mb-8 sm:mb-10">
            {tool.url && (
              <a
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 sm:px-8 sm:py-3.5 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl font-semibold hover:from-red-600 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5" />
                {isEnglish ? 'Visit Website' : '访问官网'}
              </a>
            )}
            <Link
              href="/tools"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 sm:px-8 sm:py-3.5 bg-white border border-gray-200 text-zinc-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
            >
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              {isEnglish ? 'Back to Tools' : '返回工具列表'}
            </Link>
          </div>

          <div className="apple-glass-card rounded-2xl p-5 sm:p-8">
            <h2 className="text-lg sm:text-xl font-bold text-zinc-900 mb-3 sm:mb-4">
              {isEnglish ? 'Tool Details' : '工具详情'}
            </h2>
            <div className="divide-y divide-gray-100 text-sm sm:text-base">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 py-3.5">
                <span className="text-xs sm:text-sm text-gray-500 shrink-0">{isEnglish ? 'Name' : '工具名称'}</span>
                <span className="font-medium text-zinc-900 sm:text-right">{title}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 py-3.5">
                <span className="text-xs sm:text-sm text-gray-500 shrink-0">{isEnglish ? 'Category' : '分类'}</span>
                <span className="font-medium text-zinc-900 sm:text-right">{category}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-4 py-3.5">
                <span className="text-xs sm:text-sm text-gray-500 shrink-0">{isEnglish ? 'Description' : '描述'}</span>
                <span className="font-medium text-zinc-900 sm:max-w-md sm:text-right leading-[1.75]">{description}</span>
              </div>
              {tool.url && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 py-3.5">
                  <span className="text-xs sm:text-sm text-gray-500 shrink-0">{isEnglish ? 'Website' : '官网链接'}</span>
                  <a
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 hover:text-blue-700 hover:underline inline-flex items-center gap-1 break-all sm:text-right"
                  >
                    <span>{tool.url}</span>
                    <ExternalLink className="w-4 h-4 shrink-0" />
                  </a>
                </div>
              )}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 sm:gap-4 py-3.5">
                <span className="text-xs sm:text-sm text-gray-500 shrink-0">{isEnglish ? 'Last Reviewed' : '最近核验日期'}</span>
                <span className="font-medium text-zinc-900 tabular-nums sm:text-right">{lastVerifiedDate}</span>
              </div>
            </div>
          </div>

          {/* Selection & Privacy Guidance */}
          <div className="mt-6 sm:mt-8 apple-glass-card rounded-2xl p-5 sm:p-6 md:p-8 space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-zinc-900">
              {isEnglish ? 'Review & Privacy Considerations' : '收录说明与使用建议'}
            </h2>
            <p className="text-[15px] md:text-base text-zinc-600 leading-[1.85]">
              {isEnglish
                ? 'This listing has been manually checked for official URL accuracy and category fit. Pricing plans, free-tier quotas, and data policies on third-party websites can change over time—please verify current terms on the official site before entering sensitive data or subscribing.'
                : '本条目已由本站人工核实官方链接与分类归属。第三方产品的收费方案、免费额度与隐私政策可能随版本调整，建议在上传敏感文件或付费订阅前先在官网确认最新条款。'}
            </p>
            <div className="flex flex-wrap gap-5 pt-1 text-sm">
              <Link href="/contact" className="font-medium text-zinc-700 hover:text-[#e52129] transition-colors">
                {isEnglish ? 'Report Outdated Info →' : '反馈失效链接或信息更新 →'}
              </Link>
            </div>
          </div>

          {/* Related Tools in Same Category */}
          {relatedTools.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-bold text-zinc-900 mb-4">
                {isEnglish ? `More in ${category}` : `同分类更多工具（${category}）`}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {relatedTools.map((item) => {
                  const itemName = isEnglish && item.nameEn ? item.nameEn : item.name;
                  const itemDesc = isEnglish && item.descEn ? item.descEn : item.desc;
                  return (
                    <Link
                      key={item.id}
                      href={`/tools/${item.id}`}
                      className="group rounded-xl apple-glass-card p-4"
                    >
                      <div className="font-semibold text-zinc-900 group-hover:text-[#e52129] transition-colors">
                        {itemName}
                      </div>
                      <p className="text-xs text-zinc-500 mt-1 line-clamp-2 leading-relaxed">
                        {itemDesc}
                      </p>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>
    </>
  );
}