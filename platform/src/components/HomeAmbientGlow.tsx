'use client';

import { useEffect, useRef } from 'react';

/**
 * 极轻量的环境光微视差层：
 * 直接通过 rAF 更新 GPU transform，滚动过程中零 React 重渲染。
 */
export default function HomeAmbientGlow() {
  const warmOrbRef = useRef<HTMLDivElement>(null);
  const coolOrbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prefersReduced =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    let rafId = 0;
    const update = () => {
      rafId = 0;
      const y = window.scrollY || 0;
      const clamped = Math.min(y, 1600);
      if (warmOrbRef.current) {
        warmOrbRef.current.style.transform = `translate3d(${clamped * 0.025}px, ${clamped * 0.08}px, 0)`;
      }
      if (coolOrbRef.current) {
        coolOrbRef.current.style.transform = `translate3d(${-clamped * 0.03}px, ${-clamped * 0.06}px, 0)`;
      }
    };

    const onScroll = () => {
      if (!rafId) {
        rafId = window.requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div
        ref={warmOrbRef}
        className="absolute -top-24 -left-24 h-[420px] w-[420px] rounded-full bg-[#e52129]/[0.05] blur-3xl will-change-transform"
      />
      <div
        ref={coolOrbRef}
        className="absolute top-[28%] -right-28 h-[480px] w-[480px] rounded-full bg-indigo-500/[0.06] blur-3xl will-change-transform"
      />
    </div>
  );
}
