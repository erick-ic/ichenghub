import { Metadata } from 'next';
import prisma from '@/lib/prisma';
import { getTranslations } from 'next-intl/server';
import { ShieldCheck } from 'lucide-react';
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
    title: t('metaTitle'),
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
      title: t('metaTitle'),
      description: t('metaDescription'),
      url: `https://ichenghub.cn/${locale}/tools`,
      siteName: locale === 'en' ? 'iChengHub' : 'iChengHub 热荐工坊',
      locale: locale === 'en' ? 'en_US' : 'zh_CN',
      type: 'website',
      images: [{ url: '/brand/icon-512-v2.png', width: 512, height: 512, alt: t('metaTitle') }],
    },
    twitter: {
      card: 'summary_large_image',
      title: t('metaTitle'),
      description: t('metaDescription'),
      images: ['/brand/icon-512-v2.png'],
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
          <header className="pb-4 mb-6 border-b border-zinc-200/70">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 mb-1.5">
              {t('title')}
            </h1>
            <p className="text-sm text-zinc-500 leading-relaxed">
              {t('description')}
            </p>
          </header>

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
            <header className="pb-5 mb-7 border-b border-zinc-200/70">
              <h1 className="text-2xl md:text-[28px] font-bold tracking-tight text-zinc-900 mb-2">
                {t('title')}
              </h1>
              <p className="text-sm md:text-base text-zinc-500 leading-relaxed">
                {t('description')}
              </p>
            </header>

            <CategoryContent 
              categories={displayGroups} 
              isEnglish={isEnglish} 
              t={t} 
            />

            {/* Editorial Selection & Verification Note */}
            <section className="mt-10 rounded-2xl apple-glass-card p-6 space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-700">
                <ShieldCheck className="w-4 h-4" />
                <span>{isEnglish ? 'Curation & Verification Standards' : '工具收录与审核说明'}</span>
              </div>
              <h2 className="text-base font-bold text-zinc-900">
                {isEnglish ? 'How Tools Are Selected for This Directory' : '我们如何筛选并维护这份工具目录'}
              </h2>
              <p className="text-sm text-zinc-600 leading-relaxed">
                {isEnglish
                  ? 'Every listed tool is manually checked for active official availability, clear practical value, and transparent pricing or free-tier boundaries before publication. External third-party websites are governed by their own privacy policies; for privacy-sensitive image or QR tasks, try our browser-local utilities first.'
                  : '目录中的每一款工具均需经过人工核验官网可用性、核心使用场景与基础免费/收费边界后才会收录。第三方工具受各自隐私政策约束；如果你需要处理敏感图片或生成静态二维码，建议优先使用本站的浏览器本地自研工具。'}
              </p>
            </section>
          </main>
        </div>
      </div>
    </div>
    </>
  );
}