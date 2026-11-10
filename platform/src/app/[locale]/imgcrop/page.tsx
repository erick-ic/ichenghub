import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import ImageCropper from '@/components/tools/ImageCropper';
import PageViewTracker from '@/components/PageViewTracker';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'ImageCropper' });

  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    keywords: ['图片裁剪', '圆形头像', '形状裁剪', '在线裁图', '头像生成器', '本地裁剪', '隐私保护', 'image cropper', 'circle avatar', 'shape crop'],
    alternates: {
      canonical: `/${locale}/imgcrop`,
      languages: {
        zh: '/zh/imgcrop',
        en: '/en/imgcrop',
        'x-default': '/zh/imgcrop',
      },
    },
    openGraph: {
      title: t('metaTitle'),
      description: t('metaDescription'),
      url: `https://ichenghub.cn/${locale}/imgcrop`,
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

export default async function ImageCropperPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'ImageCropper' });

  return (
    <>
      <PageViewTracker path="/imgcrop" resourceType="TOOL" />
      <div className="min-h-screen bg-background">
        <section className="container mx-auto px-4 py-12 md:py-16 max-w-6xl">
          <header className="mb-10 text-center">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-900 mb-3">
              {t('title')}
            </h1>
            <p className="text-base md:text-lg text-zinc-500 max-w-3xl mx-auto lg:whitespace-nowrap">
              {t('description')}
            </p>
          </header>

          <ImageCropper />
        </section>
      </div>
    </>
  );
}
