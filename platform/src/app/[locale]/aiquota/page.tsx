import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import AiQuotaTracker from '@/components/tools/ai-quota/AiQuotaTracker';
import PageViewTracker from '@/components/PageViewTracker';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'AiQuota' });
  return {
    title: `${t('title')} | iChengHub`,
    description: t('description'),
    alternates: {
      canonical: `/${locale}/aiquota`,
      languages: {
        zh: '/zh/aiquota',
        en: '/en/aiquota',
        'x-default': '/zh/aiquota',
      },
    },
  };
}

export default async function AiQuotaPage() {
  return (
    <>
      <PageViewTracker path="/aiquota" resourceType="TOOL" />
      <AiQuotaTracker />
    </>
  );
}
