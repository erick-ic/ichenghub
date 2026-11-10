'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import {
  Upload,
  Download,
  Copy,
  Check,
  Loader2,
  ZoomIn,
  RotateCcw,
  RotateCw,
  FlipHorizontal2,
  FlipVertical2,
  RefreshCcw,
  ImagePlus,
  Circle,
  RectangleHorizontal,
  Hexagon,
  Squircle,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { trackResourceAction } from '@/app/actions/statsActions';

// Analytics 路径标签（仅含页面路径，不含任何用户图片数据）
const ANALYTICS_PATH = '/imgcrop';

// 移动端 OOM 防御：源图单边超过 4096px 时先离屏等比降采样
const MAX_SOURCE_EDGE = 4096;
// 导出画布单边上限，防止极端缩放比下生成超大位图
const MAX_OUTPUT_EDGE = 4096;
const MIN_CROP_SIZE = 24;
const MAX_FILE_SIZE = 20 * 1024 * 1024;

type ShapeType = 'circle' | 'rect' | 'hexagon' | 'squircle';
type AspectKey = 'free' | '1:1' | '16:9' | '4:3' | '9:16' | '3:2';
type ExportFormat = 'png' | 'webp' | 'jpeg';
type HandleId = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';

const ASPECT_VALUES: Record<AspectKey, number | null> = {
  free: null,
  '1:1': 1,
  '16:9': 16 / 9,
  '4:3': 4 / 3,
  '9:16': 9 / 16,
  '3:2': 3 / 2,
};

const ASPECT_KEYS: AspectKey[] = ['free', '1:1', '16:9', '4:3', '9:16', '3:2'];
const FORMATS: ExportFormat[] = ['png', 'webp', 'jpeg'];
const MIME_MAP: Record<ExportFormat, string> = {
  png: 'image/png',
  webp: 'image/webp',
  jpeg: 'image/jpeg',
};

interface SourceImage {
  source: CanvasImageSource;
  width: number;
  height: number;
  url: string;
}

interface CropRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface StageSize {
  w: number;
  h: number;
}

/**
 * 兼容性空闲调度器：优先 requestIdleCallback，iOS 等不支持的环境回退 setTimeout
 */
const runInIdle = (callback: () => void) => {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    (window as any).requestIdleCallback(callback);
  } else {
    setTimeout(callback, 0);
  }
};

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);

const loadImageElement = (url: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = url;
  });

/**
 * 圆角矩形路径（不依赖 ctx.roundRect，兼容旧版 WebKit）
 */
const traceRoundRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) => {
  const radius = clamp(r, 0, Math.min(w, h) / 2);
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
};

/**
 * 以 (cx, cy) 为中心、w × h 为外接框的几何形状路径
 */
const appendShapePath = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  w: number,
  h: number,
  shape: ShapeType,
  cornerRadiusPx: number,
) => {
  switch (shape) {
    case 'circle':
      ctx.ellipse(cx, cy, w / 2, h / 2, 0, 0, Math.PI * 2);
      break;
    case 'rect':
      traceRoundRect(ctx, cx - w / 2, cy - h / 2, w, h, cornerRadiusPx);
      break;
    case 'hexagon': {
      // 平顶正六边形：顶点位于 0° / 60° ... 300°
      const r = w / 2;
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 180) * 60 * i;
        const px = cx + r * Math.cos(angle);
        const py = cy + r * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      break;
    }
    case 'squircle': {
      // 超椭圆 |x/a|^n + |y/b|^n = 1（n=5 接近 iOS 图标曲率），参数采样 72 点
      const n = 5;
      const a = w / 2;
      const b = h / 2;
      const power = 2 / n;
      const steps = 72;
      for (let i = 0; i <= steps; i++) {
        const t = (i / steps) * Math.PI * 2;
        const cos = Math.cos(t);
        const sin = Math.sin(t);
        const px = cx + a * Math.sign(cos) * Math.pow(Math.abs(cos), power);
        const py = cy + b * Math.sign(sin) * Math.pow(Math.abs(sin), power);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      break;
    }
  }
};

const SHAPE_ICONS: Record<ShapeType, typeof Circle> = {
  circle: Circle,
  rect: RectangleHorizontal,
  hexagon: Hexagon,
  squircle: Squircle,
};

const SHAPE_KEYS: ShapeType[] = ['circle', 'rect', 'hexagon', 'squircle'];
const CORNER_HANDLES: HandleId[] = ['nw', 'ne', 'sw', 'se'];
const EDGE_HANDLES: HandleId[] = ['n', 's', 'e', 'w'];

interface ImageCropperProps {
  // 对应 ToolCard 的稳定 ID，由服务端页面按 /imgcrop 解析注入；可能为 null
  toolId?: string | null;
}

