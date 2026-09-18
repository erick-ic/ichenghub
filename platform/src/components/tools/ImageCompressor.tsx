'use client';

import { useState, useCallback, useRef, memo, startTransition } from 'react';
import { Upload, Download, Loader2, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import imageCompression from 'browser-image-compression';
import { trackResourceAction } from '@/app/actions/statsActions';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { useEscapeKey } from '@/hooks/useEscapeKey';

interface ImageInfo {
  file: File;
  url: string;
  size: number;
}

interface ImagePreviewProps {
  url: string;
  title: string;
  size: number;
  formatFileSize: (bytes: number) => string;
  onPreview: () => void;
}

const ImagePreview = memo<ImagePreviewProps>(({ url, title, size, formatFileSize, onPreview }) => (
  <div className="aspect-video bg-gray-50 rounded-xl overflow-hidden flex items-center justify-center relative cursor-pointer group">
    <Image
      src={url}
      alt={title}
      width={400}
      height={225}
      className="max-w-full max-h-full object-contain"
      unoptimized
    />
    <button
      onClick={onPreview}
      className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100"
    >
      <ZoomIn className="w-8 h-8 text-white drop-shadow-lg" />
    </button>
  </div>
));
ImagePreview.displayName = 'ImagePreview';

/**
 * 兼容性调度器：在支持的环境下使用 requestIdleCallback，
 * 在 iOS 等不支持的环境下回退到 setTimeout
 */
const runInIdle = (callback: () => void) => {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    (window as any).requestIdleCallback(callback);
  } else {
    setTimeout(callback, 0);
  }
};

interface ImageCompressorProps {
  // 对应 ToolCard 的稳定 ID，由服务端页面按 /imgcompress 解析注入
  toolId?: string | null;
}

