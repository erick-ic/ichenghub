import { MetadataRoute } from 'next';
import prisma from '@/lib/prisma';

// 1. 强制动态渲染：确保搜索引擎每次访问都能获取最新的工具和提示词链接
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://ichenghub.cn';
  const locales = ['zh', 'en'] as const;

  // 2. 定义基础静态路由
  const staticPaths = [
    { path: '', priority: 1, changeFrequency: 'daily' as const },
    { path: '/about', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/tools', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/prompts', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/links', priority: 0.7, changeFrequency: 'weekly' as const },
    { path: '/blog', priority: 0.9, changeFrequency: 'daily' as const },
    { path: '/aiquota', priority: 0.8, changeFrequency: 'weekly' as const },
    { path: '/imgcompress', priority: 0.8, changeFrequency: 'monthly' as const },
    { path: '/qrcode', priority: 0.7, changeFrequency: 'monthly' as const },
    { path: '/submit', priority: 0.5, changeFrequency: 'monthly' as const },
  ];

  const localizedRoutes = (
    path: string,
    options: Pick<MetadataRoute.Sitemap[number], 'lastModified' | 'changeFrequency' | 'priority'>,
  ): MetadataRoute.Sitemap => locales.map((locale) => ({
    url: `${baseUrl}/${locale}${path}`,
    ...options,
    alternates: {
      languages: {
        zh: `${baseUrl}/zh${path}`,
        en: `${baseUrl}/en${path}`,
        'x-default': `${baseUrl}/zh${path}`,
      },
    },
  }));

  // 静态页面不伪造 lastModified；只有拥有真实更新时间的数据页才输出该字段。
  const staticRoutes: MetadataRoute.Sitemap = staticPaths.flatMap((item) => localizedRoutes(item.path, {
    changeFrequency: item.changeFrequency,
    priority: item.priority,
  }));

  // 3. 尝试获取动态数据，增加 try-catch 保护以绕过本地 Build 时的数据库连接限制
  try {
    // 并发查询工具、提示词与博客数据
    const [tools, prompts, blogs] = await Promise.all([
      prisma.toolCard.findMany({
        where: { status: 1 },
        select: { id: true, updatedAt: true },
      }),
      prisma.prompt.findMany({
        where: { status: 1 },
        select: { id: true, updatedAt: true },
      }),
      prisma.blog.findMany({
        where: { status: 1 },
        select: { id: true, updatedAt: true },
      }),
    ]);

    // 生成工具详情页路由（中英双语）
    const toolRoutes = tools.flatMap((tool) => localizedRoutes(`/tools/${tool.id}`, {
      lastModified: tool.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.6,
    }));

    // 生成提示词详情页路由（中英双语）
    const promptRoutes = prompts.flatMap((prompt) => localizedRoutes(`/prompts/${prompt.id}`, {
      lastModified: prompt.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.6,
    }));

    // 生成博客详情页路由（中英双语）
    const blogRoutes = blogs.flatMap((blog) => localizedRoutes(`/blog/${blog.id}`, {
      lastModified: blog.updatedAt,
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

    return [...staticRoutes, ...toolRoutes, ...promptRoutes, ...blogRoutes];
  } catch (error) {
    // 如果构建阶段（Prerender）连不上数据库，仅返回静态路由，防止 build 失败
    console.error('--- Sitemap Build Warning: Database unreachable, returning static routes only ---');
    return staticRoutes;
  }
}
