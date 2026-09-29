'use client';

import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { ChevronUp } from 'lucide-react';

export interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  items: TocItem[];
  isEnglish: boolean;
}

export default function TableOfContents({ items, isEnglish }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id || '');
  const [showBackToTop, setShowBackToTop] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const rafRef = useRef<number | null>(null);

  // 使用 IntersectionObserver 监听标题可见性
  useEffect(() => {
    const headings = items.map((item) => document.getElementById(item.id)).filter(Boolean) as HTMLElement[];
    if (headings.length === 0) return;

    // 按 DOM 位置排序，确保从上到下匹配
    const sortedHeadings = [...headings].sort((a, b) => {
      return a.getBoundingClientRect().top - b.getBoundingClientRect().top;
    });

    // 记录当前可见的标题集合
    const visibleHeadings = new Set<string>();

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            visibleHeadings.add(entry.target.id);
          } else {
            visibleHeadings.delete(entry.target.id);
          }
        });

        // 找到最顶部的可见标题
        let topVisibleId = '';
        for (const heading of sortedHeadings) {
          if (visibleHeadings.has(heading.id)) {
            topVisibleId = heading.id;
            break;
          }
        }

        if (topVisibleId) {
          setActiveId(topVisibleId);
        }
      },
      {
        rootMargin: '-10% 0% -60% 0%',
        threshold: 0,
      }
    );

    headings.forEach((heading) => {
      observerRef.current?.observe(heading);
    });

    return () => {
      observerRef.current?.disconnect();
    };
  }, [items]);

  // 滚动监听：使用 requestAnimationFrame 节流
  useEffect(() => {
    const handleScroll = () => {
      if (rafRef.current) return;

      rafRef.current = requestAnimationFrame(() => {
        setShowBackToTop(window.scrollY > 600);
        rafRef.current = null;
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const handleAnchorClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    setActiveId(id);

    const element = document.getElementById(id);
    if (element) {
      const offsetTop = element.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth',
      });
    }
  }, []);

  const handleBackToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setActiveId(items[0]?.id || '');
  }, [items]);

  if (items.length === 0) return null;

  return (
    <aside className="hidden lg:block sticky top-24 self-start">
      <div className="relative flex max-h-[calc(100dvh-7rem)] flex-col pl-4 border-l border-gray-200 dark:border-gray-700">
        <nav
          aria-label={isEnglish ? 'Table of contents' : '文章目录'}
          tabIndex={0}
          className="min-h-0 overflow-y-auto overscroll-contain space-y-1 pr-3 [scrollbar-width:thin] [scrollbar-gutter:stable]"
        >
          {items.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              onClick={(e) => handleAnchorClick(e, item.id)}
              className={`block text-sm transition-colors duration-150 py-1 ${
                item.level === 3 ? 'pl-4' : ''
              } ${activeId === item.id ? 'text-[#e52129] font-medium' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'}`}
            >
              {item.text}
            </a>
          ))}
        </nav>

        <div className="shrink-0 border-t border-gray-100 dark:border-gray-800 my-6" />

        {showBackToTop && (
          <button
            onClick={handleBackToTop}
            className="flex shrink-0 items-center gap-2 px-4 py-2 bg-[#1e1e1e] text-white text-sm font-medium rounded-lg hover:bg-[#2a2a2a] transition-colors"
          >
            <ChevronUp className="h-5 w-5 shrink-0" />
            {isEnglish ? 'Back to Top' : '回到顶部'}
          </button>
        )}
      </div>
    </aside>
  );
}
