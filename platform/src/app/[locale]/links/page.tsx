import { Metadata } from 'next';
import { PackageOpen } from 'lucide-react';
import prisma from '@/lib/prisma';
import { SidebarNav } from '@/components/SidebarNav';
import { ToolCard } from '@/components/navigation/ToolCard';
import MobileCategorySelector from '@/components/navigation/MobileCategorySelector';
import { getTranslations } from 'next-intl/server';

type Props = {
  params: { locale: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const isEn = params.locale === 'en';
  const title = isEn ? 'Useful Links - Resources Directory' : '实用链接 - 资源导航';
  const description = isEn
    ? 'Explore our curated directory of useful resources and AI-related links. Hand-picked for maximum value.'
    : '探索我们精心整理的实用资源与 AI 相关链接。精挑细选，价值最大化。';

  return {
    title,
    description,
    keywords: isEn
      ? ['AI resources', 'useful links', 'AI directory', 'productivity resources']
      : ['实用链接', '资源导航', 'AI 资源', '效率网站导航'],
    alternates: {
      canonical: `/${params.locale}/links`,
      languages: {
        zh: '/zh/links',
        en: '/en/links',
        'x-default': '/zh/links',
      },
    },
    openGraph: {
      title,
      description,
      url: `https://ichenghub.cn/${params.locale}/links`,
      siteName: isEn ? 'iChengHub' : 'iChengHub 热荐工坊',
      locale: isEn ? 'en_US' : 'zh_CN',
      type: 'website',
      images: [{ url: '/brand/icon-512-v2.png', width: 512, height: 512, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/brand/icon-512-v2.png'],
    },
  };
}

export const dynamic = 'force-dynamic';

interface ExternalTool {
  id: string;
  title: string;
  titleEn: string | null;
  description: string;
  descriptionEn: string | null;
  url: string;
  iconUrl?: string;
  category: string;
  categoryEn: string | null;
  status: number;
  sortOrder: number;
}

interface CategorySection {
  category: string;
  categoryEn: string | null;
  tools: ExternalTool[];
}

function groupToolsByCategory(tools: ExternalTool[], isEnglish: boolean): CategorySection[] {
  const grouped = tools.reduce((acc, tool) => {
    const key = isEnglish && tool.categoryEn ? tool.categoryEn : tool.category;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(tool);
    return acc;
  }, {} as Record<string, ExternalTool[]>);

  return Object.entries(grouped).map(([category, categoryTools]) => ({
    category,
    categoryEn: categoryTools[0].categoryEn,
    tools: categoryTools,
  }));
}

async function getTools(): Promise<ExternalTool[]> {
  const tools = await prisma.navLink.findMany({
    where: { status: 1 },
    orderBy: { sortOrder: 'asc' },
  });

  return tools.map(tool => ({
    id: tool.id,
    title: tool.name,
    titleEn: tool.nameEn,
    description: tool.desc,
    descriptionEn: tool.descEn,
    url: tool.url,
    iconUrl: tool.iconUrl || undefined,
    category: tool.category,
    categoryEn: tool.categoryEn,
    status: tool.status,
    sortOrder: tool.sortOrder,
  }));
}

function EmptyState({ t }: { t: (key: string) => string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24">
      <div className="relative mb-6">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
          <PackageOpen className="w-12 h-12 text-primary/60" />
        </div>
        <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white border-2 border-gray-100 shadow-sm flex items-center justify-center">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {t('noTools')}
      </h3>
      <p className="text-gray-500 text-center max-w-md">
        {t('noToolsDesc')}
      </p>
    </div>
  );
}

export default async function LinksPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'LinksPage' });
  const isEnglish = locale === 'en';
  const tools = await getTools();

  const categories = [...new Set(tools.map(tool => isEnglish && tool.categoryEn ? tool.categoryEn : tool.category))];
  const groupedTools = groupToolsByCategory(tools, isEnglish);

  return (
    <div className="min-w-0">
      {/* 移动端布局 */}
      <div className="md:hidden container mx-auto px-4 py-6">
        <MobileCategorySelector 
          categories={categories} 
          isEnglish={isEnglish} 
        />
        
        <div className="mt-6">
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            {t('title')}
          </h1>
          <p className="text-gray-500 mb-6">
            {t('description')}
          </p>

          {tools.length === 0 ? (
            <EmptyState t={t} />
          ) : (
            <div className="space-y-12">
              {groupedTools.map((section) => (
                <div
                  key={section.category}
                  data-category={encodeURIComponent(section.category)}
                  className="scroll-mt-24"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <h2 className="text-lg font-semibold text-gray-900">
                      {section.category}
                    </h2>
                    <span className="text-sm text-gray-400">
                      ({section.tools.length})
                    </span>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    {section.tools.map((tool) => (
                      <ToolCard
                        key={tool.id}
                        tool={tool}
                        isEnglish={isEnglish}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 桌面端布局 */}
      <div className="hidden md:block container mx-auto px-4 py-8">
        <div className="flex gap-6">
          <aside className="w-56 flex-shrink-0">
            <SidebarNav 
              categories={categories} 
              tools={tools} 
              isEnglish={isEnglish} 
            />
          </aside>

          <main className="flex-1 min-w-0">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                {t('title')}
              </h1>
              <p className="text-gray-500">
                {t('description')}
              </p>
            </div>

            {tools.length === 0 ? (
              <EmptyState t={t} />
            ) : (
              <div className="space-y-12">
                {groupedTools.map((section) => (
                  <div
                    key={section.category}
                    data-category={encodeURIComponent(section.category)}
                    className="scroll-mt-24"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <h2 className="text-lg font-semibold text-gray-900">
                        {section.category}
                      </h2>
                      <span className="text-sm text-gray-400">
                        ({section.tools.length})
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {section.tools.map((tool) => (
                        <ToolCard
                          key={tool.id}
                          tool={tool}
                          isEnglish={isEnglish}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}