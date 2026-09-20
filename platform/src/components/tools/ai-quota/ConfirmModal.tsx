'use client';

import { AlertTriangle, RotateCcw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useEscapeKey } from '@/hooks/useEscapeKey';

interface ConfirmModalProps {
  isOpen: boolean;
  platformName: string;
  variant: 'delete' | 'reset' | 'resetAll';
  resetEffects?: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmModal({
  isOpen,
  platformName,
  variant,
  resetEffects,
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  const t = useTranslations('AiQuota');
  useBodyScrollLock(isOpen);
  useEscapeKey(isOpen, onCancel);
  if (!isOpen) return null;

  const isDelete = variant === 'delete';
  const isResetAll = variant === 'resetAll';
  const title = isDelete
    ? t('deleteConfirmTitle')
    : isResetAll
    ? t('resetAllConfirmTitle')
    : t('resetConfirmTitle');
  const desc = isDelete
    ? t('deleteConfirmDesc', { name: platformName })
    : isResetAll
    ? t('resetAllConfirmDesc', { effects: resetEffects ?? t('resetNoEffects') })
    : t('resetConfirmDesc', { name: platformName, effects: resetEffects ?? t('resetNoEffects') });
  const confirmText = isDelete ? t('confirmDelete') : t('confirmReset');

  return (
    <div
      className="fixed inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4"
      onClick={onCancel}
    >
      <div
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-sm p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:pb-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 图标 */}
        <div className="flex justify-center mb-4">
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center ${
              isDelete ? 'bg-red-50' : 'bg-amber-50'
            }`}
          >
            {isDelete ? (
              <AlertTriangle className="w-6 h-6 text-[#e52129]" />
            ) : (
              <RotateCcw className="w-6 h-6 text-amber-600" />
            )}
          </div>
        </div>

        {/* 标题 */}
        <h3 className="text-lg font-bold text-gray-900 text-center mb-2">{title}</h3>

        {/* 描述 */}
        <p className="text-sm text-gray-500 text-center mb-6">{desc}</p>

        {/* 操作按钮 */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 sm:py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 py-3 sm:py-2.5 rounded-lg text-white text-sm font-medium transition-colors ${
              isDelete
                ? 'bg-[#e52129] hover:bg-[#c81c24]'
                : 'bg-amber-500 hover:bg-amber-600'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
