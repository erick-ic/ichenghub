'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Clock3 } from 'lucide-react';
import type { CheckIn } from './AiQuotaTracker';
import { normalizePlatformColor, PLATFORM_COLOR_STYLES, type PlatformColor } from './platform-colors';

// 卡片底色保留浅色 tint；文字统一使用主题强调色，避免 800 深色档与弹窗不一致
const STAT_TONES: Record<PlatformColor, { surface: string }> = {
  graphite: { surface: 'border-zinc-100 bg-zinc-50' },
  garnet: { surface: 'border-rose-100 bg-rose-50/70' },
  champagne: { surface: 'border-amber-100 bg-amber-50/70' },
  sapphire: { surface: 'border-sky-100 bg-sky-50/70' },
  jade: { surface: 'border-teal-100 bg-teal-50/70' },
  amethyst: { surface: 'border-violet-100 bg-violet-50/70' },
};

export default function CheckInHistory({ items, today, detailed, color }: { items: CheckIn[]; today: string; detailed: boolean; color?: PlatformColor }) {
  const t = useTranslations('AiQuota');
  const tone = STAT_TONES[normalizePlatformColor(color)];
  const palette = PLATFORM_COLOR_STYLES[normalizePlatformColor(color)];
  const locale = useLocale();
  const records = items.flatMap((item) => (item.history ?? []).map((record) => ({ ...record,
    name: (locale === 'en' ? item.nameEn || item.nameZh : item.nameZh || item.nameEn) || t('dailyCheckIn'),
    key: `${item.id}-${record.id}`,
  }))).sort((a, b) => b.date.localeCompare(a.date) || (b.at ?? 0) - (a.at ?? 0));
  const weekStart = new Date(`${today}T12:00:00`);
  weekStart.setDate(weekStart.getDate() - 6);
  const firstDay = `${weekStart.getFullYear()}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`;
  const days = new Set(records.filter((record) => record.date >= firstDay && record.date <= today).map((record) => record.date)).size;
  const earned = records.filter((record) => record.date === today).reduce((sum, record) => sum + record.creditedAmount, 0);
  const displayed = detailed ? records : records.slice(0, 2);
  return <section className="space-y-3">
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
      <div className={`min-w-0 rounded-xl border px-3 py-2.5 ${tone.surface}`}>
        <p className="truncate text-xs text-zinc-500" title={t('checkInEarnedToday')}>{t('checkInEarnedToday')}</p>
        <p className={`mt-1 truncate font-mono text-lg font-semibold leading-6 tabular-nums ${palette.accentText}`}>+{Number(earned.toFixed(2))}</p>
      </div>
      <div className={`min-w-0 rounded-xl border px-3 py-2.5 ${tone.surface}`}>
        <p className="truncate text-xs text-zinc-500" title={t('checkInDaysWeek')}>{t('checkInDaysWeek')}</p>
        <p className={`mt-1 truncate font-mono text-lg font-semibold leading-6 tabular-nums ${palette.accentText}`}>{days}<span className="font-sans text-sm font-normal text-zinc-400"> / 7</span></p>
      </div>
    </div>
    {detailed && <h3 className="text-sm font-semibold text-zinc-700">{t('checkInHistory')}</h3>}
    {displayed.length ? <div className="divide-y divide-zinc-100">
      {displayed.map((record) => <div key={record.key} className="flex items-center gap-2 py-2 text-xs">
        <Clock3 className="h-3.5 w-3.5 shrink-0 text-zinc-400" />
        <span className="min-w-0 flex-1 truncate text-zinc-600" title={record.name}>{record.name}</span>
        <time className="shrink-0 tabular-nums text-zinc-500" dateTime={record.at === undefined ? record.date : new Date(record.at).toISOString()}
          title={record.at === undefined ? t('checkInDateOnly') : new Intl.DateTimeFormat(locale, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(record.at)}>
          {record.at === undefined ? record.date : new Intl.DateTimeFormat(locale, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(record.at)}
        </time>
        <span className={`shrink-0 font-mono ${palette.accentText}`}>+{record.creditedAmount}</span>
      </div>)}
    </div> : <p className="flex items-center gap-1.5 text-xs text-zinc-500"><Clock3 className="h-3.5 w-3.5" />{t('noCheckInHistory')}</p>}
  </section>;
}
