'use client';

import { useTranslations, useLocale } from 'next-intl';
import { Minus } from 'lucide-react';
import { localDateTime, type ExpiryIndicator } from './expiry-indicators';

export default function ExpiryIndicatorFields({ items, onChange }: {
  items: ExpiryIndicator[];
  onChange: (items: ExpiryIndicator[]) => void;
}) {
  const t = useTranslations('AiQuota');
  const locale = useLocale();
  const update = (id: string, patch: Partial<ExpiryIndicator>) => onChange(items.map((item) => item.id === id ? { ...item, ...patch } : item));
  return <div className="space-y-3">
    {items.map((item) => <div id={`expiry-${item.id}`} key={item.id} className="mt-3 space-y-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
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
        <input type="datetime-local" step="1" value={localDateTime(item[field])} onInput={(e) => update(item.id, { [field]: new Date(e.currentTarget.value).getTime() })}
          onChange={(e) => update(item.id, { [field]: new Date(e.target.value).getTime() })}
          className="mt-1 w-full min-w-0 rounded-lg border border-zinc-200 bg-white p-2 text-base sm:text-sm" />
      </label>)}
      <p className="text-xs leading-relaxed text-zinc-500">{t('expiryBalanceHint')}</p>
    </div>)}
  </div>;
}
