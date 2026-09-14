'use client';

import { ArrowRight, X } from 'lucide-react';
import { useState } from 'react';
import { useRouter, usePathname } from '@/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { ToolIcon } from '../ui/ToolIcon';
import { trackResourceAction } from '@/app/actions/statsActions';

interface ToolCardProps {
  tool: {
    id: string;
    name: string;
    nameEn: string | null;
    desc: string;
    descEn: string | null;
    logoUrl: string;
    url: string | null;
  };
  isEnglish: boolean;
}

export default function ToolCard({ tool, isEnglish }: ToolCardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();
  const [showModal, setShowModal] = useState(false);
  const t = useTranslations('HomePage');

  const title = isEnglish && tool.nameEn ? tool.nameEn : tool.name;
  const description = isEnglish && tool.descEn ? tool.descEn : tool.desc;

  const handleClick = () => {
    const fullPath = `/${locale}${pathname}`;

    if (!tool.url) {
      trackResourceAction(tool.id, 'TOOL', 'CLICK', fullPath).catch(() => {});
      setShowModal(true);
      return;
    }

    if (tool.url.startsWith('/')) {
      trackResourceAction(tool.id, 'TOOL', 'CLICK', fullPath).catch(() => {});
      router.push(tool.url);
    } else if (tool.url.startsWith('http://') || tool.url.startsWith('https://')) {
      window.open(tool.url, '_blank', 'noopener,noreferrer');
      trackResourceAction(tool.id, 'TOOL', 'CLICK', fullPath).catch(() => {});
    } else {
      trackResourceAction(tool.id, 'TOOL', 'CLICK', fullPath).catch(() => {});
      router.push('/' + tool.url);
    }
  };

  return (
    <>
      <div className="group relative">
        <div
          onClick={handleClick}
          className="flex items-center gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
        >
          <ToolIcon url={tool.url || ''} title={tool.name} iconUrl={tool.logoUrl} />

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate group-hover:text-primary transition-colors">
              {title}
            </h3>
            <p className="text-sm text-gray-500 truncate">
              {description}
            </p>
          </div>

          <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
        </div>

        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-zinc-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 shadow-xl">
          <div className="font-semibold mb-1">{title}</div>
          <div className="text-zinc-300 text-xs leading-relaxed">{description}</div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900"></div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-10 max-w-md mx-4 text-center shadow-2xl">
            <div className="text-7xl mb-6">🚧</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">
              {t('comingSoon')}
            </h3>
            <p className="text-gray-500 mb-6 leading-relaxed">
              {t('comingSoonDesc', { name: title })}
            </p>
            <button
              onClick={() => setShowModal(false)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-full font-medium hover:bg-gray-800 transition-colors"
            >
              <X size={18} />
              {t('iKnow')}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
