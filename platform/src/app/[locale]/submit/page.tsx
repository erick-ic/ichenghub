import { Metadata } from 'next';
import SubmitView from './View';

type Props = {
  params: { locale: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const isEn = params.locale === 'en';
  return {
    title: isEn ? 'Submit Tool - Recommend AI Tools' : '提交工具 - 推荐 AI 工具',
    description: isEn 
      ? 'Submit your AI tool or request new features. Join our community of AI enthusiasts.' 
      : '提交你的 AI 工具或提出功能需求。加入我们的 AI 爱好者社区。',
    alternates: {
      canonical: `/${params.locale}/submit`,
      languages: {
        zh: '/zh/submit',
        en: '/en/submit',
        'x-default': '/zh/submit',
      },
    },
    openGraph: {
      title: isEn ? 'Submit Tool - Recommend AI Tools' : '提交工具 - 推荐 AI 工具',
      description: isEn
        ? 'Submit your AI tool or request new features. Join our community of AI enthusiasts.'
        : '提交你的 AI 工具或提出功能需求。加入我们的 AI 爱好者社区。',
      url: `https://ichenghub.cn/${params.locale}/submit`,
      siteName: isEn ? 'iChengHub' : 'iChengHub 热荐工坊',
      locale: isEn ? 'en_US' : 'zh_CN',
      type: 'website',
      images: [{ url: '/brand/icon-512-v2.png', width: 512, height: 512, alt: isEn ? 'Submit Tool' : '提交工具' }],
    },
    twitter: {
      card: 'summary_large_image',
      title: isEn ? 'Submit Tool - Recommend AI Tools' : '提交工具 - 推荐 AI 工具',
      description: isEn
        ? 'Submit your AI tool or request new features. Join our community of AI enthusiasts.'
        : '提交你的 AI 工具或提出功能需求。加入我们的 AI 爱好者社区。',
      images: ['/brand/icon-512-v2.png'],
    },
  };
}

export default function SubmitPage() {
  return <SubmitView />;
}
