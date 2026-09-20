'use client';

import { useState, useEffect, useRef } from 'react';
import { Check, X, Plus, Minus } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import type { Platform, Indicator, CheckIn } from './AiQuotaTracker';
import { normalizeCheckIns } from './check-ins';
import { normalizePlatformUrl } from './platform-url';
import { DEFAULT_PLATFORM_COLOR, normalizePlatformColor, PLATFORM_COLORS, PLATFORM_COLOR_STYLES, type PlatformColor } from './platform-colors';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useEscapeKey } from '@/hooks/useEscapeKey';

// ===== 表单态指标 =====
interface IndicatorForm {
  id: string;
  nameZh: string;
  nameEn: string;
  limit: number;
  used: number;
  unitZh: string;
  unitEn: string;
  resetDaily: boolean;
}

interface PlatformConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (platform: Platform) => void;
  initialData?: Platform;
}

// 生成一个空指标行
const createEmptyIndicator = (): IndicatorForm => ({
  id: crypto.randomUUID(),
  nameZh: '',
  nameEn: '',
  limit: 100,
  used: 0,
  unitZh: '',
  unitEn: '',
  resetDaily: true,
});

const createEmptyCheckIn = (): CheckIn => ({
  id: crypto.randomUUID(),
  nameZh: '',
  nameEn: '',
  reward: 0,
});

// 将存储态指标转为表单态
const toFormIndicators = (list: Indicator[]): IndicatorForm[] =>
  list.map((ind) => ({
    id: ind.id,
    nameZh: ind.nameZh,
    nameEn: ind.nameEn,
    limit: ind.limit,
    used: ind.used,
    unitZh: ind.unitZh ?? '',
    unitEn: ind.unitEn ?? '',
    resetDaily: ind.resetDaily !== false,
  }));

