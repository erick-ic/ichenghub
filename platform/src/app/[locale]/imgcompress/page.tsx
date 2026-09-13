import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import ImageCompressor from '@/components/tools/ImageCompressor';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'ImageCompressor' });
  
  return {
    title: `${t('metaTitle')} | iChengHub`,
    description: t('metaDescription'),
    keywords: ['图片压缩', '在线压缩', 'JPG压缩', 'PNG压缩', 'WebP压缩', '本地压缩', '隐私保护', 'image compressor', 'online image compression'],
    alternates: {
      canonical: `/${locale}/imgcompress`,
      languages: {
        zh: '/zh/imgcompress',
        en: '/en/imgcompress',
        'x-default': '/zh/imgcompress',
      },
    },
    openGraph: {
      title: `${t('metaTitle')} | iChengHub`,
      description: t('metaDescription'),
      url: `https://ichenghub.cn/${locale}/imgcompress`,
    },
    twitter: {
      title: `${t('metaTitle')} | iChengHub`,
      description: t('metaDescription'),
    },
  };
}

export default async function ImageCompressorPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'ImageCompressor' });

  return (
    <div className="min-h-screen bg-background">
      <section className="container mx-auto px-4 py-16">
        <div className="mb-12 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-zinc-900 mb-4">
            {t('title')}
          </h1>
          <p className="text-lg text-zinc-500 max-w-4xl mx-auto">
            {t('description')}
          </p>
        </div>

        <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
          <ImageCompressor />
        </div>
      </section>
    </div>
  );
}