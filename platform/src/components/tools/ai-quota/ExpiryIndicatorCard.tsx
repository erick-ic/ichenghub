'use client';

import { useEffect, useState } from 'react';
import { Hourglass } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { expiryProgress, type ExpiryState } from './expiry-indicators';
import type { ExpiryIndicator } from './expiry-indicators';
import { ALERT_BAR_STRIPE, normalizePlatformColor, PLATFORM_COLOR_STYLES, type PlatformColor } from './platform-colors';

export default function ExpiryIndicatorCard({ item, color }: { item: ExpiryIndicator; color?: PlatformColor }) {
  const t = useTranslations('AiQuota');
  const locale = useLocale();
  const palette = PLATFORM_COLOR_STYLES[normalizePlatformColor(color)];
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const refresh = () => setNow(Date.now());
    const timer = window.setInterval(refresh, 1_000);
    document.addEventListener('visibilitychange', refresh);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', refresh); };
  }, []);
  const { state, remainingMinutes, percent } = expiryProgress(item, now);
  const name = (locale === 'en' ? item.nameEn || item.nameZh : item.nameZh || item.nameEn) || t('dailyCheckIn');
  const formatAt = (timestamp: number) => new Intl.DateTimeFormat(locale, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(timestamp);
  const statusStyles: Record<ExpiryState, string> = {
    pending: 'text-zinc-500',
    active: 'text-zinc-600',
    expired: 'text-red-600',
  };
  const statusText = state === 'pending'
    ? t('expiryPending', { time: formatAt(item.startsAt) })
    : state === 'expired'
      ? t('expiryExpired')
      : t('expiryRemaining', { hours: Math.floor(remainingMinutes / 60), minutes: remainingMinutes % 60 });
  // 未开始保持中性灰轨；进行中正常态使用卡片主题色、≤20% 转琥珀斜纹预警；已到期用红框空槽提示
  const isWarning = state === 'active' && percent <= 20;
  const barColor = state === 'active' ? (isWarning ? 'bg-amber-500' : palette.accentBg) : 'bg-transparent';
  const trackColor = state === 'expired'
    ? 'bg-red-100/80 ring-1 ring-inset ring-red-200'
    : isWarning
      ? 'bg-amber-100/70 ring-1 ring-inset ring-amber-200'
      : 'bg-zinc-200';
  return <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
    <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
      <span className="flex min-w-0 items-center gap-1.5 font-medium text-zinc-700"><Hourglass className="h-4 w-4 shrink-0" /><span className="break-words">{name}</span></span>
      <span className="text-zinc-500">{item.amount} {t('creditUnit')}</span>
    </div>
    <div className={`my-2 text-xs ${statusStyles[state]}`}>{statusText}</div>
    <div role="progressbar" aria-label={`${name} · ${t('expiryType')}`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(percent)} className={`h-2 overflow-hidden rounded-full ${trackColor}`}>
      <div
        className={`h-full rounded-full transition-[width] duration-500 ${barColor}`}
        style={{
          width: `${percent}%`,
          ...(isWarning ? { backgroundImage: ALERT_BAR_STRIPE } : undefined),
        }}
      />
    </div>
    <p className="mt-2 text-xs text-zinc-500">{t('expiryAt')}: {formatAt(item.expiresAt)}</p>
  </div>;
}
