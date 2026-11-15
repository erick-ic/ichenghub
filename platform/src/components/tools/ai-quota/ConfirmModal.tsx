'use client';

import { AlertTriangle, RotateCcw, Sparkles } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useEscapeKey } from '@/hooks/useEscapeKey';

interface ConfirmModalProps {
  isOpen: boolean;
  platformName: string;
  variant: 'delete' | 'reset' | 'resetAll' | 'exampleGuide';
  resetEffects?: string;
  resetProtection?: string;
  error?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmModal({
  isOpen,
  platformName,
  variant,
  resetEffects,
  resetProtection,
  error,
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  const t = useTranslations('AiQuota');
  useBodyScrollLock(isOpen);
  useEscapeKey(isOpen, onCancel);
  if (!isOpen) return null;

  const isDelete = variant === 'delete';
  const isResetAll = variant === 'resetAll';
  const isInfo = variant === 'exampleGuide';
  const nothingToReset = !isDelete && !isInfo && resetEffects === t('resetNoEffects');

  const title = isInfo
    ? t('exampleGuideTitle')
    : isDelete
    ? t('deleteConfirmTitle')
    : nothingToReset
    ? t('resetNoEffectsTitle')
    : isResetAll
    ? t('resetAllConfirmTitle')
    : t('resetConfirmTitle');

  const desc = isInfo
    ? t('exampleGuideDesc')
    : isDelete
    ? t('deleteConfirmDesc', { name: platformName })
    : nothingToReset
    ? t('resetNoEffectsDesc')
    : isResetAll
    ? t('resetAllConfirmDesc', { effects: resetEffects ?? t('resetNoEffects') })
    : t('resetConfirmDesc', { name: platformName, effects: resetEffects ?? t('resetNoEffects') });

  const confirmText = isInfo
    ? t('exampleGuideConfirm')
    : isDelete
    ? t('confirmDelete')
    : t('confirmReset');

  const cancelText = isInfo
    ? t('exampleGuideCancel')
    : nothingToReset
    ? t('closeDialog')
    : t('cancel');

  // 图标与配色
  const iconBg = isDelete
    ? 'bg-red-50'
    : isInfo
    ? 'bg-emerald-50'
    : 'bg-amber-50';
  const iconClass = isDelete
    ? 'text-[#e52129]'
    : isInfo
    ? 'text-emerald-600'
    : 'text-amber-600';
  const confirmBtnClass = isInfo
    ? 'bg-emerald-600 hover:bg-emerald-700'
    : isDelete
    ? 'bg-[#e52129] hover:bg-[#c81c24]'
    : 'bg-amber-500 hover:bg-amber-600';
  const InfoIcon = isInfo ? Sparkles : isDelete ? AlertTriangle : RotateCcw;

  return (
    <div
      className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-sm p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:pb-6"
      >
        {/* 图标 */}
        <div className="flex justify-center mb-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center ${iconBg}`}>
            <InfoIcon className={`w-6 h-6 ${iconClass}`} />
          </div>
        </div>

        {/* 标题 */}
        <h3 className="text-lg font-bold text-gray-900 text-center mb-2">{title}</h3>

        {/* 描述 */}
        <p className={`text-sm text-gray-500 text-center ${resetProtection ? 'mb-3' : 'mb-6'}`}>{desc}</p>
        {resetProtection && <p className="mb-6 rounded-lg bg-emerald-50 p-2.5 text-center text-xs leading-relaxed text-emerald-800">{resetProtection}</p>}
        {error && <p className="mb-6 rounded-lg bg-red-50 p-2.5 text-center text-xs leading-relaxed text-red-700">{error}</p>}

        {/* 操作按钮 */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 sm:py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {cancelText}
          </button>
          {!nothingToReset && <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 py-3 sm:py-2.5 rounded-lg text-white text-sm font-medium transition-colors ${confirmBtnClass}`}
          >
            {confirmText}
          </button>}
        </div>
      </div>
    </div>
  );
}
