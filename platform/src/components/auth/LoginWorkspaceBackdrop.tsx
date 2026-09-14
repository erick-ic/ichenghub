'use client';

import { useEffect, useRef, useState } from 'react';
import {
  QrCode,
  Sparkles,
  Bookmark,
  Code,
  Copy,
  FileText,
  ArrowRight,
} from 'lucide-react';

// 登录页背景：大型 Hub 轮廓字 + 抽象产品卡片（仅桌面）。
// 移动端极简：只保留 Hub 描边 + 登录卡片。
export default function LoginWorkspaceBackdrop({ mounted }: { mounted: boolean }) {
  const EASE = 'var(--ease-out-expo)';

  // 桌面端极轻视差（仅 hover: hover 且 pointer: fine）
  const enableParallax =
    typeof window !== 'undefined' &&
    window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const parallaxRef = useRef<{
    tool: { x: number; y: number };
    prompt: { x: number; y: number };
    blog: { x: number; y: number };
  }>({
    tool: { x: 0, y: 0 },
    prompt: { x: 0, y: 0 },
    blog: { x: 0, y: 0 },
  });
  const [parallax, setParallax] = useState({
    tool: { x: 0, y: 0 },
    prompt: { x: 0, y: 0 },
    blog: { x: 0, y: 0 },
  });
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!enableParallax) return;

    let target = { tool: { x: 0, y: 0 }, prompt: { x: 0, y: 0 }, blog: { x: 0, y: 0 } };

    const onMove = (e: MouseEvent) => {
      const { innerWidth: w, innerHeight: h } = window;
      const nx = e.clientX / w - 0.5;
      const ny = e.clientY / h - 0.5;
      target = {
        tool: { x: nx * -3, y: ny * -3 },
        prompt: { x: nx * -6, y: ny * -6 },
        blog: { x: nx * -4, y: ny * -4 },
      };
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };

    const tick = () => {
      const cur = parallaxRef.current;
      let changed = false;
      for (const key of ['tool', 'prompt', 'blog'] as const) {
        cur[key].x += (target[key].x - cur[key].x) * 0.12;
        cur[key].y += (target[key].y - cur[key].y) * 0.12;
        if (Math.abs(target[key].x - cur[key].x) > 0.01 || Math.abs(target[key].y - cur[key].y) > 0.01) {
          changed = true;
        }
      }
      setParallax({
        tool: { x: cur.tool.x, y: cur.tool.y },
        prompt: { x: cur.prompt.x, y: cur.prompt.y },
        blog: { x: cur.blog.x, y: cur.blog.y },
      });
      rafRef.current = changed ? requestAnimationFrame(tick) : null;
    };

    const onLeave = () => {
      target = { tool: { x: 0, y: 0 }, prompt: { x: 0, y: 0 }, blog: { x: 0, y: 0 } };
      if (rafRef.current === null) rafRef.current = requestAnimationFrame(tick);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseleave', onLeave);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseleave', onLeave);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [enableParallax]);

  // ======== 桌面端 Hub + 卡片 ========
  const desktopEase = EASE;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* ===== Hub 描边（桌面端：持续循环揭示） ===== */}
      <div
        className="login-hub-reveal absolute left-[-5%] top-[50%] z-0 hidden select-none font-black italic leading-[0.8] md:block"
        style={{
          fontSize: 'clamp(280px, 38vw, 680px)',
          letterSpacing: '-0.08em',
          color: 'transparent',
          WebkitTextStroke: '1.5px rgba(229, 33, 41, 0.28)',
          transform: 'translateY(-50%)',
        }}
      >
        Hub
      </div>

      {/* ===== 工具卡片：仅桌面端 ===== */}
      <div
        className="absolute z-10 hidden md:left-[10%] md:top-[16%] md:block"
        style={{
          ...(mounted
            ? { opacity: 0.58, transform: `translate3d(${parallax.tool.x}px, ${parallax.tool.y}px, 0) scale(1)` }
            : { opacity: 0, transform: 'translate3d(-8px, 10px, 0) scale(0.985)' }),
          transition: `opacity 520ms ${desktopEase} 260ms, transform 520ms ${desktopEase} 260ms`,
        }}
      >
        <ToolCard icon={<QrCode className="h-4 w-4" />} scale={0.92} />
      </div>

      {/* ===== 提示词主卡：仅桌面端 ===== */}
      <div
        className="absolute z-20 hidden md:left-[22%] md:top-[22%] md:block"
        style={{
          ...(mounted
            ? { opacity: 0.90, transform: `translate3d(${parallax.prompt.x}px, ${parallax.prompt.y}px, 0) scale(1)` }
            : { opacity: 0, transform: 'translate3d(0, 14px, 0) scale(0.975)' }),
          transition: `opacity 560ms ${desktopEase} 320ms, transform 560ms ${desktopEase} 320ms`,
        }}
      >
        <PromptCard variant="main" mounted={mounted} />
      </div>

      {/* ===== 博客卡片：仅桌面端 ===== */}
      <div
        className="absolute z-10 hidden md:left-[26%] md:top-[68%] md:block"
        style={{
          ...(mounted
            ? { opacity: 0.55, transform: `translate3d(${parallax.blog.x}px, ${parallax.blog.y}px, 0) scale(1)` }
            : { opacity: 0, transform: 'translate3d(8px, 12px, 0) scale(0.985)' }),
          transition: `opacity 540ms ${desktopEase} 380ms, transform 540ms ${desktopEase} 380ms`,
        }}
      >
        <BlogPanel scale={0.92} />
      </div>

      {/* ===== 左下角栏目标签：仅桌面端 ===== */}
      <div
        aria-hidden="true"
        className="absolute bottom-6 left-6 z-10 hidden select-none md:block lg:bottom-10 lg:left-12"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(6px)',
          transition: `opacity 520ms ${desktopEase} 440ms, transform 520ms ${desktopEase} 440ms`,
        }}
      >
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-black/[0.28]">
          TOOLS <span className="mx-2 text-black/[0.18]">/</span> PROMPTS{' '}
          <span className="mx-2 text-black/[0.18]">/</span> IDEAS
        </p>
      </div>
    </div>
  );
}

