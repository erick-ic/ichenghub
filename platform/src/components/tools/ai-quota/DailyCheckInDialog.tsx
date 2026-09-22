'use client';

import { useLocale, useTranslations } from 'next-intl';
import * as Dialog from '@radix-ui/react-dialog';
import focusStyles from './quota-focus.module.css';
import { Check, ChevronRight, ClipboardCheck, ExternalLink, X } from 'lucide-react';
import type { Platform } from './AiQuotaTracker';
import { getDailySummary } from './daily-overview';
import { normalizePlatformColor, PLATFORM_COLOR_STYLES } from './platform-colors';

export default function DailyCheckInDialog({ platforms, today, onCheckIn, mode = 'global', compact = false }: {
  platforms: Platform[];
  today: string;
  onCheckIn: (platformId: string, checkInId: string) => void;
  mode?: 'global' | 'platform';
  compact?: boolean;
}) {
  const t = useTranslations('AiQuota');
  const locale = useLocale();
  const name = (zh?: string, en?: string) => (locale === 'en' ? en || zh : zh || en) || t('dailyCheckIn');
  const summary = getDailySummary(platforms, today);
  // 进度条跟随主题色；完成状态文字统一用中性黑，主题色只留给数值
  const palette = mode === 'platform' ? PLATFORM_COLOR_STYLES[normalizePlatformColor(platforms[0].color)] : null;
  const completeBar = palette?.accentBg ?? 'bg-emerald-500';

  return <Dialog.Root>
    <Dialog.Trigger asChild>
      <button type="button" aria-label={mode === 'platform' ? t('platformCheckInsTitle', { name: name(platforms[0].nameZh, platforms[0].nameEn) }) : t('openDailyChecklist')}
        className={mode === 'platform'
          ? `flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2.5 text-left text-sm font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-100 ${compact ? 'shrink-0 bg-white' : 'w-full bg-zinc-50'}`
          : 'inline-flex h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-zinc-200 bg-white px-2 py-2 text-sm font-medium text-zinc-700 hover:border-zinc-400 hover:bg-zinc-50 sm:gap-2 sm:px-3'}>
        <ClipboardCheck className="h-4 w-4 shrink-0" />
        <span className={mode === 'platform' && !compact ? 'flex-1' : mode === 'global' ? 'hidden sm:inline' : ''}>{t(mode === 'platform' ? 'platformCheckIns' : 'openDailyChecklist')}</span>
        {mode === 'platform' && !compact && <span className={`text-xs ${summary.pending ? 'text-amber-700' : 'text-zinc-600'}`}>
          {summary.pending ? t('checklistPendingCount', { count: summary.pending }) : t('checklistComplete')}
        </span>}
        <span className={`rounded-full px-2 py-0.5 text-xs tabular-nums ${summary.pending ? 'bg-amber-100 text-amber-800' : 'bg-zinc-100 text-zinc-600'}`}>
          {summary.completed}/{summary.total}
        </span>
        {mode === 'platform' && !compact && <ChevronRight className="h-4 w-4 shrink-0 text-zinc-400" />}
      </button>
    </Dialog.Trigger>
    <Dialog.Portal>
      <Dialog.Overlay className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" />
      <Dialog.Content className={`${focusStyles.scope} fixed inset-x-0 bottom-0 z-50 flex max-h-[90dvh] flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:w-[calc(100%_-_2rem)] sm:max-w-xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl`}>
        <div className="border-b border-zinc-100 px-5 pb-5 pt-6 sm:px-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <Dialog.Title className="text-xl font-semibold tracking-tight text-zinc-900">
                {mode === 'platform' ? t('platformCheckInsTitle', { name: name(platforms[0].nameZh, platforms[0].nameEn) }) : t('dailyChecklist')}
              </Dialog.Title>
              <p className="mt-1 text-xs text-zinc-500">{today}</p>
            </div>
            <Dialog.Close asChild>
              <button type="button" aria-label={t('closeChecklist')} className="rounded-full p-2 text-zinc-500 hover:bg-zinc-100"><X className="h-5 w-5" /></button>
            </Dialog.Close>
          </div>
          <Dialog.Description className="mt-3 text-sm leading-relaxed text-zinc-500">{t('checklistHint')}</Dialog.Description>
          {summary.total > 0 && <div className="mt-4">
            <div className="mb-2 flex items-center justify-between text-xs">
              <span className="font-medium text-zinc-700">{t('checklistProgress', { completed: summary.completed, total: summary.total })}</span>
              <span className={summary.pending ? 'text-amber-700' : 'text-zinc-600'}>{summary.pending ? t('checklistPendingCount', { count: summary.pending }) : t('checklistComplete')}</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-zinc-100" aria-hidden="true">
              <div className={`h-full rounded-full transition-all ${completeBar}`} style={{ width: `${summary.completed / summary.total * 100}%` }} />
            </div>
          </div>}
        </div>
        <div className="min-h-0 overflow-y-auto bg-zinc-50 p-4 sm:p-6">
          {summary.total === 0 ? <p className="py-8 text-center text-sm text-zinc-500">{t('noCheckInsConfigured')}</p> : <div className="space-y-4">
            {platforms.filter((platform) => platform.checkIns?.length).map((platform) => {
              const items = platform.checkIns ?? [];
              const done = items.filter((item) => item.completedDate === today).length;
              const color = PLATFORM_COLOR_STYLES[normalizePlatformColor(platform.color)];
              return <section key={platform.id} className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
                {mode === 'global' && <div className="flex items-center gap-3 border-b border-zinc-100 px-4 py-3">
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${color.marker}`} />
                  <h3 className="min-w-0 flex-1 break-words text-sm font-semibold text-zinc-900">{name(platform.nameZh, platform.nameEn)}</h3>
                  <span className="shrink-0 text-xs tabular-nums text-zinc-500">{done}/{items.length}</span>
                  {platform.url && <a href={platform.url} target="_blank" rel="noopener noreferrer"
                    aria-label={t('aria.openPlatform', { name: name(platform.nameZh, platform.nameEn) })}
                    title={t('aria.openPlatform', { name: name(platform.nameZh, platform.nameEn) })}
                    className="rounded-md p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900"><ExternalLink className="h-4 w-4" /></a>}
                </div>}
                <div className="divide-y divide-zinc-100">
                  {items.map((item) => {
                    const completed = item.completedDate === today;
                    return <label key={item.id} className="flex cursor-pointer items-center gap-3 px-4 py-3.5 transition-colors hover:bg-zinc-50">
                      <input type="checkbox" checked={completed} onChange={() => onCheckIn(platform.id, item.id)} className="peer sr-only" />
                      <span aria-hidden="true" className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-offset-2 ${color.accentRing} ${completed ? `${color.accentBorder} ${color.accentBg} text-white` : 'border-zinc-300 bg-white'}`}>
                        {completed && <Check className="h-3.5 w-3.5" />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className={`block break-words text-sm ${completed ? 'text-zinc-500' : 'text-zinc-800'}`}>{name(item.nameZh, item.nameEn)}</span>
                        <span className="mt-0.5 block text-xs text-zinc-500">{completed ? t('checkedInToday') : t('notCheckedInToday')}</span>
                      </span>
                      {item.reward > 0 && <span className={`shrink-0 font-mono text-xs font-medium tabular-nums ${color.accentText}`}>+{item.reward}</span>}
                    </label>;
                  })}
                </div>
              </section>;
            })}
          </div>}
        </div>
        <div className="border-t border-zinc-100 px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] text-xs text-zinc-500 sm:px-6">{t('checklistUndoHint')}</div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
