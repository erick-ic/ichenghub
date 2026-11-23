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
  Triangle,
  Diamond,
  Star,
  Octagon,
  PenTool,
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

type ShapeType =
  | 'circle'
  | 'rect'
  | 'hexagon'
  | 'squircle'
  | 'triangle'
  | 'diamond'
  | 'star'
  | 'octagon'
  | 'custom';
type AspectKey = 'free' | '1:1' | '16:9' | '4:3' | '9:16' | '3:2';
type ExportFormat = 'png' | 'webp' | 'jpeg';
type HandleId = 'nw' | 'ne' | 'sw' | 'se' | 'n' | 's' | 'e' | 'w';
interface ShapePoint {
  x: number;
  y: number;
}

const ASPECT_VALUES: Record<AspectKey, number | null> = {
  free: null,
  '1:1': 1,
  '16:9': 16 / 9,
  '4:3': 4 / 3,
  '9:16': 9 / 16,
  '3:2': 3 / 2,
};

const ASPECT_KEYS: AspectKey[] = ['free', '1:1', '16:9', '4:3', '9:16', '3:2'];
// 平顶正六边形 / 正三角形外接矩形宽高比均为 2 : √3，选框按此比例才能贴合四边
const ROOT3_RATIO = 2 / Math.sqrt(3);
// 正五角星外接矩形宽高比：宽 2cos18°，高 1+sin54°
const STAR_RATIO = (2 * Math.cos(Math.PI / 10)) / (1 + Math.sin((3 * Math.PI) / 10));

