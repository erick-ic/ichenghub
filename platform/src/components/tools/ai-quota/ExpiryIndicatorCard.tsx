'use client';

import { useEffect, useState } from 'react';
import { Hourglass } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { expiryProgress, type ExpiryIndicator } from './expiry-indicators';

export default function ExpiryIndicatorCard({ item }: { item: ExpiryIndicator }) {
  const t = useTranslations('AiQuota');
  const locale = useLocale();
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const refresh = () => setNow(Date.now());
    const timer = window.setInterval(refresh, 15_000);
    document.addEventListener('visibilitychange', refresh);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', refresh); };
  }, []);
  const { remainingMinutes, percent } = expiryProgress(item, now);
  const expired = remainingMinutes === 0;
  const name = (locale === 'en' ? item.nameEn || item.nameZh : item.nameZh || item.nameEn) || t('dailyCheckIn');
  return <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
      <span className="flex min-w-0 items-center gap-1.5 font-medium text-zinc-700"><Hourglass className="h-4 w-4 shrink-0" /><span className="break-words">{name}</span></span>
      <span className="text-zinc-500">{item.amount} {t('creditUnit')}</span>
    </div>
    <div className={`my-2 text-xs ${expired ? 'text-red-600' : 'text-zinc-600'}`}>
      {expired ? t('expiryExpired') : t('expiryRemaining', { hours: Math.floor(remainingMinutes / 60), minutes: remainingMinutes % 60 })}
    </div>
    <div role="progressbar" aria-label={`${name} · ${t('expiryType')}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(percent)} className="h-2 overflow-hidden rounded-full bg-zinc-200">
      <div className={`h-full rounded-full ${percent <= 20 ? 'bg-amber-500' : 'bg-emerald-600'}`} style={{ width: `${percent}%` }} />
    </div>
    <p className="mt-2 text-xs text-zinc-500">{t('expiryAt')}: {new Intl.DateTimeFormat(locale, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(item.expiresAt)}</p>
  </div>;
}
