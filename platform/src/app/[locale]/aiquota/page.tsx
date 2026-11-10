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
    title: t('metaTitle'),
    description: t('metaDescription'),
    keywords: ['AI额度', '额度追踪', 'Midjourney', 'ChatGPT', '每日额度', '本地存储', 'AI quota', 'quota tracker', 'Midjourney quota'],
    alternates: {
      canonical: `/${locale}/aiquota`,
      languages: {
        zh: '/zh/aiquota',
        en: '/en/aiquota',
        'x-default': '/zh/aiquota',
      },
    },
    openGraph: {
      title: t('metaTitle'),
      description: t('metaDescription'),
      url: `https://ichenghub.cn/${locale}/aiquota`,
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

export default async function AiQuotaPage() {
  return (
    <>
      <PageViewTracker path="/aiquota" resourceType="TOOL" />
      <AiQuotaTracker />
    </>
  );
}
