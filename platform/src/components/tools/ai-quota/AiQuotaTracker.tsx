'use client';

import { useState, useEffect } from 'react';
import { Plus, Minus, Pencil, Trash2, Clock, RotateCcw, Database, LayoutGrid } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { trackResourceAction } from '@/app/actions/statsActions';
import PlatformConfigModal from './PlatformConfigModal';
import ConfirmModal from './ConfirmModal';
import ImportExportModal from './ImportExportModal';

// ===== 类型定义 =====
export interface Indicator {
  id: string;
  nameZh: string;
  nameEn: string;
  used: number;
  limit: number;
  unitZh?: string;
  unitEn?: string;
}

export interface Platform {
  id: string;
  nameZh: string;
  nameEn: string;
  indicators: Indicator[];
}

interface QuotaStore {
  platforms: Platform[];
  lastResetDate: string;
}

// ===== 常量 =====
const STORAGE_KEY = 'ichenghub_ai_quotas';
const ANALYTICS_PATH = '/aiquota';

// 首次访问示例数据：Midjourney Standard 套餐（$30/月）的官方额度，
// 三个指标分别展示正常/预警/耗尽三种进度状态
// 依据：docs.midjourney.com Comparing Midjourney Plans
const samplePlatforms: Platform[] = [
  {
    id: 'sample-midjourney',
    nameZh: 'Midjourney',
    nameEn: 'Midjourney',
    indicators: [
      // Fast GPU Time：Standard 每月 15 小时
      { id: 's1', nameZh: '快速GPU时长', nameEn: 'Fast GPU Time', used: 3.2, limit: 15, unitZh: '小时', unitEn: 'hrs' },
      // Maximum Queued Jobs：Standard 最多排队 10 个任务
      { id: 's2', nameZh: '排队任务', nameEn: 'Queued Jobs', used: 8, limit: 10, unitZh: '个', unitEn: 'jobs' },
      // Maximum Concurrent Prompts：Standard 最多 3 个并发 Fast 任务
      { id: 's3', nameZh: '并发任务', nameEn: 'Concurrent Jobs', used: 3, limit: 3, unitZh: '个', unitEn: 'jobs' },
    ],
  },
];

// YYYY-MM-DD 本地日期字符串
function getTodayStr(): string {
  return new Date().toLocaleDateString('en-CA');
}

