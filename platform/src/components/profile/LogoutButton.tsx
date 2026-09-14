'use client';

import { useState, useTransition, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface LogoutButtonProps {
  action: () => Promise<void>;
}

// 客户端退出登录按钮：点击后弹出确认弹窗，确认后才执行 server action。
// 弹窗通过 createPortal 挂到 document.body，彻底绕开祖先（aside sticky + transform）
// 创建的 stacking context 陷阱，确保层级独立于组件树。
export default function LogoutButton({ action }: LogoutButtonProps) {
  const t = useTranslations('Profile');
  const [showConfirm, setShowConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();
  // SSR 时 document 不存在，必须等客户端挂载后才能 createPortal
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const handleConfirm = () => {
    startTransition(async () => {
      await action();
    });
  };

  const overlay = (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[200] flex items-end sm:items-center justify-center sm:p-4"
      onClick={() => setShowConfirm(false)}
    >
      <div
        className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-sm p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:pb-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="logout-confirm-title"
      >
        <div className="flex justify-center mb-4">
          <div className="w-12 h-12 rounded-full flex items-center justify-center bg-red-50">
            <LogOut className="w-6 h-6 text-[#e52129]" />
          </div>
        </div>
        <h3 id="logout-confirm-title" className="text-lg font-bold text-gray-900 text-center mb-2">
          {t('signOutConfirmTitle')}
        </h3>
        <p className="text-sm text-gray-500 text-center mb-6">
          {t('signOutConfirmDesc')}
        </p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setShowConfirm(false)}
            disabled={isPending}
            className="flex-1 py-3 sm:py-2.5 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {t('cancel')}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isPending}
            className="flex-1 py-3 sm:py-2.5 rounded-lg bg-[#e52129] hover:bg-[#c81c24] text-white text-sm font-medium transition-colors disabled:opacity-60"
          >
            {t('confirmSignOut')}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        onClick={() => setShowConfirm(true)}
        className="flex min-h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-[#e52129] px-4 py-2 text-sm font-medium text-[#e52129] transition-colors hover:bg-[#e52129] hover:text-white active:bg-[#c41b22]"
      >
        <LogOut className="h-4 w-4" />
        {t('signOut')}
      </button>

      {mounted && showConfirm && createPortal(overlay, document.body)}
    </>
  );
}
