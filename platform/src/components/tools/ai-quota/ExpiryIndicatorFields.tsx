'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Minus, ChevronDown, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { localDateTime, type ExpiryIndicator } from './expiry-indicators';

export default function ExpiryIndicatorFields({ items, onChange }: {
  items: ExpiryIndicator[];
  onChange: (items: ExpiryIndicator[]) => void;
}) {
  const t = useTranslations('AiQuota');
  const locale = useLocale();
  const [showExpired, setShowExpired] = useState(false);
  const update = (id: string, patch: Partial<ExpiryIndicator>) => onChange(items.map((item) => item.id === id ? { ...item, ...patch } : item));

  // 未过期与过期记录分组，过期记录默认收起，避免编辑时淹没有效指标
  const now = Date.now();
  const activeItems = items.filter((item) => item.expiresAt > now);
  const expiredItems = items.filter((item) => item.expiresAt <= now);

  const renderCard = (item: ExpiryIndicator, dimmed = false) => <div id={`expiry-${item.id}`} key={item.id}
    className={`mt-3 space-y-3 rounded-xl border p-3 transition-opacity ${dimmed
      ? 'border-zinc-200 bg-white opacity-60 hover:opacity-90'
      : 'border-zinc-200 bg-zinc-50'}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-semibold text-zinc-600">{t('expiryType')}</span>
        <button type="button" aria-label={t('removeExpiry')} onClick={() => onChange(items.filter((entry) => entry.id !== item.id))} className="rounded-md border border-zinc-200 bg-white p-2 text-zinc-500 hover:text-red-600"><Minus className="h-4 w-4" /></button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {(locale === 'en' ? ['en', 'zh'] : ['zh', 'en']).map((language) => <label key={language} className="min-w-0 text-xs text-zinc-600">
          {t(language === 'zh' ? 'nameChinese' : 'nameEnglish')}
          <input value={language === 'zh' ? item.nameZh : item.nameEn} placeholder={t('dailyCheckIn')}
            onChange={(e) => update(item.id, { [language === 'zh' ? 'nameZh' : 'nameEn']: e.target.value })}
            className="mt-1 w-full rounded-lg border border-zinc-200 bg-white p-2 text-base sm:text-sm" />
        </label>)}
      </div>
      <label className="block text-xs text-zinc-600">{t('expiryAmount')}
        <input type="number" min="0" step="any" value={Number.isFinite(item.amount) ? item.amount : ''} onChange={(e) => update(item.id, { amount: e.target.value ? Number(e.target.value) : NaN })} className="mt-1 w-full rounded-lg border border-zinc-200 bg-white p-2 text-base sm:text-sm" />
      </label>
      {(['startsAt', 'expiresAt'] as const).map((field) => <label key={field} className="block text-xs text-zinc-600">
        {t(field === 'startsAt' ? 'expiryStart' : 'expiryAt')}
        <input type="datetime-local" step="1" value={localDateTime(item[field])}
          onInput={(e) => update(item.id, { [field]: new Date(e.currentTarget.value).getTime() })}
          onChange={(e) => update(item.id, { [field]: new Date(e.target.value).getTime() })}
          className="mt-1 w-full min-w-0 rounded-lg border border-zinc-200 bg-white p-2 text-base sm:text-sm" />
      </label>)}
      <p className="text-xs leading-relaxed text-zinc-500">{t('expiryBalanceHint')}</p>
    </div>;

  return <div>
    {activeItems.map((item) => renderCard(item))}
    {expiredItems.length > 0 && <div className="mt-3">
      <button type="button" aria-expanded={showExpired} onClick={() => setShowExpired((value) => !value)}
        className="flex w-full items-center justify-between rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 transition-colors hover:bg-red-100">
        <span className="flex items-center gap-1.5">
          <AlertCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          {t('expiredRecords', { count: expiredItems.length })}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${showExpired ? 'rotate-180' : ''}`} />
      </button>
      {showExpired && expiredItems.map((item) => renderCard(item, true))}
    </div>}
  </div>;
}
