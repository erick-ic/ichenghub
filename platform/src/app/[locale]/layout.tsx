import { Metadata } from 'next';
import './../globals.css';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import ClientLayout from './ClientLayout';

type Props = {
  params: { locale: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const isEn = params.locale === 'en';
  const base = 'https://ichenghub.cn';
  // 当前语言站点地址：作为布局层默认 canonical，避免相对路径解析到站点根目录
  const canonical = `${base}/${params.locale}`;
  const ogImage = {
    url: '/brand/icon-512-v2.png',
    width: 512,
    height: 512,
    alt: isEn ? 'iChengHub - AI Tools Portal' : 'iChengHub 热荐工坊 - AI 工具门户',
  };
  return {
    metadataBase: new URL(base),
    title: {
      template: isEn
        ? '%s | iChengHub'
        : '%s | iChengHub 热荐工坊',
      default: isEn
        ? 'iChengHub | Privacy-First Browser Tools, Practical Guides & Tech Blog'
        : 'iChengHub 热荐工坊 | 隐私优先在线工具 · 实用指南 · 效率导航 · 技术博客',
    },
    description: isEn
      ? 'Discover practical browser-based tools, carefully reviewed digital resources, straightforward guides, and technical articles designed for privacy-conscious everyday work.'
      : 'iChengHub（热荐工坊）提供浏览器本地处理的实用在线工具、人工筛选的数字资源导航、原创实战指南与技术博客，助力更高效、更注重隐私的数字工作流。',
    keywords: isEn
      ? ['Browser Tools', 'Local Image Compressor', 'Shape Cropper', 'QR Code Generator', 'AI Productivity', 'Tech Blog', 'iChengHub']
      : ['在线工具', '本地图片压缩', '形状裁剪', '二维码生成', '实用指南', '效率导航', '技术博客', 'iChengHub'],
    authors: [{ name: isEn ? 'Heguang Studio' : '和光工作室' }],
    alternates: {
      canonical: canonical,
      languages: {
        'zh': `${base}/zh`,
        'en': `${base}/en`,
        'x-default': `${base}/zh`,
      },
    },
    openGraph: {
      title: isEn ? 'iChengHub | Privacy-First Browser Tools & Guides' : 'iChengHub 热荐工坊 | 隐私优先在线工具与实用指南',
      description: isEn
        ? 'Practical browser-based utilities, reviewed digital resources, and technical guides.'
        : '浏览器本地处理工具、实用效率指南、精选数字资源与原创技术博客。',
      url: canonical,
      siteName: isEn ? 'iChengHub' : '热荐工坊',
      locale: isEn ? 'en_US' : 'zh_CN',
      type: 'website',
      images: [ogImage],
    },
    twitter: {
      card: 'summary_large_image',
      title: isEn ? 'iChengHub | Practical Tools & Guides' : 'iChengHub 热荐工坊',
      description: isEn
        ? 'Browser-based tools, practical guides, reviewed resources, and technical blogs.'
        : '隐私优先在线工具、实用指南、精选导航与技术博客。',
      images: [ogImage.url],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    icons: {
      icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
      apple: [{ url: '/apple-touch-icon-v2.png', sizes: '180x180', type: 'image/png' }],
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  setRequestLocale(params.locale);
  // 公共 layout 不读取 Cookie/Session，避免所有前台页面因 auth() 被迫按请求动态渲染。
  // 登录态由 ClientLayout 在浏览器端按需获取；真正需要鉴权的页面和 API 仍在服务端调用 auth()。
  const messages = await getMessages({ locale: params.locale });

  return (
    <NextIntlClientProvider messages={messages} locale={params.locale}>
      <ClientLayout locale={params.locale}>
        <main className="flex-1">
          {children}
        </main>
      </ClientLayout>
    </NextIntlClientProvider>
  );
}
