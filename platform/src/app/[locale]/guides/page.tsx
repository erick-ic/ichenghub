import { Metadata } from 'next';
import { Link } from '@/navigation';
import { BookOpen, ArrowRight, Clock, Users } from 'lucide-react';
import PageViewTracker from '@/components/PageViewTracker';
import { getAllGuides } from '@/data/guides';

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === 'en';
  const title = isEn ? 'Practical Guides & Privacy Insights' : '实用指南与隐私技术解读';
  const description = isEn
    ? 'Step-by-step guides on browser-based file processing, image compression formats, shape cropping, static QR codes, and managing AI usage limits privately.'
    : '围绕浏览器本地处理、图片格式与压缩、形状裁剪透明导出、静态二维码与 AI 额度管理的原创实战指南。';

  return {
    title,
    description,
    keywords: isEn
      ? ['browser-based processing', 'image compression guide', 'WebP vs PNG', 'static QR code', 'AI quota management']
      : ['浏览器本地处理', '图片压缩指南', 'WebP对比PNG', '静态二维码', 'AI额度管理'],
    alternates: {
      canonical: `/${locale}/guides`,
      languages: {
        zh: '/zh/guides',
        en: '/en/guides',
        'x-default': '/zh/guides',
      },
    },
    openGraph: {
      title,
      description,
      url: `https://ichenghub.cn/${locale}/guides`,
      siteName: isEn ? 'iChengHub' : 'iChengHub 热荐工坊',
      locale: isEn ? 'en_US' : 'zh_CN',
      type: 'website',
      images: [{ url: '/brand/icon-512-v2.png', width: 512, height: 512, alt: title }],
    },
  };
}

export default async function GuidesIndexPage({ params }: Props) {
  const { locale } = await params;
  const isEn = locale === 'en';
  const guides = getAllGuides(locale);

  return (
    <>
      <PageViewTracker path={`/${locale}/guides`} />
      <div className="min-h-screen">
        <section className="container mx-auto px-4 py-8 md:py-12">
          <header className="mb-8 md:mb-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-50 text-[#e52129] text-xs font-semibold mb-4">
              <BookOpen className="w-3.5 h-3.5" />
              <span>{isEn ? 'Practical Guides' : '原创实战指南'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 mb-3">
              {isEn ? 'Practical Guides & Privacy Insights' : '实用指南与隐私技术解读'}
            </h1>
            <p className="text-base md:text-lg text-zinc-600 leading-relaxed">
              {isEn
                ? 'Verified walkthroughs on image optimization, transparent cropping, browser-local privacy, and AI quota workflows.'
                : '围绕图片格式选择、透明背景裁剪、浏览器本地隐私与 AI 额度管理编写的原创实用教程。'}
            </p>
          </header>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {guides.map((guide) => (
              <article
                key={guide.slug}
                className="group flex flex-col justify-between apple-glass-card rounded-2xl p-5 sm:p-6 md:p-7"
              >
                <div>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-zinc-100 text-zinc-700 text-xs font-medium">
                      {guide.category}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-zinc-400">
                      <Clock className="w-3.5 h-3.5" />
                      {guide.readingTime}
                    </span>
                  </div>

                  <h2 className="text-lg sm:text-xl font-bold text-zinc-900 group-hover:text-[#e52129] transition-colors mb-3 leading-[1.45]">
                    <Link href={`/guides/${guide.slug}`}>{guide.title}</Link>
                  </h2>

                  <p className="text-sm sm:text-[15px] text-zinc-600 leading-[1.8] mb-5">
                    {guide.summary}
                  </p>
                </div>

                <div className="pt-4 border-t border-zinc-100 space-y-3">
                  <div className="flex items-center gap-2 text-xs text-zinc-500">
                    <Users className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
                    <span>{guide.audience}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-400">
                      {isEn ? `Updated ${guide.updatedAt}` : `更新于 ${guide.updatedAt}`}
                    </span>
                    <Link
                      href={`/guides/${guide.slug}`}
                      className="inline-flex items-center gap-1 font-semibold text-zinc-900 group-hover:text-[#e52129] transition-colors"
                    >
                      {isEn ? 'Read Guide' : '阅读全文'}
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