export default function ImageCompressor({ toolId = null }: ImageCompressorProps) {
  const t = useTranslations('ImageCompressor');
  const [isCompressing, setIsCompressing] = useState(false);
  const [originalImage, setOriginalImage] = useState<ImageInfo | null>(null);
  const [compressedImage, setCompressedImage] = useState<ImageInfo | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quality, setQuality] = useState(80);
  const [previewMode, setPreviewMode] = useState<'original' | 'compressed' | null>(null);
  useBodyScrollLock(previewMode !== null);
  useEscapeKey(previewMode !== null, () => setPreviewMode(null));
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isProcessing = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const pendingQualityRef = useRef<number | null>(null);

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const compressImage = useCallback(async (file: File, qualityValue: number, signal: AbortSignal) => {
    try {
      const options = {
        maxSizeMB: 20,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
        initialQuality: qualityValue / 100,
        signal,
      };

      const compressedFile = await imageCompression(file, options);
      
      if (signal.aborted) {
        return;
      }

      const compressedUrl = URL.createObjectURL(compressedFile);
      
      setCompressedImage(prev => {
        if (prev?.url) {
          URL.revokeObjectURL(prev.url);
        }
        return {
          file: compressedFile,
          url: compressedUrl,
          size: compressedFile.size,
        };
      });
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }
      setError(t('errorCompression'));
      console.error('Image compression failed:', err);
    }
  }, [t]);

  const startCompression = useCallback((file: File, qualityValue: number) => {
    return new Promise<void>((resolve) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const abortController = new AbortController();
      abortControllerRef.current = abortController;

      setIsCompressing(true);

      runInIdle(async () => {
        await compressImage(file, qualityValue, abortController.signal);

        if (!abortController.signal.aborted) {
          startTransition(() => {
            setIsCompressing(false);
          });
          
          if (pendingQualityRef.current !== null && pendingQualityRef.current !== qualityValue) {
            const pendingQuality = pendingQualityRef.current;
            pendingQualityRef.current = null;
            await startCompression(file, pendingQuality);
          } else {
            pendingQualityRef.current = null;
          }
        }

        abortControllerRef.current = null;
        resolve();
      });
    });
  }, [compressImage]);

  const handleFileSelect = useCallback(async (file: File) => {
    if (isProcessing.current) return;
    
    const supportedTypes = [
      'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/bmp',
      'image/heic', 'image/heif'
    ];
    
    const fileExt = file.name.toLowerCase().split('.').pop();
    const isTypeSupported = supportedTypes.includes(file.type) || ['heic', 'heif'].includes(fileExt || '');
    
    if (!isTypeSupported) {
      setError(t('errorInvalidImage'));
      return;
    }

    const MAX_FILE_SIZE = 20 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      setError(t('errorFileTooLarge'));
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    isProcessing.current = true;
    setError(null);
    setCompressedImage(prev => {
      if (prev?.url) {
        URL.revokeObjectURL(prev.url);
      }
      return null;
    });
    pendingQualityRef.current = null;

    let fileToProcess = file;
    const isHeic = file.type === 'image/heic' || file.type === 'image/heif' || fileExt === 'heic' || fileExt === 'heif';
    
    if (isHeic) {
      setIsCompressing(true);
      try {
        const heic2any = (await import('heic2any')).default;
        const convertedBlob = await heic2any({
          blob: file,
          toType: 'image/jpeg',
          quality: 0.8,
        });
        
        const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
        
        fileToProcess = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
          type: 'image/jpeg',
        });
      } catch (err) {
        console.error('HEIC Conversion failed:', err);
        setError(t('errorHeicConversionFailed'));
        setIsCompressing(false);
        isProcessing.current = false;
        return;
      }
    }

    const originalUrl = URL.createObjectURL(fileToProcess);
    setOriginalImage(prev => {
      if (prev?.url) {
        URL.revokeObjectURL(prev.url);
      }
      return {
        file: fileToProcess,
        url: originalUrl,
        size: fileToProcess.size,
      };
    });

    await startCompression(fileToProcess, quality);

    isProcessing.current = false;
  }, [t, quality, startCompression]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLDivElement>) => {
    const files = e.clipboardData?.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        e.preventDefault();
        handleFileSelect(file);
      }
    }
  }, [handleFileSelect]);

  const handleDownload = useCallback(async () => {
    if (!compressedImage) return;

    const url = compressedImage.url;
    const link = document.createElement('a');
    link.href = url;
    const originalName = originalImage?.file.name || 'compressed-image';
    const ext = originalName.split('.').pop() || 'png';
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    link.download = `${baseName}_compressed.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    await trackResourceAction(toolId, 'TOOL', 'IMAGE_COMPRESS_SUCCESS', '/imgcompress');
  }, [compressedImage, originalImage, toolId]);

  const handleReset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    setOriginalImage(prev => {
      if (prev?.url) {
        URL.revokeObjectURL(prev.url);
      }
      return null;
    });
    setCompressedImage(prev => {
      if (prev?.url) {
        URL.revokeObjectURL(prev.url);
      }
      return null;
    });
    setError(null);
    setQuality(80);
    setPreviewMode(null);
    pendingQualityRef.current = null;
  }, []);

  const handleQualityChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    if (value >= 10 && value <= 100) {
      setQuality(value);
      
      if (originalImage) {
        if (isCompressing) {
          pendingQualityRef.current = value;
        } else {
          startCompression(originalImage.file, value);
        }
      }
    }
  }, [originalImage, isCompressing, startCompression]);

  const compressionRatio = originalImage && compressedImage
    ? Math.max(0, Math.round((1 - compressedImage.size / originalImage.size) * 100))
    : 0;

  const hasCompressionGain = originalImage && compressedImage
    ? compressedImage.size < originalImage.size
    : false;

  return (
    <div className="max-w-2xl mx-auto" onPaste={handlePaste}>
      {!originalImage ? (
        <div
          className={`
            relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
            transition-all duration-300
            ${isDragging
              ? 'border-[#e52129] bg-red-50/50'
              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
            }
            ${isCompressing ? 'pointer-events-none opacity-50' : ''}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />

          <div className="flex flex-col items-center gap-4">
            <div className={`
              w-16 h-16 rounded-full flex items-center justify-center
              transition-colors duration-300
              ${isDragging ? 'bg-[#e52129]' : 'bg-gray-100'}
            `}>
              <Upload className={`w-8 h-8 ${isDragging ? 'text-white' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900 mb-1">
                {isDragging ? t('dropZoneDragging') : t('dropZone')}
              </p>
              <p className="text-sm text-gray-500">
                {t('orClick')} | {t('orPaste')}
              </p>
            </div>
            <p className="text-xs text-gray-400">
              {t('supportedFormats')}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-medium text-gray-600">{t('compressionQuality')}</span>
              <span className="text-sm font-bold text-[#e52129]">{quality}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              value={quality}
              onChange={handleQualityChange}
              disabled={isCompressing}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#e52129] disabled:cursor-not-allowed"
            />
            <div className="flex justify-between mt-2 text-xs text-gray-400">
              <span>10% ({t('lowQuality')})</span>
              <span>100% ({t('originalQuality')})</span>
            </div>
          </div>

          {isCompressing && (
            <div className="flex flex-col items-center justify-center py-16 bg-gray-50 rounded-2xl">
              <div className="relative">
                <div className="w-20 h-20 border-4 border-gray-200 rounded-full"></div>
                <div className="absolute inset-0 w-20 h-20 border-4 border-t-[#e52129] rounded-full animate-spin"></div>
                <Loader2 className="absolute inset-0 m-auto w-8 h-8 text-[#e52129] animate-pulse" />
              </div>
              <p className="mt-4 text-gray-600">{t('compressing')}</p>
              <p className="text-sm text-gray-400">{t('compressingHint')}</p>
            </div>
          )}

          {compressedImage && (
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
              <div className="grid grid-cols-1 md:grid-cols-2">
                <div className="p-6 border-b md:border-b-0 md:border-r border-gray-100 relative">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-600">{t('originalImage')}</span>
                    <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-500">
                      {formatFileSize(originalImage.size)}
                    </span>
                  </div>
                  <ImagePreview
                    url={originalImage.url}
                    title={t('originalImage')}
                    size={originalImage.size}
                    formatFileSize={formatFileSize}
                    onPreview={() => setPreviewMode('original')}
                  />
                  <p className="text-xs text-gray-400 text-center mt-2">{t('clickToPreview')}</p>
                </div>

                <div className="p-6 relative">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-medium text-gray-600">{t('compressedImage')}</span>
                    <span className="text-xs px-2 py-1 bg-red-50 rounded-full text-[#e52129]">
                      {formatFileSize(compressedImage.size)}
                    </span>
                  </div>
                  <ImagePreview
                    url={compressedImage.url}
                    title={t('compressedImage')}
                    size={compressedImage.size}
                    formatFileSize={formatFileSize}
                    onPreview={() => setPreviewMode('compressed')}
                  />
                  <p className="text-xs text-gray-400 text-center mt-2">{t('clickToPreview')}</p>
                </div>
              </div>

              <div className="px-6 py-4 bg-gradient-to-r from-red-50 to-transparent border-t border-gray-100">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      hasCompressionGain ? 'bg-[#e52129]' : 'bg-gray-200'
                    }`}>
                      <span className={`text-white font-bold text-sm ${
                        hasCompressionGain ? '' : 'text-gray-500'
                      }`}>
                        {hasCompressionGain ? `-${compressionRatio}%` : `+${Math.round((compressedImage.size / originalImage.size - 1) * 100)}%`}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{t('compressionRatio')}</p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(originalImage.size)} → {formatFileSize(compressedImage.size)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleDownload}
                    disabled={isCompressing}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-[#e52129] text-white rounded-xl font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto"
                  >
                    <Download className="w-4 h-4" />
                    {t('downloadButton')}
                  </button>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={handleReset}
            disabled={isCompressing}
            className="w-full py-3 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {t('resetButton')}
          </button>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
          {error}
        </div>
      )}

      {previewMode && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewMode(null)}
        >
          <button 
            onClick={() => setPreviewMode(null)}
            className="absolute top-4 right-4 text-white hover:text-gray-300"
          >
            <ZoomOut className="w-8 h-8" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setPreviewMode(previewMode === 'original' ? 'compressed' : 'original');
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setPreviewMode(previewMode === 'original' ? 'compressed' : 'original');
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/20 transition-colors"
          >
            <ChevronRight className="w-6 h-6" />
          </button>

          <Image
            src={(previewMode === 'original' ? originalImage?.url : compressedImage?.url) || ''}
            alt={previewMode === 'original' ? t('originalImage') : t('compressedImage')}
            width={1200}
            height={800}
            className="max-w-full max-h-full object-contain"
            unoptimized
            onClick={(e) => e.stopPropagation()}
          />

          <div className="absolute bottom-4 flex items-center gap-4">
            <span className={`px-3 py-1 rounded-full text-sm ${
              previewMode === 'original' 
                ? 'bg-white text-black' 
                : 'bg-[#e52129] text-white'
            }`}>
              {previewMode === 'original' ? t('originalImage') : t('compressedImage')}
            </span>
            <span className="text-white/70 text-sm">
              {previewMode === 'original' 
                ? formatFileSize(originalImage?.size || 0) 
                : formatFileSize(compressedImage?.size || 0)}
            </span>
          </div>

          <div className="absolute bottom-16 flex items-center gap-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPreviewMode('original');
              }}
              className={`px-4 py-2 rounded-full text-sm transition-colors ${
                previewMode === 'original'
                  ? 'bg-white text-black'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              {t('originalImage')}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setPreviewMode('compressed');
              }}
              className={`px-4 py-2 rounded-full text-sm transition-colors ${
                previewMode === 'compressed'
                  ? 'bg-[#e52129] text-white'
                  : 'bg-white/20 text-white hover:bg-white/30'
              }`}
            >
              {t('compressedImage')}
            </button>
          </div>
        </div>
      )}

      <p className="text-center text-xs text-gray-400 mt-8">
        {t('privacyNotice')}
      </p>
    </div>
  );
}