const getShapeRatio = (
  shapeType: ShapeType,
  aspectKey: AspectKey,
  customAspect = 1,
): number | null => {
  if (shapeType === 'rect') return ASPECT_VALUES[aspectKey];
  if (shapeType === 'hexagon' || shapeType === 'triangle') return ROOT3_RATIO;
  if (shapeType === 'star') return STAR_RATIO;
  if (shapeType === 'custom') return customAspect;
  return 1;
};

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

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// 判断多边形边线是否自相交（含非相邻边端点重合），用于禁止生成交叉形状
const hasSelfIntersection = (pts: readonly ShapePoint[]): boolean => {
  const n = pts.length;
  if (n < 4) return false;
  const eps = 1e-6;
  const orient = (a: ShapePoint, b: ShapePoint, c: ShapePoint) =>
    (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  const onSegment = (a: ShapePoint, b: ShapePoint, p: ShapePoint) =>
    Math.min(a.x, b.x) - eps <= p.x &&
    p.x <= Math.max(a.x, b.x) + eps &&
    Math.min(a.y, b.y) - eps <= p.y &&
    p.y <= Math.max(a.y, b.y) + eps;
  const segmentsIntersect = (a: ShapePoint, b: ShapePoint, c: ShapePoint, d: ShapePoint) => {
    const d1 = orient(a, b, c);
    const d2 = orient(a, b, d);
    const d3 = orient(c, d, a);
    const d4 = orient(c, d, b);
    // 严格相交
    if (
      ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) &&
      ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))
    ) {
      return true;
    }
    // 共线重叠或端点落在另一条边上
    if (Math.abs(d1) <= eps && onSegment(a, b, c)) return true;
    if (Math.abs(d2) <= eps && onSegment(a, b, d)) return true;
    if (Math.abs(d3) <= eps && onSegment(c, d, a)) return true;
    if (Math.abs(d4) <= eps && onSegment(c, d, b)) return true;
    return false;
  };
  for (let i = 0; i < n; i++) {
    const a = pts[i];
    const b = pts[(i + 1) % n];
    // 跳过相邻边（共享顶点）
    for (let j = i + 2; j < n; j++) {
      if (i === 0 && j === n - 1) continue;
      const c = pts[j];
      const d = pts[(j + 1) % n];
      if (segmentsIntersect(a, b, c, d)) return true;
    }
  }
  return false;
};

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
  customPoints?: readonly ShapePoint[],
) => {
  switch (shape) {
    case 'circle':
      ctx.ellipse(cx, cy, w / 2, h / 2, 0, 0, Math.PI * 2);
      break;
    case 'rect':
      traceRoundRect(ctx, cx - w / 2, cy - h / 2, w, h, cornerRadiusPx);
      break;
    case 'hexagon': {
      // 平顶正六边形：左右顶点贴边，上下平边贴边（h = √3/2 · w 时即为正六边形）
      const rx = w / 2;
      const ry = h / 2;
      const pts: [number, number][] = [
        [cx + rx, cy],
        [cx + rx / 2, cy + ry],
        [cx - rx / 2, cy + ry],
        [cx - rx, cy],
        [cx - rx / 2, cy - ry],
        [cx + rx / 2, cy - ry],
      ];
      for (let i = 0; i < pts.length; i++) {
        const [px, py] = pts[i];
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      break;
    }
    case 'triangle': {
      // 正三角形：顶点居中朝上，底边贴下沿
      ctx.moveTo(cx, cy - h / 2);
      ctx.lineTo(cx + w / 2, cy + h / 2);
      ctx.lineTo(cx - w / 2, cy + h / 2);
      ctx.closePath();
      break;
    }
    case 'diamond': {
      // 菱形：四顶点贴四边中点
      ctx.moveTo(cx, cy - h / 2);
      ctx.lineTo(cx + w / 2, cy);
      ctx.lineTo(cx, cy + h / 2);
      ctx.lineTo(cx - w / 2, cy);
      ctx.closePath();
      break;
    }
    case 'star': {
      // 正五角星：内接半径比 (3-√5)/2，按外接矩形归一化后贴合四边
      const inner = (3 - Math.sqrt(5)) / 2;
      const raw: [number, number][] = [];
      for (let i = 0; i < 5; i++) {
        const outerAngle = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
        raw.push([Math.cos(outerAngle), Math.sin(outerAngle)]);
        const innerAngle = outerAngle + Math.PI / 5;
        raw.push([inner * Math.cos(innerAngle), inner * Math.sin(innerAngle)]);
      }
      const xs = raw.map(([px]) => px);
      const ys = raw.map(([, py]) => py);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);
      const sx = w / (maxX - minX);
      const sy = h / (maxY - minY);
      const mx = (minX + maxX) / 2;
      const my = (minY + maxY) / 2;
      raw.forEach(([px, py], i) => {
        const x = cx + (px - mx) * sx;
        const y = cy + (py - my) * sy;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.closePath();
      break;
    }
    case 'octagon': {
      // 正八边形：四角按 (2-√2)/(2(1+√2)) 切角，比例吻合时为等边正八边形
      const cutX = w * 0.29289;
      const cutY = h * 0.29289;
      const x0 = cx - w / 2;
      const x1 = cx + w / 2;
      const y0 = cy - h / 2;
      const y1 = cy + h / 2;
      ctx.moveTo(x0 + cutX, y0);
      ctx.lineTo(x1 - cutX, y0);
      ctx.lineTo(x1, y0 + cutY);
      ctx.lineTo(x1, y1 - cutY);
      ctx.lineTo(x1 - cutX, y1);
      ctx.lineTo(x0 + cutX, y1);
      ctx.lineTo(x0, y1 - cutY);
      ctx.lineTo(x0, y0 + cutY);
      ctx.closePath();
      break;
    }
    case 'custom': {
      // 自定义多边形：点集已按外接框归一化到 0~1，直接映射到选框
      const pts = customPoints ?? [];
      if (pts.length < 3) {
        traceRoundRect(ctx, cx - w / 2, cy - h / 2, w, h, cornerRadiusPx);
        break;
      }
      const x0 = cx - w / 2;
      const y0 = cy - h / 2;
      pts.forEach((p, i) => {
        const px = x0 + p.x * w;
        const py = y0 + p.y * h;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      });
      ctx.closePath();
      break;
    }
    case 'squircle': {
      // 标准超椭圆（Lamé curve）|x/a|^n + |y/b|^n = 1，n=4 为常用的 squircle 圆润度，采样 72 点
      const n = 4;
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
  triangle: Triangle,
  diamond: Diamond,
  star: Star,
  octagon: Octagon,
  custom: PenTool,
};

const SHAPE_KEYS: ShapeType[] = [
  'circle',
  'rect',
  'squircle',
  'triangle',
  'diamond',
  'star',
  'hexagon',
  'octagon',
  'custom',
];

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
  const [previewArea, setPreviewArea] = useState<StageSize>({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0); // 0 / 90 / 180 / 270
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [crop, setCrop] = useState<CropRect>({ x: 0, y: 0, w: 0, h: 0 });

  // ===== 形状与导出状态 =====
  const [shape, setShape] = useState<ShapeType>('circle');
  const [aspect, setAspect] = useState<AspectKey>('free');
  const [radiusPct, setRadiusPct] = useState(0);
  const [format, setFormat] = useState<ExportFormat>('png');
  // 各格式实际编码后的文件体积（字节），null 表示计算中/未就绪
  const [formatSizes, setFormatSizes] = useState<Partial<Record<ExportFormat, number>> | null>(null);
  // ===== 自定义多边形 =====
  // 已确认的多边形顶点，归一化到自身外接框（0~1）
  const [customPoints, setCustomPoints] = useState<ShapePoint[]>([]);
  // 多边形外接框宽高比，用于选框等比缩放
  const [customAspect, setCustomAspect] = useState(1);
  const [isDrawingCustom, setIsDrawingCustom] = useState(false);
  // 绘制中的顶点（舞台坐标，px）
  const [draftPoints, setDraftPoints] = useState<ShapePoint[]>([]);

  // ===== 交互与反馈状态 =====
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stageRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);
  const previewAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const rafRef = useRef<number | null>(null);
  const copyingRef = useRef(false);
  const copiedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cropInitForRef = useRef<string | null>(null);
  const draftDragRef = useRef<number | null>(null);
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

  // 图像在舞台坐标系中的实际显示范围（旋转后按包围盒计算），用于约束默认选框
  const imageBounds = useMemo(() => {
    if (!img || stage.w <= 0 || stage.h <= 0) return null;
    const rotated = rotation % 180 !== 0;
    const w = (rotated ? img.height : img.width) * totalScale;
    const h = (rotated ? img.width : img.height) * totalScale;
    return {
      x: stage.w / 2 + offset.x - w / 2,
      y: stage.h / 2 + offset.y - h / 2,
      w,
      h,
    };
  }, [img, stage, rotation, offset, totalScale]);

  const currentRatio = useMemo((): number | null => {
    return getShapeRatio(shape, aspect, customAspect);
  }, [shape, aspect, customAspect]);

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

  // ===== 绘制中同步预览：按草稿多边形外接框与顶点实时渲染 =====
  const draftBBox = useMemo(() => {
    if (draftPoints.length < 3) return null;
    const xs = draftPoints.map(p => p.x);
    const ys = draftPoints.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const w = maxX - minX;
    const h = maxY - minY;
    if (w < 1 || h < 1) return null;
    return { x: minX, y: minY, w, h };
  }, [draftPoints]);

  const draftNormalized = useMemo(
    () =>
      draftBBox
        ? draftPoints.map(p => ({
            x: (p.x - draftBBox.x) / draftBBox.w,
            y: (p.y - draftBBox.y) / draftBBox.h,
          }))
        : [],
    [draftBBox, draftPoints],
  );

  // 预览输出尺寸：绘制中跟随草稿外接框，其余情况即实际导出尺寸
  const previewSize = useMemo(() => {
    if (!isDrawingCustom || !draftBBox || !img || totalScale <= 0) return outputSize;
    let outW = draftBBox.w / totalScale;
    let outH = draftBBox.h / totalScale;
    const maxEdge = Math.max(outW, outH);
    if (maxEdge > MAX_OUTPUT_EDGE) {
      const f = MAX_OUTPUT_EDGE / maxEdge;
      outW *= f;
      outH *= f;
    }
    return { w: Math.max(1, Math.round(outW)), h: Math.max(1, Math.round(outH)) };
  }, [isDrawingCustom, draftBBox, img, totalScale, outputSize]);

  // 预览画布尺寸：按输出比例铺满预览可用区域，使裁剪结果紧贴预览区边缘
  const previewFit = useMemo(() => {
    if (previewSize.w <= 0 || previewArea.w <= 0 || previewArea.h <= 0) return { w: 0, h: 0 };
    const fit = Math.min(previewArea.w / previewSize.w, previewArea.h / previewSize.h);
    return {
      w: Math.max(1, Math.round(previewSize.w * fit)),
      h: Math.max(1, Math.round(previewSize.h * fit)),
    };
  }, [previewSize, previewArea]);

  // ===== 默认选框 =====
  const buildDefaultCrop = useCallback(
    (
      shapeType: ShapeType,
      aspectKey: AspectKey,
      stageSize: StageSize,
      bounds: { x: number; y: number; w: number; h: number } | null,
      customAspectRatio = 1,
    ): CropRect => {
      const ratio = getShapeRatio(shapeType, aspectKey, customAspectRatio);
      // 可用区域取舞台与图像显示范围的交集，避免竖屏图默认选框超出图片宽度
      const areaW = bounds ? Math.min(stageSize.w, bounds.w) : stageSize.w;
      const areaH = bounds ? Math.min(stageSize.h, bounds.h) : stageSize.h;
      // 图像比舞台窄时（典型为竖屏图），选框宽度直接贴合图片宽度，而不是再按比例缩小
      const fitImageWidth = bounds ? bounds.w < stageSize.w - 1 : false;
      let w: number;
      let h: number;
      if (ratio) {
        w = fitImageWidth ? areaW : Math.min(areaW * 0.7, areaH * 0.7 * ratio);
        h = Math.min(w / ratio, areaH);
        w = h * ratio;
      } else {
        w = fitImageWidth ? areaW : areaW * 0.7;
        h = areaH * 0.6;
      }
      const cx = bounds ? bounds.x + bounds.w / 2 : stageSize.w / 2;
      const cy = bounds ? bounds.y + bounds.h / 2 : stageSize.h / 2;
      return {
        x: clamp(cx - w / 2, 0, Math.max(0, stageSize.w - w)),
        y: clamp(cy - h / 2, 0, Math.max(0, stageSize.h - h)),
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
      opts: {
        fillWhite: boolean;
        // 以下覆盖项用于绘制自定义形状时同步预览草稿
        cropRect?: CropRect;
        shapeType?: ShapeType;
        points?: readonly ShapePoint[];
      },
    ) => {
      if (!img || stage.w <= 0) return;
      const rect = opts.cropRect ?? crop;
      const shapeType = opts.shapeType ?? shape;
      const pts = opts.points ?? customPoints;
      const ratio = outW / rect.w;
      const rotRad = (rotation * Math.PI) / 180;
      const k = totalScale * ratio;
      const radiusPx = (radiusPct / 100) * (Math.min(outW, outH) / 2);

      if (opts.fillWhite) {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, outW, outH);
      }

      ctx.save();
      ctx.beginPath();
      appendShapePath(ctx, outW / 2, outH / 2, outW, outH, shapeType, radiusPx, pts);
      ctx.clip();
      // 将「舞台中心 + 平移」的图像坐标系映射到输出画布（原点对齐选框左上角）
      ctx.translate(
        (stage.w / 2 + offset.x - rect.x) * ratio,
        (stage.h / 2 + offset.y - rect.y) * ratio,
      );
      ctx.rotate(rotRad);
      ctx.scale(flipH ? -k : k, flipV ? -k : k);
      ctx.drawImage(img.source, -img.width / 2, -img.height / 2);
      ctx.restore();
    },
    [img, stage, crop, offset, rotation, flipH, flipV, shape, radiusPct, totalScale, customPoints],
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

    // 绘制自定义形状时隐藏选区遮罩，但保留与其它模式一致的灰色底，避免露出舞台纯白
    if (isDrawingCustom) {
      ctx.fillStyle = 'rgba(17, 24, 39, 0.45)';
      ctx.fillRect(0, 0, stage.w, stage.h);
    }

    // 1. 图像层（CSS 像素坐标系下的硬件加速合成）
    ctx.save();
    ctx.translate(stage.w / 2 + offset.x, stage.h / 2 + offset.y);
    ctx.rotate((rotation * Math.PI) / 180);
    ctx.scale(flipH ? -totalScale : totalScale, flipV ? -totalScale : totalScale);
    ctx.drawImage(img.source, -img.width / 2, -img.height / 2);
    ctx.restore();

    // 2. 选区遮罩层：evenodd 填充让形状区域镂空，其余区域暗化（绘制自定义形状时隐藏）
    if (!isDrawingCustom) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, stage.w, stage.h);
      const radiusPx = (radiusPct / 100) * (Math.min(crop.w, crop.h) / 2);
      appendShapePath(
        ctx,
        crop.x + crop.w / 2,
        crop.y + crop.h / 2,
        crop.w,
        crop.h,
        shape,
        radiusPx,
        customPoints,
      );
      ctx.fillStyle = 'rgba(17, 24, 39, 0.45)';
      ctx.fill('evenodd');
      ctx.restore();
    }
  }, [
    img,
    stage,
    offset,
    rotation,
    flipH,
    flipV,
    totalScale,
    crop,
    shape,
    radiusPct,
    customPoints,
    isDrawingCustom,
  ]);

  const drawPreview = useCallback(() => {
    const canvas = previewCanvasRef.current;
    const { w: pw, h: ph } = previewFit;
    if (!canvas || !img || previewSize.w <= 0 || pw <= 0 || ph <= 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(pw * dpr));
    canvas.height = Math.max(1, Math.round(ph * dpr));

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, pw, ph);
    // 绘制自定义形状时，预览实时跟草稿多边形（外接框 + 顶点）
    const draftOverrides =
      isDrawingCustom && draftBBox
        ? { cropRect: draftBBox, shapeType: 'custom' as ShapeType, points: draftNormalized }
        : null;
    renderInto(ctx, pw, ph, { fillWhite: false, ...(draftOverrides ?? {}) });
  }, [img, previewSize, previewFit, renderInto, isDrawingCustom, draftBBox, draftNormalized]);

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

  // 预览可用区域测量：预览画布按该区域铺满，保证裁剪结果贴边
  useEffect(() => {
    if (!img) return;
    const el = previewAreaRef.current;
    if (!el) return;
    const measure = () => setPreviewArea({ w: el.clientWidth, h: el.clientHeight });
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
    setCrop(buildDefaultCrop(shape, aspect, stage, imageBounds, customAspect));
  }, [img, stage, shape, aspect, buildDefaultCrop, imageBounds, customAspect]);

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
        // 换图时退出自定义绘制，已确认的多边形保留（按比例可复用）
        setIsDrawingCustom(false);
        setDraftPoints([]);
        draftDragRef.current = null;
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
    if (stage.w > 0) {
      // 重置后回到正向、zoom=1、无平移，必须按「未旋转」的适配比例重算显示范围；
      // 不能用 baseScale（它基于重置前的旋转角度），否则旋转后重置会把选框算大
      const bounds = img
        ? (() => {
            const fit = Math.min(stage.w / img.width, stage.h / img.height);
            const w = img.width * fit;
            const h = img.height * fit;
            return { x: (stage.w - w) / 2, y: (stage.h - h) / 2, w, h };
          })()
        : null;
      setCrop(buildDefaultCrop(shape, aspect, stage, bounds, customAspect));
    }
  }, [img, stage, shape, aspect, buildDefaultCrop, customAspect]);

  // 按目标宽高比调整选框（保持中心与可容纳的最大尺寸）
  const fitCropToRatio = useCallback(
    (prev: CropRect, ratio: number): CropRect => {
      if (stage.w <= 0 || prev.w <= 0) return prev;
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
    },
    [stage],
  );

  const handleShapeChange = useCallback(
    (next: ShapeType) => {
      if (isDrawingCustom && next !== 'custom') {
        setIsDrawingCustom(false);
        setDraftPoints([]);
      }
      if (next === 'custom') {
        // 尚无自定义形状：进入绘制模式（保持当前形状，绘制完成后再切换）
        if (customPoints.length < 3) {
          setDraftPoints([]);
          setIsDrawingCustom(true);
          return;
        }
        // 已在用自定义形状：再次点击进入编辑，顶点按当前选框还原到舞台坐标
        if (shape === 'custom') {
          setDraftPoints(
            customPoints.map(p => ({ x: crop.x + p.x * crop.w, y: crop.y + p.y * crop.h })),
          );
          setIsDrawingCustom(true);
          return;
        }
        // 已有自定义形状但当前是其它形状：直接应用
        setShape('custom');
        setCrop(prev => fitCropToRatio(prev, customAspect));
        return;
      }
      setShape(next);
      setCrop(prev => {
        const ratio = getShapeRatio(next, aspect, customAspect);
        if (!ratio) return prev;
        return fitCropToRatio(prev, ratio);
      });
    },
    [aspect, customAspect, customPoints, shape, crop, isDrawingCustom, fitCropToRatio],
  );

  const handleAspectChange = useCallback(
    (next: AspectKey) => {
      setAspect(next);
      const ratio = ASPECT_VALUES[next];
      if (!ratio || stage.w <= 0) return;
      setCrop(prev => fitCropToRatio(prev, ratio));
    },
    [stage, fitCropToRatio],
  );

  // ===== 自定义多边形绘制交互 =====
  const draftSelfIntersects = useMemo(() => hasSelfIntersection(draftPoints), [draftPoints]);
  // 顶点数 ≥ 3、边线不交叉且外接框不小于最小裁剪尺寸时才允许完成
  const canFinishCustom = useMemo(() => {
    if (draftPoints.length < 3 || draftSelfIntersects) return false;
    const xs = draftPoints.map(p => p.x);
    const ys = draftPoints.map(p => p.y);
    return (
      Math.max(...xs) - Math.min(...xs) >= MIN_CROP_SIZE &&
      Math.max(...ys) - Math.min(...ys) >= MIN_CROP_SIZE
    );
  }, [draftPoints, draftSelfIntersects]);

  const stagePointFromEvent = useCallback((e: React.PointerEvent<HTMLDivElement>): ShapePoint => {
    const el = stageRef.current;
    if (!el) return { x: 0, y: 0 };
    const rect = el.getBoundingClientRect();
    return {
      x: clamp(e.clientX - rect.left, 0, rect.width),
      y: clamp(e.clientY - rect.top, 0, rect.height),
    };
  }, []);

  const handleDrawPointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.stopPropagation();
      // 仅响应主键/触摸，避免右键误加点
      if (e.button !== 0) return;
      const target = e.target as HTMLElement;
      const pointIndex = target.dataset.draftIndex;
      // 命中顶点：开始拖拽调整
      if (pointIndex !== undefined) {
        draftDragRef.current = Number(pointIndex);
        e.currentTarget.setPointerCapture(e.pointerId);
        return;
      }
      // 空白处：追加顶点
      const p = stagePointFromEvent(e);
      setDraftPoints(prev => [...prev, p]);
    },
    [stagePointFromEvent],
  );

  const handleDrawPointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      e.stopPropagation();
      const index = draftDragRef.current;
      if (index === null) return;
      const p = stagePointFromEvent(e);
      setDraftPoints(prev => prev.map((pt, i) => (i === index ? p : pt)));
    },
    [stagePointFromEvent],
  );

  const handleDrawPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    draftDragRef.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  }, []);

  const undoDraftPoint = useCallback(() => {
    setDraftPoints(prev => prev.slice(0, -1));
  }, []);

  const cancelCustomDrawing = useCallback(() => {
    setIsDrawingCustom(false);
    setDraftPoints([]);
    draftDragRef.current = null;
  }, []);

  const finishCustomDrawing = useCallback(() => {
    if (!canFinishCustom) return;
    const xs = draftPoints.map(p => p.x);
    const ys = draftPoints.map(p => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const bw = maxX - minX;
    const bh = maxY - minY;
    // 归一化到自身外接框，选框按该比例生成，形状四边贴合选框
    setCustomPoints(draftPoints.map(p => ({ x: (p.x - minX) / bw, y: (p.y - minY) / bh })));
    setCustomAspect(bw / bh);
    setCrop({ x: minX, y: minY, w: bw, h: bh });
    setShape('custom');
    setIsDrawingCustom(false);
    setDraftPoints([]);
    draftDragRef.current = null;
  }, [canFinishCustom, draftPoints]);

  const handleChangeImage = useCallback(() => {
    setImg(prev => {
      revokeImg(prev);
      return null;
    });
    setError(null);
    setCopied(false);
    cropInitForRef.current = null;
    setIsDrawingCustom(false);
    setDraftPoints([]);
    draftDragRef.current = null;
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

  // 各格式预估下载体积：停止调整后串行编码一次，避免占用交互热路径
  useEffect(() => {
    if (!img || outputSize.w <= 0) {
      setFormatSizes(null);
      return;
    }
    setFormatSizes(null);
    let cancelled = false;
    const timer = setTimeout(() => {
      runInIdle(async () => {
        const sizes: Partial<Record<ExportFormat, number>> = {};
        for (const fmt of FORMATS) {
          const blob = await exportBlob(fmt);
          if (cancelled) return;
          if (blob) sizes[fmt] = blob.size;
        }
        if (!cancelled) setFormatSizes(sizes);
      });
    }, 500);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [img, exportBlob, outputSize.w]);

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
                  // 绘制期间只高亮「自定义」，避免底层形状同时选中
                  const active = isDrawingCustom ? key === 'custom' : shape === key;
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
              className="relative w-full h-[380px] sm:h-[460px] lg:h-[clamp(300px,calc(100vh-310px),620px)] bg-white rounded-xl overflow-hidden select-none touch-none shadow-sm"
              onPointerDown={handleStagePointerDown}
              onPointerMove={handleStagePointerMove}
              onPointerUp={handleStagePointerUp}
              onPointerCancel={handleStagePointerUp}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />

              {/* 自定义多边形绘制层：点击加点、拖拽顶点 */}
              {isDrawingCustom && (
                <div
                  className="absolute inset-0 z-10 cursor-crosshair"
                  style={{ touchAction: 'none' }}
                  onPointerDown={handleDrawPointerDown}
                  onPointerMove={handleDrawPointerMove}
                  onPointerUp={handleDrawPointerUp}
                  onPointerCancel={handleDrawPointerUp}
                >
                  <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    viewBox={`0 0 ${Math.max(1, stage.w)} ${Math.max(1, stage.h)}`}
                    preserveAspectRatio="none"
                  >
                    {draftPoints.length >= 3 ? (
                      <polygon
                        points={draftPoints.map(p => `${p.x},${p.y}`).join(' ')}
                        fill="rgba(229,33,41,0.12)"
                        stroke="#e52129"
                        strokeWidth={2}
                        strokeDasharray={canFinishCustom ? undefined : '6 4'}
                      />
                    ) : draftPoints.length === 2 ? (
                      <polyline
                        points={draftPoints.map(p => `${p.x},${p.y}`).join(' ')}
                        fill="none"
                        stroke="#e52129"
                        strokeWidth={2}
                        strokeDasharray="6 4"
                      />
                    ) : null}
                  </svg>
                  {draftPoints.map((p, i) => (
                    <div
                      key={i}
                      data-draft-index={i}
                      className="absolute w-4 h-4 -ml-2 -mt-2 rounded-full bg-white border-2 border-[#e52129] shadow-sm cursor-move"
                      style={{ left: p.x, top: p.y }}
                    />
                  ))}
                </div>
              )}

              {/* 绘制操作条 */}
              {isDrawingCustom && (
                <div
                  className="absolute left-1/2 bottom-3 -translate-x-1/2 z-20 flex max-w-[calc(100%-1.5rem)] flex-wrap items-center justify-center gap-2 rounded-xl bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm"
                  onPointerDown={e => e.stopPropagation()}
                >
                  <span className="text-xs text-gray-500 text-center">
                    {draftSelfIntersects
                      ? t('customCrossHint')
                      : draftPoints.length < 3
                        ? t('customDrawHint')
                        : t('customDrawHintDone')}
                  </span>
                  <button
                    onClick={undoDraftPoint}
                    disabled={draftPoints.length === 0}
                    className="px-2 h-7 rounded-md text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-40 disabled:pointer-events-none"
                  >
                    {t('customUndo')}
                  </button>
                  <button
                    onClick={finishCustomDrawing}
                    disabled={!canFinishCustom}
                    className="px-2.5 h-7 rounded-md text-xs font-medium text-white bg-[#e52129] hover:bg-[#c81b23] transition-colors disabled:opacity-40 disabled:pointer-events-none"
                  >
                    {t('customDone')}
                  </button>
                  <button
                    onClick={cancelCustomDrawing}
                    className="px-2 h-7 rounded-md text-xs text-gray-500 hover:bg-gray-100 transition-colors"
                  >
                    {t('customCancel')}
                  </button>
                </div>
              )}

              {/* 选框覆盖层：DOM + CSS 硬件加速，零 Canvas 合成开销 */}
              {crop.w > 0 && !isDrawingCustom && (
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
                !isDrawingCustom &&
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
                <div className="absolute inset-0 z-30 bg-white/70 flex flex-col items-center justify-center gap-3">
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
          {/* 高度固定为「画布高度 + 底部工具条 40px」，与选中形状无关，保证各形状下预览区尺寸一致 */}
          <aside className="lg:col-span-3 flex flex-col gap-3 min-w-0 lg:h-[calc(clamp(300px,calc(100vh-310px),620px)+2.5rem)]">
            {/* 透明通道实时预览（纯 CSS 棋盘格，输出尺寸角标悬浮）*/}
            <div className="bg-white rounded-xl p-3 flex-1 flex flex-col min-h-0">
              <p className="text-sm font-medium text-gray-500 mb-2">{t('previewLabel')}</p>
              <div
                ref={previewAreaRef}
                className="relative flex-1 min-h-[140px] flex items-center justify-center"
              >
                {previewFit.w > 0 && (
                  <div
                    className="relative"
                    style={{
                      width: previewFit.w,
                      height: previewFit.h,
                      backgroundColor: '#f9fafb',
                      backgroundImage:
                        'linear-gradient(45deg, #d8dce1 25%, transparent 25%), linear-gradient(-45deg, #d8dce1 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #d8dce1 75%), linear-gradient(-45deg, transparent 75%, #d8dce1 75%)',
                      backgroundSize: '16px 16px',
                      backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
                    }}
                  >
                    <canvas ref={previewCanvasRef} className="block w-full h-full" />
                    <span className="absolute top-2 right-2 px-2 py-0.5 bg-white/85 backdrop-blur-sm rounded-md text-xs text-gray-500 tabular-nums shadow-sm">
                      {previewSize.w} × {previewSize.h} px
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 导出操作区 */}
            <div className="bg-white rounded-xl p-3 space-y-2.5">
              <div className="grid grid-cols-3 gap-1 p-1 bg-gray-100 rounded-lg">
                {FORMATS.map(fmt => {
                  const size = formatSizes?.[fmt];
                  const active = format === fmt;
                  return (
                    <button
                      key={fmt}
                      onClick={() => setFormat(fmt)}
                      className={`min-h-[44px] py-1 rounded-md text-[13px] font-medium uppercase tracking-wide transition-colors flex flex-col items-center justify-center gap-0.5 ${
                        active
                          ? 'bg-[#e52129] text-white shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <span>{fmt === 'jpeg' ? 'JPG' : fmt}</span>
                      <span
                        className={`text-[10px] font-normal normal-case tracking-normal tabular-nums ${
                          active ? 'text-white/80' : 'text-gray-400'
                        }`}
                      >
                        {size !== undefined ? formatBytes(size) : '…'}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleDownload}
                  disabled={isExporting || isProcessing}
                  className="min-h-[40px] inline-flex items-center justify-center gap-1.5 px-2 bg-[#e52129] text-white rounded-xl text-[13px] font-medium whitespace-nowrap hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isExporting ? (
                    <Loader2 className="w-4 h-4 shrink-0 animate-spin" />
                  ) : (
                    <Download className="w-4 h-4 shrink-0" />
                  )}
                  <span>{isExporting ? t('exporting') : t('downloadButton')}</span>
                </button>

                <button
                  onClick={handleCopy}
                  disabled={isProcessing}
                  className={`min-h-[40px] inline-flex items-center justify-center gap-1.5 px-2 rounded-xl text-[13px] font-medium whitespace-nowrap border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    copied
                      ? 'border-[#e52129] bg-red-50 text-[#e52129]'
                      : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {copied ? (
                    <Check className="w-4 h-4 shrink-0" />
                  ) : (
                    <Copy className="w-4 h-4 shrink-0" />
                  )}
                  <span>{copied ? t('copiedFeedback') : t('copyButton')}</span>
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
