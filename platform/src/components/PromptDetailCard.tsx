'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { useLocale } from 'next-intl';
import { usePathname } from '@/navigation';
import { trackResourceAction } from '@/app/actions/statsActions';
import { copyToClipboard } from '@/lib/copyUtils';

export interface PromptDetailData {
  id: string;
  title: string;
  titleEn: string | null;
  promptText: string;
  description?: string;
  platformName?: string;
  platformUrl?: string;
  commentsCount?: number;
  category?: string;
}

interface PromptDetailCardProps {
  data: PromptDetailData;
  isEnglish?: boolean;
  isPortrait?: boolean;
}

export default function PromptDetailCard({ data, isEnglish = false, isPortrait = false }: PromptDetailCardProps) {
  const [copied, setCopied] = useState(false);
  const locale = useLocale();
  const pathname = usePathname();

  const handleCopy = async () => {
    const success = await copyToClipboard(data.promptText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }

    const fullPath = `/${locale}${pathname}`;
    trackResourceAction(data.id, 'PROMPT', 'COPY', fullPath).catch(() => {});
  };

  if (isPortrait) {
    return (
      <div className="space-y-4">
        <div className="bg-zinc-900/40 backdrop-blur-2xl border border-zinc-700/50 rounded-xl overflow-hidden">
          <div className="flex justify-between items-center px-4 py-3 border-b border-zinc-700/30">
            <span className="text-white/80 text-sm font-semibold">
              {isEnglish ? 'Prompt' : '提示词'}
            </span>
            <button
              onClick={handleCopy}
              className="group flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-white/10 transition-all"
              title={isEnglish ? 'Copy Prompt' : '复制提示词'}
            >
              {copied ? (
                <>
                  <Check size={14} className="text-green-400" />
                  <span className="text-green-400 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    {isEnglish ? 'Copied!' : '已复制！'}
                  </span>
                </>
              ) : (
                <>
                  <Copy size={14} className="text-white/60" />
                  <span className="text-white/60 text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                    {isEnglish ? 'Copy' : '复制'}
                  </span>
                </>
              )}
            </button>
          </div>

          <div className="p-4 font-mono text-xs leading-relaxed text-white/90 whitespace-pre-wrap break-all max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-600 scrollbar-track-zinc-800">
            {data.promptText}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="apple-glass-card rounded-2xl overflow-hidden">
        <div className="flex justify-between items-center px-4 py-3 border-b border-zinc-200 bg-zinc-50/50">
          <span className="text-zinc-700 text-sm font-semibold">
            {isEnglish ? 'Prompt' : '提示词'}
          </span>
          <button
            onClick={handleCopy}
            className="group flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md shadow-blue-500/30 hover:shadow-lg hover:shadow-blue-500/40 hover:from-blue-600 hover:to-indigo-700 hover:-translate-y-0.5 active:scale-[0.95] transition-all duration-300"
            title={isEnglish ? 'Copy Prompt' : '复制提示词'}
          >
            {copied ? (
              <>
                <span className="text-sm font-semibold whitespace-nowrap">
                  {isEnglish ? 'Copied!' : '已复制！'}
                </span>
                <Check size={16} />
              </>
            ) : (
              <>
                <span className="text-sm font-semibold whitespace-nowrap">
                  {isEnglish ? 'Copy' : '复制'}
                </span>
                <Copy size={16} />
              </>
            )}
          </button>
        </div>

        <div className="p-6 font-mono text-sm leading-relaxed text-zinc-700 whitespace-pre-wrap break-all max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-zinc-300 scrollbar-track-zinc-100 bg-zinc-50">
          {data.promptText}
        </div>
      </div>

      {/* <section id="comments-section" className="mt-8">
        <h3 className="text-lg font-bold mb-6">{isEnglish ? 'All Comments' : '全部评论'} ({commentsCount})</h3>
        <div className="mb-8">
          <textarea
            className="w-full bg-gray-50 border-transparent rounded-lg p-4 text-sm focus:border-[#e52129] focus:ring-1 focus:ring-[#e52129] focus:outline-none transition-all"
            placeholder={isEnglish ? 'Leave your thoughts...' : '留下你的想法...'}
            rows={3}
          ></textarea>
          <div className="flex justify-end mt-2">
            <button className="bg-gray-900 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 hover:shadow-lg hover:shadow-gray-900/20 hover:-translate-y-0.5 active:scale-[0.95] transition-all duration-300">
              {isEnglish ? 'Post Comment' : '发表评论'}
            </button>
          </div>
        </div>
      </section> */}
    </div>
  );
}
