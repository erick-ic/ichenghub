'use client';

import { useEffect, useRef, useState } from 'react';
import { Database, MoreHorizontal, RotateCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function QuotaMoreActions({ onBackup, onReset, canReset }: {
  onBackup: () => void;
  onReset: () => void;
  canReset: boolean;
}) {
  const t = useTranslations('AiQuota');
  const ref = useRef<HTMLDivElement>(null);
  const summaryRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
        summaryRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', escape);
    return () => {
      document.removeEventListener('pointerdown', dismiss);
      document.removeEventListener('keydown', escape);
    };
  }, [open]);

  const run = (action: () => void) => {
    setOpen(false);
    summaryRef.current?.focus();
    action();
  };

  return <div ref={ref} className="relative">
    <button ref={summaryRef} type="button" aria-haspopup="menu" aria-expanded={open}
      aria-label={t('moreActions')} title={t('moreActions')}
      onClick={() => setOpen((prev) => !prev)}
      className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-200/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400">
      <MoreHorizontal className="h-5 w-5" />
    </button>
    {open && (
      <div role="menu" className="absolute right-0 top-full z-20 mt-2 w-52 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-lg">
        <button type="button" role="menuitem" onClick={() => run(onBackup)}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-zinc-700 hover:bg-zinc-100 focus-visible:bg-zinc-100">
          <Database className="h-4 w-4" />{t('backupRestore')}
        </button>
        <div className="my-1 border-t border-zinc-100" />
        <button type="button" role="menuitem" disabled={!canReset} onClick={() => run(onReset)}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 focus-visible:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40">
          <RotateCcw className="h-4 w-4" />{t('resetAll')}
        </button>
      </div>
    )}
  </div>;
}
