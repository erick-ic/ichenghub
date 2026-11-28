'use client';

import Image from 'next/image';
import { Copy, Check, Eye, Heart, MessageCircle } from 'lucide-react';
import { useState } from 'react';
import { useRouter, usePathname } from '@/navigation';
import { useLocale } from 'next-intl';
import { trackResourceAction } from '@/app/actions/statsActions';
import { copyToClipboard } from '@/lib/copyUtils';

export interface PromptData {
  id: string;
  platform: string;
  imageUrl: string;
  title: string;
  category: string;
  promptText: string;
  views: number;
  likes: number;
  comments: number;
}

interface PromptCardProps {
  data: PromptData;
}

export default function PromptCard({ data }: PromptCardProps) {
  const [copied, setCopied] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await copyToClipboard(data.promptText);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }

    const fullPath = `/${locale}${pathname}`;
    trackResourceAction(data.id, 'PROMPT', 'COPY', fullPath).catch(() => {});
  };

  const handleCardClick = () => {
    router.push(`/prompts/${data.id}`);
  };

  return (
    <div
      className="flex flex-col rounded-2xl apple-glass-card overflow-hidden cursor-pointer"
      onClick={handleCardClick}
    >
      <div className="relative w-full aspect-[4/3] overflow-hidden bg-gray-50">
        <Image
          src={data.imageUrl}
          alt={data.title}
          fill
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          className="hover:scale-105 transition-transform duration-500"
          style={{
            objectFit: 'cover',
            objectPosition: 'top center'
          }}
          unoptimized={data.imageUrl?.startsWith('http')}
        />
      </div>

      <div className="p-5 flex flex-col flex-grow gap-4">
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 line-clamp-2 leading-snug">{data.title}</h3>
            <span className="text-xs text-gray-500 mt-1 block">{data.category}</span>
          </div>
          <button
            onClick={handleCopy}
            className={`ml-2 p-2 rounded-full transition-colors flex-shrink-0 ${
              copied ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
            }`}
            title="一键复制提示词"
          >
            {copied ? <Check size={18} /> : <Copy size={18} />}
          </button>
        </div>

        <div className="relative bg-gray-50 rounded-xl p-3 h-28 overflow-y-auto text-sm text-gray-700 leading-relaxed border border-gray-100">
          {data.promptText}
        </div>

        <div className="flex items-center justify-between mt-2 pt-4 border-t border-gray-50 text-gray-400 text-sm">
          <div className="flex gap-4">
            <div className="flex items-center gap-1.5 hover:text-gray-900 transition-colors cursor-pointer">
              <Eye size={16} />
              <span>{data.views}</span>
            </div>
            <div className="flex items-center gap-1.5 hover:text-red-500 transition-colors cursor-pointer">
              <Heart size={16} />
              <span>{data.likes}</span>
            </div>
            <div className="flex items-center gap-1.5 hover:text-blue-500 transition-colors cursor-pointer">
              <MessageCircle size={16} />
              <span>{data.comments}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
