'use client';

import { useState } from 'react';
import { Mail, Copy, Check } from 'lucide-react';
import { copyToClipboard } from '@/lib/copyUtils';

const CONTACT_EMAIL = 'ichenghub@gmail.com';

interface CopyEmailCardActionProps {
  isEn: boolean;
}

export default function CopyEmailCardAction({ isEn }: CopyEmailCardActionProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const ok = await copyToClipboard(CONTACT_EMAIL);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="group flex flex-col justify-between w-full text-left rounded-2xl apple-glass-card p-6 md:p-8 gap-6 cursor-pointer"
    >
      <div className="space-y-4">
        <div className="w-11 h-11 rounded-xl bg-red-50 text-[#e52129] flex items-center justify-center">
          <Mail className="w-5 h-5" />
        </div>
        <h2 className="text-xl font-bold text-zinc-900 group-hover:text-[#e52129] transition-colors">
          {isEn ? 'Direct Email' : '官方邮箱'}
        </h2>
        <p className="text-sm sm:text-[15px] text-zinc-600 leading-[1.8]">
          {isEn
            ? 'Best for bug reports, technical corrections, broken link notices, copyright inquiries, and privacy/data deletion requests.'
            : '适合反馈工具 Bug、内容纠错、失效链接提醒、版权沟通以及隐私与账号数据删除申请。'}
        </p>
      </div>
      <div>
        <span className="relative inline-flex items-center gap-2 text-sm font-semibold">
          <span
            className={`font-mono transition-colors ${
              copied ? 'text-emerald-600' : 'text-zinc-900 group-hover:text-[#e52129]'
            }`}
          >
            {CONTACT_EMAIL}
          </span>
          {copied ? (
            <Check className="w-4 h-4 shrink-0 text-emerald-600" />
          ) : (
            <Copy className="w-4 h-4 shrink-0 text-zinc-900 opacity-70 transition-all group-hover:text-[#e52129] group-hover:opacity-100" />
          )}
          {copied && (
            <span
              role="status"
              aria-live="polite"
              className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white shadow-md animate-fade-in"
            >
              <Check className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>{isEn ? 'Copied' : '已复制'}</span>
            </span>
          )}
        </span>
      </div>
    </button>
  );
}
