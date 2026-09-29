'use client';

import { Link } from '@/navigation';
import { useTranslations } from 'next-intl';

interface NavBlog {
  id: string;
  titleZh: string;
  titleEn: string;
}

interface BlogNavigationProps {
  prevBlog: NavBlog | null;
  nextBlog: NavBlog | null;
  isEnglish: boolean;
}

export default function BlogNavigation({ prevBlog, nextBlog, isEnglish }: BlogNavigationProps) {
  const t = useTranslations('blog');

  const getTitle = (blog: NavBlog) => {
    return isEnglish ? blog.titleEn : blog.titleZh;
  };

  return (
    <nav className="border-t border-gray-100 dark:border-gray-800 pt-6 flex items-center justify-between">
      <Link
        href={prevBlog ? `/blog/${prevBlog.id}` : '/blog'}
        className="flex items-center gap-2 text-sm md:text-base text-gray-600 dark:text-gray-400 hover:text-[#e52129] transition-colors duration-200 max-w-[45%]"
      >
        <span className="shrink-0 text-xl leading-none">←</span>
        <span className="truncate">
          {prevBlog ? getTitle(prevBlog) : t('backToList')}
        </span>
      </Link>

      <Link
        href={nextBlog ? `/blog/${nextBlog.id}` : '/blog'}
        className="flex items-center gap-2 text-sm md:text-base text-gray-600 dark:text-gray-400 hover:text-[#e52129] transition-colors duration-200 max-w-[45%] justify-end"
      >
        <span className="truncate">
          {nextBlog ? getTitle(nextBlog) : t('backToList')}
        </span>
        <span className="shrink-0 text-xl leading-none">→</span>
      </Link>
    </nav>
  );
}
