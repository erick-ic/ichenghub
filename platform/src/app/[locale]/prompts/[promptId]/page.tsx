import { Metadata, ResolvingMetadata } from 'next';
import PromptDetailCard, { PromptDetailData } from '@/components/PromptDetailCard';
import ColorExtractedImage from '@/components/ColorExtractedImage';
import LikeButton from '@/components/stats/LikeButton';
import FavoriteButton from '@/components/stats/FavoriteButton';
import CopyGenerateButton from '@/components/stats/CopyGenerateButton';
import AnimatedNumber from '@/components/stats/AnimatedNumber';
import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import { Eye, Tag } from 'lucide-react';
import { Link } from '@/navigation';
import ViewsTracker from '@/components/ViewsTracker';
import { cookies } from 'next/headers';

export const revalidate = 0;

export async function generateMetadata(
  { params }: { params: { promptId: string; locale: string } },
  parent: ResolvingMetadata
): Promise<Metadata> {
  const { promptId, locale } = params;
  const prompt = await prisma.prompt.findUnique({ where: { id: promptId } });

  if (!prompt || prompt.status !== 1) {
    return { title: '提示词未找到 | 热荐工坊' };
  }

  const isEnglish = locale === 'en';
  const title = isEnglish && prompt.titleEn ? prompt.titleEn : prompt.title;
  const description = prompt.promptText.substring(0, 150) + '...';

  return {
    title: `${title} | 热荐工坊`,
    description: description,
    openGraph: {
      title: `${title} - 热荐工坊`,
      description: description,
      url: `https://ichenghub.cn/${locale}/prompts/${promptId}`,
      type: 'article',
    },
    twitter: {
      title: `${title} - 热荐工坊`,
      description: description,
    },
  };
}

interface PageProps {
  params: Promise<{ locale: string; promptId: string }>;
}