export default function AiQuotaTracker() {
  // platforms: 平台与指标列表；lastResetDate: 上次重置日期(YYYY-MM-DD)
  const [platforms, setPlatforms] = useState<Platform[]>([]);
  const [lastResetDate, setLastResetDate] = useState<string>('');
  // mounted: 规避 SSR/CSR Hydration 不匹配，挂载前渲染骨架
  const [mounted, setMounted] = useState(false);
  // 弹窗开关与当前编辑的平台
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlatform, setEditingPlatform] = useState<Platform | null>(null);
  // 删除确认弹窗
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deletingPlatformId, setDeletingPlatformId] = useState<string>('');
  const [deletingPlatformName, setDeletingPlatformName] = useState<string>('');
  // 重置确认弹窗
  const [isResetOpen, setIsResetOpen] = useState(false);
  const [resettingPlatformId, setResettingPlatformId] = useState<string>('');
  const [resettingPlatformName, setResettingPlatformName] = useState<string>('');
  // 全局一键重置确认弹窗
  const [isResetAllOpen, setIsResetAllOpen] = useState(false);
  // 导入导出弹窗
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  // 进度条挂载动画：挂载后从 0 填充到目标值
  const [animated, setAnimated] = useState(false);
  const t = useTranslations('AiQuota');
  const locale = useLocale();

  // 根据当前语言取平台/指标名称，当前语言为空时回退到另一种语言
  const pickName = (zh: string, en: string) => {
    if (locale === 'en') return en || zh;
    return zh || en;
  };

  // 取当前语言的单位，空时回退到另一种语言
  const pickUnit = (zh?: string, en?: string) => {
    if (locale === 'en') return en || zh;
    return zh || en;
  };

  // ===== 持久化写入 =====
  const persist = (nextPlatforms: Platform[], nextResetDate: string) => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ platforms: nextPlatforms, lastResetDate: nextResetDate })
      );
    } catch {
      // localStorage 不可用或配额已满：静默降级，不阻塞交互
    }
  };

  // ===== 挂载：读取 localStorage + 跨天重置校验 =====
  useEffect(() => {
    const today = getTodayStr();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const stored = JSON.parse(raw) as Partial<QuotaStore>;
        // 兼容旧数据格式（name → nameZh/nameEn, unit → unitZh/unitEn）
        const storedPlatforms = (stored.platforms ?? samplePlatforms).map((p) => {
          const oldP = p as unknown as { name?: string; indicators: Array<{ name?: string; unit?: string } & Indicator> };
          return {
            ...p,
            nameZh: p.nameZh ?? oldP.name ?? '',
            nameEn: p.nameEn ?? oldP.name ?? '',
            indicators: p.indicators.map((ind) => {
              const oldInd = ind as unknown as { name?: string; unit?: string };
              return {
                ...ind,
                nameZh: ind.nameZh ?? oldInd.name ?? '',
                nameEn: ind.nameEn ?? oldInd.name ?? '',
                unitZh: ind.unitZh ?? oldInd.unit,
                unitEn: ind.unitEn ?? oldInd.unit,
              };
            }),
          };
        });
        const storedResetDate = stored.lastResetDate ?? '';

        if (storedResetDate !== today) {
          // 跨天：所有指标 used 归零，刷新 lastResetDate
          const resetPlatforms = storedPlatforms.map((p) => ({
            ...p,
            indicators: p.indicators.map((ind) => ({ ...ind, used: 0 })),
          }));
          setPlatforms(resetPlatforms);
          setLastResetDate(today);
          persist(resetPlatforms, today);
        } else {
          setPlatforms(storedPlatforms);
          setLastResetDate(storedResetDate);
        }
      } else {
        // 首次访问：加载示例数据，帮助用户理解工具用法
        setPlatforms(samplePlatforms);
        setLastResetDate(today);
        persist(samplePlatforms, today);
      }
    } catch {
      // 解析失败：回退到示例数据
      setPlatforms(samplePlatforms);
      setLastResetDate(today);
    } finally {
      setMounted(true);
      // 延迟一帧触发进度条从 0 填充到目标值的动画，确保 0% 状态先被绘制
      setTimeout(() => setAnimated(true), 50);
    }
  }, []);

  // ===== 快捷加减：边界防御 + 同步持久化 =====
  const handleUpdateQuota = (
    platformId: string,
    indicatorId: string,
    delta: number
  ) => {
    setPlatforms((prev) => {
      const next = prev.map((p) =>
        p.id !== platformId
          ? p
          : {
              ...p,
              indicators: p.indicators.map((ind) => {
                if (ind.id !== indicatorId) return ind;
                // 边界：used ∈ [0, limit]
                const nextUsed = Math.max(0, Math.min(ind.limit, ind.used + delta));
                return { ...ind, used: nextUsed };
              }),
            }
      );
      // 状态更新后同步持久化（lastResetDate 仅在跨天时变更，此处沿用当前值）
      persist(next, lastResetDate);
      return next;
    });
  };

  // ===== 保存平台：新增追加 / 编辑替换，统一持久化 =====
  const handleSavePlatform = (platform: Platform) => {
    const actionType = editingPlatform ? 'AI_QUOTA_EDIT_PLATFORM' : 'AI_QUOTA_ADD_PLATFORM';
    // 本地 localStorage 平台 id 不是 ToolCard.id，资源 ID 留空；工具级归属由页面 VIEW 埋点承载
    trackResourceAction(null, 'TOOL', actionType, ANALYTICS_PATH).catch(() => {});
    setPlatforms((prev) => {
      const exists = prev.some((p) => p.id === platform.id);
      const next = exists
        ? prev.map((p) => (p.id === platform.id ? platform : p))
        : [...prev, platform];
      persist(next, lastResetDate);
      return next;
    });
    setEditingPlatform(null);
  };

  // ===== 打开删除确认弹窗 =====
  const handleDeletePlatform = (platform: Platform) => {
    setDeletingPlatformId(platform.id);
    setDeletingPlatformName(pickName(platform.nameZh, platform.nameEn));
    setIsDeleteOpen(true);
  };

  // ===== 确认删除 =====
  const handleConfirmDelete = () => {
    const id = deletingPlatformId;
    trackResourceAction(null, 'TOOL', 'AI_QUOTA_DELETE_PLATFORM', ANALYTICS_PATH).catch(() => {});
    setPlatforms((prev) => {
      const next = prev.filter((p) => p.id !== id);
      persist(next, lastResetDate);
      return next;
    });
    setIsDeleteOpen(false);
    setDeletingPlatformId('');
    setDeletingPlatformName('');
  };

  // ===== 打开重置确认弹窗 =====
  const handleResetPlatform = (platform: Platform) => {
    setResettingPlatformId(platform.id);
    setResettingPlatformName(pickName(platform.nameZh, platform.nameEn));
    setIsResetOpen(true);
  };

  // ===== 确认重置：将目标平台所有指标 used 归零 =====
  const handleConfirmReset = () => {
    const id = resettingPlatformId;
    trackResourceAction(null, 'TOOL', 'AI_QUOTA_RESET_PLATFORM', ANALYTICS_PATH).catch(() => {});
    setPlatforms((prev) => {
      const next = prev.map((p) =>
        p.id !== id
          ? p
          : {
              ...p,
              indicators: p.indicators.map((ind) => ({ ...ind, used: 0 })),
            }
      );
      persist(next, lastResetDate);
      return next;
    });
    setIsResetOpen(false);
    setResettingPlatformId('');
    setResettingPlatformName('');
  };

  // ===== 打开全局一键重置确认弹窗 =====
  const handleResetAll = () => {
    setIsResetAllOpen(true);
  };

  // ===== 确认全局重置：所有平台所有指标 used 归零 =====
  const handleConfirmResetAll = () => {
    trackResourceAction(null, 'TOOL', 'AI_QUOTA_RESET_ALL', ANALYTICS_PATH).catch(() => {});
    setPlatforms((prev) => {
      const next = prev.map((p) => ({
        ...p,
        indicators: p.indicators.map((ind) => ({ ...ind, used: 0 })),
      }));
      persist(next, lastResetDate);
      return next;
    });
    setIsResetAllOpen(false);
  };

  // ===== 导入数据：替换或合并 =====
  const handleImport = (
    importedPlatforms: Platform[],
    importedResetDate: string,
    mode: 'replace' | 'merge'
  ) => {
    trackResourceAction(null, 'TOOL', 'AI_QUOTA_IMPORT', ANALYTICS_PATH).catch(() => {});
    if (mode === 'replace') {
      setPlatforms(importedPlatforms);
      persist(importedPlatforms, importedResetDate);
      return;
    }
    // 合并模式：按平台 id 合并，同 id 平台内按指标 id 合并
    setPlatforms((prev) => {
      const map = new Map<string, Platform>();
      prev.forEach((p) => map.set(p.id, p));
      importedPlatforms.forEach((imp) => {
        const existing = map.get(imp.id);
        if (!existing) {
          map.set(imp.id, imp);
        } else {
          const indMap = new Map(existing.indicators.map((i) => [i.id, i]));
          imp.indicators.forEach((ind) => indMap.set(ind.id, ind));
          map.set(imp.id, { ...existing, ...imp, indicators: Array.from(indMap.values()) });
        }
      });
      const next = Array.from(map.values());
      persist(next, lastResetDate);
      return next;
    });
  };

  // ===== 打开编辑弹窗 =====
  const handleEditPlatform = (platform: Platform) => {
    setEditingPlatform(platform);
    setIsModalOpen(true);
  };

  // ===== 打开新增弹窗 =====
  const handleOpenAdd = () => {
    setEditingPlatform(null);
    setIsModalOpen(true);
  };

  // ===== 挂载前骨架：避免 Hydration 不匹配 =====
  if (!mounted) {
    return (
      <div className="bg-[#f5f5f7] min-h-screen p-4 sm:p-12">
        <div className="h-8 w-48 bg-zinc-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6 mt-6 sm:mt-8">
          {[0, 1].map((i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-4 sm:p-6">
              <div className="h-5 w-32 bg-zinc-100 rounded animate-pulse" />
              <div className="flex flex-col gap-5 mt-6">
                <div className="h-10 bg-zinc-100 rounded animate-pulse" />
                <div className="h-10 bg-zinc-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f5f5f7] min-h-screen p-4 sm:p-12">
      {/* ===== 顶部标题区 ===== */}
      <header className="text-center mb-6 sm:mb-8">
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-900">
          {t('title')}
        </h1>
        <p className="text-base md:text-lg text-zinc-500 max-w-2xl mx-auto mt-3">
          {t('description')}
        </p>
      </header>

      {/* ===== 次级提示 + 操作按钮（移动端纵向堆叠，桌面端两端对齐） ===== */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 sm:mb-8">
        <p className="text-xs text-gray-400 flex items-center gap-1">
          <Clock className="w-3 h-3 shrink-0" />
          {t('subtitle')}
        </p>
        <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-3">
          <button
            type="button"
            onClick={() => setIsImportExportOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-2 sm:px-4 py-2 rounded-lg border border-zinc-200 bg-white text-xs sm:text-sm font-medium text-gray-700 hover:border-zinc-300 hover:text-zinc-900 transition-colors"
          >
            <Database className="w-4 h-4 shrink-0" />
            <span className="truncate">{t('dataSync')}</span>
          </button>
          <button
            type="button"
            onClick={handleResetAll}
            className="inline-flex items-center justify-center gap-1.5 px-2 sm:px-4 py-2 rounded-lg border border-zinc-200 bg-white text-xs sm:text-sm font-medium text-gray-700 hover:border-[#e52129] hover:text-[#e52129] hover:bg-red-50 transition-colors"
          >
            <RotateCcw className="w-4 h-4 shrink-0" />
            <span className="truncate">{t('resetAll')}</span>
          </button>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center justify-center gap-1.5 px-2 sm:px-4 py-2 rounded-lg border border-zinc-200 bg-white text-xs sm:text-sm font-medium text-gray-700 hover:border-zinc-300 hover:text-[#e52129] transition-colors"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="truncate">{t('addPlatform')}</span>
          </button>
        </div>
      </div>

      {/* ===== 平台卡片网格 / 空状态 ===== */}
      {platforms.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 sm:py-20 px-4">
          <div className="w-20 h-20 rounded-2xl bg-white border border-zinc-100 shadow-sm flex items-center justify-center mb-6">
            <LayoutGrid className="w-9 h-9 text-zinc-300" />
          </div>
          <h3 className="text-xl font-bold text-zinc-800 mb-2">{t('emptyTitle')}</h3>
          <p className="text-sm text-zinc-400 text-center max-w-sm mb-8">{t('emptyDesc')}</p>
          <button
            type="button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-[#e52129] text-white text-sm font-medium hover:bg-[#c81c24] transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            {t('addPlatform')}
          </button>
        </div>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
        {platforms.map((platform) => (
          <div
            key={platform.id}
            className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-4 sm:p-6 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
          >
            {/* 卡片 Header */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <h2 className="text-base sm:text-lg font-bold text-gray-900 truncate">{pickName(platform.nameZh, platform.nameEn)}</h2>
                {platform.id.startsWith('sample-') && (
                  <span className="shrink-0 text-[10px] text-zinc-500 bg-zinc-100 px-1.5 py-0.5 rounded font-medium">
                    {t('sample')}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                <button
                  type="button"
                  aria-label={t('aria.edit')}
                  onClick={() => handleEditPlatform(platform)}
                  className="w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  <Pencil className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  aria-label={t('aria.reset')}
                  onClick={() => handleResetPlatform(platform)}
                  className="w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  aria-label={t('aria.delete')}
                  onClick={() => handleDeletePlatform(platform)}
                  className="w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-[#e52129] hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 指标列表 */}
            <div className="flex flex-col gap-4 sm:gap-5 mt-5 sm:mt-6">
              {platform.indicators.map((ind) => {
                const percent = Math.min(100, (ind.used / ind.limit) * 100);
                const isExceeded = ind.used >= ind.limit;
                const isWarning = !isExceeded && percent >= 80;
                const barColor = isExceeded
                  ? 'bg-[#e52129]'
                  : isWarning
                  ? 'bg-amber-500'
                  : 'bg-zinc-800';
                const trackColor = isExceeded
                  ? 'bg-red-50'
                  : isWarning
                  ? 'bg-amber-50'
                  : 'bg-gray-100';
                const valueColor = isExceeded
                  ? 'text-[#e52129]'
                  : isWarning
                  ? 'text-amber-600'
                  : 'text-gray-900';
                return (
                  <div key={ind.id}>
                    {/* 信息行：名称 + 今日消耗/上限徽章（窄屏自动换行） */}
                    <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1 mb-2">
                      <span className="text-sm text-gray-600 truncate min-w-0 flex-1">{pickName(ind.nameZh, ind.nameEn)}</span>
                      <div className="flex flex-wrap items-center justify-end gap-1">
                        <span className={`font-mono text-sm font-medium ${valueColor}`}>
                          {ind.used}
                        </span>
                        <span className="text-[10px] text-gray-400 px-1 bg-gray-100 rounded">{t('today')}</span>
                        <span className="text-sm text-gray-400">/</span>
                        <span className="font-mono text-sm text-gray-500">{ind.limit}</span>
                        {(() => { const u = pickUnit(ind.unitZh, ind.unitEn); return u ? <span className="text-xs text-gray-400 ml-0.5">{u}</span> : null; })()}
                        <span className="text-[10px] text-gray-400 px-1 bg-gray-100 rounded">{t('limit')}</span>
                        {isWarning && (
                          <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded ml-1">
                            {t('warning')}
                          </span>
                        )}
                        {isExceeded && (
                          <span className="text-[10px] text-white bg-[#e52129] px-1.5 py-0.5 rounded ml-1 animate-pulse">
                            {t('exhausted')}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 进度条 + 操作按钮（移动端加大触控热区） */}
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className={`flex-1 rounded-full h-2 overflow-hidden ${trackColor}`}>
                        <div
                          className={`h-full rounded-full transition-[width] duration-700 ease-out ${barColor}`}
                          style={{ width: animated ? `${percent}%` : '0%' }}
                        />
                      </div>

                      <button
                        type="button"
                        aria-label={t('aria.decrease')}
                        onClick={() => handleUpdateQuota(platform.id, ind.id, -1)}
                        className="w-8 h-8 sm:w-6 sm:h-6 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:text-[#e52129] hover:bg-red-50 transition-colors"
                      >
                        <Minus className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                      </button>
                      <button
                        type="button"
                        aria-label={t('aria.increase')}
                        onClick={() => handleUpdateQuota(platform.id, ind.id, 1)}
                        className="w-8 h-8 sm:w-6 sm:h-6 flex items-center justify-center rounded-md border border-gray-200 text-gray-500 hover:text-[#e52129] hover:bg-red-50 transition-colors"
                      >
                        <Plus className="w-4 h-4 sm:w-3.5 sm:h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      )}

      {/* ===== 平台配置弹窗（新增 / 编辑双模式） ===== */}
      <PlatformConfigModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingPlatform(null);
        }}
        onSave={handleSavePlatform}
        initialData={editingPlatform ?? undefined}
      />

      {/* ===== 删除确认弹窗 ===== */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        platformName={deletingPlatformName}
        variant="delete"
        onCancel={() => {
          setIsDeleteOpen(false);
          setDeletingPlatformId('');
          setDeletingPlatformName('');
        }}
        onConfirm={handleConfirmDelete}
      />

      {/* ===== 重置确认弹窗 ===== */}
      <ConfirmModal
        isOpen={isResetOpen}
        platformName={resettingPlatformName}
        variant="reset"
        onCancel={() => {
          setIsResetOpen(false);
          setResettingPlatformId('');
          setResettingPlatformName('');
        }}
        onConfirm={handleConfirmReset}
      />

      {/* ===== 全局一键重置确认弹窗 ===== */}
      <ConfirmModal
        isOpen={isResetAllOpen}
        platformName=""
        variant="resetAll"
        onCancel={() => setIsResetAllOpen(false)}
        onConfirm={handleConfirmResetAll}
      />

      {/* ===== 导入导出弹窗 ===== */}
      {isImportExportOpen && (
        <ImportExportModal
          platforms={platforms}
          lastResetDate={lastResetDate}
          onClose={() => setIsImportExportOpen(false)}
          onImport={handleImport}
        />
      )}
    </div>
  );
}
