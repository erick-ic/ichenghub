'use client';

import { useState, useEffect } from 'react';
import { Check, X, Plus, Minus } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import type { Platform, Indicator } from './AiQuotaTracker';
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
  const [nameError, setNameError] = useState(false);
  const [urlError, setUrlError] = useState(false);
  const [indicatorError, setIndicatorError] = useState(false);

  // 当前语言对应的平台名称值与 setter
  const platformName = isEn ? platformNameEn : platformNameZh;
  const setPlatformName = isEn ? setPlatformNameEn : setPlatformNameZh;

  // 每次打开弹窗时：编辑态回填 initialData，新增态置空
  useEffect(() => {
    if (!isOpen) return;
    if (initialData) {
      setPlatformNameZh(initialData.nameZh);
      setPlatformNameEn(initialData.nameEn);
      setPlatformUrl(initialData.url ?? '');
      setPlatformColor(normalizePlatformColor(initialData.color));
      setIndicators(toFormIndicators(initialData.indicators));
    } else {
      setPlatformNameZh('');
      setPlatformNameEn('');
      setPlatformUrl('');
      setPlatformColor(DEFAULT_PLATFORM_COLOR);
      setIndicators([createEmptyIndicator()]);
    }
    setNameError(false);
    setUrlError(false);
    setIndicatorError(false);
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  // ===== 指标行操作 =====
  const updateIndicator = (
    id: string,
    field: 'nameZh' | 'nameEn' | 'limit' | 'unitZh' | 'unitEn',
    value: string
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

  // ===== 保存：校验 + 组装 + 回调 =====
  const handleSave = () => {
    const trimmedName = platformName.trim();

    if (!trimmedName) {
      setNameError(true);
      return;
    }
    setNameError(false);

    const normalizedUrl = platformUrl.trim() ? normalizePlatformUrl(platformUrl) : undefined;
    if (platformUrl.trim() && !normalizedUrl) {
      setUrlError(true);
      return;
    }
    setUrlError(false);

    const nameField = isEn ? 'nameEn' : 'nameZh';
    const validIndicators = indicators.filter(
      (ind) => (ind[nameField] as string).trim() !== ''
    );
    if (validIndicators.length === 0) {
      setIndicatorError(true);
      return;
    }
    setIndicatorError(false);

    // 组装完整 Platform：编辑态保留原有 id 与各指标 used 值
    const savedPlatform: Platform = {
      id: initialData?.id ?? crypto.randomUUID(),
      nameZh: isEn ? platformNameZh : trimmedName,
      nameEn: isEn ? trimmedName : platformNameEn,
      url: normalizedUrl,
      color: platformColor,
      indicators: validIndicators.map((ind) => ({
        id: ind.id,
        nameZh: ind.nameZh.trim(),
        nameEn: ind.nameEn.trim(),
        limit: Math.max(1, Number(ind.limit) || 0),
        used: ind.used,
        unitZh: ind.unitZh.trim() || undefined,
        unitEn: ind.unitEn.trim() || undefined,
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

        {/* ===== 平台名称（仅当前语言） ===== */}
        <div className="mb-5">
          <label className="block text-sm text-gray-600 mb-1.5">{t('platformNameLabel')}</label>
          <input
            type="text"
            value={platformName}
            onChange={(e) => {
              setPlatformName(e.target.value);
              if (nameError) setNameError(false);
            }}
            placeholder={t('platformNamePlaceholder')}
            className={`w-full px-3 py-2 rounded-lg border bg-white text-base sm:text-sm text-gray-900 outline-none transition-colors ${
              nameError
                ? 'border-[#e52129] focus:border-[#e52129]'
                : 'border-gray-200 focus:border-[#e52129]'
            }`}
          />
        </div>

        {/* ===== 平台链接（可选） ===== */}
        <div className="mb-5">
          <label className="block text-sm text-gray-600 mb-1.5">{t('platformUrlLabel')}</label>
          <input
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
              <div key={ind.id} className="flex items-center gap-2">
                <input
                  type="text"
                  value={isEn ? ind.nameEn : ind.nameZh}
                  onChange={(e) => {
                    updateIndicator(ind.id, isEn ? 'nameEn' : 'nameZh', e.target.value);
                    if (indicatorError) setIndicatorError(false);
                  }}
                  placeholder={t('indicatorName')}
                  className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-gray-200 bg-white text-base sm:text-sm text-gray-900 outline-none focus:border-[#e52129] transition-colors"
                />
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
              </div>
            ))}
          </div>

          {indicatorError && (
            <p className="text-xs text-[#e52129] mt-1.5">{t('errors.indicatorRequired')}</p>
          )}

          <button
            type="button"
            onClick={addIndicator}
            className="mt-2.5 inline-flex items-center gap-1 text-sm text-gray-500 hover:text-[#e52129] transition-colors"
          >
            <Plus className="w-4 h-4" />
            {t('addIndicator')}
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
