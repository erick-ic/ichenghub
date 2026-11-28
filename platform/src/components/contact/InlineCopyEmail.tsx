'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { copyToClipboard } from '@/lib/copyUtils';

const CONTACT_EMAIL = 'ichenghub@gmail.com';

interface InlineCopyEmailProps {
  isEn: boolean;
}

export default function InlineCopyEmail({ isEn }: InlineCopyEmailProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const ok = await copyToClipboard(CONTACT_EMAIL);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <span className="relative inline-block align-baseline">
      <button
        type="button"
        onClick={handleCopy}
        title={isEn ? 'Click to copy email' : '点击复制邮箱'}
        className={`inline font-normal transition-colors cursor-pointer ${
          copied
            ? 'text-emerald-600 underline decoration-emerald-400/70 underline-offset-2'
            : 'text-[#e52129] underline underline-offset-2 hover:text-red-700'
        }`}
      >
        {CONTACT_EMAIL}
      </button>
      {copied && (
        <span
          role="status"
          aria-live="polite"
          className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 -translate-x-1/2 inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white shadow-md animate-fade-in"
        >
          <Check className="w-3 h-3 text-emerald-400 shrink-0" />
          <span>{isEn ? 'Copied' : '已复制'}</span>
        </span>
      )}
    </span>
  );
}
