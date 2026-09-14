'use client';

import { ReactNode, useMemo, useState } from 'react';
import { Link } from '@/navigation';
import { useLocale, useTranslations } from 'next-intl';
import {
  Wrench,
  BookOpen,
  Copy,
  Inbox,
  ArrowRight,
  Star,
  ExternalLink,
  Send,
  Sparkles,
  LayoutGrid,
  ShieldCheck,
  BarChart3,
  Zap,
  Loader2,
} from 'lucide-react';
import type {
  ProfileData,
  FavoriteItem,
  SubmissionItem,
  OverviewToolItem,
  OverviewBlogItem,
  OverviewPromptItem,
} from '@/lib/profile-data';

interface ProfileConsoleProps {
  // 服务端渲染的左侧用户卡片，保持 signOut server action 在服务端
  sidebar: ReactNode;
  data: ProfileData;
}

type TabKey = 'overview' | 'favorites' | 'submissions';
type FavoriteFilter = 'ALL' | 'PROMPT' | 'BLOG';

const CARD = 'rounded-2xl border border-gray-100 bg-white shadow-sm';

function formatDate(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

// 空状态：图标 + 文案 + 引导按钮，避免大片空白
function EmptyState({
  icon,
  text,
  cta,
}: {
  icon: ReactNode;
  text: string;
  cta: { href: string; label: string; external?: boolean };
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-10 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f5f5f7] text-gray-400">
        {icon}
      </div>
      <p className="max-w-xs text-sm leading-relaxed text-gray-500">{text}</p>
      {cta.external ? (
        <a
          href={cta.href}
          className="mt-1 inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#e52129] px-4 py-2 text-sm font-medium text-[#e52129] transition-colors hover:bg-[#e52129] hover:text-white"
        >
          {cta.label}
          <ArrowRight className="h-3.5 w-3.5" />
        </a>
      ) : (
        <Link
          href={cta.href}
          className="mt-1 inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-[#e52129] px-4 py-2 text-sm font-medium text-[#e52129] transition-colors hover:bg-[#e52129] hover:text-white"
        >
          {cta.label}
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      )}
    </div>
  );
}

