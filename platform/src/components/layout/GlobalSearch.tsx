'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, X, ExternalLink } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';
import { ToolIcon } from '../ui/ToolIcon';

export interface SearchItem {
  id: string;
  title: string;
  titleEn: string | null;
  description: string;
  descriptionEn: string | null;
  url: string;
  iconUrl?: string;
  category: string;
  categoryEn?: string | null;
  type: 'tool' | 'link' | 'prompt' | 'blog';
}

const TYPE_META: Record<SearchItem['type'], { color: string; colorDark: string; cn: string; en: string; initial: string; }> = {
  tool: { color: 'text-blue-600', colorDark: 'bg-blue-50', cn: '工具', en: 'Tools', initial: '🛠' },
  link: { color: 'text-green-600', colorDark: 'bg-green-50', cn: '链接', en: 'Links', initial: '🔗' },
  prompt: { color: 'text-purple-600', colorDark: 'bg-purple-50', cn: '提示词', en: 'Prompts', initial: '💡' },
  blog: { color: 'text-[#e52129]', colorDark: 'bg-red-50', cn: '技术博客', en: 'Blogs', initial: '📝' },
};

interface GlobalSearchProps {
  items: SearchItem[];
  isEnglish: boolean;
}

export function GlobalSearch({ items, isEnglish }: GlobalSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const locale = isEnglish ? 'en' : 'zh';

  const debouncedSearch = useDebouncedCallback((searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    const q = searchQuery.toLowerCase();
    const filteredResults = items
      .filter((item) => {
        const title = isEnglish ? (item.titleEn || item.title) : item.title;
        const desc = isEnglish ? (item.descriptionEn || item.description) : item.description;
        const cat = isEnglish ? (item.categoryEn || item.category) : item.category;
        return (
          title.toLowerCase().includes(q) ||
          (desc || '').toLowerCase().includes(q) ||
          cat.toLowerCase().includes(q)
        );
      })
      .slice(0, 10);

    setResults(filteredResults);
  }, 300);

  const resolveUrl = (item: SearchItem) => {
    const isExternal = item.url.startsWith('http://') || item.url.startsWith('https://');
    if (isExternal) return item.url;
    if (item.type === 'blog' || item.type === 'prompt') {
      return `/${locale}${item.url.startsWith('/') ? item.url : '/' + item.url}`;
    }
    return item.url;
  };

  const handleResultClick = (item: SearchItem) => {
    const url = resolveUrl(item);
    const isExternal = url.startsWith('http://') || url.startsWith('https://');

    if (isExternal) {
      window.open(url, '_blank');
    } else {
      window.location.href = url;
    }

    setIsOpen(false);
    setQuery('');
    setResults([]);
  };

  // 监听输入变化
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    setIsOpen(true);
    debouncedSearch(value);
  }, [debouncedSearch]);

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
          }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 打开时聚焦输入框
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // 清空搜索
  const handleClear = () => {
    setQuery('');
    setResults([]);
    inputRef.current?.focus();
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (results.length > 0) {
        handleResultClick(results[0]);
      }
    }
  };

  // 按类型分组结果
  const groupedResults = results.reduce((acc, item) => {
    if (!acc[item.type]) {
      acc[item.type] = [];
    }
    acc[item.type].push(item);
    return acc;
  }, {} as Record<string, SearchItem[]>);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 移动端：搜索框 + 结果列表 */}
      <div className="md:hidden">
        {/* 搜索框 */}
        <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-zinc-100/80 border border-zinc-200/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.03)] focus-within:bg-white focus-within:border-zinc-400 focus-within:ring-2 focus-within:ring-zinc-900/5 transition-all">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={isEnglish ? 'Search tools, guides, blogs...' : '搜索工具、指南、博客...'}
            className="flex-1 bg-transparent text-sm text-zinc-900 outline-none placeholder:text-zinc-400"
          />
          {query && (
            <button onClick={handleClear} className="text-zinc-400 hover:text-zinc-600 p-0.5 rounded-full hover:bg-zinc-200/60 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 移动端搜索结果列表 */}
        {query && (
          <div className="mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden max-h-64 overflow-y-auto">
            {results.length > 0 ? (
              <div>
                {results.slice(0, 8).map((item) => {
                  const title = isEnglish ? (item.titleEn || item.title) : item.title;
                  const description = isEnglish ? (item.descriptionEn || item.description) : item.description;
                  
                  return (
                      <button
                        key={item.id}
                        onClick={() => handleResultClick(item)}
                        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                      >
                        <ToolIcon url={item.url} title={title} iconUrl={item.iconUrl} />
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-gray-900 truncate block">
                            {title}
                          </span>
                          <p className="text-sm text-gray-500 truncate mt-0.5">
                            {description}
                          </p>
                        </div>
                        <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      </button>
                    );
                  })}
              </div>
            ) : (
              <div className="py-6 px-4 text-center">
                <p className="text-sm text-gray-500">
                  {isEnglish ? 'No results found' : '未找到相关结果'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  {isEnglish ? 'Try a different keyword' : '请尝试其他关键词'}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 桌面端：完整搜索框 */}
      <div className="hidden md:block">
        {/* 搜索框 */}
        <div
          className={`
            flex items-center gap-3 px-4 py-2.5 rounded-full cursor-pointer
            transition-all duration-200 w-64 md:w-72
            ${isOpen ? 'bg-white shadow-lg ring-2 ring-primary/20' : 'bg-[#f5f5f7] hover:bg-gray-200'}
          `}
          onClick={() => setIsOpen(!isOpen)}
        >
          <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={isEnglish ? 'Search...' : '搜索...'}
            className="bg-transparent text-sm outline-none flex-1 placeholder:text-gray-400"
            onClick={(e) => e.stopPropagation()}
          />
          {query && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 下拉搜索结果 - 仅桌面端显示 */}
        {isOpen && (
          <div className={`
            absolute top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50
            w-80
          `}>
            {/* 搜索结果列表 */}
            {results.length > 0 ? (
              <div className="max-h-80 overflow-y-auto">
                {/* 按类型分组显示 */}
                {Object.entries(groupedResults).map(([type, items]) => (
                  <div key={type} className="border-b border-gray-50 last:border-b-0">
                    <div className="px-4 py-2 bg-gray-50/50">
                      <span className={`text-xs font-medium ${TYPE_META[type as SearchItem['type']].color}`}>
                        {isEnglish
                          ? TYPE_META[type as SearchItem['type']].en
                          : TYPE_META[type as SearchItem['type']].cn
                        } ({items.length})
                      </span>
                    </div>

                    {items.map((item) => {
                      const title = isEnglish ? (item.titleEn || item.title) : item.title;
                      const description = isEnglish ? (item.descriptionEn || item.description) : item.description;

                      return (
                        <button
                          key={item.id}
                          onClick={() => handleResultClick(item)}
                          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left"
                        >
                          {(item.type === 'blog' || item.type === 'prompt') ? (
                            <span className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm font-semibold ${TYPE_META[item.type].colorDark}`}>
                              {TYPE_META[item.type].initial}
                            </span>
                          ) : (
                            <ToolIcon url={item.url} title={title} iconUrl={item.iconUrl} />
                          )}
                          
                          {/* 文字内容 */}
                          <div className="flex-1 min-w-0">
                            <span className="font-medium text-gray-900 truncate block">
                              {title}
                            </span>
                            <p className="text-sm text-gray-500 truncate mt-0.5">
                              {description}
                            </p>
                          </div>
                          
                          {/* 外部链接图标 */}
                          <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            ) : (
              /* 无结果提示 */
              <div className="py-8 px-4">
                {query ? (
                  <div className="text-center">
                    <p className="text-sm text-gray-500">
                      {isEnglish ? 'No results found' : '未找到相关结果'}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {isEnglish ? 'Try a different keyword' : '请尝试其他关键词'}
                    </p>
                  </div>
                ) : (
                  <div className="text-center">
                    <p className="text-sm text-gray-500">
                      {isEnglish ? 'Search tools and links' : '搜索工具和链接'}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}