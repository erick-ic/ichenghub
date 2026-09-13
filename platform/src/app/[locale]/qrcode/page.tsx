import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import QRCodeGenerator from '@/components/tools/qrcode/QRCodeGenerator';
import PageViewTracker from '@/components/PageViewTracker';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'QrCode' });
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    keywords: ['二维码生成器', 'QR Code', '二维码', '在线生成', 'SVG', 'PNG', '本地生成', 'qr code generator'],
    alternates: {
      canonical: `/${locale}/qrcode`,
      languages: {
        zh: '/zh/qrcode',
        en: '/en/qrcode',
        'x-default': '/zh/qrcode',
      },
    },
    openGraph: {
      title: t('metaTitle'),
      description: t('metaDescription'),
      url: `https://ichenghub.cn/${locale}/qrcode`,
    },
    twitter: {
      title: t('metaTitle'),
      description: t('metaDescription'),
    },
  };
}

export default async function QRCodePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'QrCode' });

  return (
    <>
      <PageViewTracker path="/qrcode" resourceType="TOOL" />
      <div className="min-h-screen bg-background">
        <section className="container mx-auto px-4 py-12 md:py-16 max-w-6xl">
          {/* Title / Description */}
          <header className="mb-10 text-center">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-900 mb-3">
              {t('title')}
            </h1>
            <p className="text-base md:text-lg text-zinc-500 max-w-2xl mx-auto">
              {t('description')}
            </p>
          </header>

          {/* Generator: 内部按 mobile 单列 / desktop 60-40 布局 */}
          <QRCodeGenerator />

          {/* Privacy */}
          <p className="mt-10 text-center text-xs text-gray-400 max-w-2xl mx-auto leading-relaxed">
            {t('privacy')}
          </p>
        </section>
      </div>
    </>
  );
}