function MetaBadge({ children, tone = 'gray' }: { children: ReactNode; tone?: 'gray' | 'red' | 'blue' | 'amber' | 'green' }) {
  const tones: Record<string, string> = {
    gray: 'border-gray-200 text-gray-500',
    red: 'border-[#e52129]/40 text-[#e52129]',
    blue: 'border-blue-200 text-blue-600',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
    green: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  };
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-medium leading-5 ${tones[tone]}`}>
      {children}
    </span>
  );
}

function SectionHeader({ icon, title, hint }: { icon: ReactNode; title: string; hint?: string }) {
  return (
    <h2 className="flex items-center gap-2 px-4 pt-5 text-sm font-semibold text-gray-900 md:px-6">
      <span className="text-[#e52129]">{icon}</span>
      {title}
      {hint && (
        <span className="text-[11px] font-normal text-gray-400">{hint}</span>
      )}
    </h2>
  );
}

export default function ProfileConsole({ sidebar, data }: ProfileConsoleProps) {
  const t = useTranslations('Profile');
  const locale = useLocale();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [favoriteFilter, setFavoriteFilter] = useState<FavoriteFilter>('ALL');
  const [favorites, setFavorites] = useState<FavoriteItem[]>(data.favorites);
  const [favoritesCount, setFavoritesCount] = useState(data.stats.favoritesCount);
  const [removingKey, setRemovingKey] = useState<string | null>(null);

  const tabs: { key: TabKey; label: string }[] = [
    { key: 'overview', label: t('tabs.overview') },
    { key: 'favorites', label: t('tabs.favorites') },
    { key: 'submissions', label: t('tabs.submissions') },
  ];

  const filteredFavorites = useMemo(() => {
    if (favoriteFilter === 'ALL') return favorites;
    return favorites.filter((item) => item.kind === favoriteFilter);
  }, [favorites, favoriteFilter]);

  // 取消收藏：调用统一收藏接口，成功后本地移除，失败提示且不移除
  const handleRemoveFavorite = async (item: FavoriteItem) => {
    const key = `${item.kind}-${item.id}`;
    if (removingKey) return;
    setRemovingKey(key);
    try {
      const response = await fetch('/api/favorite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resourceType: item.kind, resourceId: item.id }),
      });
      const result = await response.json();
      if (response.ok && result.success && !result.requiresLogin) {
        setFavorites((prev) => prev.filter((row) => !(row.kind === item.kind && row.id === item.id)));
        setFavoritesCount((prev) => Math.max(0, prev - 1));
      } else {
        alert(result.message || t('favorites.removeFail'));
      }
    } catch (error) {
      console.error('remove favorite failed:', error);
      alert(t('favorites.removeFail'));
    } finally {
      setRemovingKey(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* 左侧：用户卡片 */}
        <aside className="self-start lg:sticky lg:top-20 lg:col-span-3">
          {sidebar}
        </aside>

        {/* 中间：Tab 内容 */}
        <section className="min-w-0 lg:col-span-6 fade-slide-up" style={{ animationDelay: '60ms' }}>
          <div className={CARD}>
            {/* Tab 导航：移动端可横向滚动，但不造成页面级横向溢出 */}
            <div
              role="tablist"
              aria-label="profile tabs"
              className="flex gap-6 overflow-x-auto border-b border-gray-200 px-4 md:px-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {tabs.map((tab) => {
                const active = tab.key === activeTab;
                return (
                  <button
                    key={tab.key}
                    role="tab"
                    aria-selected={active}
                    onClick={() => setActiveTab(tab.key)}
                    className={`relative min-h-11 shrink-0 whitespace-nowrap pb-3 pt-4 text-sm font-medium transition-colors ${
                      active ? 'text-gray-900' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    {tab.label}
                    {active && (
                      <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-[#e52129]" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab 1：个人概览 */}
            {activeTab === 'overview' && (
              <div key="overview" className="fade-slide-up divide-y divide-gray-100">
                {/* 最近使用的工具 */}
                <div>
                  <SectionHeader icon={<Wrench className="h-4 w-4" />} title={t('overview.toolsTitle')} hint={t('overview.recentHint')} />
                  {data.recentTools.length > 0 ? (
                    <ul className="px-2 py-3 md:px-4">
                      {data.recentTools.map((tool: OverviewToolItem, i: number) => (
                        <li key={tool.id} className="fade-slide-up" style={{ animationDelay: `${Math.min(i, 6) * 40}ms` }}>
                          <ToolRow tool={tool} time={formatDate(tool.lastUsedAt, locale)} />
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <EmptyState
                      icon={<Wrench className="h-5 w-5" />}
                      text={t('overview.toolsEmpty')}
                      cta={{ href: '/tools', label: t('overview.toolsCta') }}
                    />
                  )}
                </div>

                {/* 最近阅读的博客 */}
                <div>
                  <SectionHeader icon={<BookOpen className="h-4 w-4" />} title={t('overview.blogsTitle')} hint={t('overview.recentHint')} />
                  {data.recentBlogs.length > 0 ? (
                    <ul className="px-2 py-3 md:px-4">
                      {data.recentBlogs.map((blog: OverviewBlogItem, i: number) => (
                        <li key={blog.id} className="fade-slide-up" style={{ animationDelay: `${Math.min(i, 6) * 40}ms` }}>
                          <Link
                            href={`/blog/${blog.id}`}
                            className="group flex items-start justify-between gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-gray-50"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-gray-900 group-hover:text-[#e52129]">
                                {blog.title}
                              </p>
                              <p className="mt-1 text-xs text-gray-400">{blog.category}</p>
                            </div>
                            <time className="shrink-0 pt-0.5 text-xs tabular-nums text-gray-400">
                              {formatDate(blog.lastReadAt, locale)}
                            </time>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <EmptyState
                      icon={<BookOpen className="h-5 w-5" />}
                      text={t('overview.blogsEmpty')}
                      cta={{ href: '/blog', label: t('overview.blogsCta') }}
                    />
                  )}
                </div>

                {/* 最近复制的提示词 */}
                <div>
                  <SectionHeader icon={<Copy className="h-4 w-4" />} title={t('overview.promptsTitle')} hint={t('overview.recentHint')} />
                  {data.recentPrompts.length > 0 ? (
                    <ul className="px-2 py-3 md:px-4">
                      {data.recentPrompts.map((prompt: OverviewPromptItem, i: number) => (
                        <li key={prompt.id} className="fade-slide-up" style={{ animationDelay: `${Math.min(i, 6) * 40}ms` }}>
                          <Link
                            href={`/prompts/${prompt.id}`}
                            className="group flex items-start justify-between gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-gray-50"
                          >
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-gray-900 group-hover:text-[#e52129]">
                                {prompt.title}
                              </p>
                              <p className="mt-1 truncate text-xs text-gray-400">
                                {prompt.platform}
                                <span className="mx-1.5 text-gray-300">·</span>
                                {prompt.category}
                              </p>
                            </div>
                            <time className="shrink-0 pt-0.5 text-xs tabular-nums text-gray-400">
                              {formatDate(prompt.lastCopiedAt, locale)}
                            </time>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <EmptyState
                      icon={<Copy className="h-5 w-5" />}
                      text={t('overview.promptsEmpty')}
                      cta={{ href: '/prompts', label: t('overview.promptsCta') }}
                    />
                  )}
                </div>
              </div>
            )}

            {/* Tab 2：我的收藏 */}
            {activeTab === 'favorites' && (
              <div key="favorites" className="fade-slide-up">
                <div className="px-4 pt-4 md:px-6">
                  <h2 className="text-sm font-semibold text-gray-900">{t('favorites.title')}</h2>
                  <p className="mt-0.5 text-[11px] text-gray-400">{t('favorites.allDataHint')}</p>
                </div>
                <div className="flex gap-2 px-4 pb-2 pt-3 md:px-6">
                  {(
                    [
                      { key: 'ALL', label: t('favorites.filterAll') },
                      { key: 'BLOG', label: t('favorites.filterBlogs') },
                      { key: 'PROMPT', label: t('favorites.filterPrompts') },
                    ] as { key: FavoriteFilter; label: string }[]
                  ).map((chip) => {
                    const active = favoriteFilter === chip.key;
                    return (
                      <button
                        key={chip.key}
                        type="button"
                        onClick={() => setFavoriteFilter(chip.key)}
                        aria-pressed={active}
                        className={`inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3.5 py-1 text-xs font-medium transition-colors ${
                          active
                            ? 'border-[#e52129] bg-[#e52129]/5 text-[#e52129]'
                            : 'border-gray-200 text-gray-500 hover:border-[#e52129]/50 hover:text-[#e52129]'
                        }`}
                      >
                        {chip.label}
                      </button>
                    );
                  })}
                </div>

                {filteredFavorites.length > 0 ? (
                  <ul className="px-2 pb-3 pt-1 md:px-4">
                    {filteredFavorites.map((item, i: number) => {
                      const key = `${item.kind}-${item.id}`;
                      const href = item.kind === 'PROMPT' ? `/prompts/${item.id}` : `/blog/${item.id}`;
                      return (
                        <li
                          key={key}
                          className="fade-slide-up flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-gray-50"
                          style={{ animationDelay: `${Math.min(i, 6) * 40}ms` }}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <MetaBadge tone={item.kind === 'PROMPT' ? 'blue' : 'gray'}>
                                {item.kind === 'PROMPT' ? t('favorites.typePrompt') : t('favorites.typeBlog')}
                              </MetaBadge>
                              <time className="text-[11px] tabular-nums text-gray-400">
                                {formatDate(item.createdAt, locale)}
                              </time>
                            </div>
                            <p className="mt-1.5 truncate text-sm font-semibold text-gray-900">{item.title}</p>
                            <p className="mt-0.5 truncate text-xs text-gray-400">
                              {item.kind === 'PROMPT'
                                ? `${item.platform} · ${item.category}`
                                : item.category}
                            </p>
                          </div>
                          <Link
                            href={href}
                            aria-label={t('favorites.open')}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-[#e52129]/10 hover:text-[#e52129]"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                          <button
                            type="button"
                            disabled={removingKey === key}
                            onClick={() => handleRemoveFavorite(item)}
                            aria-label={t('favorites.remove')}
                            title={t('favorites.remove')}
                            className="flex h-8 min-w-8 items-center justify-center gap-1 rounded-lg px-2 text-xs text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            {removingKey === key ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Star className="h-4 w-4" fill="currentColor" />
                            )}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <EmptyState
                    icon={<Inbox className="h-5 w-5" />}
                    text={t('favorites.empty')}
                    cta={{ href: '/blog', label: t('favorites.readBlogs') }}
                  />
                )}
              </div>
            )}

            {/* Tab 3：我的提交 */}
            {activeTab === 'submissions' && (
              <div key="submissions" className="fade-slide-up">
                <div className="px-4 pt-4 md:px-6">
                  <h2 className="text-sm font-semibold text-gray-900">{t('submissions.title')}</h2>
                  <p className="mt-0.5 text-[11px] text-gray-400">{t('submissions.allDataHint')}</p>
                </div>
                {data.submissions.length > 0 ? (
                  <ul className="px-2 py-3 md:px-4">
                    {data.submissions.map((item: SubmissionItem, i: number) => {
                      const statusKey = item.status.toUpperCase();
                      const statusLabel =
                        statusKey === 'PENDING' || statusKey === 'APPROVED' || statusKey === 'REJECTED'
                          ? t(`submissions.status.${statusKey}`)
                          : item.status;
                      const statusTone =
                        statusKey === 'APPROVED' ? 'green' : statusKey === 'REJECTED' ? 'red' : 'amber';
                      return (
                        <li
                          key={`${item.kind}-${item.id}`}
                          className="fade-slide-up flex items-start justify-between gap-3 rounded-xl px-3 py-3.5 transition-colors hover:bg-gray-50"
                          style={{ animationDelay: `${Math.min(i, 6) * 40}ms` }}
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <MetaBadge tone={item.kind === 'TOOL' ? 'red' : 'gray'}>
                                {item.kind === 'TOOL' ? t('submissions.typeTool') : t('submissions.typeDemand')}
                              </MetaBadge>
                              <MetaBadge tone={statusTone}>{statusLabel}</MetaBadge>
                            </div>
                            <p className="mt-1.5 truncate text-sm font-semibold text-gray-900">{item.title}</p>
                            <time className="mt-0.5 block text-xs tabular-nums text-gray-400">
                              {formatDate(item.createdAt, locale)}
                            </time>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <EmptyState
                    icon={<Send className="h-5 w-5" />}
                    text={t('submissions.empty')}
                    cta={{ href: '/submit', label: t('submissions.cta') }}
                  />
                )}
              </div>
            )}
          </div>
        </section>

        {/* 右侧：数据概览 / 快捷入口 / 隐私说明 —— 随页面一起滚动，不 sticky */}
        <aside className="min-w-0 space-y-4 lg:col-span-3">
          <div className="fade-slide-up" style={{ animationDelay: '0ms' }}>
            <div className={`${CARD} transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}>
              <h2 className="flex items-center gap-2 px-4 pb-1 pt-4 text-sm font-semibold text-gray-900">
                <BarChart3 className="h-4 w-4 text-[#e52129]" />
                {t('stats.title')}
              </h2>
              <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-b-2xl bg-gray-100">
                {[
                  { label: t('stats.favorites'), value: favoritesCount },
                  { label: t('stats.submissions'), value: data.stats.submissionsCount },
                  { label: t('stats.recentTools'), value: data.stats.recentToolCount },
                  { label: t('stats.recentBlogs'), value: data.stats.recentBlogCount },
                ].map((stat) => (
                  <div key={stat.label} className="bg-white px-4 py-4">
                    <dd className="text-2xl font-bold tabular-nums text-gray-900">{stat.value}</dd>
                    <dt className="mt-1 text-xs text-gray-400">{stat.label}</dt>
                  </div>
                ))}
              </dl>
            </div>
          </div>

          <div className="fade-slide-up" style={{ animationDelay: '80ms' }}>
            <div className={`${CARD} transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}>
              <h2 className="flex items-center gap-2 px-4 pb-1 pt-4 text-sm font-semibold text-gray-900">
                <Zap className="h-4 w-4 text-[#e52129]" />
                {t('quickLinks.title')}
              </h2>
              <ul className="px-2 py-2">
                {[
                  { href: '/tools', label: t('quickLinks.tools'), icon: <LayoutGrid className="h-4 w-4" /> },
                  { href: '/prompts', label: t('quickLinks.prompts'), icon: <Sparkles className="h-4 w-4" /> },
                  { href: '/blog', label: t('quickLinks.blog'), icon: <BookOpen className="h-4 w-4" /> },
                  { href: '/submit', label: t('quickLinks.submit'), icon: <Send className="h-4 w-4" /> },
                ].map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="group flex min-h-10 items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-50 hover:text-[#e52129]"
                    >
                      <span className="text-gray-400 transition-colors group-hover:text-[#e52129]">{link.icon}</span>
                      <span className="flex-1">{link.label}</span>
                      <ArrowRight className="h-3.5 w-3.5 text-gray-300 transition-transform group-hover:translate-x-0.5 group-hover:text-[#e52129]" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="fade-slide-up" style={{ animationDelay: '160ms' }}>
            <div className={`${CARD} p-4 transition-all duration-300 hover:shadow-lg hover:-translate-y-1`}>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                <ShieldCheck className="h-4 w-4 text-[#e52129]" />
                {t('privacy.title')}
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-gray-400">{t('privacy.text')}</p>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

// 工具行：站内地址走 Link，外部工具新开标签页，无地址时退化为静态行
function ToolRow({ tool, time }: { tool: OverviewToolItem; time: string }) {
  const inner = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-100 bg-[#f5f5f7]">
        {tool.logoUrl ? (
          <img src={tool.logoUrl} alt="" className="h-full w-full object-cover" />
        ) : (
          <Wrench className="h-4 w-4 text-gray-400" />
        )}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-semibold text-gray-900 group-hover:text-[#e52129]">
        {tool.name}
      </span>
      <time className="shrink-0 pt-0.5 text-xs tabular-nums text-gray-400">{time}</time>
    </>
  );

  const className =
    'group flex items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-gray-50';

  if (!tool.url) {
    return <div className={className}>{inner}</div>;
  }
  if (tool.url.startsWith('http://') || tool.url.startsWith('https://')) {
    return (
      <a href={tool.url} target="_blank" rel="noopener noreferrer" className={className}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={tool.url} className={className}>
      {inner}
    </Link>
  );
}
