'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';

interface LoginErrorAlertProps {
  message: string;
  closeLabel: string;
}

// 登录错误提示：位于登录方式标题与按钮之间，可关闭，不暴露内部错误码
export default function LoginErrorAlert({ message, closeLabel }: LoginErrorAlertProps) {
  const [visible, setVisible] = useState(true);

  // 防止 SSR 阶段访问 document
  useEffect(() => {
    setVisible(true);
  }, []);

  if (!visible) return null;

  return (
    <div
      role="alert"
      className="mt-3 flex items-start gap-2.5 rounded-xl border border-[#e52129]/30 bg-[#e52129]/5 px-3.5 py-3 text-left fade-slide-up"
    >
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-[#e52129]" aria-hidden="true" />
      <p className="flex-1 text-xs leading-relaxed text-[#b3191f]">{message}</p>
      <button
        type="button"
        onClick={() => setVisible(false)}
        aria-label={closeLabel}
        className="-mr-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[#e52129]/70 transition-colors hover:bg-[#e52129]/15 hover:text-[#e52129]"
      >
        <X className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}
