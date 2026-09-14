'use client';

import { ArrowRight } from 'lucide-react';
import { ToolIcon } from '@/components/ui/ToolIcon';
import { usePathname } from '@/navigation';
import { useLocale } from 'next-intl';
import { trackResourceAction } from '@/app/actions/statsActions';

interface ExternalTool {
  id: string;
  title: string;
  titleEn: string | null;
  description: string;
  descriptionEn: string | null;
  url: string;
  iconUrl?: string;
}

interface ToolCardProps {
  tool: ExternalTool;
  isEnglish: boolean;
}

export function ToolCard({ tool, isEnglish }: ToolCardProps) {
  const title = isEnglish && tool.titleEn ? tool.titleEn : tool.title;
  const description = isEnglish && tool.descriptionEn ? tool.descriptionEn : tool.description;
  const pathname = usePathname();
  const locale = useLocale();

  const handleClick = () => {
    let fullPath = pathname;
    if (!fullPath.startsWith('/' + locale)) {
      fullPath = '/' + locale + fullPath;
    }
    trackResourceAction(tool.id, 'LINK', 'CLICK', fullPath).catch(() => {});
  };

  return (
    <div className="group relative">
      <a
        href={tool.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className="flex items-center gap-4 p-4 bg-white rounded-xl border border-zinc-200/50 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
      >
        <ToolIcon url={tool.url} title={title} iconUrl={tool.iconUrl} />

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-zinc-900 truncate group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">
            {description}
          </p>
        </div>

        <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
      </a>

      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-zinc-900 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-50 shadow-xl">
        <div className="font-semibold mb-1">{title}</div>
        <div className="text-zinc-300 text-xs leading-relaxed">{description}</div>
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900"></div>
      </div>
    </div>
  );
}