export default function ImageCropper({ toolId = null }: ImageCropperProps) {
  const t = useTranslations('ImageCropper');

  // ===== 图像与视图状态 =====
  const [img, setImg] = useState<SourceImage | null>(null);
  const [stage, setStage] = useState<StageSize>({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // 0 / 90 / 180 / 270
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [crop, setCrop] = useState<CropRect>({ x: 0, y: 0, w: 0, h: 0 });

  // ===== 形状与导出状态 =====
  const [shape, setShape] = useState<ShapeType>('circle');
  const [aspect, setAspect] = useState<AspectKey>('free');
  const [radiusPct, setRadiusPct] = useState(12);
  const [format, setFormat] = useState<ExportFormat>('png');

  // ===== 交互与反馈状态 =====
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rafRef = useRef<number | null>(null);
  const copyingRef = useRef(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cropInitForRef = useRef<string | null>(null);
  const dragRef = useRef<{
    mode: HandleId | 'move' | 'pan';
    startX: number;
    startY: number;
    startCrop: CropRect;
    startOffset: { x: number; y: number };
    ratio: number | null;
  } | null>(null);

  // 最新可变状态快照，供原生事件回调（wheel / paste）读取，避免闭包过期
  const stateRef = useRef({ zoom, offset, crop, stage });
  stateRef.current = { zoom, offset, crop, stage };

  // ===== 派生量 =====
  // 图像适配舞台的基准缩放（旋转 90°/270° 时按交换后的包围盒计算）
  const baseScale = useMemo(() => {
    if (!img || stage.w <= 0 || stage.h <= 0) return 1;
    const rotated = rotation % 180 !== 0;
    const fw = rotated ? img.height : img.width;
    const fh = rotated ? img.width : img.height;
    return Math.min(stage.w / fw, stage.h / fh);
  }, [img, stage, rotation]);

  const totalScale = baseScale * zoom;

  const currentRatio = useMemo((): number | null => {
    if (shape !== 'rect') return 1;
    return ASPECT_VALUES[aspect];
  }, [shape, aspect]);

  // 选框对应的真实输出像素尺寸（含 4096 上限收敛）
  const outputSize = useMemo(() => {
    if (!img || crop.w <= 0 || totalScale <= 0) return { w: 0, h: 0 };
    let outW = crop.w / totalScale;
    let outH = crop.h / totalScale;
    const maxEdge = Math.max(outW, outH);
    if (maxEdge > MAX_OUTPUT_EDGE) {
      const f = MAX_OUTPUT_EDGE / maxEdge;
      outW *= f;
      outH *= f;
    }
    return { w: Math.max(1, Math.round(outW)), h: Math.max(1, Math.round(outH)) };
  }, [img, crop, totalScale]);

  // ===== 默认选框 =====
  const buildDefaultCrop = useCallback(
    (shapeType: ShapeType, aspectKey: AspectKey, stageSize: StageSize): CropRect => {
      const ratio = shapeType === 'rect' ? ASPECT_VALUES[aspectKey] : 1;
      let w: number;
      let h: number;
      if (ratio) {
        h = Math.min(stageSize.h * 0.7, (stageSize.w * 0.7) / ratio);
        w = h * ratio;
      } else {
        w = stageSize.w * 0.7;
        h = stageSize.h * 0.6;
      }
      return {
        x: (stageSize.w - w) / 2,
        y: (stageSize.h - h) / 2,
        w,
        h,
      };
    },
    [],
  );

  // ===== 渲染：形状外区域按形状路径挖空 =====
  const renderInto = useCallback(
    (
      ctx: CanvasRenderingContext2D,
      outW: number,
      outH: number,
      opts: { fillWhite: boolean },
    ) => {
      if (!img || stage.w <= 0) return;
      const ratio = outW / crop.w;
      const rotRad = (rotation * Math.PI) / 180;
      const k = totalScale * ratio;
      const radiusPx = (radiusPct / 100) * (Math.min(outW, outH) / 2);

      if (opts.fillWhite) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, outW, outH);
      }

      ctx.save();
      ctx.beginPath();
      appendShapePath(ctx, outW / 2, outH / 2, outW, outH, shape, radiusPx);
      ctx.clip();
      // 将「舞台中心 + 平移」的图像坐标系映射到输出画布（原点对齐选框左上角）
      ctx.translate(
        (stage.w / 2 + offset.x - crop.x) * ratio,
        (stage.h / 2 + offset.y - crop.y) * ratio,
      );
      ctx.rotate(rotRad);
      ctx.scale(flipH ? -k : k, flipV ? -k : k);
      ctx.drawImage(img.source, -img.width / 2, -img.height / 2);
      ctx.restore();
    },
    [img, stage, crop, offset, rotation, flipH, flipV, shape, radiusPct, totalScale],
  );

  const drawMain = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !img || stage.w <= 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const targetW = Math.max(1, Math.round(stage.w * dpr));
    const targetH = Math.max(1, Math.round(stage.h * dpr));
    if (canvas.width !== targetW || canvas.height !== targetH) {
      canvas.width = targetW;
      canvas.height = targetH;
    }

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, stage.w, stage.h);

    // 1. 图像层（CSS 像素坐标系下的硬件加速合成）
    ctx.save();
    ctx.translate(stage.w / 2 + offset.x, stage.h / 2 + offset.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -totalScale : totalScale, flipV ? -totalScale : totalScale);
    ctx.drawImage(img.source, -img.width / 2, -img.height / 2);
    ctx.restore();

    // 2. 选区遮罩层：evenodd 填充让形状区域镂空，其余区域暗化
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, stage.w, stage.h);
    const radiusPx = (radiusPct / 100) * (Math.min(crop.w, crop.h) / 2);
    appendShapePath(ctx, crop.x + crop.w / 2, crop.y + crop.h / 2, crop.w, crop.h, shape, radiusPx);
    ctx.fillStyle = 'rgba(17, 24, 39, 0.45)';
    ctx.fill('evenodd');
    ctx.restore();
  }, [img, stage, offset, rotation, flipH, flipV, totalScale, crop, shape, radiusPct]);

  const drawPreview = useCallback(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas || !img || outputSize.w <= 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const fitScale = 224 / Math.max(outputSize.w, outputSize.h);
    const pw = Math.max(1, Math.round(outputSize.w * fitScale));
    const ph = Math.max(1, Math.round(outputSize.h * fitScale));

    canvas.width = Math.round(pw * dpr);
    canvas.height = Math.round(ph * dpr);
    canvas.style.width = `${pw}px`;
    canvas.style.height = `${ph}px`;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, pw, ph);
    renderInto(ctx, pw, ph, { fillWhite: false });
  }, [img, outputSize, renderInto]);

  // 所有可见状态变化经 rAF 合并为一帧重绘，交互期绝不触发 toBlob/toDataURL
  useEffect(() => {
    if (!img) return;
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      drawMain();
      drawPreview();
    });
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  });

  // ===== 舞台尺寸测量（舞台仅在图像加载后挂载）=====
  useEffect(() => {
    if (!img) return;
    const el = stageRef.current;
    if (!el) return;
    const measure = () => setStage({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [img]);

  // 图像载入且舞台就绪后初始化默认选框（每张图仅一次）
  useEffect(() => {
    if (!img || stage.w <= 0) return;
    if (cropInitForRef.current === img.url) return;
    cropInitForRef.current = img.url;
    setCrop(buildDefaultCrop(shape, aspect, stage));
  }, [img, stage, shape, aspect, buildDefaultCrop]);

  // 舞台尺寸变化时保持选框在边界内
  useEffect(() => {
    if (!img || stage.w <= 0) return;
    setCrop(prev => {
      const w = Math.min(prev.w, stage.w);
      const h = Math.min(prev.h, stage.h);
      return {
        w,
        h,
        x: clamp(prev.x, 0, stage.w - w),
        y: clamp(prev.y, 0, stage.h - h),
      };
    });
  }, [stage, img]);

  // ===== 卸载与切换时的内存回收 =====
  useEffect(
    () => () => {
      if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
    },
    [],
  );

  const revokeImg = useCallback((target: SourceImage | null) => {
    if (target?.url) URL.revokeObjectURL(target.url);
  }, []);

  // ===== 文件接入：白名单校验 + HEIC 转码 + 4096 降采样 =====
  const handleFileSelect = useCallback(
    async (file: File) => {
      setError(null);
      const fileExt = file.name.toLowerCase().split('.').pop() || '';

      // 显式拦截 GIF 动图
      if (file.type === 'image/gif' || fileExt === 'gif') {
        setError(t('errorGif'));
        return;
      }

      const supportedTypes = [
        'image/jpeg',
        'image/jpg',
        'image/png',
        'image/webp',
        'image/heic',
        'image/heif',
      ];
      const isHeic =
        file.type === 'image/heic' ||
        file.type === 'image/heif' ||
        fileExt === 'heic' ||
        fileExt === 'heif';
      if (!supportedTypes.includes(file.type) && !isHeic) {
        setError(t('errorInvalidImage'));
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setError(t('errorFileTooLarge'));
        return;
      }

      setIsProcessing(true);
      let fileToProcess = file;

      if (isHeic) {
        try {
          const heic2any = (await import('heic2any')).default;
          const convertedBlob = await heic2any({
            blob: file,
            toType: 'image/jpeg',
            quality: 0.9,
          });
          const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
          fileToProcess = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
            type: 'image/jpeg',
          });
        } catch (err) {
          console.error('HEIC conversion failed:', err);
          setError(t('errorHeicConversionFailed'));
          setIsProcessing(false);
          return;
        }
      }

      const url = URL.createObjectURL(fileToProcess);
      try {
        const el = await loadImageElement(url);
        let source: CanvasImageSource = el;
        let width = el.naturalWidth;
        let height = el.naturalHeight;

        // 移动端 OOM 防御：离屏等比预降采样
        if (Math.max(width, height) > MAX_SOURCE_EDGE) {
          const f = MAX_SOURCE_EDGE / Math.max(width, height);
          const off = document.createElement('canvas');
          off.width = Math.round(width * f);
          off.height = Math.round(height * f);
          const offCtx = off.getContext('2d');
          if (offCtx) {
            offCtx.drawImage(el, 0, 0, off.width, off.height);
            source = off;
            width = off.width;
            height = off.height;
          }
        }

        setImg(prev => {
          revokeImg(prev);
          return { source, width, height, url };
        });
        // 视口状态复位
        setZoom(1);
        setRotation(0);
        setFlipH(false);
        setFlipV(false);
        setOffset({ x: 0, y: 0 });
        cropInitForRef.current = null;
      } catch (err) {
        console.error('Image decode failed:', err);
        URL.revokeObjectURL(url);
        setError(t('errorInvalidImage'));
      } finally {
        setIsProcessing(false);
      }
    },
    [t, revokeImg],
  );

  const handleFileSelectRef = useRef(handleFileSelect);
  handleFileSelectRef.current = handleFileSelect;

  // 全局粘贴：Ctrl+V / Cmd+V 截图直接进入工作台
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of Array.from(items)) {
        if (item.kind === 'file' && item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            e.preventDefault();
            handleFileSelectRef.current(file);
          }
          break;
        }
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, []);

  // ===== 拖拽上传 =====
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDraggingFile(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDraggingFile(false);
      const files = e.dataTransfer.files;
      if (files && files.length > 0) handleFileSelect(files[0]);
    },
    [handleFileSelect],
  );

  // ===== 选框 / 图像指针交互 =====
  const handleStagePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!img || stage.w <= 0) return;
      const target = e.target as HTMLElement;
      const handle = target.dataset.handle as HandleId | undefined;
      const mode: HandleId | 'move' | 'pan' = handle
        ? handle
        : target.dataset.zone === 'crop'
          ? 'move'
          : 'pan';

      stageRef.current?.setPointerCapture(e.pointerId);
      dragRef.current = {
        mode,
        startX: e.clientX,
        startY: e.clientY,
        startCrop: { ...crop },
        startOffset: { ...offset },
        ratio: handle && CORNER_HANDLES.includes(handle) ? currentRatio : null,
      };
    },
    [img, stage, crop, offset, currentRatio],
  );

  const handleStagePointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = e.clientX - drag.startX;
    const dy = e.clientY - drag.startY;
    const { w: sw, h: sh } = stateRef.current.stage;
    const start = drag.startCrop;

    if (drag.mode === 'pan') {
      setOffset({ x: drag.startOffset.x + dx, y: drag.startOffset.y + dy });
      return;
    }

    if (drag.mode === 'move') {
      setCrop({
        ...start,
        x: clamp(start.x + dx, 0, sw - start.w),
        y: clamp(start.y + dy, 0, sh - start.h),
      });
      return;
    }

    // 角点等比缩放（正圆/六边形/超椭圆与固定比例矩形）
    if (drag.ratio) {
      const R = drag.ratio;
      const anchorX = drag.mode.includes('w') ? start.x + start.w : start.x;
      const anchorY = drag.mode.includes('n') ? start.y + start.h : start.y;
      const movingX = drag.mode.includes('w') ? start.x + dx : start.x + start.w + dx;
      const maxW = drag.mode.includes('w') ? anchorX : sw - anchorX;
      const maxH = drag.mode.includes('n') ? anchorY : sh - anchorY;
      let newW = Math.abs(movingX - anchorX);
      newW = clamp(newW, MIN_CROP_SIZE, Math.min(maxW, maxH * R));
      const newH = newW / R;
      setCrop({
        x: drag.mode.includes('w') ? anchorX - newW : anchorX,
        y: drag.mode.includes('n') ? anchorY - newH : anchorY,
        w: newW,
        h: newH,
      });
      return;
    }

    // 自由比例矩形：八向独立调整
    let { x, y, w, h } = start;
    if (drag.mode.includes('e')) w = clamp(start.w + dx, MIN_CROP_SIZE, sw - start.x);
    if (drag.mode.includes('s')) h = clamp(start.h + dy, MIN_CROP_SIZE, sh - start.y);
    if (drag.mode.includes('w')) {
      const anchor = start.x + start.w;
      w = clamp(start.w - dx, MIN_CROP_SIZE, anchor);
      x = anchor - w;
    }
    if (drag.mode.includes('n')) {
      const anchor = start.y + start.h;
      h = clamp(start.h - dy, MIN_CROP_SIZE, anchor);
      y = anchor - h;
    }
    setCrop({ x, y, w, h });
  }, []);

  const handleStagePointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return;
    dragRef.current = null;
    if (stageRef.current?.hasPointerCapture(e.pointerId)) {
      stageRef.current.releasePointerCapture(e.pointerId);
    }
    // 松手后进入空闲调度，交互线程零合成负担
    runInIdle(() => {});
  }, []);

  // 滚轮缩放：以指针位置为锚点，原生非 passive 监听以阻止页面滚动
  useEffect(() => {
    const el = stageRef.current;
    if (!el || !img) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const { zoom: z, offset: off, stage: st } = stateRef.current;
      const next = clamp(z * (e.deltaY < 0 ? 1.1 : 1 / 1.1), 0.5, 3);
      if (next === z) return;
      const rect = el.getBoundingClientRect();
      const px = e.clientX - rect.left - st.w / 2;
      const py = e.clientY - rect.top - st.h / 2;
      const k = next / z;
      setOffset({ x: px - (px - off.x) * k, y: py - (py - off.y) * k });
      setZoom(next);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [img]);

  // ===== 微调工具栏动作 =====
  const handleRotate = useCallback((dir: 1 | -1) => {
    setRotation(prev => (prev + dir * 90 + 360) % 360);
  }, []);

  const handleReset = useCallback(() => {
    setZoom(1);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setOffset({ x: 0, y: 0 });
    if (stage.w > 0) setCrop(buildDefaultCrop(shape, aspect, stage));
  }, [stage, shape, aspect, buildDefaultCrop]);

  const handleShapeChange = useCallback(
    (next: ShapeType) => {
      setShape(next);
      setCrop(prev => {
        if (stage.w <= 0 || prev.w <= 0) return prev;
        const ratio = next === 'rect' ? ASPECT_VALUES[aspect] : 1;
        if (!ratio) return prev;
        const cx = prev.x + prev.w / 2;
        const cy = prev.y + prev.h / 2;
        let w = Math.min(prev.w, stage.w * 0.9);
        let h = w / ratio;
        if (h > stage.h * 0.9) {
          h = stage.h * 0.9;
          w = h * ratio;
        }
        return {
          w,
          h,
          x: clamp(cx - w / 2, 0, stage.w - w),
          y: clamp(cy - h / 2, 0, stage.h - h),
        };
      });
    },
    [aspect, stage],
  );

  const handleAspectChange = useCallback(
    (next: AspectKey) => {
      setAspect(next);
      const ratio = ASPECT_VALUES[next];
      if (!ratio || stage.w <= 0) return;
      setCrop(prev => {
        const cx = prev.x + prev.w / 2;
        const cy = prev.y + prev.h / 2;
        let w = Math.min(prev.w, stage.w * 0.9);
        let h = w / ratio;
        if (h > stage.h * 0.9) {
          h = stage.h * 0.9;
          w = h * ratio;
        }
        return {
          w,
          h,
          x: clamp(cx - w / 2, 0, stage.w - w),
          y: clamp(cy - h / 2, 0, stage.h - h),
        };
      });
    },
    [stage],
  );

  const handleChangeImage = useCallback(() => {
    setImg(prev => {
      revokeImg(prev);
      return null;
    });
    setError(null);
    setCopied(false);
    cropInitForRef.current = null;
    fileInputRef.current?.click();
  }, [revokeImg]);

  // ===== 导出合成（仅导出/复制动作触发，绝不进入交互热路径）=====
  const exportBlob = useCallback(
    (fmt: ExportFormat): Promise<Blob | null> => {
      const canvas = document.createElement('canvas');
      canvas.width = outputSize.w;
      canvas.height = outputSize.h;
      const ctx = canvas.getContext('2d');
      if (!ctx) return Promise.resolve(null);
      // JPEG 无 Alpha 通道：先铺纯白底，防止透明区域发黑
      renderInto(ctx, outputSize.w, outputSize.h, { fillWhite: fmt === 'jpeg' });
      return new Promise(resolve =>
        canvas.toBlob(blob => resolve(blob), MIME_MAP[fmt], fmt === 'png' ? undefined : 0.92),
      );
    },
    [outputSize, renderInto],
  );

  const handleDownload = useCallback(() => {
    if (!img || isExporting) return;
    setIsExporting(true);
    runInIdle(async () => {
      try {
        const blob = await exportBlob(format);
        if (!blob) {
          setError(t('errorExport'));
          return;
        }
        const ext = format === 'jpeg' ? 'jpg' : format;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ichenghub-crop-${Date.now()}.${ext}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        trackResourceAction(toolId, 'TOOL', 'IMAGE_CROP_SUCCESS', ANALYTICS_PATH).catch(() => {});
      } catch (err) {
        console.error('Export failed:', err);
        setError(t('errorExport'));
      } finally {
        setIsExporting(false);
      }
    });
  }, [img, isExporting, exportBlob, format, t, toolId]);

  // iOS Safari 穿透：Blob Promise 必须在点击事件中同步构造并立即交给 ClipboardItem
  const handleCopy = useCallback(() => {
    if (!img || copyingRef.current) return;
    if (
      typeof navigator === 'undefined' ||
      !navigator.clipboard ||
      typeof ClipboardItem === 'undefined'
    ) {
      setError(t('errorCopyNotSupported'));
      return;
    }
    copyingRef.current = true; // 防连击幂等锁
    try {
      const blobPromise = exportBlob('png').then(blob => {
        if (!blob) throw new Error('export failed');
        return blob;
      });
      navigator.clipboard
        .write([new ClipboardItem({ 'image/png': blobPromise })])
        .then(() => {
          setCopied(true);
          if (copiedTimerRef.current) clearTimeout(copiedTimerRef.current);
          copiedTimerRef.current = setTimeout(() => setCopied(false), 2000);
          trackResourceAction(toolId, 'TOOL', 'IMAGE_CROP_SUCCESS', ANALYTICS_PATH).catch(() => {});
        })
        .catch(err => {
          console.error('Clipboard write failed:', err);
          setError(t('errorCopy'));
        })
        .finally(() => {
          copyingRef.current = false;
        });
    } catch (err) {
      copyingRef.current = false;
      console.error('Clipboard write failed:', err);
      setError(t('errorCopy'));
    }
  }, [img, exportBlob, t, toolId]);

  const freeRectMode = shape === 'rect' && aspect === 'free';
  const activeHandles = freeRectMode ? [...CORNER_HANDLES, ...EDGE_HANDLES] : CORNER_HANDLES;

  // 锚点定位样式（32px 触控热区）
  const handleStyle = (id: HandleId): React.CSSProperties => {
    const { x, y, w, h } = crop;
    const pos: Record<HandleId, { left: number; top: number }> = {
      nw: { left: x, top: y },
      ne: { left: x + w, top: y },
      sw: { left: x, top: y + h },
      se: { left: x + w, top: y + h },
      n: { left: x + w / 2, top: y },
      s: { left: x + w / 2, top: y + h },
      e: { left: x + w, top: y + h / 2 },
      w: { left: x, top: y + h / 2 },
    };
    return {
      left: pos[id].left,
      top: pos[id].top,
      transform: 'translate(-50%, -50%)',
      touchAction: 'none',
    };
  };

  const handleCursor: Record<HandleId, string> = {
    nw: 'nwse-resize',
    se: 'nwse-resize',
    ne: 'nesw-resize',
    sw: 'nesw-resize',
    n: 'ns-resize',
    s: 'ns-resize',
    e: 'ew-resize',
    w: 'ew-resize',
  };

  const adjustButtons = [
    {
      key: 'rotateLeft',
      icon: RotateCcw,
      active: false,
      onClick: () => handleRotate(-1),
    },
    {
      key: 'rotateRight',
      icon: RotateCw,
      active: false,
      onClick: () => handleRotate(1),
    },
    {
      key: 'flipHorizontal',
      icon: FlipHorizontal2,
      active: flipH,
      onClick: () => setFlipH(prev => !prev),
    },
    {
      key: 'flipVertical',
      icon: FlipVertical2,
      active: flipV,
      onClick: () => setFlipV(prev => !prev),
    },
    { key: 'resetButton', icon: RefreshCcw, active: false, onClick: handleReset },
    { key: 'changeImage', icon: ImagePlus, active: false, onClick: handleChangeImage },
  ] as const;

  return (
    <>
      {error && (
        <div className="mb-3 p-3 bg-red-50 border border-red-100 rounded-xl text-red-600 text-sm">
          {error}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp,image/heic,image/heif,.heic,.heif"
        onChange={e => {
          const files = e.target.files;
          if (files && files.length > 0) handleFileSelect(files[0]);
          e.target.value = '';
        }}
        className="hidden"
      />

      {!img ? (
        <div className="bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
        <div className="max-w-2xl mx-auto">
        <div
          className={`
            relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer
            transition-all duration-300
            ${isDraggingFile ? 'border-[#e52129] bg-red-50/50' : 'border-gray-200 hover:border-gray-300'}
            ${isProcessing ? 'pointer-events-none opacity-60' : ''}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="flex flex-col items-center gap-4">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors duration-300 ${
                isDraggingFile ? 'bg-[#e52129]' : 'bg-gray-100'
              }`}
            >
              {isProcessing ? (
                <Loader2 className="w-8 h-8 text-[#e52129] animate-spin" />
              ) : (
                <Upload className={`w-8 h-8 ${isDraggingFile ? 'text-white' : 'text-gray-400'}`} />
              )}
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900 mb-1">
                {isProcessing
                  ? t('converting')
                  : isDraggingFile
                    ? t('dropZoneDragging')
                    : t('dropZone')}
              </p>
              <p className="text-sm text-gray-500">
                {t('orClick')} | {t('orPaste')}
              </p>
            </div>
            <p className="text-xs text-gray-400">{t('supportedFormats')}</p>
          </div>
        </div>
        </div>
        <p className="mt-8 text-center text-xs text-gray-400">{t('privacyNotice')}</p>
        </div>
      ) : (
        <>
        <div className="bg-[#f5f5f7] rounded-2xl p-3 sm:p-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
          {/* ===== 左栏：独立工具面板（形状列表 + 矩形参数）===== */}
          <aside className="lg:col-span-2 flex flex-col gap-3 min-w-0">
            {/* 形状选择：纵向列表，后续新增形状直接追加即可 */}
            <div className="bg-white rounded-xl p-2.5">
              <p className="px-1.5 pb-2 text-sm font-medium text-gray-500">{t('shapeLabel')}</p>
              <div className="grid grid-cols-2 lg:grid-cols-1 gap-1">
                {SHAPE_KEYS.map(key => {
                  const Icon = SHAPE_ICONS[key];
                  const active = shape === key;
                  return (
                    <button
                      key={key}
                      onClick={() => handleShapeChange(key)}
                      className={`flex items-center gap-2 px-2.5 min-h-[36px] rounded-lg text-[13px] transition-colors ${
                        active
                          ? 'bg-[#e52129] text-white font-medium shadow-sm'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{t(`shape_${key}`)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 矩形参数：比例胶囊 + 圆角半径（仅矩形模式展示）*/}
            {shape === 'rect' && (
              <div className="bg-white rounded-xl p-2.5 space-y-3">
                <div>
                  <p className="px-1.5 pb-1.5 text-sm font-medium text-gray-500">
                    {t('aspectLabel')}
                  </p>
                  <div className="flex flex-wrap gap-1 px-1.5">
                    {ASPECT_KEYS.map(key => {
                      const active = aspect === key;
                      return (
                        <button
                          key={key}
                          onClick={() => handleAspectChange(key)}
                          className={`px-2 min-h-[28px] rounded-full text-[13px] font-medium transition-colors ${
                            active
                              ? 'bg-[#e52129] text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          {key === 'free' ? t('aspectFree') : key}
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between px-1.5 pb-1.5">
                    <p className="text-sm font-medium text-gray-500">{t('cornerRadius')}</p>
                    <span className="text-xs font-medium text-[#e52129] tabular-nums">
                      {radiusPct}%
                    </span>
                  </div>
                  <div className="px-1.5">
                    <input
                      type="range"
                      min={0}
                      max={50}
                      step={1}
                      value={radiusPct}
                      onChange={e => setRadiusPct(clamp(parseInt(e.target.value, 10), 0, 50))}
                      className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#e52129]"
                      aria-label={t('cornerRadius')}
                    />
                  </div>
                </div>
              </div>
            )}
          </aside>

          {/* ===== 中栏：纯净画布（无任何遮挡层）===== */}
          <div className="lg:col-span-7 min-w-0 lg:flex lg:flex-col">
            <div
              ref={stageRef}
              className="relative w-full h-[380px] sm:h-[460px] lg:h-auto lg:flex-1 lg:min-h-[clamp(300px,calc(100vh-310px),620px)] bg-white rounded-xl overflow-hidden select-none touch-none shadow-sm"
              onPointerDown={handleStagePointerDown}
              onPointerMove={handleStagePointerMove}
              onPointerUp={handleStagePointerUp}
              onPointerCancel={handleStagePointerUp}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

              {/* 选框覆盖层：DOM + CSS 硬件加速，零 Canvas 合成开销 */}
              {crop.w > 0 && (
                <div
                  data-zone="crop"
                  className="absolute border-2 border-[#e52129] cursor-move"
                  style={{
                    left: crop.x,
                    top: crop.y,
                    width: crop.w,
                    height: crop.h,
                    touchAction: 'none',
                  }}
                />
              )}

              {crop.w > 0 &&
                activeHandles.map(id => (
                  <div
                    key={id}
                    data-handle={id}
                    className="absolute w-8 h-8 flex items-center justify-center"
                    style={{ ...handleStyle(id), cursor: handleCursor[id] }}
                  >
                    <div className="w-3.5 h-3.5 bg-white border-2 border-[#e52129] rounded-full shadow-sm pointer-events-none" />
                  </div>
                ))}

              {isProcessing && (
                <div className="absolute inset-0 bg-white/70 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 text-[#e52129] animate-spin" />
                  <p className="text-sm text-gray-600">{t('converting')}</p>
                </div>
              )}
            </div>

            {/* 主图区底部：单行透明工具条（文档流内，零遮挡）*/}
            <div className="mt-2 shrink-0 flex flex-wrap items-center gap-x-3 gap-y-1.5 px-1">
              <div className="flex items-center gap-2 flex-1 min-w-[140px] sm:flex-none">
                <ZoomIn className="w-4 h-4 text-gray-400 shrink-0" />
                <input
                  type="range"
                  min={0.5}
                  max={3}
                  step={0.01}
                  value={zoom}
                  onChange={e => setZoom(clamp(parseFloat(e.target.value), 0.5, 3))}
                  className="w-full sm:w-28 h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#e52129]"
                  aria-label={t('zoomLabel')}
                />
                <span className="text-xs font-medium text-gray-500 w-9 text-right tabular-nums">
                  {zoom.toFixed(2)}x
                </span>
              </div>

              <div className="flex items-center gap-0.5">
                {adjustButtons.map(({ key, icon: Icon, active, onClick }) => (
                  <button
                    key={key}
                    onClick={onClick}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition-colors ${
                      active
                        ? 'bg-red-50 text-[#e52129]'
                        : 'text-gray-500 hover:bg-white hover:text-[#e52129]'
                    }`}
                    title={t(key)}
                    aria-label={t(key)}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ===== 右栏：透明预览 + 导出 ===== */}
          <aside className="lg:col-span-3 flex flex-col gap-3 min-w-0">
            {/* 透明通道实时预览（纯 CSS 棋盘格，输出尺寸角标悬浮）*/}
            <div className="bg-white rounded-xl p-3 flex-1 flex flex-col min-h-0">
              <p className="text-sm font-medium text-gray-500 mb-2">{t('previewLabel')}</p>
              <div
                className="relative flex-1 min-h-[140px] rounded-lg overflow-hidden flex items-center justify-center p-3"
                style={{
                  backgroundColor: '#f9fafb',
                  backgroundImage:
                    'linear-gradient(45deg, #d8dce1 25%, transparent 25%), linear-gradient(-45deg, #d8dce1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #d8dce1 75%), linear-gradient(-45deg, transparent 75%, #d8dce1 75%)',
                  backgroundSize: '16px 16px',
                  backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
                }}
              >
                <canvas ref={previewCanvasRef} />
                <span className="absolute top-2 right-2 px-2 py-0.5 bg-white/85 backdrop-blur-sm rounded-md text-xs text-gray-500 tabular-nums shadow-sm">
                  {outputSize.w} × {outputSize.h} px
                </span>
              </div>
            </div>

            {/* 导出操作区 */}
            <div className="bg-white rounded-xl p-3 space-y-2.5">
              <div className="grid grid-cols-3 gap-1 p-1 bg-gray-100 rounded-lg">
                {FORMATS.map(fmt => (
                  <button
                    key={fmt}
                    onClick={() => setFormat(fmt)}
                    className={`min-h-[32px] rounded-md text-[13px] font-medium uppercase tracking-wide transition-colors ${
                      format === fmt
                        ? 'bg-[#e52129] text-white shadow-sm'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {fmt === 'jpeg' ? 'JPG' : fmt}
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleDownload}
                  disabled={isExporting || isProcessing}
                  className="min-h-[40px] inline-flex items-center justify-center gap-1.5 bg-[#e52129] text-white rounded-xl text-[13px] font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4" />
                  )}
                  {isExporting ? t('exporting') : t('downloadButton')}
                </button>

                <button
                  onClick={handleCopy}
                  disabled={isProcessing}
                  className={`min-h-[40px] inline-flex items-center justify-center gap-1.5 rounded-xl text-[13px] font-medium border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    copied
                      ? 'border-[#e52129] bg-red-50 text-[#e52129]'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? t('copiedFeedback') : t('copyButton')}
                </button>
              </div>
            </div>
          </aside>
        </div>
        </div>
        <p className="mt-8 text-center text-xs text-gray-400">{t('privacyNotice')}</p>
        </>
      )}
    </>
  );
}