function ToolCard({ icon, scale = 1 }: { icon: React.ReactNode; scale?: number }) {
  return (
    <div
      className="rounded-[14px] border border-black/[0.07] bg-white/[0.72] px-3 py-2.5 shadow-[0_2px_10px_rgba(24,24,27,0.05)] backdrop-blur-sm"
      style={{ transform: `scale(${scale})` }}
    >
      <div className="flex items-center gap-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f1f0ed] text-gray-600">
          {icon}
        </div>
        <div className="min-w-[60px] space-y-1.5">
          <div className="h-1.5 w-[88%] rounded-full bg-black/10" />
          <div className="h-1.5 w-[62%] rounded-full bg-black/[0.06]" />
        </div>
        <ArrowRight className="h-3.5 w-3.5 shrink-0 text-black/25" />
      </div>
    </div>
  );
}

function PromptCard({ variant = 'secondary', mounted = true }: { variant?: 'main' | 'secondary'; mounted?: boolean }) {
  const sizeScale = variant === 'main' ? 1.12 : 1;
  const EASE = 'var(--ease-out-expo)';

  const lineBase = mounted ? { opacity: 1, transform: 'translateX(0)' } : { opacity: 0, transform: 'translateX(-4px)' };

  return (
    <div
      className="group relative rounded-[16px] border border-black/[0.08] bg-white/[0.92] p-4 shadow-[0_8px_24px_rgba(24,24,27,0.07)] backdrop-blur-sm transition-shadow duration-300 hover:shadow-[0_10px_28px_rgba(24,24,27,0.09)]"
      style={{ transform: `scale(${sizeScale})` }}
    >
      <div
        className="absolute right-2.5 top-2.5"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'translateY(0)' : 'translateY(-3px)',
          transition: `opacity 400ms ${EASE} 620ms, transform 400ms ${EASE} 620ms`,
        }}
      >
        <Bookmark className="h-[18px] w-[18px] fill-[#e52129] stroke-[#e52129]" />
      </div>

      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#f1f0ed] text-gray-600">
          <Sparkles className="h-4 w-4" />
        </div>
        <div className="flex-1 space-y-2">
          <div style={{ ...lineBase, transition: `opacity 220ms ${EASE} 360ms, transform 220ms ${EASE} 360ms` }}>
            <div className="h-2 w-[92%] rounded-full bg-black/10" />
          </div>
          <div style={{ ...lineBase, transition: `opacity 220ms ${EASE} 395ms, transform 220ms ${EASE} 395ms` }}>
            <div className="h-2 w-[78%] rounded-full bg-black/[0.07]" />
          </div>
          <div style={{ ...lineBase, transition: `opacity 220ms ${EASE} 430ms, transform 220ms ${EASE} 430ms` }}>
            <div className="h-2 w-[64%] rounded-full bg-black/[0.05]" />
          </div>
          <div className="flex items-center gap-1.5 pt-1">
            <Code className="h-3 w-3 text-black/20" />
            <div style={{ ...lineBase, transition: `opacity 220ms ${EASE} 465ms, transform 220ms ${EASE} 465ms` }}>
              <div className="h-2 w-[52%] rounded-full bg-black/[0.04]" />
            </div>
          </div>
        </div>
        <Copy className="h-3.5 w-3.5 shrink-0 text-black/25" />
      </div>

      {variant === 'main' && (
        <div
          className="mt-3 h-[2px] w-14 rounded-full bg-[#e52129]"
          style={{
            transformOrigin: 'left center',
            transform: mounted ? 'scaleX(1)' : 'scaleX(0)',
            transition: `transform 320ms ${EASE} 520ms`,
          }}
        />
      )}
    </div>
  );
}

function BlogPanel({ scale = 1 }: { scale?: number }) {
  return (
    <div
      className="rounded-[14px] border border-black/[0.07] bg-white/[0.72] p-3.5 shadow-[0_2px_10px_rgba(24,24,27,0.05)] backdrop-blur-sm"
      style={{ transform: `scale(${scale})` }}
    >
      <div className="flex items-center gap-2">
        <FileText className="h-3.5 w-3.5 text-black/25" />
        <div className="h-1.5 w-20 rounded-full bg-black/10" />
        <div className="ml-auto h-1.5 w-10 rounded-full bg-black/[0.06]" />
      </div>
      <div className="mt-2.5 space-y-1.5">
        <div className="h-1.5 w-full rounded-full bg-black/[0.07]" />
        <div className="h-1.5 w-[94%] rounded-full bg-black/[0.06]" />
        <div className="h-1.5 w-[88%] rounded-full bg-black/[0.05]" />
      </div>
      <div className="mt-2.5 flex items-center gap-2">
        <Code className="h-3 w-3 text-black/20" />
        <div className="h-1.5 w-12 rounded-full bg-black/[0.05]" />
      </div>
      <div className="mt-2.5 h-[1.5px] w-8 rounded-full bg-[#e52129]/60" />
    </div>
  );
}
