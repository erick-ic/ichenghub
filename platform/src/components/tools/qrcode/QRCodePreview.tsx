'use client';

import { Download, QrCode as QrCodeIcon, AlertCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { QrErrorCode, QrResult } from '@/lib/qrcode/qr-service';

interface QRCodePreviewProps {
  generatedResult: QrResult | null;
  generating: boolean;
  errorCode: QrErrorCode | null;
  onDownloadSvg: () => void;
  onDownloadPng: () => void;
}

export default function QRCodePreview({
  generatedResult,
  generating,
  errorCode,
  onDownloadSvg,
  onDownloadPng,
}: QRCodePreviewProps) {
  const t = useTranslations('QrCode');
  const hasResult = generatedResult !== null;
  const canDownload = hasResult && !generating;

  // 友好错误文案（不暴露第三方库原始异常）
  const errorText =
    errorCode === 'CONTENT_TOO_LONG' ? t('errors.contentTooLong') : null;

  return (
    <div className="flex h-full flex-col gap-4">
      {/* 二维码识别区：强制白底、不透明、无渐变、无阴影；玻璃/阴影只作用于外层 Card（由 Generator 提供） */}
      <div className="flex flex-1 min-h-[240px] items-center justify-center bg-white rounded-xl p-3">
        {generating ? (
          <Skeleton />
        ) : hasResult ? (
          // 直接消费 generatedResult.svgString（同源），不读取 draft
          <div
            className="w-full h-full flex items-center justify-center [&>svg]:w-auto [&>svg]:h-auto [&>svg]:max-w-full [&>svg]:max-h-full [&>svg]:block"
            dangerouslySetInnerHTML={{ __html: generatedResult.svgString }}
          />
        ) : (
          <EmptyState label={t('preview.empty')} />
        )}
      </div>

      {/* 错误提示：生成失败时保留旧二维码，仅展示错误 */}
      {errorText && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-[13px]">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{errorText}</span>
        </div>
      )}

      {/* 下载按钮 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="button"
          onClick={onDownloadSvg}
          disabled={!canDownload}
          className="inline-flex flex-1 items-center justify-center gap-2 px-4 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-xl text-[13px] font-medium hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          {t('actions.downloadSvg')}
        </button>
        <button
          type="button"
          onClick={onDownloadPng}
          disabled={!canDownload}
          className="inline-flex flex-1 items-center justify-center gap-2 px-4 py-2.5 bg-[#e52129] text-white rounded-xl text-[13px] font-medium hover:bg-red-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          {t('actions.downloadPng')}
        </button>
      </div>
    </div>
  );
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-3 text-gray-300">
      <QrCodeIcon className="w-12 h-12" strokeWidth={1} />
      <span className="text-[13px] text-gray-400">{label}</span>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="h-[200px] w-[200px] rounded-lg bg-gray-100 animate-pulse" />
  );
}
