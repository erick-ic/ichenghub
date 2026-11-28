import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const handler = async function GET() {
  try {
    const [tools, links, blogs, prompts] = await Promise.all([
      prisma.toolCard.findMany({
        where: { status: 1 },
        select: {
          id: true, name: true, nameEn: true, desc: true, descEn: true,
          url: true, logoUrl: true, category: true, categoryEn: true,
        },
      }),
      prisma.navLink.findMany({
        where: { status: 1 },
        select: {
          id: true, name: true, nameEn: true, desc: true, descEn: true,
          url: true, iconUrl: true, category: true, categoryEn: true,
        },
      }),
      prisma.blog.findMany({
        where: { status: 1 },
        select: {
          id: true,
          titleZh: true,
          titleEn: true,
          excerptZh: true,
          excerptEn: true,
          categoryZh: true,
          categoryEn: true,
        },
        orderBy: { createdAt: 'desc' as const },
        take: 60,
      }),
      prisma.prompt.findMany({
        where: { status: 1 },
        select: {
          id: true,
          title: true,
          titleEn: true,
          category: true,
          categoryEn: true,
          platform: true,
          platformEn: true,
          promptText: true,
        },
        orderBy: { likes: 'desc' as const },
        take: 80,
      }),
    ]);

    const toolItems = tools.map((tool) => ({
      id: `tool-${tool.id}`,
      title: tool.name,
      titleEn: tool.nameEn,
      description: tool.desc,
      descriptionEn: tool.descEn,
      url: tool.url || '',
      iconUrl: tool.logoUrl,
      category: tool.category,
      categoryEn: tool.categoryEn,
      type: 'tool' as const,
    }));

    const linkItems = links.map((link) => ({
      id: `link-${link.id}`,
      title: link.name,
      titleEn: link.nameEn,
      description: link.desc,
      descriptionEn: link.descEn,
      url: link.url,
      iconUrl: link.iconUrl,
      category: link.category,
      categoryEn: link.categoryEn,
      type: 'link' as const,
    }));

    const blogItems = blogs.map((blog) => ({
      id: `blog-${blog.id}`,
      title: blog.titleZh,
      titleEn: blog.titleEn,
      description: blog.excerptZh || blog.categoryZh,
      descriptionEn: blog.excerptEn || blog.categoryEn,
      url: `/blog/${blog.id}`,
      iconUrl: undefined as string | undefined,
      category: blog.categoryZh,
      categoryEn: blog.categoryEn,
      type: 'blog' as const,
    }));

    const promptItems = prompts.map((p) => {
      const snippet = (t: string, max = 80) =>
        t.length > max ? t.slice(0, max) + '…' : t;
      return {
        id: `prompt-${p.id}`,
        title: p.title,
        titleEn: p.titleEn,
        description: snippet(p.promptText || p.platform || '', 80),
        descriptionEn: snippet(p.promptText || p.platformEn || '', 80),
        url: `/prompts/${p.id}`,
        iconUrl: undefined as string | undefined,
        category: p.category,
        categoryEn: p.categoryEn,
        type: 'prompt' as const,
      };
    });

    const allItems = [...toolItems, ...linkItems, ...blogItems, ...promptItems];

    return NextResponse.json(allItems, {
      headers: {
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
      },
    });
  } catch (error) {
    console.error('Search API error:', error);
    return NextResponse.json([], { status: 500 });
  }
};

export { handler as GET };
