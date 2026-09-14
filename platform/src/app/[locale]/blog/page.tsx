import { Metadata } from 'next';
import { Link } from '@/navigation';
import PageViewTracker from '@/components/PageViewTracker';
import BlogHeroTypewriter from '@/components/BlogHeroTypewriter';
import FavoriteButton from '@/components/stats/FavoriteButton';
import { BlogPost, getAllBlogs } from '@/data/blogs';
import prisma from '@/lib/prisma';
import { auth } from '../../../../auth';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export function generateMetadata({ params }: PageProps): Metadata {
  const isEn = (params as unknown as { locale: string }).locale === 'en';
  const base = 'https://ichenghub.cn';
  return {
    metadataBase: new URL(base),
    title: isEn ? 'Technical Blog - iChengHub' : '技术博客专栏 - iChengHub 热荐工坊',
    description: isEn
      ? 'Independent tech blog covering AI, full-stack development, engineering practices and industry thoughts.'
      : '涵盖 AI、全栈开发、工程实践与行业思考的独立技术博客专栏。',
    keywords: isEn
      ? ['Tech Blog', 'AI', 'Full Stack', 'Engineering', 'Go', 'Next.js']
      : ['技术博客', 'AI', '全栈开发', '工程实践', 'Go', 'Next.js'],
    alternates: {
      canonical: isEn ? `${base}/en/blog` : `${base}/zh/blog`,
      languages: {
        'zh': `${base}/zh/blog`,
        'en': `${base}/en/blog`,
        'x-default': `${base}/zh/blog`,
      },
    },
    openGraph: {
      title: isEn ? 'Technical Blog - iChengHub' : '技术博客专栏 - iChengHub 热荐工坊',
      description: isEn
        ? 'Independent tech blog covering AI, full-stack development and engineering practices.'
        : '涵盖 AI、全栈开发与工程实践的独立技术博客。',
      url: isEn ? `${base}/en/blog` : `${base}/zh/blog`,
      siteName: 'iChengHub',
      locale: isEn ? 'en_US' : 'zh_CN',
      type: 'website',
    },
  };
}

