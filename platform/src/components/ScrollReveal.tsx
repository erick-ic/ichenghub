'use client';

import { useEffect, useRef, useState } from 'react';

interface ScrollRevealProps {
  children: React.ReactNode;
  delayMs?: number;
  className?: string;
}

export default function ScrollReveal({
  children,
  delayMs = 0,
  className = '',
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  // SSR 首帧默认可见，避免搜索引擎抓取或无 JS 环境下内容不可见；
  // 仅在客户端挂载时，对处于首屏视口下方的元素平滑触发滚动入场。
  const [state, setState] = useState<'idle' | 'hidden' | 'visible'>('idle');

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || typeof IntersectionObserver === 'undefined') {
      setState('visible');
      return;
    }

    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight * 0.92) {
      setState('visible');
      return;
    }

    setState('hidden');

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setState('visible');
            observer.disconnect();
            break;
          }
        }
      },
      {
        threshold: 0.08,
        rootMargin: '0px 0px -48px 0px',
      },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const revealClass =
    state === 'hidden'
      ? 'scroll-reveal-hidden'
      : state === 'visible'
        ? 'scroll-reveal-visible'
        : '';

  return (
    <div
      ref={ref}
      className={`scroll-reveal ${revealClass} ${className}`.trim()}
      style={delayMs > 0 ? { transitionDelay: `${delayMs}ms` } : undefined}
    >
      {children}
    </div>
  );
}
