import { Metadata } from 'next';
import AboutView from './View';

type Props = {
  params: { locale: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const isEn = params.locale === 'en';
  const title = isEn ? 'About Us - Pure AI Workshop' : '关于我们 - 纯净 AI 工坊';
  const description = isEn
    ? 'Learn about iChengHub, your dedicated AI efficiency compass. We curate high-quality AI tools and productivity prompts.'
    : '了解热荐工坊，你的专属效率罗盘。我们精心收录高质量 AI 工具与生产力提示词。';

  return {
    title,
    description,
    alternates: {
      canonical: `/${params.locale}/about`,
      languages: {
        zh: '/zh/about',
        en: '/en/about',
        'x-default': '/zh/about',
      },
    },
    openGraph: {
      title,
      description,
      url: `https://ichenghub.cn/${params.locale}/about`,
      siteName: isEn ? 'iChengHub' : 'iChengHub 热荐工坊',
      locale: isEn ? 'en_US' : 'zh_CN',
      type: 'website',
      images: [{ url: '/brand/icon-512-v2.png', width: 512, height: 512, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/brand/icon-512-v2.png'],
    },
  };
}

export default function AboutPage() {
  return <AboutView />;
}
