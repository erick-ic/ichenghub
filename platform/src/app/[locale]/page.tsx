import { Link } from '@/navigation';
import ToolCard from '@/components/ToolCard';
import PageViewTracker from '@/components/PageViewTracker';
import ScrollReveal from '@/components/ScrollReveal';
import HomeAmbientGlow from '@/components/HomeAmbientGlow';
import prisma from '@/lib/prisma';
import { getAllGuides } from '@/data/guides';
import { getAllBlogs, type BlogPost } from '@/data/blogs';
import {
  ArrowRight,
  ImageDown,
  Crop,
  QrCode,
  Gauge,
  Clock,
  ChevronDown,
} from 'lucide-react';

export const dynamic = 'force-dynamic';

interface Tool {
  id: string;
  name: string;
  nameEn: string | null;
  desc: string;
  descEn: string | null;
  logoUrl: string;
  category: string;
  url: string | null;
}

async function fetchTools(): Promise<Tool[]> {
  try {
    return await prisma.toolCard.findMany({
      where: { status: 1 },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });
  } catch (error) {
    console.error('[home] fetchTools failed:', error);
    return [];
  }
}

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const isEnglish = locale === 'en';

  const [tools, blogs] = await Promise.all([
    fetchTools(),
    getAllBlogs().catch((): BlogPost[] => []),
  ]);

  const featuredGuides = getAllGuides(locale).slice(0, 3);
  const latestBlogs = blogs.slice(0, 3);

  const displayTools = tools.map((tool) => ({
    ...tool,
    displayName: isEnglish && tool.nameEn ? tool.nameEn : tool.name,
    displayDesc: isEnglish && tool.descEn ? tool.descEn : tool.desc,
  }));

  const featuredBrowserTools = isEnglish
    ? [
        {
          name: 'Image Compressor',
          href: '/imgcompress',
          icon: ImageDown,
          tag: 'Browser-Local',
          summary: 'Compress JPG, PNG, WebP & HEIC locally without uploads.',
        },
        {
          name: 'Shape Cropper',
          href: '/imgcrop',
          icon: Crop,
          tag: 'Canvas 2D',
          summary: 'Crop circles, stars, or custom polygons with transparent export.',
        },
        {
          name: 'QR Code Generator',
          href: '/qrcode',
          icon: QrCode,
          tag: 'Static SVG / PNG',
          summary: 'Generate permanent offline QR codes with zero redirect tracking.',
        },
        {
          name: 'AI Quota Tracker',
          href: '/aiquota',
          icon: Gauge,
          tag: 'LocalStorage',
          summary: 'Track multi-platform AI limits and daily check-ins privately.',
        },
      ]
    : [
        {
          name: '本地图片压缩',
          href: '/imgcompress',
          icon: ImageDown,
          tag: '本地零上传',
          summary: '浏览器本地压缩 JPG、PNG、WebP 与 HEIC，实时对比画质。',
        },
        {
          name: '形状裁剪器',
          href: '/imgcrop',
          icon: Crop,
          tag: '透明导出',
          summary: '8 种几何形状与自定义多边形裁剪，支持透明 PNG / WebP。',
        },
        {
          name: '二维码生成器',
          href: '/qrcode',
          icon: QrCode,
          tag: '静态 SVG / PNG',
          summary: '离线生成永不过期的静态二维码，无短链劫持与追踪。',
        },
        {
          name: 'AI 额度追踪',
          href: '/aiquota',
          icon: Gauge,
          tag: '本地存储',
          summary: '手动记录多平台 AI 配额与每日签到，支持 JSON 备份。',
        },
      ];

  const homeFaqs = isEnglish
    ? [
        {
          question: 'Do these browser tools upload my images or QR content to a server?',
          answer:
            'No. Our Image Compressor, Shape Cropper, and QR Code Generator run locally in your browser using Canvas, Web Workers, and client-side encoding. Your files and QR payloads stay on your device.',
        },
        {
          question: 'Are the online tools free, and do I need to sign up?',
          answer:
            'All self-developed browser utilities and practical guides are free to use without creating an account. Optional GitHub or Gitee sign-in is only needed if you want to save favorites or submit tool recommendations.',
        },
        {
          question: 'How do we keep directory listings and guides accurate?',
          answer:
            'Every tool guide is verified against our actual source code, and third-party directory submissions pass manual checks for official URL validity and practical utility before publishing.',
        },
        {
          question: 'How is my AI Quota Tracker data stored and backed up?',
          answer:
            'AI Quota Tracker is a manual local board stored strictly in your browser localStorage—no third-party API keys or logins are requested. You can export and import JSON backups anytime via Data Sync.',
        },
      ]
    : [
        {
          question: '使用图片压缩、裁剪或二维码工具时，我的文件会上传到服务器吗？',
          answer:
            '不会。本站自研的图片压缩器、形状裁剪器与二维码生成器均基于浏览器本地 Canvas 与 Web Worker 运行，图片与输入文本仅在当前设备内存中处理，不上传云端服务器。',
        },
        {
          question: '这些在线工具是否免费？需要注册登录才能用吗？',
          answer:
            '所有自研在线工具与实用指南均免费开放且无需注册即可直接使用。只有当你希望收藏博客/提示词、或提交工具推荐时，才需要通过 GitHub 或 Gitee 可选登录。',
        },
        {
          question: '平台如何保证实用指南与工具导航的内容质量？',
          answer:
            '每一篇工具说明与实战指南均对照真实源码核验，明确写出适用场景与使用限制；用户推荐的第三方工具也会经过人工核查官网可用性与实用价值后再决定是否收录。',
        },
        {
          question: 'AI 额度追踪器的数据保存在哪里？换设备怎么迁移？',
          answer:
            'AI 额度追踪器是纯前端手动记录看板，无需授权任何第三方账号或 API Key，所有配置均保存在当前浏览器的 localStorage 中。更换设备前可通过内置「数据同步」一键导出/导入 JSON 备份。',
        },
      ];

  const baseUrl = 'https://ichenghub.cn';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: isEnglish ? 'iChengHub' : 'iChengHub 热荐工坊',
        alternateName: isEnglish ? 'iChengHub 热荐工坊' : 'iChengHub',
        url: `${baseUrl}/${locale}`,
        description: isEnglish
          ? 'Practical browser-based digital tools, privacy-conscious workflows, reviewed resources, and technical guides.'
          : '隐私优先的浏览器在线工具、精选数字资源、实用效率指南与原创技术博客。',
        inLanguage: isEnglish ? 'en' : 'zh-CN',
      },
      {
        '@type': 'Organization',
        name: isEnglish ? 'iChengHub (Heguang Studio)' : 'iChengHub 热荐工坊（和光工作室）',
        url: baseUrl,
        logo: `${baseUrl}/brand/icon-512-v2.png`,
        email: 'ichenghub@gmail.com',
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />
      <PageViewTracker path={`/${locale}`} />

      <div className="relative">
        <HomeAmbientGlow />
        {/* Minimal Hero */}
        <section className="container mx-auto px-4 pt-10 pb-6 md:pt-12 md:pb-8 text-center">
          <h1 className="text-3xl sm:text-4xl md:text-[42px] font-extrabold tracking-tight leading-tight text-zinc-900 mb-3.5">
            {isEnglish
              ? 'Useful Digital Tools. More Privacy. Less Friction.'
              : '实用在线工具，更注重隐私'}
          </h1>
          <p className="text-base md:text-lg text-zinc-500 mx-auto leading-relaxed mb-6 xl:whitespace-nowrap">
            {isEnglish
              ? 'Browser-local utilities, reviewed digital resources, and practical guides for simpler everyday work.'
              : '浏览器本地工具、精选数字资源与实用指南，让日常数字工作更高效安心。'}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/tools"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-zinc-900 text-white text-sm font-medium hover:bg-zinc-800 transition-colors"
            >
              {isEnglish ? 'Explore Tools' : '探索工具'}
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/guides"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/80 backdrop-blur-md border border-zinc-200/80 text-zinc-700 text-sm font-medium hover:bg-white transition-colors"
            >
              {isEnglish ? 'Read Guides' : '实用指南'}
            </Link>
          </div>
        </section>

        {/* Featured Tools Grid (uses DB ToolCards; falls back to core browser utilities if DB is empty) */}
        <section className="container mx-auto px-4 pt-2 pb-10 md:pb-12">
          {displayTools.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayTools.map((tool, index) => (
                <ToolCard key={tool.id} tool={tool} priority={index < 3} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {featuredBrowserTools.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="group flex flex-col justify-between rounded-2xl apple-glass-card p-5"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-3.5">
                        <div className="w-9 h-9 rounded-xl bg-red-50 text-[#e52129] flex items-center justify-center">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
                          {item.tag}
                        </span>
                      </div>
                      <h2 className="text-base font-bold text-zinc-900 group-hover:text-[#e52129] transition-colors mb-1.5">
                        {item.name}
                      </h2>
                      <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">
                        {item.summary}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Practical Guides (3 concise cards) */}
        <section className="container mx-auto px-4 pb-10 md:pb-12">
          <ScrollReveal>
            <div className="flex items-end justify-between gap-4 mb-6">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-zinc-900 tracking-tight">
                  {isEnglish ? 'Practical Guides' : '实用指南'}
                </h2>
                <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                  {isEnglish
                    ? 'Walkthroughs on web image formats, local privacy, and everyday workflows.'
                    : '围绕图片格式选型、浏览器本地隐私与日常效率工作流的原创教程。'}
                </p>
              </div>
              <Link
                href="/guides"
                className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-[#e52129] transition-colors shrink-0"
              >
                {isEnglish ? 'All guides' : '全部指南'}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </ScrollReveal>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredGuides.map((guide, index) => (
              <ScrollReveal key={guide.slug} delayMs={index * 80} className="h-full">
                <Link
                  href={`/guides/${guide.slug}`}
                  className="group flex h-full flex-col justify-between rounded-2xl apple-glass-card p-6"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-[11px] mb-3">
                      <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 font-medium">
                        {guide.category}
                      </span>
                      <span className="inline-flex items-center gap-1 text-zinc-400">
                        <Clock className="w-3 h-3" />
                        {guide.readingTime}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-zinc-900 group-hover:text-[#e52129] transition-colors line-clamp-2 leading-[1.45]">
                      {guide.title}
                    </h3>
                    <p className="mt-2.5 text-sm text-zinc-500 line-clamp-2 leading-[1.75]">
                      {guide.summary}
                    </p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-400">
                    <span>{guide.updatedAt}</span>
                    <span className="inline-flex items-center gap-1 font-medium text-zinc-700 group-hover:text-[#e52129] transition-colors">
                      {isEnglish ? 'Read guide' : '阅读指南'}
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </Link>
              </ScrollReveal>
            ))}
          </div>
        </section>

        {/* Latest Technical Articles (3 concise cards) */}
        {latestBlogs.length > 0 && (
          <section className="container mx-auto px-4 pb-10 md:pb-12">
            <ScrollReveal>
              <div className="flex items-end justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-xl md:text-2xl font-bold text-zinc-900 tracking-tight">
                    {isEnglish ? 'Latest Articles' : '技术博客'}
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                    {isEnglish
                      ? 'Engineering practices, frontend notes, and backend architecture tutorials.'
                      : '全栈开发实践、前端性能优化与工程技术笔记。'}
                  </p>
                </div>
                <Link
                  href="/blog"
                  className="inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-[#e52129] transition-colors shrink-0"
                >
                  {isEnglish ? 'All posts' : '全部文章'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </ScrollReveal>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {latestBlogs.map((post, index) => {
                const postTitle = isEnglish ? post.title.en : post.title.zh;
                const postExcerpt = isEnglish ? post.excerpt.en : post.excerpt.zh;
                const postCategory = isEnglish ? post.category.en : post.category.zh;

                return (
                  <ScrollReveal key={post.id} delayMs={index * 80} className="h-full">
                    <Link
                      href={`/blog/${post.id}`}
                      className="group flex h-full flex-col justify-between rounded-2xl apple-glass-card p-6"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 text-[11px] mb-3">
                          <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 font-medium">
                            {postCategory}
                          </span>
                          <time dateTime={post.date} className="text-zinc-400 tabular-nums">
                            {post.date}
                          </time>
                        </div>
                        <h3 className="text-base font-bold text-zinc-900 group-hover:text-[#e52129] transition-colors line-clamp-2 leading-[1.45]">
                          {postTitle}
                        </h3>
                        <p className="mt-2.5 text-sm text-zinc-500 line-clamp-2 leading-[1.75]">
                          {postExcerpt}
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-end text-xs">
                        <span className="inline-flex items-center gap-1 font-medium text-zinc-700 group-hover:text-[#e52129] transition-colors">
                          {isEnglish ? 'Read article' : '阅读全文'}
                          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                      </div>
                    </Link>
                  </ScrollReveal>
                );
              })}
            </div>
          </section>
        )}

        {/* Collapsible Minimal FAQ */}
        <section className="container mx-auto px-4 pb-12 md:pb-14">
          <ScrollReveal>
            <div className="rounded-2xl apple-glass-card p-6 md:p-8">
            <div className="mb-5">
              <h2 className="text-lg md:text-xl font-bold text-zinc-900 tracking-tight">
                {isEnglish ? 'Frequently Asked Questions' : '常见问题'}
              </h2>
              <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                {isEnglish
                  ? 'Quick answers on local processing, privacy, and how our tools work.'
                  : '关于本地处理机制、隐私边界与内容审核的简要说明。'}
              </p>
            </div>

            <div className="divide-y divide-zinc-100">
              {homeFaqs.map((faq) => (
                <details key={faq.question} className="group py-4 first:pt-0 last:pb-0">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[15px] sm:text-sm font-medium text-zinc-900 leading-[1.5] hover:text-[#e52129] transition-colors">
                    <span>{faq.question}</span>
                    <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0 transition-transform duration-200 group-open:rotate-180" />
                  </summary>
                  <p className="mt-3 text-sm text-zinc-600 leading-[1.8] sm:pr-6">
                    {faq.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
          </ScrollReveal>
        </section>
      </div>
    </>
  );
}
