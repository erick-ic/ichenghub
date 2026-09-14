import { getTranslations } from 'next-intl/server';
import ToolCard from '@/components/ToolCard';
import PageViewTracker from '@/components/PageViewTracker';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

interface Tool {
  id: string;
  name: string;
  nameEn: string | null;
  desc: string;
  descEn: string | null;
  logoUrl: string;
  category: string;
  url: string | null;
}

async function fetchTools(): Promise<Tool[]> {
  const tools = await prisma.toolCard.findMany({
    where: { status: 1 },
    orderBy: [
      { sortOrder: 'asc' },
      { createdAt: 'desc' },
    ]
  });
  return tools;
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'HomePage' });
  const tools = await fetchTools();

  const displayTools = tools.map(tool => ({
    ...tool,
    displayName: locale === 'en' && tool.nameEn ? tool.nameEn : tool.name,
    displayDesc: locale === 'en' && tool.descEn ? tool.descEn : tool.desc,
  }));

  return (
    <>
      <PageViewTracker path={`/${locale}`} />
      <section className="container mx-auto px-4 py-16">
      <div className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-100 mb-4">
          {t('heroTitle')}
        </h1>
        <p className="text-base md:text-lg tracking-wide text-gray-500 dark:text-gray-400 max-w-4xl mx-auto leading-relaxed">
          {t('heroSubtitle')}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {displayTools.length === 0 ? (
          <div className="col-span-full text-center py-16">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-slate-100">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-1">{t('noTools')}</h3>
            <p className="text-slate-500">{t('noToolsDesc')}</p>
          </div>
        ) : (
          displayTools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))
        )}
      </div>
    </section>
    </>
  );
}
