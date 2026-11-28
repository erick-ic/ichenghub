'use client';

import { useState, useEffect, useCallback } from 'react';
import type { MouseEvent } from 'react';
import { useTranslations } from 'next-intl';

interface BlogHeroTypewriterProps {
  phrases: string[];
}

export default function BlogHeroTypewriter({ phrases }: BlogHeroTypewriterProps) {
  const t = useTranslations('blog');

  const [text, setText] = useState('');
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (phrases.length === 0) return;

    const currentPhrase = phrases[phraseIndex];
    const typingSpeed = isDeleting ? 50 : 100;
    const delay = !isDeleting && text === currentPhrase ? 2000 : typingSpeed;

    const timeout = setTimeout(() => {
      if (!isDeleting && text === currentPhrase) {
        setIsDeleting(true);
      } else if (isDeleting && text === '') {
        setIsDeleting(false);
        setPhraseIndex((prev) => (prev + 1) % phrases.length);
      } else {
        setText(
          currentPhrase.substring(
            0,
            text.length + (isDeleting ? -1 : 1)
          )
        );
      }
    }, delay);

    return () => clearTimeout(timeout);
  }, [text, isDeleting, phraseIndex, phrases]);

  const handleMouseMove = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const { currentTarget, clientX, clientY } = e;
    const rect = currentTarget.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    currentTarget.style.setProperty('--mouse-x', `${x}px`);
    currentTarget.style.setProperty('--mouse-y', `${y}px`);
  }, []);

  const handleMouseLeave = useCallback((e: MouseEvent<HTMLDivElement>) => {
    const { currentTarget } = e;
    currentTarget.style.setProperty('--mouse-x', '50%');
    currentTarget.style.setProperty('--mouse-y', '50%');
  }, []);

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="group relative w-full flex flex-col items-center justify-center text-center py-16 md:py-10 bg-[#f5f5f7] dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 overflow-hidden"
    >
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(#d1d5db_1px,transparent_1px)] dark:bg-[radial-gradient(#374151_1px,transparent_1px)] [background-size:24px_24px] opacity-20 dark:opacity-[0.08] [mask-image:linear-gradient(to_bottom,black_40%,transparent_100%)]"></div>

        <div
          className="absolute inset-0 overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            maskImage: 'radial-gradient(200px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), black 0%, transparent 100%)',
            WebkitMaskImage: 'radial-gradient(200px circle at var(--mouse-x, 50%) var(--mouse-y, 50%), black 0%, transparent 100%)',
          }}
        >
          <div className="absolute inset-0 bg-[radial-gradient(#e52129_1.5px,transparent_1.5px)] [background-size:24px_24px]"></div>
          <div className="absolute inset-0 bg-red-500/10 dark:bg-red-900/10"></div>
        </div>
      </div>

      <div className="relative z-10 flex flex-col items-center">
        <div className="mb-2 flex items-center space-x-3 text-xs font-mono tracking-[0.2em] text-gray-500 dark:text-gray-400 select-none">
          <span className="text-[#e52129]/80 animate-pulse">• •</span>
          <span className="uppercase">Engineering_Insights</span>
          <span className="text-[#e52129]/80 animate-pulse">• •</span>
        </div>

        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-gray-100 mb-3 transition-all">
          {t('hero.title')}
        </h1>

        <div className="flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 px-4 h-auto md:h-10">
          <span className="text-base md:text-xl text-gray-600 dark:text-gray-400 font-medium flex-shrink-0">
            {t('hero.subtitle')}
          </span>
          <div className="flex items-center gap-1 text-base md:text-xl font-medium text-gray-900 dark:text-gray-100 h-[1.5em] md:h-auto flex-shrink-0">
            <span>{text}</span>
            <span
              className="inline-block w-[2px] h-[1em] bg-[#e52129] shadow-[0_0_8px_#e52129]"
              style={{ animation: 'blink 0.8s steps(2, start) infinite' }}
            />
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes blink {
          to { visibility: hidden; }
        }
      `}</style>
    </div>
  );
}
