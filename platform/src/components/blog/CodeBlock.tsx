'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { copyToClipboard } from '@/lib/copyUtils';

interface CodeBlockProps {
  code: string;
}

export default function CodeBlock({ code }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      const success = await copyToClipboard(code.trim());
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  return (
    <div className="relative group">
      <div className="bg-[#1e1e1e] rounded-xl overflow-hidden">
        {/* 代码内容 */}
        <pre className="p-4 md:p-6 text-sm md:text-base overflow-x-auto">
          <code className="text-gray-100 font-mono leading-relaxed whitespace-pre">
            {code}
          </code>
        </pre>
      </div>

      {/* 复制按钮 */}
      <button
        onClick={handleCopy}
        className="absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-gray-400 hover:text-white rounded-lg transition-all duration-200 backdrop-blur-sm"
        aria-label="Copy code"
      >
        {copied ? (
          <>
            <Check className="h-[18px] w-[18px] shrink-0 text-green-400" />
            <span className="text-xs text-green-400">{copied ? 'Copied' : 'Copy'}</span>
          </>
        ) : (
          <>
            <Copy className="h-[18px] w-[18px] shrink-0" />
            <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">Copy</span>
          </>
        )}
      </button>
    </div>
  );
}
