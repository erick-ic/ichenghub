'use client';

import { useState, useRef } from 'react';
import { Download, Copy, Check, Upload, ClipboardPaste, X, FileJson } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { Platform } from './AiQuotaTracker';
import { getBeijingDayKey } from '@/lib/time';
import { normalizePlatformUrl } from './platform-url';
import { normalizePlatformColor } from './platform-colors';
import { normalizeCheckIns } from './check-ins';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useEscapeKey } from '@/hooks/useEscapeKey';

interface ExportData {
  version: number;
  exportedAt: string;
  platforms: Platform[];
  lastResetDate: string;
}

interface ImportExportModalProps {
  platforms: Platform[];
  lastResetDate: string;
  onClose: () => void;
  onImport: (platforms: Platform[], lastResetDate: string, mode: 'replace' | 'merge') => void;
}

export default function ImportExportModal({
  platforms,
  lastResetDate,
  onClose,
  onImport,
}: ImportExportModalProps) {
  useBodyScrollLock(true);
  useEscapeKey(true, onClose);
  const t = useTranslations('AiQuota');
  const [tab, setTab] = useState<'export' | 'import'>('export');
  const [copied, setCopied] = useState(false);
  const [importMode, setImportMode] = useState<'replace' | 'merge'>('replace');
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ===== 导出：构建 JSON 字符串 =====
  const exportData: ExportData = {
    version: 3,
    exportedAt: new Date().toISOString(),
    platforms,
    lastResetDate,
  };
  const exportJson = JSON.stringify(exportData, null, 2);

  // ===== 下载 JSON 文件 =====
  const handleDownload = () => {
    const blob = new Blob([exportJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-quota-${lastResetDate || getBeijingDayKey(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // ===== 复制到剪贴板 =====
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // 降级：创建临时 textarea 执行 copy 命令
      const ta = document.createElement('textarea');
      ta.value = exportJson;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // ===== 导入：文件读取 =====
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setImportText(String(reader.result ?? ''));
      setImportError('');
    };
    reader.onerror = () => setImportError(t('importFileError'));
    reader.readAsText(file);
    e.target.value = '';
  };

  // ===== 导入：粘贴剪贴板 =====
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setImportText(text);
      setImportError('');
    } catch {
      setImportError(t('importPasteError'));
    }
  };

  // ===== 导入：解析并校验 =====
  const parseImportData = (text: string): ExportData | null => {
    try {
      const data = JSON.parse(text) as Partial<ExportData>;
      if (!Array.isArray(data.platforms)) {
        throw new Error('invalid');
      }
      // 校验每个平台结构
      const validPlatforms: Platform[] = data.platforms.map((p) => {
        const oldP = p as unknown as { name?: string };
        return {
          id: String(p.id),
          pinned: p.pinned === true,
          nameZh: String(p.nameZh ?? oldP.name ?? ''),
          nameEn: String(p.nameEn ?? oldP.name ?? ''),
          url: normalizePlatformUrl(p.url),
          color: normalizePlatformColor(p.color),
          balance: p.balance && typeof p.balance === 'object' ? {
            current: Math.max(0, Number(p.balance.current) || 0),
            initial: Math.max(0, Number(p.balance.initial) || 0),
            resetDaily: p.balance.resetDaily === true,
          } : undefined,
          checkIns: normalizeCheckIns(p.checkIns, p.checkIn),
          indicators: Array.isArray(p.indicators)
            ? p.indicators.map((ind) => {
                const oldInd = ind as unknown as { name?: string; unit?: string };
                return {
                  id: String(ind.id),
                  nameZh: String(ind.nameZh ?? oldInd.name ?? ''),
                  nameEn: String(ind.nameEn ?? oldInd.name ?? ''),
                  used: Number(ind.used) || 0,
                  limit: Number(ind.limit) || 0,
                  resetDaily: ind.resetDaily !== false,
                  unitZh: ind.unitZh ? String(ind.unitZh) : oldInd.unit ? String(oldInd.unit) : undefined,
                  unitEn: ind.unitEn ? String(ind.unitEn) : oldInd.unit ? String(oldInd.unit) : undefined,
                };
              })
            : [],
        };
      });
      return {
        version: data.version ?? 1,
        exportedAt: data.exportedAt ?? new Date().toISOString(),
        platforms: validPlatforms,
        lastResetDate: data.lastResetDate ?? new Date().toLocaleDateString('en-CA'),
      };
    } catch {
      return null;
    }
  };

  // ===== 执行导入 =====
  const handleImport = () => {
    const parsed = parseImportData(importText);
    if (!parsed) {
      setImportError(t('importParseError'));
      return;
    }
    onImport(parsed.platforms, parsed.lastResetDate, importMode);
    onClose();
  };

  const parsedPreview = importText.trim() ? parseImportData(importText) : null;
  const platformCount = parsedPreview?.platforms.length ?? 0;
  const indicatorCount = parsedPreview?.platforms.reduce((s, p) => s + p.indicators.length, 0) ?? 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[85vh] flex flex-col overflow-hidden">
        {/* 头部 */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-900">{t('dataSync')}</h3>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 sm:w-8 sm:h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab 切换 */}
        <div className="flex px-4 sm:px-6 pt-4 gap-2">
          <button
            type="button"
            onClick={() => setTab('export')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'export' ? 'bg-zinc-900 text-white' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {t('exportTab')}
          </button>
          <button
            type="button"
            onClick={() => setTab('import')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === 'import' ? 'bg-zinc-900 text-white' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            {t('importTab')}
          </button>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {tab === 'export' ? (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-gray-500">{t('exportDesc')}</p>

              {/* 操作按钮 */}
              <div className="flex gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-2 sm:px-4 py-3 rounded-xl bg-[#e52129] text-white text-xs sm:text-sm font-medium hover:bg-[#c81c24] transition-colors"
                >
                  <Download className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">{t('downloadJson')}</span>
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 px-2 sm:px-4 py-3 rounded-xl border text-xs sm:text-sm font-medium transition-colors ${
                    copied
                      ? 'bg-green-50 border-green-200 text-green-600'
                      : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {copied ? <Check className="w-4 h-4 shrink-0" /> : <Copy className="w-4 h-4 shrink-0" />}
                  <span className="whitespace-nowrap">{copied ? t('copied') : t('copyJson')}</span>
                </button>
              </div>

              {/* 数据预览 */}
              <div className="rounded-xl bg-gray-50 border border-gray-100 overflow-hidden">
                <div className="px-4 py-2 text-xs text-gray-500 border-b border-gray-100 flex items-center gap-2">
                  <FileJson className="w-3.5 h-3.5" />
                  {t('exportPreview')}
                </div>
                <pre className="p-4 text-xs text-gray-600 overflow-x-auto max-h-64">
                  {exportJson}
                </pre>
              </div>
              <p className="text-xs text-gray-400">{t('exportStat', { platforms: platforms.length })}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <p className="text-sm text-gray-500">{t('importDesc')}</p>

              {/* 导入方式 */}
              <div className="flex gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-2 sm:px-4 py-3 rounded-xl border border-gray-200 bg-white text-xs sm:text-sm font-medium text-gray-700 hover:border-gray-300 transition-colors"
                >
                  <Upload className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">{t('uploadFile')}</span>
                </button>
                <button
                  type="button"
                  onClick={handlePaste}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-2 sm:px-4 py-3 rounded-xl border border-gray-200 bg-white text-xs sm:text-sm font-medium text-gray-700 hover:border-gray-300 transition-colors"
                >
                  <ClipboardPaste className="w-4 h-4 shrink-0" />
                  <span className="whitespace-nowrap">{t('pasteClipboard')}</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json,application/json"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* 文本输入区 */}
              <textarea
                value={importText}
                onChange={(e) => {
                  setImportText(e.target.value);
                  setImportError('');
                }}
                placeholder={t('importPlaceholder')}
                className="w-full h-40 px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-base sm:text-sm text-gray-700 font-mono resize-none focus:outline-none focus:border-zinc-400 focus:bg-white transition-colors"
              />

              {/* 导入模式 */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setImportMode('replace')}
                  className={`flex-1 px-4 py-3 sm:py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                    importMode === 'replace'
                      ? 'bg-zinc-900 text-white border-zinc-900'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {t('importModeReplace')}
                </button>
                <button
                  type="button"
                  onClick={() => setImportMode('merge')}
                  className={`flex-1 px-4 py-3 sm:py-2.5 rounded-lg text-sm font-medium border transition-colors ${
                    importMode === 'merge'
                      ? 'bg-zinc-900 text-white border-zinc-900'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {t('importModeMerge')}
                </button>
              </div>

              {/* 解析预览 / 错误 */}
              {importError && (
                <p className="text-sm text-[#e52129] bg-red-50 px-4 py-2 rounded-lg">{importError}</p>
              )}
              {parsedPreview && !importError && (
                <p className="text-sm text-green-600 bg-green-50 px-4 py-2 rounded-lg">
                  {t('importPreview', { platforms: platformCount, indicators: indicatorCount })}
                </p>
              )}
            </div>
          )}
        </div>

        {/* 底部：导入确认按钮（移动端纵向通栏） */}
        {tab === 'import' && (
          <div className="px-4 sm:px-6 pt-3 sm:pt-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:pb-4 border-t border-gray-100 flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 sm:py-2 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-100 transition-colors"
            >
              {t('cancel')}
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={!parsedPreview}
              className="px-6 py-3 sm:py-2 rounded-lg bg-[#e52129] text-white text-sm font-medium hover:bg-[#c81c24] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {t('confirmImport')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