export default async function BlogListPage({ params }: PageProps) {
  const { locale } = await params;
  const isEnglish = locale === 'en';

  let blogs: BlogPost[] = [];
  try {
    blogs = await getAllBlogs();
  } catch (error) {
    console.error('[blog] failed to load blogs:', error);
  }

  // 批量解析当前用户已收藏的博客 id（与详情页同一口径，未登录则全为未收藏）
  let favoritedIds = new Set<string>();
  let isLoggedIn = false;
  try {
    const session = await auth();
    isLoggedIn = !!session?.user?.id;
    if (session?.user?.id && blogs.length > 0) {
      const favorites = await prisma.userBlogFavorite.findMany({
        where: { userId: session.user.id, blogId: { in: blogs.map((b) => b.id) } },
        select: { blogId: true },
      });
      favoritedIds = new Set(favorites.map((f) => f.blogId));
    }
  } catch (favoriteError) {
    console.error('[blog] resolve favorite states failed:', favoriteError);
  }

  const phrases = isEnglish
    ? [
        'Exploring Go Full-Stack',
        'Deep Dive into Next.js 14',
        'Decoding AI Prompt Engineering',
        'Building High-Concurrency Services',
      ]
    : [
        '探索 Go 全栈架构',
        '深入 Next.js 14 最佳实践',
        '解密 AI 提示词工程',
        '构建高并发微服务',
      ];

  return (
    <>
      <PageViewTracker path={`/${locale}/blog`} />
      <main className="bg-background min-h-[calc(100vh-4rem)]">
        <BlogHeroTypewriter phrases={phrases} />

        <div className="max-w-4xl mx-auto px-6">
          {blogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
              <p className="text-2xl font-semibold text-foreground mb-2">
                {isEnglish ? 'No posts yet' : '还没有文章'}
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                {isEnglish ? 'Stay tuned.' : '敬请期待。'}
              </p>
            </div>
          ) : (
            // 单列垂直排列：放弃瀑布流，回到 List Layout
            <ul className="flex flex-col gap-0">
              {blogs.map((blog, index) => {
                const isLast = index === blogs.length - 1;
                const title = isEnglish ? blog.title.en : blog.title.zh;
                const excerpt = isEnglish ? blog.excerpt.en : blog.excerpt.zh;
                const category = isEnglish ? blog.category.en : blog.category.zh;

                return (
                  <li
                    key={blog.id}
                    className={[
                      isLast ? '' : 'border-b border-gray-100 dark:border-gray-800',
                    ].join(' ')}
                  >
                    <div
                      className="group relative block py-8 px-4 transition-all duration-300 hover:bg-white hover:shadow-md hover:-translate-y-0.5 -mx-4 rounded-lg"
                    >
                      {/* 第一层：标题（hover 时变品牌红） */}
                      <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground transition-all duration-300 group-hover:text-[#e52129]">
                        {title}
                      </h2>

                      {/* 第二层：摘要（严格 2 行截断） */}
                      <p className="mt-2 text-sm md:text-base leading-relaxed text-gray-500 dark:text-gray-400 line-clamp-2 transition-colors duration-300 group-hover:text-gray-700 dark:group-hover:text-gray-300">
                        {excerpt}
                      </p>

                      {/* 第三层：元数据行（分类 + 日期 + 阅读 + 收藏）。
                          整行 pointer-events-none，点击穿透到覆盖链接仍可跳转；
                          收藏按钮单独恢复 pointer-events-auto，与详情页共用同一组件 */}
                      <div className="pointer-events-none relative z-10 flex flex-wrap items-center gap-x-3 text-xs mt-3">
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium tracking-wide bg-gray-50/70 dark:bg-gray-800/60 text-gray-600 dark:text-gray-300 ring-1 ring-inset ring-gray-200/80 dark:ring-gray-700/70 transition-all duration-200 hover:bg-white hover:ring-[#e52129]/30 hover:text-[#e52129] dark:hover:bg-gray-800">
                          <svg viewBox="0 0 24 24" className="w-3 h-3 shrink-0 opacity-70" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11.778 2.066H5.722A2.222 2.222 0 0 0 3.5 4.288v6.056a2.222 2.222 0 0 0 .654 1.576l7.412 7.412a2.222 2.222 0 0 0 3.143 0l4.426-4.426a2.222 2.222 0 0 0 0-3.143L13.35 2.72a2.222 2.222 0 0 0-1.572-.654Z"/>
                            <circle cx="7.556" cy="7.556" r="1.333"/>
                          </svg>
                          {category}
                        </span>
                        <time
                          dateTime={blog.date}
                          className="inline-flex items-center gap-1 text-gray-400 dark:text-gray-500 font-normal tabular-nums"
                        >
                          <svg viewBox="0 0 24 24" className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                            <rect x="3" y="4.5" width="18" height="15" rx="2"/>
                            <path d="M8 3v4M16 3v4M3 10.5h18"/>
                          </svg>
                          {blog.date}
                        </time>
                        <span className="inline-flex items-center gap-1 text-gray-400 dark:text-gray-500 font-normal tabular-nums">
                          <svg viewBox="0 0 24 24" className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                          {blog.views}
                        </span>
                        <span className="pointer-events-auto">
                          <FavoriteButton
                            resourceType="BLOG"
                            resourceId={blog.id}
                            initialFavorited={favoritedIds.has(blog.id)}
                            initialCount={blog.favorites}
                            isEnglish={isEnglish}
                            isLoggedIn={isLoggedIn}
                            variant="compact"
                          />
                        </span>
                      </div>

                      {/* 覆盖整卡的跳转链接（stretched-link），按钮在其上层不被拦截 */}
                      <Link
                        href={`/blog/${blog.id}`}
                        aria-label={title}
                        className="absolute inset-0 rounded-lg"
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </main>
    </>
  );
}
