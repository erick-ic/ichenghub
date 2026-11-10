import { Metadata, ResolvingMetadata } from 'next';
import Image from 'next/image';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Link } from '@/navigation';
import { Tag, ArrowRight, ExternalLink } from 'lucide-react';
import PageViewTracker from '@/components/PageViewTracker';

export const revalidate = 0;

export async function generateMetadata(
  { params }: { params: { id: string; locale: string } },
  parent: ResolvingMetadata
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

      <div className="min-h-screen bg-background">
        <section className="container mx-auto px-4 py-16 max-w-4xl">
          <nav className="flex items-center gap-2 mb-12 text-sm text-zinc-500">
            <Link href="/" className="hover:text-zinc-800 transition-colors font-medium">
              {isEnglish ? 'Home' : '首页'}
            </Link>
            <span className="text-zinc-400">/</span>
            <Link href="/tools" className="hover:text-zinc-800 transition-colors font-medium">
              {isEnglish ? 'Tools' : '工具导航'}
            </Link>
            <span className="text-zinc-400">/</span>
            <span className="text-zinc-800 font-semibold">{title}</span>
          </nav>

          <div className="flex items-start gap-6 mb-8">
            <div className="flex-shrink-0 w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden">
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

            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 mb-3">
                {title}
              </h1>
              <p className="text-lg text-zinc-600 mb-4">
                {description}
              </p>
              
              {category && (
                <span className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-full px-4 py-2">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                    <Tag className="w-3 h-3 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-blue-600">{category}</span>
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-4 mb-12">
            {tool.url && (
              <a
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl font-semibold hover:from-red-600 hover:to-orange-600 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5"
              >
                <ExternalLink className="w-5 h-5" />
                {isEnglish ? 'Visit Website' : '访问官网'}
              </a>
            )}
            <Link
              href="/tools"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white border border-gray-200 text-zinc-700 rounded-xl font-semibold hover:bg-gray-50 transition-all"
            >
              <ArrowRight className="w-5 h-5" />
              {isEnglish ? 'Back to Tools' : '返回工具列表'}
            </Link>
          </div>

          <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
            <h2 className="text-xl font-bold text-zinc-900 mb-4">
              {isEnglish ? 'Tool Details' : '工具详情'}
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-500">{isEnglish ? 'Name' : '工具名称'}</span>
                <span className="font-medium text-zinc-900">{title}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-500">{isEnglish ? 'Category' : '分类'}</span>
                <span className="font-medium text-zinc-900">{category}</span>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-gray-100">
                <span className="text-gray-500">{isEnglish ? 'Description' : '描述'}</span>
                <span className="font-medium text-zinc-900 max-w-xs text-right">{description}</span>
              </div>
              {tool.url && (
                <div className="flex items-center justify-between py-3">
                  <span className="text-gray-500">{isEnglish ? 'Website' : '官网链接'}</span>
                  <a
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                  >
                    {tool.url}
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}