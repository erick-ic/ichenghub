import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/navigation';
import ImageCompressor from '@/components/tools/ImageCompressor';
import ToolGuideSection from '@/components/tools/ToolGuideSection';
import { getToolGuide } from '@/data/tool-guides';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'ImageCompressor' });
  
  return {
    title: t('metaTitle'),
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
      title: t('metaTitle'),
      description: t('metaDescription'),
      url: `https://ichenghub.cn/${locale}/imgcompress`,
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

export default async function ImageCompressorPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'ImageCompressor' });
  const isEn = locale === 'en';
  const guide = getToolGuide(locale, 'imgcompress');

  return (
    <div className="min-h-screen">
      <section className="container mx-auto px-4 py-10 md:py-14">
        <nav className="flex items-center gap-2 mb-8 text-xs sm:text-sm text-zinc-500">
          <Link href="/" className="hover:text-zinc-900 transition-colors">
            {isEn ? 'Home' : '首页'}
          </Link>
          <span className="text-zinc-400">/</span>
          <Link href="/tools" className="hover:text-zinc-900 transition-colors">
            {isEn ? 'Tools' : '工具分类'}
          </Link>
          <span className="text-zinc-400">/</span>
          <span className="text-zinc-900 font-medium">{guide.name}</span>
        </nav>

        <header className="mb-10 text-center">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 mb-3">
            {t('title')}
          </h1>
          <p className="text-base md:text-lg text-zinc-500 mx-auto xl:whitespace-nowrap">
            {t('description')}
          </p>
        </header>

        <div className="apple-glass rounded-2xl p-6 md:p-8">
          <ImageCompressor />
        </div>

        <ToolGuideSection guide={guide} locale={locale} />
      </section>
    </div>
  );
}