export default function PlatformConfigModal({
  isOpen,
  onClose,
  onSave,
  initialData,
}: PlatformConfigModalProps) {
  const t = useTranslations('AiQuota');
  const locale = useLocale();
  const isEn = locale === 'en';
  const isEdit = !!initialData;
  useBodyScrollLock(isOpen);
  useEscapeKey(isOpen, onClose);

  const [platformNameZh, setPlatformNameZh] = useState('');
  const [platformNameEn, setPlatformNameEn] = useState('');
  const [platformUrl, setPlatformUrl] = useState('');
  const [platformColor, setPlatformColor] = useState<PlatformColor>(DEFAULT_PLATFORM_COLOR);
  const [indicators, setIndicators] = useState<IndicatorForm[]>([
    createEmptyIndicator(),
  ]);
  const [hasBalance, setHasBalance] = useState(false);
  const [balanceCurrent, setBalanceCurrent] = useState(0);
  const [balanceInitial, setBalanceInitial] = useState(0);
  const [balanceResetDaily, setBalanceResetDaily] = useState(false);
  const [checkIns, setCheckIns] = useState<CheckIn[]>([]);
  const [nameError, setNameError] = useState(false);
  const [urlError, setUrlError] = useState(false);
  const [indicatorError, setIndicatorError] = useState(false);
  const [checkInError, setCheckInError] = useState(false);
  const platformNameRef = useRef<HTMLInputElement>(null);
  const platformUrlRef = useRef<HTMLInputElement>(null);
  const addIndicatorRef = useRef<HTMLButtonElement>(null);

  const nameLanguages: Array<'zh' | 'en'> = isEn ? ['en', 'zh'] : ['zh', 'en'];

  // 每次打开弹窗时：编辑态回填 initialData，新增态置空
  useEffect(() => {
    if (!isOpen) return;
    if (initialData) {
      setPlatformNameZh(initialData.nameZh);
      setPlatformNameEn(initialData.nameEn);
      setPlatformUrl(initialData.url ?? '');
      setPlatformColor(normalizePlatformColor(initialData.color));
      setIndicators(toFormIndicators(initialData.indicators));
      setHasBalance(!!initialData.balance);
      setBalanceCurrent(initialData.balance?.current ?? 0);
      setBalanceInitial(initialData.balance?.initial ?? 0);
      setBalanceResetDaily(initialData.balance?.resetDaily ?? false);
      setCheckIns(normalizeCheckIns(initialData.checkIns, initialData.checkIn));
    } else {
      setPlatformNameZh('');
      setPlatformNameEn('');
      setPlatformUrl('');
      setPlatformColor(DEFAULT_PLATFORM_COLOR);
      setIndicators([createEmptyIndicator()]);
      setHasBalance(false);
      setBalanceCurrent(0);
      setBalanceInitial(0);
      setBalanceResetDaily(false);
      setCheckIns([]);
    }
    setNameError(false);
    setUrlError(false);
    setIndicatorError(false);
    setCheckInError(false);
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  // ===== 指标行操作 =====
  const updateIndicator = (
    id: string,
    field: 'nameZh' | 'nameEn' | 'limit' | 'unitZh' | 'unitEn' | 'resetDaily',
    value: string | boolean
  ) => {
    setIndicators((prev) =>
      prev.map((ind) =>
        ind.id === id
          ? { ...ind, [field]: field === 'limit' ? Number(value) : value }
          : ind
      )
    );
  };

  const removeIndicator = (id: string) => {
    setIndicators((prev) => prev.filter((ind) => ind.id !== id));
  };

  const addIndicator = () => {
    setIndicators((prev) => [...prev, createEmptyIndicator()]);
  };

  const updateCheckIn = (id: string, field: 'nameZh' | 'nameEn' | 'reward', value: string) => {
    setCheckIns((prev) => prev.map((item) => item.id === id
      ? { ...item, [field]: field === 'reward' ? Number(value) : value } : item));
  };

  // ===== 保存：校验 + 组装 + 回调 =====
  const handleSave = () => {
    if (!platformNameZh.trim() && !platformNameEn.trim()) {
      setNameError(true);
      platformNameRef.current?.focus();
      return;
    }
    setNameError(false);

    const normalizedUrl = platformUrl.trim() ? normalizePlatformUrl(platformUrl) : undefined;
    if (platformUrl.trim() && !normalizedUrl) {
      setUrlError(true);
      platformUrlRef.current?.focus();
      return;
    }
    setUrlError(false);

    const validIndicators = indicators.filter(
      (ind) => ind.nameZh.trim() || ind.nameEn.trim()
    );
    if (validIndicators.length === 0 && !hasBalance && checkIns.length === 0) {
      setIndicatorError(true);
      (document.querySelector<HTMLInputElement>('[data-indicator-name]') ?? addIndicatorRef.current)?.focus();
      return;
    }
    setIndicatorError(false);
    const invalidCheckInIndex = checkIns.length > 1
      ? checkIns.findIndex((item) => !item.nameZh?.trim() && !item.nameEn?.trim()) : -1;
    if (invalidCheckInIndex !== -1) {
      setCheckInError(true);
      document.querySelectorAll<HTMLInputElement>('[data-checkin-name]')[invalidCheckInIndex]?.focus();
      return;
    }
    setCheckInError(false);

    // 组装完整 Platform：编辑态保留原有 id 与各指标 used 值
    const savedPlatform: Platform = {
      id: initialData?.id ?? crypto.randomUUID(),
      pinned: initialData?.pinned ?? false,
      nameZh: platformNameZh.trim(),
      nameEn: platformNameEn.trim(),
      url: normalizedUrl,
      color: platformColor,
      balance: hasBalance ? {
        current: Math.max(0, Number(balanceCurrent) || 0),
        initial: Math.max(0, Number(balanceInitial) || 0),
        resetDaily: balanceResetDaily,
      } : undefined,
      checkIns: checkIns.map((item) => ({
        ...item,
        nameZh: item.nameZh?.trim() ?? '',
        nameEn: item.nameEn?.trim() ?? '',
        reward: Math.max(0, Number(item.reward) || 0),
      })),
      indicators: validIndicators.map((ind) => ({
        id: ind.id,
        nameZh: ind.nameZh.trim(),
        nameEn: ind.nameEn.trim(),
        limit: Math.max(1, Number(ind.limit) || 0),
        used: ind.used,
        unitZh: ind.unitZh.trim() || undefined,
        unitEn: ind.unitEn.trim() || undefined,
        resetDaily: ind.resetDaily,
      })),
    };

    onSave(savedPlatform);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-md max-h-[92vh] overflow-y-auto p-5 sm:p-6 pb-[max(1.25rem,env(safe-area-inset-bottom))] sm:pb-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ===== 头部 ===== */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">
            {isEdit ? t('editModalTitle') : t('modalTitle')}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label={t('cancel')}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ===== 平台名称：原始语言和可选翻译都可编辑 ===== */}
        <div className="mb-5">
          <div className="text-sm text-gray-600 mb-1.5">{t('platformNameLabel')}</div>
          <p className="text-xs text-gray-400 mb-2">{t('nameTranslationHint')}</p>
          <div className="grid grid-cols-2 items-end gap-2">
            {nameLanguages.map((language, index) => <label key={language} className="block min-w-0 text-xs text-gray-600">
              {t(language === 'zh' ? 'nameChinese' : 'nameEnglish')}
              <input
                ref={index === 0 ? platformNameRef : undefined}
                type="text"
                value={language === 'zh' ? platformNameZh : platformNameEn}
                onChange={(e) => {
                  if (language === 'zh') setPlatformNameZh(e.target.value);
                  else setPlatformNameEn(e.target.value);
                  if (nameError) setNameError(false);
                }}
                placeholder={t('platformNamePlaceholder')}
                aria-invalid={nameError || undefined}
                className={`mt-1 w-full px-3 py-2 rounded-lg border bg-white text-base sm:text-sm text-gray-900 outline-none transition-colors ${
                  nameError ? 'border-[#e52129] focus:border-[#e52129]' : 'border-gray-200 focus:border-[#e52129]'
                }`}
              />
            </label>)}
          </div>
          {nameError && <p className="mt-1.5 text-xs text-[#e52129]">{t('errors.platformNameRequired')}</p>}
        </div>

        {/* ===== 平台链接（可选） ===== */}
        <div className="mb-5">
          <label className="block text-sm text-gray-600 mb-1.5">{t('platformUrlLabel')}</label>
          <input
            ref={platformUrlRef}
            type="url"
            inputMode="url"
            value={platformUrl}
            onChange={(e) => {
              setPlatformUrl(e.target.value);
              if (urlError) setUrlError(false);
            }}
            placeholder={t('platformUrlPlaceholder')}
            aria-invalid={urlError || undefined}
            className={`w-full px-3 py-2 rounded-lg border bg-white text-base sm:text-sm text-gray-900 outline-none transition-colors ${
              urlError
                ? 'border-[#e52129] focus:border-[#e52129]'
                : 'border-gray-200 focus:border-[#e52129]'
            }`}
          />
          <p className={`mt-1.5 text-xs ${urlError ? 'text-[#e52129]' : 'text-gray-400'}`}>
            {urlError ? t('errors.platformUrlInvalid') : t('platformUrlHint')}
          </p>
        </div>

        {/* ===== 卡片配色 ===== */}
        <fieldset className="mb-5">
          <legend className="block text-sm text-gray-600 mb-1.5">{t('cardColorLabel')}</legend>
          <p className="text-xs text-gray-400 mb-3">{t('cardColorHint')}</p>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label={t('cardColorLabel')}>
            {PLATFORM_COLORS.map((color) => {
              const selected = platformColor === color;
              const style = PLATFORM_COLOR_STYLES[color];
              return (
                <button
                  key={color}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  onClick={() => setPlatformColor(color)}
                  className={`flex items-center gap-2 rounded-xl border p-2 text-left transition-all ${
                    selected
                      ? 'border-zinc-800 bg-zinc-50 ring-1 ring-zinc-800 shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${style.swatch} shadow-inner`}>
                    {selected && <Check className="h-3.5 w-3.5 text-white drop-shadow" strokeWidth={3} />}
                  </span>
                  <span className="truncate text-xs font-medium text-gray-700">{t(`cardColors.${color}`)}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* ===== 监控指标列表 ===== */}
        <div className="mb-5">
          <label className="block text-sm text-gray-600 mb-1.5">{t('indicatorLabel')}</label>
          <div className="flex flex-col gap-2.5">
            {indicators.map((ind) => (
              <div key={ind.id} className="flex flex-wrap items-center gap-2">
                <div className="grid w-full grid-cols-2 items-end gap-2">
                  {nameLanguages.map((language, index) => <label key={language} className="min-w-0 text-xs text-zinc-600">
                    {t(language === 'zh' ? 'nameChinese' : 'nameEnglish')}
                    <input type="text" data-indicator-name={index === 0 ? '' : undefined}
                      aria-label={`${t('indicatorName')} (${t(language === 'zh' ? 'nameChinese' : 'nameEnglish')})`}
                      value={language === 'zh' ? ind.nameZh : ind.nameEn}
                      onChange={(e) => {
                        updateIndicator(ind.id, language === 'zh' ? 'nameZh' : 'nameEn', e.target.value);
                        if (indicatorError) setIndicatorError(false);
                      }}
                      placeholder={t('indicatorName')}
                      className="mt-1 w-full min-w-0 rounded-lg border border-zinc-200 px-3 py-2 text-base sm:text-sm text-zinc-900 outline-none focus:border-[#e52129]" />
                  </label>)}
                </div>
                <input
                  type="number"
                  min={1}
                  value={ind.limit}
                  onChange={(e) => updateIndicator(ind.id, 'limit', e.target.value)}
                  placeholder={t('dailyLimit')}
                  className="w-14 sm:w-16 shrink-0 px-2 py-2 rounded-lg border border-gray-200 bg-white text-base sm:text-sm text-gray-900 outline-none focus:border-[#e52129] transition-colors"
                />
                <input
                  type="text"
                  value={isEn ? ind.unitEn : ind.unitZh}
                  onChange={(e) => updateIndicator(ind.id, isEn ? 'unitEn' : 'unitZh', e.target.value)}
                  placeholder={t('unitPlaceholder')}
                  className="w-12 sm:w-14 shrink-0 px-2 py-2 rounded-lg border border-gray-200 bg-white text-base sm:text-sm text-gray-900 outline-none focus:border-[#e52129] transition-colors"
                />
                <button
                  type="button"
                  onClick={() => removeIndicator(ind.id)}
                  aria-label={t('cancel')}
                  className="w-9 h-9 sm:w-8 sm:h-8 shrink-0 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:text-[#e52129] hover:bg-red-50 transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <label className="w-full text-xs text-zinc-600 flex items-center gap-2 pl-1">
                  <input type="checkbox" checked={ind.resetDaily}
                    onChange={(e) => updateIndicator(ind.id, 'resetDaily', e.target.checked)} />
                  {t('resetDaily')}
                </label>
              </div>
            ))}
          </div>

          {indicatorError && (
            <p className="text-xs text-[#e52129] mt-1.5">{t('errors.indicatorRequired')}</p>
          )}

          <button
            ref={addIndicatorRef}
            type="button"
            onClick={addIndicator}
            className="mt-2.5 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#e52129] transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('addIndicator')}
          </button>
        </div>

        <div className="mb-5 space-y-3 border-t border-zinc-100 pt-4">
          <label className="flex items-center gap-2 text-sm text-zinc-700">
            <input type="checkbox" checked={hasBalance} onChange={(e) => setHasBalance(e.target.checked)} />
            {t('enableBalance')}
          </label>
          {hasBalance && <div className="grid grid-cols-2 gap-3">
            <label className="text-xs text-zinc-600">{t('balance')}
              <input type="number" min="0" step="any" value={balanceCurrent}
                onChange={(e) => setBalanceCurrent(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-zinc-200 p-2 text-sm" />
            </label>
            <label className="text-xs text-zinc-600">{t('initialBalance')}
              <input type="number" min="0" step="any" value={balanceInitial}
                onChange={(e) => setBalanceInitial(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-zinc-200 p-2 text-sm" />
            </label>
            <label className="col-span-2 flex items-center gap-2 text-xs text-zinc-600">
              <input type="checkbox" checked={balanceResetDaily} onChange={(e) => setBalanceResetDaily(e.target.checked)} />
              {t('resetBalanceDaily')}
            </label>
          </div>}
          <div className="text-sm font-medium text-zinc-700">{t('checkInCategories')}</div>
          {checkIns.map((item) => <div key={item.id} className="rounded-xl border border-zinc-200 p-3 space-y-3">
            <div className="grid grid-cols-2 items-end gap-2">
              {nameLanguages.map((language, index) => <label key={language} className="block min-w-0 text-xs text-zinc-600">
                {t(language === 'zh' ? 'nameChinese' : 'nameEnglish')}
                <input type="text" data-checkin-name={index === 0 ? '' : undefined}
                  aria-label={`${t('checkInName')} (${t(language === 'zh' ? 'nameChinese' : 'nameEnglish')})`}
                  value={language === 'zh' ? item.nameZh ?? '' : item.nameEn ?? ''}
                  onChange={(e) => updateCheckIn(item.id, language === 'zh' ? 'nameZh' : 'nameEn', e.target.value)}
                  placeholder={t('dailyCheckIn')}
                  className="mt-1 w-full min-w-0 rounded-lg border border-zinc-200 p-2 text-base sm:text-sm" />
              </label>)}
            </div>
            <div className="flex items-end gap-2">
              <label className="block min-w-0 flex-1 text-xs text-zinc-600">{t('checkInReward')}
                <input type="number" min="0" step="any" value={item.reward}
                  onChange={(e) => updateCheckIn(item.id, 'reward', e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-200 p-2 text-base sm:text-sm" />
              </label>
              <button type="button" onClick={() => setCheckIns((prev) => prev.filter((entry) => entry.id !== item.id))}
                aria-label={t('removeCheckIn')}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-zinc-200 text-zinc-500 hover:text-red-600">
                <Minus className="h-4 w-4" />
              </button>
            </div>
          </div>)}
          {checkInError && <p className="text-xs text-[#e52129]">{t('checkInNameRequired')}</p>}
          <button type="button" onClick={() => setCheckIns((prev) => [...prev, createEmptyCheckIn()])}
            className="inline-flex items-center gap-1 text-sm text-zinc-600 hover:text-[#e52129]">
            <Plus className="h-4 w-4" />{t('addCheckIn')}
          </button>
        </div>

        {/* ===== 保存按钮 ===== */}
        <button
          type="button"
          onClick={handleSave}
          className="w-full py-2.5 rounded-lg bg-[#e52129] text-white text-sm font-medium hover:bg-[#c81c24] transition-colors"
        >
          {t('saveConfig')}
        </button>
      </div>
    </div>
  );
}
