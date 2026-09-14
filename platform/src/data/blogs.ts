import prisma from '@/lib/prisma';
import { getBeijingDayKey } from '@/lib/time';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypePrism from 'rehype-prism-plus';
import rehypeStringify from 'rehype-stringify';

export interface LocalizedString {
  zh: string;
  en: string;
}

export interface BlogPost {
  id: string;
  title: LocalizedString;
  excerpt: LocalizedString;
  category: LocalizedString;
  date: string;
  content: string;
  views: number;
  favorites: number;
}

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function rehypeHeadingIds() {
  const idCount: Record<string, number> = {};
  
  function getTextContent(node: any): string {
    if (node.type === 'text') {
      return node.value || '';
    }
    if (node.type === 'element' && node.children) {
      return node.children.map((child: any) => getTextContent(child)).join('');
    }
    return '';
  }
  
  return function (tree: any) {
    function visit(node: any) {
      if (node.type === 'element' && ['h2', 'h3'].includes(node.tagName)) {
        const text = getTextContent(node);
        
        let slug = generateSlug(text);
        if (idCount[slug]) {
          idCount[slug]++;
          slug = `${slug}-${idCount[slug]}`;
        } else {
          idCount[slug] = 1;
        }
        
        node.properties = node.properties || {};
        node.properties.id = slug;
      }
      
      if (node.children) {
        node.children.forEach(visit);
      }
    }
    
    visit(tree);
  };
}

function rehypeCodeBlockDefaultLanguage() {
  return function (tree: any) {
    function visit(node: any) {
      if (node.type === 'element' && node.tagName === 'pre') {
        const codeChild = node.children.find((child: any) => child.type === 'element' && child.tagName === 'code');
        if (codeChild) {
          const className = codeChild.properties?.className || '';
          if (!className || !className.toString().includes('language-')) {
            codeChild.properties = codeChild.properties || {};
            codeChild.properties.className = 'language-text';
          }
        }
      }
      
      if (node.children) {
        node.children.forEach(visit);
      }
    }
    
    visit(tree);
  };
}

async function highlightMarkdown(content: string): Promise<string> {
  try {
    const result = await unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype, { allowDangerousHtml: true })
      .use(rehypeHeadingIds)
      .use(rehypeCodeBlockDefaultLanguage)
      .use(rehypePrism, { ignoreMissing: true })
      .use(rehypeStringify, { allowDangerousHtml: true })
      .process(content);
    
    return result.toString();
  } catch (error) {
    console.error('[blog] highlightMarkdown failed:', error);
    return content;
  }
}

/**
 * 从数据库获取所有已发布的文章（按发布时间倒序）。
 */
export async function getAllBlogs(): Promise<BlogPost[]> {
  try {
    const blogs = await prisma.blog.findMany({
      where: { status: 1 },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    return blogs.map((blog) => ({
      id: blog.id,
      title: { zh: blog.titleZh, en: blog.titleEn },
      excerpt: { zh: blog.excerptZh, en: blog.excerptEn },
      category: { zh: blog.categoryZh, en: blog.categoryEn },
      date: getBeijingDayKey(blog.updatedAt),
      content: blog.contentZh,
      views: blog.views || 0,
      favorites: blog.favorites || 0,
    }));
  } catch (error) {
    console.error('[blog] getAllBlogs failed:', error);
    return [];
  }
}

/**
 * 按 id 获取单篇博客。找不到返回 null，调用方需自行决定 notFound()。
 */
export async function getBlogById(id: string): Promise<BlogPost | null> {
  try {
    const blog = await prisma.blog.findUnique({
      where: { id },
    });

    if (!blog) {
      return null;
    }

    return {
      id: blog.id,
      title: { zh: blog.titleZh, en: blog.titleEn },
      excerpt: { zh: blog.excerptZh, en: blog.excerptEn },
      category: { zh: blog.categoryZh, en: blog.categoryEn },
      date: getBeijingDayKey(blog.updatedAt),
      content: blog.contentZh,
      views: (blog as any).views || 0,
      favorites: blog.favorites || 0,
    };
  } catch (error) {
    console.error('[blog] getBlogById failed for id:', id, error);
    return null;
  }
}

import { extractHeadings as extractHeadingsUtil } from '@/lib/headingUtils';

/**
 * 按 id 获取单篇博客的原始内容（用于 react-markdown 渲染）。
 * 服务端只添加 language- 类名，不进行语法高亮转换（避免 SSR 兼容性问题）。
 * 代码高亮通过静态 Prism CSS 实现。
 */
export async function getBlogContentById(id: string, locale: string): Promise<{
  title: string;
  excerpt: string;
  category: string;
  content: string;
  date: string;
  updatedAt: string;
  slug: string;
  views: number;
  favorites: number;
} | null> {
  try {
    const blog = await prisma.blog.findUnique({
      where: { id },
    });

    if (!blog) {
      return null;
    }

    const isEnglish = locale === 'en';
    const rawContent = isEnglish ? blog.contentEn : blog.contentZh;

    return {
      title: isEnglish ? blog.titleEn : blog.titleZh,
      excerpt: isEnglish ? blog.excerptEn : blog.excerptZh,
      category: isEnglish ? blog.categoryEn : blog.categoryZh,
      content: rawContent,
      date: getBeijingDayKey(blog.createdAt),
      updatedAt: getBeijingDayKey(blog.updatedAt),
      slug: blog.id,
      views: (blog as any).views || 0,
      favorites: blog.favorites || 0,
    };
  } catch (error) {
    console.error('[blog] getBlogContentById failed for id:', id, error);
    return null;
  }
}

/**
 * 从 Markdown 内容中提取标题结构，用于生成目录。
 * 解析 h2 和 h3 标题，返回带 id、text、level 的数组。
 */
export { extractHeadingsUtil as extractHeadings };

export interface NavBlog {
  id: string;
  titleZh: string;
  titleEn: string;
}

export async function getPrevAndNextBlogs(id: string): Promise<{
  prev: NavBlog | null;
  next: NavBlog | null;
}> {
  try {
    const blogs = await prisma.blog.findMany({
      where: { status: 1 },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
      select: {
        id: true,
        titleZh: true,
        titleEn: true,
      },
    });

    const currentIndex = blogs.findIndex((blog) => blog.id === id);
    if (currentIndex === -1) {
      return { prev: null, next: null };
    }

    const prev = currentIndex > 0 ? blogs[currentIndex - 1] : null;
    const next = currentIndex < blogs.length - 1 ? blogs[currentIndex + 1] : null;

    return { prev, next };
  } catch (error) {
    console.error('[blog] getPrevAndNextBlogs failed:', error);
    return { prev: null, next: null };
  }
}