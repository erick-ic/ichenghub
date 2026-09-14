import { Metadata } from 'next';
import './../globals.css';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import ClientLayout from './ClientLayout';
import { auth } from '../../../auth';

type Props = {
  params: { locale: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const isEn = params.locale === 'en';
  const base = 'https://ichenghub.cn';
  return {
    metadataBase: new URL(base),
    title: {
      template: isEn
        ? '%s | iChengHub: AI Tools, Prompts, Navigation & Tech Blog'
        : '%s | iChengHub 热荐工坊：AI 工具 · 爆款提示词 · 效率导航 · 技术博客',
      default: isEn
        ? 'iChengHub | AI Tools Portal, Prompts, Navigation & Tech Blog'
        : 'iChengHub 热荐工坊 | AI 工具门户 · 爆款提示词 · 效率导航 · 技术博客',
    },
    description: isEn
      ? 'iChengHub is a premium portal empowering digital creators. Explore self-developed AI tools, viral prompt templates, essential efficiency directories, and professional technical blogs.'
      : 'iChengHub（热荐工坊）是专为开发者与创造者打造的 AI 门户系统。提供自研 AI 工具、爆款图像提示词模板、全网热门效率网站导航、以及涵盖 Go/Next.js 等前沿技术的独立技术博客专栏。',
    keywords: isEn
      ? ['AI Tools', 'AI Prompts', 'Prompt Templates', 'AI Productivity', 'Tech Blog', 'iChengHub']
      : ['AI工具', '提示词', '效率导航', '技术博客', 'iChengHub', '热荐工坊'],
    authors: [{ name: isEn ? 'Heguang Studio' : '和光工作室' }],
    alternates: {
      canonical: './',
      languages: {
        'zh': `${base}/zh`,
        'en': `${base}/en`,
        'x-default': `${base}/zh`,
      },
    },
    openGraph: {
      title: isEn ? 'iChengHub | AI Tools, Prompts, Navigation & Tech Blog' : 'iChengHub 热荐工坊 | AI 工具门户',
      description: isEn
        ? 'Self-developed AI tools, viral prompts, curated navigation, and technical blogs for digital creators.'
        : '自研 AI 工具、爆款提示词模板、全网热门导航与深度技术博客。',
      url: base,
      siteName: isEn ? 'iChengHub' : '热荐工坊',
      locale: isEn ? 'en_US' : 'zh_CN',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: isEn ? 'iChengHub | AI Tools & Tech Blog' : 'iChengHub 热荐工坊',
      description: isEn
        ? 'Premium AI portal: self-developed tools, viral prompts, curated navigation, and technical blogs.'
        : 'AI 门户系统：自研工具 · 爆款提示词 · 效率导航 · 技术博客。',
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
      apple: '/favicon.svg',
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
  const [messages, session] = await Promise.all([
    getMessages({ locale: params.locale }),
    auth(),
  ]);

  return (
    <NextIntlClientProvider messages={messages} locale={params.locale}>
      <ClientLayout
        locale={params.locale}
        isLoggedIn={!!session?.user}
        userImage={session?.user?.image ?? null}
      >
        <main className="flex-1">
          {children}
        </main>
      </ClientLayout>
    </NextIntlClientProvider>
  );
}