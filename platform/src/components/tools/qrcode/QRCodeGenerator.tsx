'use client';

import { useState, useCallback, useRef } from 'react';
import QRCodeInput from './QRCodeInput';
import QRCodePreview from './QRCodePreview';
import {
  generateQr,
  downloadSvg,
  downloadPng,
  QrError,
  type QrMode,
  type QrResult,
  type QrErrorCode,
} from '@/lib/qrcode/qr-service';
import { trackResourceAction } from '@/app/actions/statsActions';

// Analytics 路径标签（仅含页面路径，不含任何 payload）
const ANALYTICS_PATH = '/qrcode';

interface QRCodeGeneratorProps {
  // 对应 ToolCard 的稳定 ID，由服务端页面按 url 解析后注入；可能为 null（未配置时跳过个性化关联）
  toolId?: string | null;
}

export default function QRCodeGenerator({ toolId = null }: QRCodeGeneratorProps) {
  // ===== 核心状态模型 =====
  // draft：textarea 当前正在编辑的原始内容
  const [draft, setDraft] = useState<string>('');
  // generatedSnapshot：最后一次成功 Generate 时锁定的原始内容
  const [generatedSnapshot, setGeneratedSnapshot] = useState<string | null>(null);
  // generatedResult：与 generatedSnapshot 对应的 QR 输出（svgString）
  const [generatedResult, setGeneratedResult] = useState<QrResult | null>(null);
  const [mode, setMode] = useState<QrMode>('text');
  const [generating, setGenerating] = useState<boolean>(false);
  const [errorCode, setErrorCode] = useState<QrErrorCode | null>(null);

  // 防止生成动作并发重入
  const generatingRef = useRef(false);

  const handleModeChange = useCallback(
    (next: QrMode) => {
      setMode((prev) => {
        if (prev !== next) {
          trackResourceAction(
            toolId,
            'TOOL',
            next === 'text' ? 'QR_MODE_TEXT' : 'QR_MODE_URL',
            ANALYTICS_PATH
          ).catch(() => {});
        }
        return next;
      });
    },
    [toolId]
  );

  const handleDraftChange = useCallback((value: string) => {
    setDraft(value);
    // 编辑过程中清除上次错误展示（不影响已生成的二维码）
    setErrorCode(null);
  }, []);

  const handleGenerate = useCallback(() => {
    // Step 1：校验 —— 仅判断空字符串 / 全空格；payload 仍使用原始 draft
    if (draft.trim() === '' || generatingRef.current) return;

    generatingRef.current = true;
    setGenerating(true);
    setErrorCode(null);

    // 让 loading 态先绘制，再执行同步生成
    const run = () => {
      try {
        // Step 2：生成 —— 原始 draft 直接交给 QR Engine，禁止 trim / encode / 协议补全
        const result = generateQr(draft);
        // Step 3：成功 —— 仅此时更新 snapshot / result
        setGeneratedSnapshot(draft);
        setGeneratedResult(result);
        trackResourceAction(toolId, 'TOOL', 'QR_GENERATE_SUCCESS', ANALYTICS_PATH).catch(() => {});
      } catch (err) {
        // Step 4：失败 —— 不覆盖旧 snapshot / 不删除旧 result
        setErrorCode(err instanceof QrError ? err.code : 'CONTENT_TOO_LONG');
        trackResourceAction(toolId, 'TOOL', 'QR_GENERATE_FAILURE', ANALYTICS_PATH).catch(() => {});
      } finally {
        setGenerating(false);
        generatingRef.current = false;
      }
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      (window as unknown as {
        requestIdleCallback: (cb: () => void) => void;
      }).requestIdleCallback(() => run());
    } else {
      setTimeout(run, 0);
    }
  }, [draft, toolId]);

  // Download 数据源：仅读取 generatedResult（同源于 generatedSnapshot），禁止读取 draft
  const handleDownloadSvg = useCallback(() => {
    if (!generatedResult) return;
    downloadSvg(generatedResult.svgString);
    trackResourceAction(toolId, 'TOOL', 'QR_DOWNLOAD_SVG', ANALYTICS_PATH).catch(() => {});
  }, [generatedResult, toolId]);

  const handleDownloadPng = useCallback(async () => {
    if (!generatedResult) return;
    try {
      await downloadPng(generatedResult.svgString);
      trackResourceAction(toolId, 'TOOL', 'QR_DOWNLOAD_PNG', ANALYTICS_PATH).catch(() => {});
    } catch {
      // 导出失败不向用户暴露底层错误，静默处理
    }
  }, [generatedResult, toolId]);

  // generatedSnapshot 与 generatedResult 一一对应，形成「锁定快照」
  // 任何修改 draft 都不会影响已生成的结果，直至再次点击 Generate
  void generatedSnapshot;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-8">
      {/* Desktop: Input 60% / Preview 40%；Mobile/Tablet: 单列 */}
      <div className="lg:col-span-3">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm h-full">
          <QRCodeInput
            mode={mode}
            draft={draft}
            generating={generating}
            onModeChange={handleModeChange}
            onDraftChange={handleDraftChange}
            onGenerate={handleGenerate}
          />
        </div>
      </div>
      <div className="lg:col-span-2">
        {/* 外层 Card 允许轻玻璃；二维码识别区在 Preview 内部为纯白不透明 */}
        <div className="rounded-2xl border border-gray-100 bg-white/70 backdrop-blur-sm shadow-sm p-6 h-full">
          <QRCodePreview
            generatedResult={generatedResult}
            generating={generating}
            errorCode={errorCode}
            onDownloadSvg={handleDownloadSvg}
            onDownloadPng={handleDownloadPng}
          />
        </div>
      </div>
    </div>
  );
}
