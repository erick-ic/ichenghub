import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import { getTranslations } from 'next-intl/server';
import CategorySidebar from '@/components/tools/CategorySidebar';
import CategoryContent from '@/components/tools/CategoryContent';
import MobileCategorySelector from '@/components/tools/MobileCategorySelector';
import PageViewTracker from '@/components/PageViewTracker';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'ToolsPage' });
  return {
    title: `${t('metaTitle')} | iChengHub`,
    description: t('metaDescription'),
    keywords: ['AI工具', '工具导航', '效率工具', 'AI工具推荐', 'AI tools', 'productivity tools', 'AI directory'],
    alternates: {
      canonical: `/${locale}/tools`,
      languages: {
        zh: '/zh/tools',
        en: '/en/tools',
        'x-default': '/zh/tools',
      },
    },
    openGraph: {
      title: `${t('metaTitle')} | iChengHub`,
      description: t('metaDescription'),
      url: `https://ichenghub.cn/${locale}/tools`,
    },
    twitter: {
      title: `${t('metaTitle')} | iChengHub`,
      description: t('metaDescription'),
    },
  };
}

export const dynamic = 'force-dynamic';

interface Tool {
  id: string;
  name: string;
  nameEn: string | null;
  desc: string;
  descEn: string | null;
  logoUrl: string;
  category: string;
  categoryEn: string | null;
  url: string | null;
}

interface CategoryGroup {
  categoryName: string;
  categoryNameEn: string | null;
  tools: Tool[];
}

interface DisplayCategoryGroup {
  categoryName: string;
  displayCategoryName: string;
  tools: Tool[];
}

interface SidebarCategory {
  categoryName: string;
  displayCategoryName: string;
  toolCount: number;
}

async function fetchTools(): Promise<Tool[]> {
  const tools = await prisma.toolCard.findMany({
    where: { status: 1 },
    orderBy: [
      { sortOrder: 'asc' },
      { createdAt: 'desc' },
    ],
  });
  return tools;
}

function groupToolsByCategory(tools: Tool[], isEnglish: boolean): CategoryGroup[] {
  const grouped = tools.reduce((acc, tool) => {
    const key = isEnglish && tool.categoryEn ? tool.categoryEn : tool.category;
    const existing = acc.find(g => {
      const existingKey = isEnglish && g.categoryNameEn ? g.categoryNameEn : g.categoryName;
      return existingKey === key;
    });
    if (existing) {
      existing.tools.push(tool);
    } else {
      acc.push({ categoryName: tool.category, categoryNameEn: tool.categoryEn, tools: [tool] });
    }
    return acc;
  }, [] as CategoryGroup[]);
  
  return grouped.sort((a, b) => {
    const aKey = isEnglish && a.categoryNameEn ? a.categoryNameEn : a.categoryName;
    const bKey = isEnglish && b.categoryNameEn ? b.categoryNameEn : b.categoryName;
    return aKey.localeCompare(bKey);
  });
}

export default async function ToolsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'ToolsPage' });
  const isEnglish = locale === 'en';
  const tools = await fetchTools();
  const groupedTools = groupToolsByCategory(tools, isEnglish);

  const displayGroups: DisplayCategoryGroup[] = groupedTools.map(group => ({
    ...group,
    displayCategoryName: isEnglish && group.categoryNameEn ? group.categoryNameEn : group.categoryName,
    tools: group.tools,
  }));

  const sidebarCategories: SidebarCategory[] = displayGroups.map(group => ({
    categoryName: group.categoryName,
    displayCategoryName: group.displayCategoryName,
    toolCount: group.tools.length,
  }));

  return (
    <>
      <PageViewTracker path={`/${locale}/tools`} />
      <div className="min-w-0">
      {/* 移动端布局 */}
      <div className="md:hidden container mx-auto px-4 py-6">
        <MobileCategorySelector 
          categories={sidebarCategories} 
          isEnglish={isEnglish} 
        />
        
        <div className="mt-6">
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            {t('title')}
          </h1>
          <p className="text-gray-500 mb-6">
            {t('description')}
          </p>

          <CategoryContent 
            categories={displayGroups} 
            isEnglish={isEnglish} 
            t={t} 
          />
        </div>
      </div>

      {/* 桌面端布局 */}
      <div className="hidden md:block container mx-auto px-4 py-8">
        <div className="flex gap-6">
          <aside className="w-56 flex-shrink-0">
            <CategorySidebar 
              categories={sidebarCategories} 
              totalCount={tools.length} 
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

            <CategoryContent 
              categories={displayGroups} 
              isEnglish={isEnglish} 
              t={t} 
            />
          </main>
        </div>
      </div>
    </div>
    </>
  );
}