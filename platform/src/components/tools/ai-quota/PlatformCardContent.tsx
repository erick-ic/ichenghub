'use client';

import { useEffect, useRef, useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import focusStyles from './quota-focus.module.css';
import { Plus, Minus, ChevronRight, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import type { Platform } from './AiQuotaTracker';
import { getRemainingPercent, getUsagePercent, isRemainingIndicator } from './indicator-utils';
import { ALERT_BAR_STRIPE, normalizePlatformColor, PLATFORM_COLOR_STYLES } from './platform-colors';
import DailyCheckInDialog from './DailyCheckInDialog';
import ExpiryIndicatorCard from './ExpiryIndicatorCard';
import { recentExpiredIndicators } from './expiry-indicators';
import CheckInHistory from './CheckInHistory';

type Props = {
  platform: Platform;
  today: string;
  animated: boolean;
  handleCheckIn: (platformId: string, checkInId: string) => void;
  handleUpdateQuota: (platformId: string, indicatorId: string, delta: number) => void;
  handleSetRemainingPercent: (platformId: string, indicatorId: string, remainingPercent: number) => void;
  detailed?: boolean;
};

export default function PlatformCardContent(props: Props) {
  const { platform, today, animated, handleCheckIn, handleUpdateQuota, handleSetRemainingPercent, detailed = false } = props;
  const t = useTranslations('AiQuota');
  const locale = useLocale();
  const palette = PLATFORM_COLOR_STYLES[normalizePlatformColor(platform.color)];
  const pickName = (zh: string, en: string) => locale === 'en' ? en || zh : zh || en;
  const [now, setNow] = useState(Date.now);
  const [editingIndicatorId, setEditingIndicatorId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const cancelEditRef = useRef(false);

  const startEditingRemaining = (indicatorId: string, currentPercent: number) => {
    cancelEditRef.current = false;
    setEditingIndicatorId(indicatorId);
    setEditingValue(String(currentPercent));
  };

  const commitEditingRemaining = (indicatorId: string) => {
    if (cancelEditRef.current) {
      cancelEditRef.current = false;
      return;
    }
    const parsed = Number(editingValue);
    if (editingValue.trim() !== '' && Number.isFinite(parsed)) {
      handleSetRemainingPercent(platform.id, indicatorId, parsed);
    }
    setEditingIndicatorId(null);
  };

  const cancelEditingRemaining = () => {
    cancelEditRef.current = true;
    setEditingIndicatorId(null);
  };
  useEffect(() => {
    const refresh = () => setNow(Date.now());
    const timer = window.setInterval(refresh, 1_000);
    document.addEventListener('visibilitychange', refresh);
    return () => { window.clearInterval(timer); document.removeEventListener('visibilitychange', refresh); };
  }, []);
  const active = (platform.expiryIndicators ?? []).filter((item) => item.expiresAt > now).sort((a, b) => a.expiresAt - b.expiresAt);
  const expired = recentExpiredIndicators(platform.expiryIndicators ?? [], now);
  const pending = (platform.checkIns ?? []).filter((item) => item.validityMinutes && !item.expiryRecordId);
  // 取当前语言的单位，空时回退到另一种语言
  const pickUnit = (zh?: string, en?: string) => {
    if (locale === 'en') return en || zh;
    return zh || en;
  };

  const formatValidity = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
    return locale === 'en'
      ? [hours && `${hours}h`, rest && `${rest}m`].filter(Boolean).join(' ')
      : [hours && `${hours} 小时`, rest && `${rest} 分钟`].filter(Boolean).join(' ');
  };


  const regularCheckIns = (platform.checkIns ?? []).filter((item) => !item.validityMinutes || item.history?.length);
  const hasIndicators = platform.indicators.length > 0 || !!platform.expiryIndicators?.length;
  const primaryQuota = [...platform.indicators].sort((a, b) => getUsagePercent(b) - getUsagePercent(a))[0];
  const urgentQuota = primaryQuota && getUsagePercent(primaryQuota) >= 80;
  const remaining = active[0] ? Math.max(1, Math.ceil((active[0].expiresAt - now) / 60000)) : 0;
  const status = urgentQuota
    ? `${pickName(primaryQuota.nameZh, primaryQuota.nameEn)} · ${t(primaryQuota.used >= primaryQuota.limit ? (primaryQuota.resetDaily === false ? 'exhaustedPermanent' : 'exhausted') : 'warning')}`
    : active.length ? t('nextCreditExpiry', { amount: active[0].amount, duration: formatValidity(remaining) })
    : pending.length ? t('pendingExpirySummary', { count: pending.length })
    : platform.checkIns?.length ? t(platform.checkIns.every((item) => item.completedDate === today) ? 'checklistComplete' : 'notCheckedInToday')
    : platform.indicators.length ? t('quotaSummaryCount', { count: platform.indicators.length })
    : t('noActiveExpiry');

  // 概览、滚动卡片与详情共用同一余额区域，避免分支样式漂移。
  const balancePanel = platform.balance ? (
    <div className="flex h-[4.25rem] min-w-0 shrink-0 items-center justify-between gap-2 rounded-xl bg-zinc-50 px-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs leading-4 text-zinc-500">{t('balance')}</p>
        <p className="truncate font-mono text-lg font-semibold leading-7 tabular-nums text-zinc-900" title={platform.balance.current.toFixed(2)}>{platform.balance.current.toFixed(2)}</p>
      </div>
      {!!platform.checkIns?.length && <DailyCheckInDialog mode="platform" compact platforms={[platform]} today={today} onCheckIn={handleCheckIn} />}
    </div>
  ) : null;

  return <>
    {!detailed && !hasIndicators && !platform.balance && <div className="mt-3 space-y-3">
      <div className="flex h-[4.25rem] min-w-0 shrink-0 items-center justify-between gap-2 rounded-xl bg-zinc-50 px-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-zinc-500" title={primaryQuota ? pickName(primaryQuota.nameZh, primaryQuota.nameEn) : t('activeCreditTotal')}>
            {primaryQuota ? pickName(primaryQuota.nameZh, primaryQuota.nameEn) : t('activeCreditTotal')}
          </p>
          <p className="truncate font-mono text-lg font-semibold leading-7 tabular-nums text-zinc-900">
            {primaryQuota ? (isRemainingIndicator(primaryQuota)
              ? <>{getRemainingPercent(primaryQuota)}%</>
              : <>{primaryQuota.used}<span className="text-sm font-normal text-zinc-500"> / {primaryQuota.limit} {pickUnit(primaryQuota.unitZh, primaryQuota.unitEn)}</span></>) : active.reduce((sum, item) => sum + item.amount, 0).toFixed(2)}
          </p>
        </div>
      </div>
      <p title={status} className={`truncate text-xs leading-5 ${urgentQuota ? 'text-amber-700' : 'text-zinc-500'}`}>{status}</p>
    </div>}
    {(detailed || hasIndicators || !!platform.balance) && <div
      tabIndex={!detailed ? 0 : undefined}
      aria-label={!detailed ? t('scrollQuotaIndicators') : undefined}
      className={detailed ? 'mt-5 flex flex-col gap-4 sm:mt-6 sm:gap-5'
        : 'mt-3 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [&>*]:shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-300'}>
      {balancePanel}
      {!!platform.balance && <CheckInHistory items={regularCheckIns} today={today} detailed={detailed} color={platform.color} />}
      {active.map((item) => <ExpiryIndicatorCard key={item.id} item={item} color={platform.color} />)}
      {platform.indicators.map((ind) => {
        const isRemaining = isRemainingIndicator(ind);
        const usedPercent = getUsagePercent(ind);
        const remainingPercent = getRemainingPercent(ind);
        const barPercent = isRemaining ? remainingPercent : usedPercent;
        const isExceeded = ind.used >= ind.limit;
        const isWarning = !isExceeded && usedPercent >= 80;
        const barColor = isExceeded
          ? 'bg-[#e52129]'
          : isWarning
          ? 'bg-amber-500'
          : palette.accentBg;
        const trackColor = isExceeded
          ? isRemaining
            ? 'bg-red-100/80 ring-1 ring-inset ring-red-200'
            : 'bg-red-50 ring-1 ring-inset ring-red-200'
          : isWarning
          ? 'bg-amber-50 ring-1 ring-inset ring-amber-200'
          : 'bg-gray-100';
        const valueColor = isExceeded
          ? 'text-[#e52129]'
          : isWarning
          ? 'text-amber-600'
          : 'text-gray-900';
        const isEditingThis = isRemaining && editingIndicatorId === ind.id;
        const canDecrease = isRemaining ? remainingPercent > 0 : ind.used > 0;
        const canIncrease = isRemaining ? remainingPercent < 100 : ind.used < ind.limit;
        const stepperBtnClass =
          'w-8 h-8 sm:w-6 sm:h-6 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:text-[#e52129] hover:bg-red-50 transition-colors disabled:cursor-not-allowed disabled:border-gray-100 disabled:bg-gray-50 disabled:text-gray-300 disabled:hover:bg-gray-50 disabled:hover:text-gray-300';
        return (
          <div key={ind.id} className={!detailed ? 'min-h-[3.75rem] shrink-0' : undefined}>
            {/* 信息行：名称 + 额度数值/状态徽章（窄屏自动换行） */}
            <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 mb-2">
              <span className="text-sm font-medium text-zinc-700 truncate min-w-0 flex-1">{pickName(ind.nameZh, ind.nameEn)}</span>
              <div className="flex flex-wrap items-center justify-end gap-1">
                {isRemaining ? (
                  <>
                    {isEditingThis ? (
                      <span className="inline-flex items-center gap-0.5">
                        <input
                          type="number"
                          min={0}
                          max={100}
                          step="any"
                          autoFocus
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onFocus={(e) => e.currentTarget.select()}
                          onBlur={() => commitEditingRemaining(ind.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              commitEditingRemaining(ind.id);
                            } else if (e.key === 'Escape') {
                              e.preventDefault();
                              cancelEditingRemaining();
                            }
                          }}
                          aria-label={t('aria.remainingPercentInput')}
                          className="w-14 rounded border border-zinc-300 bg-white px-1.5 py-0.5 text-right font-mono text-sm font-medium text-zinc-900 outline-none focus:border-zinc-500"
                        />
                        <span className="font-mono text-sm text-zinc-500">%</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEditingRemaining(ind.id, remainingPercent)}
                        title={t('clickToEditRemaining')}
                        aria-label={t('aria.editRemainingPercent', {
                          name: pickName(ind.nameZh, ind.nameEn),
                          percent: remainingPercent,
                        })}
                        className={`font-mono text-sm font-medium tabular-nums rounded px-1 -mx-1 hover:bg-zinc-100 transition-colors cursor-text ${valueColor}`}
                      >
                        {remainingPercent}%
                      </button>
                    )}
                    <span className="text-[10px] text-gray-400 px-1 bg-gray-100 rounded">
                      {ind.resetDaily === false ? t('remaining') : t('todayRemaining')}
                    </span>
                  </>
                ) : (
                  <>
                    <span className={`font-mono text-sm font-medium ${valueColor}`}>
                      {ind.used}
                    </span>
                    <span className="text-[10px] text-gray-400 px-1 bg-gray-100 rounded">{ind.resetDaily === false ? t('used') : t('today')}</span>
                    <span className="text-sm text-gray-400">/</span>
                    <span className="font-mono text-sm text-gray-500">{ind.limit}</span>
                    {(() => { const u = pickUnit(ind.unitZh, ind.unitEn); return u ? <span className="text-xs text-gray-400 ml-0.5">{u}</span> : null; })()}
                    <span className="text-[10px] text-gray-400 px-1 bg-gray-100 rounded">{t('limit')}</span>
                  </>
                )}
                {isWarning && (
                  <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded ml-1">
                    {t('warning')}
                  </span>
                )}
                {isExceeded && (
                  <span className="text-[10px] text-white bg-[#e52129] px-1.5 py-0.5 rounded ml-1 animate-pulse">
                    {t(ind.resetDaily === false ? 'exhaustedPermanent' : 'exhausted')}
                  </span>
                )}
              </div>
            </div>

            {/* 进度条与快捷加减 */}
            <div className="flex items-center gap-2 sm:gap-3">
              <div
                role="progressbar"
                aria-label={pickName(ind.nameZh, ind.nameEn)}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(barPercent)}
                className={`flex-1 rounded-full h-2 overflow-hidden ${trackColor}`}
              >
                <div
                  className={`h-full rounded-full transition-[width] duration-700 ease-out ${barColor}`}
                  style={{
                    width: animated ? `${barPercent}%` : '0%',
                    ...(isWarning || isExceeded ? { backgroundImage: ALERT_BAR_STRIPE } : undefined),
                  }}
                />
              </div>
              {isRemaining ? (
                <>
                  <button
                    type="button"
                    disabled={!canDecrease}
                    aria-label={t('aria.decreaseRemaining')}
                    title={canDecrease ? t('aria.decreaseRemainingHint') : undefined}
                    onClick={(e) => handleUpdateQuota(platform.id, ind.id, e.shiftKey ? 10 : 1)}
                    className={stepperBtnClass}
                  >
                    <Minus className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={!canIncrease}
                    aria-label={t('aria.increaseRemaining')}
                    title={canIncrease ? t('aria.increaseRemainingHint') : undefined}
                    onClick={(e) => handleUpdateQuota(platform.id, ind.id, e.shiftKey ? -10 : -1)}
                    className={stepperBtnClass}
                  >
                    <Plus className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                  </button>
                </>
              ) : (
                <>
                  <button type="button" disabled={!canDecrease} aria-label={t('aria.decrease')}
                    onClick={() => handleUpdateQuota(platform.id, ind.id, -1)}
                    className={stepperBtnClass}>
                    <Minus className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                  </button>
                  <button type="button" disabled={!canIncrease} aria-label={t('aria.increase')}
                    onClick={() => handleUpdateQuota(platform.id, ind.id, 1)}
                    className={stepperBtnClass}>
                    <Plus className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                  </button>
                </>
              )}
            </div>
          </div>
        );
      })}

      {detailed && expired.length > 0 && <section className="space-y-3 border-t border-zinc-100 pt-5">
        <h3 className="text-sm font-semibold text-zinc-700">{t('expiredHistory', { count: expired.length })}</h3>
        {expired.map((item) => <ExpiryIndicatorCard key={item.id} item={item} color={platform.color} />)}
      </section>}
    </div>}
    {!detailed && <Dialog.Root>
      <div className="mt-auto shrink-0 pt-3">
        <Dialog.Trigger asChild>
          <button type="button" aria-label={t('platformDetailsTitle', { name: pickName(platform.nameZh, platform.nameEn) })}
            className={`${focusStyles.footerTrigger} flex w-full items-center justify-between gap-2 border-t border-zinc-100 pt-3 text-xs text-zinc-500 hover:text-zinc-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400`}>
            <span>{expired.length ? t('expiredHistory', { count: expired.length }) : platform.indicators.length ? t('quotaSummaryCount', { count: platform.indicators.length }) : active.length ? t('activeCreditCount', { count: active.length }) : t('platformOverview')}</span>
            <span className="flex shrink-0 items-center gap-1 font-medium">{t('viewDetails')}<ChevronRight className="h-3.5 w-3.5" /></span>
          </button>
        </Dialog.Trigger>
      </div>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" />
        <Dialog.Content className={`${focusStyles.scope} fixed inset-x-0 bottom-0 z-50 flex max-h-[90dvh] flex-col rounded-t-2xl bg-white shadow-2xl sm:inset-y-0 sm:left-auto sm:right-0 sm:max-h-none sm:w-full sm:max-w-lg sm:rounded-none`}>
          <div className="flex items-start justify-between gap-4 border-b border-zinc-100 p-5 sm:p-6">
            <div className="min-w-0">
      <Dialog.Title className="break-words text-xl font-semibold text-zinc-900">{t('platformDetailsTitle', { name: pickName(platform.nameZh, platform.nameEn) })}</Dialog.Title>
      <Dialog.Description className="mt-2 text-sm text-zinc-500">{t('platformDetailsDescription')}</Dialog.Description>
            </div>
            <Dialog.Close asChild><button type="button" aria-label={t('closeDetails')} className="shrink-0 rounded-full p-2 text-zinc-500 hover:bg-zinc-100"><X className="h-5 w-5" /></button></Dialog.Close>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6 sm:px-6">
            <PlatformCardContent {...props} animated detailed />
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>}
  </>;
}
