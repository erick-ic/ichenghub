'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, Download, RefreshCw, ChevronDown, ChevronUp, Copy, Check, X, Trash2 } from 'lucide-react';
import { createPortal } from 'react-dom';
import { copyToClipboard } from '@/lib/copyUtils';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useEscapeKey } from '@/hooks/useEscapeKey';

interface ErrorLog {
  ts: string;
  message: string;
  status: number;
  path: string;
  method: string;
  detail: string;
}

export function SystemStatusCard({
  apiSuccess,
  apiFailed,
  aiErrors,
  rawErrorCount
}: {
  apiSuccess: number;
  apiFailed: number;
  aiErrors: number;
  rawErrorCount: number;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [errorCount, setErrorCount] = useState(rawErrorCount);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [copied, setCopied] = useState(false);
  useBodyScrollLock(modalOpen);
  useEscapeKey(modalOpen, () => setModalOpen(false));

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const total = apiSuccess + apiFailed;
  const successRate = total === 0 ? 100 : Math.round((apiSuccess / total) * 10000) / 100;
  const hasErrorLogs = errorCount > 0;
  const hasHistoricalFailures = apiFailed > 0;

  async function openModal() {
    setModalOpen(true);
    await fetchErrors();
  }

  async function fetchErrors() {
    setLoading(true);
    try {
      const res = await fetch('/api/system/errors', { cache: 'no-store' });
      if (!res.ok) throw new Error(`Failed to load error logs: ${res.status}`);
      const data = await res.json();
      const nextErrors = Array.isArray(data.errors) ? data.errors : [];
      setErrors(nextErrors);
      setErrorCount(nextErrors.length);
    } catch {
      setErrors([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleClear() {
    if (!confirm('确定要清空所有错误日志吗？')) return;
    setLoading(true);
    try {
      const res = await fetch('/api/system/errors', { method: 'DELETE' });
      if (!res.ok) throw new Error(`Failed to clear error logs: ${res.status}`);
      setErrors([]);
      setErrorCount(0);
    } finally {
      setLoading(false);
    }
  }

  function handleExport() {
    window.open('/api/system/errors/export', '_blank');
  }

  function toggle(idx: number) {
    setExpanded((s) => ({ ...s, [idx]: !s[idx] }));
  }

  async function handleCopyAll() {
    const text = errors
      .map(
        (e) =>
          `[${e.ts}] ${e.method || '-'} ${e.path || '-'} ${e.status || '-'} — ${e.message}${e.detail ? '\n  ' + e.detail : ''}`
      )
      .join('\n\n');
    try {
      const success = await copyToClipboard(text);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }
    } catch {}
  }

  const modalNode = modalOpen ? (
    <div
      onClick={() => setModalOpen(false)}
      className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/55 backdrop-blur-sm animate-in fade-in duration-200 p-4"
    >
      <div
        className="relative w-full max-w-4xl max-h-[86vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="text-lg font-bold text-zinc-900">错误日志</h3>
            <span className="ml-2 px-2 py-0.5 text-xs font-semibold rounded-full bg-red-50 text-red-600">
              {errors.length}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchErrors}
              className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-600 transition-colors"
              title="刷新"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleCopyAll}
              className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-600 transition-colors"
              title="复制全部"
            >
              {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
            </button>
            <button
              onClick={handleExport}
              className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-600 transition-colors"
              title="导出 JSON"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={handleClear}
              className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-600 transition-colors"
              title="清空"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setModalOpen(false)}
              className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-zinc-50">
          {loading && errors.length === 0 ? (
            <div className="p-10 text-center text-zinc-400">加载中…</div>
          ) : errors.length === 0 ? (
            <div className="p-16 text-center text-zinc-400">
              <div className="text-5xl mb-4">✨</div>
              <div className="font-medium text-zinc-600">最近暂无错误日志明细</div>
              <div className="text-sm mt-1">状态卡仅统计当前 24 小时周期</div>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {errors.map((e, idx) => (
                <div key={idx} className="bg-white p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-zinc-400 font-mono">
                        {new Date(e.ts).toLocaleString()}
                      </span>
                      {e.method && (
                        <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 font-mono text-[10px]">
                          {e.method}
                        </span>
                      )}
                      {e.status ? (
                        <span
                          className={`px-1.5 py-0.5 rounded font-semibold text-[10px] ${
                            e.status >= 500
                              ? 'bg-red-100 text-red-700'
                              : e.status >= 400
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-zinc-100 text-zinc-600'
                          }`}
                        >
                          {e.status}
                        </span>
                      ) : null}
                    </div>
                    {e.detail && (
                      <button
                        onClick={() => toggle(idx)}
                        className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-900 transition-colors"
                      >
                        {expanded[idx] ? (
                          <>
                            收起 <ChevronUp className="w-3.5 h-3.5" />
                          </>
                        ) : (
                          <>
                            详情 <ChevronDown className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    )}
                  </div>

                  <div className="mt-2">
                    <div className="font-medium text-zinc-900 text-sm break-words">{e.message}</div>
                    {e.path && (
                      <div className="mt-1 text-xs text-zinc-500 font-mono break-all">{e.path}</div>
                    )}
                  </div>

                  {expanded[idx] && e.detail && (
                    <pre className="mt-3 text-xs leading-relaxed bg-zinc-900 text-zinc-100 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all font-mono">
                      {e.detail}
                    </pre>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t border-zinc-100 text-xs text-zinc-400 flex items-center justify-between">
          <span>自动保留最近 50 条，超出会自动清理</span>
          <span>点击 &quot;详情&quot; 查看堆栈 / 返回体原文</span>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm">API 成功率 <span className="text-zinc-400">· 近 24 小时</span></span>
          <span
            className={`text-sm font-semibold px-2 py-0.5 rounded-full ${
              successRate >= 95
                ? 'bg-green-50 text-green-600'
                : 'bg-amber-50 text-amber-600'
            }`}
          >
            {successRate}%
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">核心请求失败 <span className="text-zinc-400">· 近 24 小时</span></span>
          <span
            className={`text-sm font-semibold px-2 py-0.5 rounded-full ${
              apiFailed === 0
                ? 'bg-slate-50 text-slate-500'
                : 'bg-red-50 text-red-600'
            }`}
          >
            {apiFailed > 0 ? `${apiFailed} 次失败` : '无异常'}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm">AI 服务异常 <span className="text-zinc-400">· 近 24 小时</span></span>
          <span
            className={`text-sm font-semibold px-2 py-0.5 rounded-full ${
              aiErrors === 0
                ? 'bg-slate-50 text-slate-500'
                : 'bg-red-50 text-red-600'
            }`}
          >
            {aiErrors > 0 ? `${aiErrors} 次异常` : '无异常'}
          </span>
        </div>

        <button
          onClick={openModal}
          className={`mt-3 w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
            hasErrorLogs
              ? 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100'
              : hasHistoricalFailures
                ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-100'
              : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100 border border-zinc-100'
          }`}
        >
          <AlertTriangle
            className={`w-4 h-4 ${
              hasErrorLogs ? 'text-red-600' : hasHistoricalFailures ? 'text-amber-600' : ''
            }`}
          />
          {hasErrorLogs
            ? `查看最近错误日志 · ${errorCount} 条`
            : hasHistoricalFailures
              ? '查看最近错误日志 · 当前无明细'
              : '查看最近错误日志'}
        </button>
      </div>

      {mounted && typeof document !== 'undefined' && createPortal(modalNode, document.body)}
    </>
  );
}