export default async function PromptDetailPage({ params }: PageProps) {
  const { locale, promptId } = await params;
  const isEnglish = locale === 'en';

  const cookieStore = await cookies();
  const isLiked = cookieStore.has(`liked_${promptId}`);

  const prompt = await prisma.prompt.findUnique({
    where: { id: promptId },
  });

  if (!prompt || prompt.status !== 1) {
    notFound();
  }

  const promptTitle = isEnglish ? (prompt.titleEn || prompt.title) : prompt.title;
  const category = isEnglish ? (prompt.categoryEn || prompt.category) : prompt.category;
  const platformName = isEnglish ? (prompt.platformEn || prompt.platform) : prompt.platform;

  const promptData: PromptDetailData = {
    id: prompt.id,
    title: prompt.title,
    titleEn: prompt.titleEn,
    promptText: prompt.promptText,
    platformName: platformName,
    platformUrl: prompt.platformUrl || undefined,
    commentsCount: prompt.comments,
    category: category,
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    name: promptTitle,
    description: prompt.promptText.substring(0, 200) + '...',
    url: `https://ichenghub.cn/${locale}/prompts/${promptId}`,
    author: {
      '@type': 'Organization',
      name: '和光工作室',
    },
    publisher: {
      '@type': 'Organization',
      name: '热荐工坊',
    },
    articleSection: category,
    keywords: [category, 'AI', 'Prompt', '提示词'],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      ratingCount: String(prompt.likes),
    },
    commentCount: String(prompt.comments),
  };


  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ViewsTracker promptId={promptId} path={`/${locale}/prompts/${promptId}`} />
      <div className="min-h-screen bg-background">
        <section className="container mx-auto px-4 py-8 sm:py-16 max-w-6xl">
          <nav className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-6 sm:mb-12 text-xs sm:text-sm text-zinc-500">
            <Link href="/" className="shrink-0 hover:text-zinc-800 transition-colors font-medium">
              {isEnglish ? 'Home' : '首页'}
            </Link>
            <span className="text-zinc-400">/</span>
            <Link href="/prompts" className="shrink-0 hover:text-zinc-800 transition-colors font-medium">
              {isEnglish ? 'Prompt List' : '提示词列表'}
            </Link>
            <span className="text-zinc-400">/</span>
            <span className="text-zinc-800 font-semibold min-w-0 break-words">{promptTitle}</span>
          </nav>

          <div className="mb-5 sm:mb-8">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-zinc-900 tracking-tight">
              {promptTitle}
            </h1>
          </div>

          {/* 标签区域：分类和推荐平台（移动端保持同一行，靠缩小字号/内边距容纳） */}
          <div className="flex flex-nowrap items-center gap-0.5 sm:gap-3 mb-6">
            {category && (
              <span className="inline-flex items-center gap-0.5 sm:gap-2 min-w-0 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100 rounded-full px-1 sm:px-4 py-1.5 sm:py-2">
                <div className="w-3.5 h-3.5 sm:w-5 sm:h-5 shrink-0 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center">
                  <Tag className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                </div>
                <span className="text-[10px] sm:text-sm font-semibold text-blue-600 truncate">{category}</span>
              </span>
            )}
            {prompt.platform && (
              <span className="inline-flex items-center gap-0.5 sm:gap-2 min-w-0 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-full px-1 sm:px-4 py-1.5 sm:py-2">
                <div className="w-3.5 h-3.5 sm:w-5 sm:h-5 shrink-0 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
                  <svg className="w-2 h-2 sm:w-3 sm:h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <span className="text-[10px] sm:text-sm font-medium text-orange-700 shrink-0">{isEnglish ? 'Recommended Platform:' : '推荐平台'}</span>
                {prompt.platformUrl && (
                  <a
                    href={prompt.platformUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-600 font-semibold hover:text-orange-800 transition-colors flex items-center gap-0 sm:gap-1 min-w-0 text-[10px] sm:text-sm"
                  >
                    <span className="truncate">{platformName}</span>
                    <svg className="w-3 h-3 sm:w-4 sm:h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </span>
            )}
          </div>

          {/* 双栏布局：移动端垂直排列，桌面端并排，使用 Grid 确保等高 */}
          <div className="grid grid-cols-1 lg:grid-cols-[3fr,1fr] gap-8 items-stretch">
            {/* 左侧：图片 */}
            <div className="flex-1">
              <ColorExtractedImage 
                src={prompt.imageUrl || ''} 
                alt={promptTitle}
                unoptimized={prompt.imageUrl?.startsWith('http')}
              />
            </div>

            {/* 右侧统计卡片：移动端在图片下方，桌面端在图片右侧，撑满高度并两端对齐 */}
            <div className="flex flex-col justify-between h-full">
              {/* 上盒子：浏览、点赞、收藏 */}
              <div className="space-y-4">
                <div className="relative bg-white/90 backdrop-blur-md border border-zinc-100 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden h-24">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-blue-100/40 to-transparent rounded-bl-full"></div>
                  <div className="relative h-full flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center eye-container ring-2 ring-blue-100/50">
                        <Eye className="w-5 h-5 text-blue-500 eye-icon" />
                        <div className="absolute inset-0 bg-blue-500/5 rounded-xl"></div>
                      </div>
                      <span className="text-zinc-500 text-sm font-medium">{isEnglish ? 'Views' : '浏览'}</span>
                    </div>
                    <AnimatedNumber value={prompt.views} className="text-3xl font-bold text-zinc-900" />
                  </div>
                </div>

                <LikeButton 
                  promptId={promptId}
                  initialLiked={isLiked}
                  initialCount={prompt.likes}
                  isEnglish={isEnglish}
                />

                <FavoriteButton 
                  promptId={promptId}
                  initialFavorited={false}
                  initialCount={prompt.favorites}
                  isEnglish={isEnglish}
                />
              </div>

              {/* 下盒子：复制去生成按钮 */}
              <div className="mt-4 lg:mt-auto">
                {prompt.platformUrl && (
                  <CopyGenerateButton 
                    promptText={prompt.promptText}
                    platformUrl={prompt.platformUrl}
                    promptId={promptId}
                    isEnglish={isEnglish}
                  />
                )}
              </div>
            </div>
          </div>

          {/* 提示词详情卡片 - 在统计卡片下方 */}
          <div className="mt-8">
            <PromptDetailCard data={promptData} isEnglish={isEnglish} />
          </div>
        </section>
      </div>
      <style>{`
        .eye-icon {
          transition: transform 0.3s ease;
          transform-origin: center;
        }
        .eye-container:hover .eye-icon {
          transform: scale(1.1);
          animation: eye-blink 0.6s ease-in-out;
        }
        @keyframes eye-blink {
          0%, 40%, 100% { 
            transform: scale(1.1); 
            clip-path: inset(0 0 0 0);
          }
          50% { 
            transform: scale(1.1);
            clip-path: inset(45% 0 45% 0);
          }
        }
      `}</style>
    </>
  );
}
