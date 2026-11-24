export const PLATFORM_COLORS = ['graphite', 'garnet', 'champagne', 'sapphire', 'jade', 'amethyst'] as const;

export type PlatformColor = (typeof PLATFORM_COLORS)[number];

export const DEFAULT_PLATFORM_COLOR: PlatformColor = 'graphite';

export function normalizePlatformColor(value: unknown): PlatformColor {
  return typeof value === 'string' && PLATFORM_COLORS.includes(value as PlatformColor)
    ? value as PlatformColor
    : DEFAULT_PLATFORM_COLOR;
}

export const ALERT_BAR_STRIPE =
  'repeating-linear-gradient(-45deg, rgba(255, 255, 255, 0.28) 0, rgba(255, 255, 255, 0.28) 4px, transparent 4px, transparent 8px)';

export const PLATFORM_COLOR_STYLES: Record<PlatformColor, {
  swatch: string;
  card: string;
  sheen: string;
  marker: string;
  // 主题强调色：文字、实心底（含进度条正常态）、描边、键盘焦点环
  accentText: string;
  accentBg: string;
  accentBorder: string;
  accentRing: string;
  // 配色选择器选中态边框与浅底
  selected: string;
}> = {
  graphite: {
    swatch: 'from-zinc-400 to-zinc-800',
    card: 'border-zinc-100 hover:border-zinc-200 hover:shadow-[0_18px_45px_-24px_rgba(24,24,27,0.35)]',
    sheen: 'from-zinc-300 via-zinc-600 to-zinc-900',
    marker: 'bg-zinc-700 shadow-zinc-700/30',
    accentText: 'text-zinc-700',
    accentBg: 'bg-zinc-700',
    accentBorder: 'border-zinc-700',
    accentRing: 'peer-focus-visible:ring-zinc-500',
    selected: 'border-zinc-700 bg-zinc-50 ring-1 ring-zinc-700 shadow-sm',
  },
  garnet: {
    swatch: 'from-rose-400 to-rose-700',
    card: 'border-rose-100 hover:border-rose-200 hover:shadow-[0_18px_45px_-24px_rgba(225,29,72,0.35)]',
    sheen: 'from-rose-300 via-rose-600 to-rose-800',
    marker: 'bg-rose-600 shadow-rose-600/30',
    accentText: 'text-rose-600',
    accentBg: 'bg-rose-600',
    accentBorder: 'border-rose-600',
    accentRing: 'peer-focus-visible:ring-rose-500',
    selected: 'border-rose-600 bg-rose-50/50 ring-1 ring-rose-600 shadow-sm',
  },
  champagne: {
    swatch: 'from-amber-300 to-amber-600',
    card: 'border-amber-100 hover:border-amber-200 hover:shadow-[0_18px_45px_-24px_rgba(217,119,6,0.35)]',
    sheen: 'from-amber-200 via-amber-500 to-amber-700',
    marker: 'bg-amber-600 shadow-amber-600/30',
    accentText: 'text-amber-700',
    accentBg: 'bg-amber-600',
    accentBorder: 'border-amber-600',
    accentRing: 'peer-focus-visible:ring-amber-500',
    selected: 'border-amber-600 bg-amber-50/50 ring-1 ring-amber-600 shadow-sm',
  },
  sapphire: {
    swatch: 'from-sky-300 to-blue-800',
    card: 'border-sky-100 hover:border-sky-200 hover:shadow-[0_18px_45px_-24px_rgba(29,78,216,0.35)]',
    sheen: 'from-sky-300 via-blue-600 to-indigo-950',
    marker: 'bg-blue-600 shadow-blue-600/30',
    accentText: 'text-blue-700',
    accentBg: 'bg-blue-600',
    accentBorder: 'border-blue-600',
    accentRing: 'peer-focus-visible:ring-blue-500',
    selected: 'border-blue-600 bg-sky-50/40 ring-1 ring-blue-600 shadow-sm',
  },
  jade: {
    swatch: 'from-emerald-300 to-teal-800',
    card: 'border-emerald-100 hover:border-emerald-200 hover:shadow-[0_18px_45px_-24px_rgba(4,120,87,0.35)]',
    sheen: 'from-emerald-300 via-teal-600 to-emerald-950',
    marker: 'bg-teal-600 shadow-teal-600/30',
    accentText: 'text-teal-700',
    accentBg: 'bg-teal-600',
    accentBorder: 'border-teal-600',
    accentRing: 'peer-focus-visible:ring-teal-500',
    selected: 'border-teal-600 bg-teal-50/40 ring-1 ring-teal-600 shadow-sm',
  },
  amethyst: {
    swatch: 'from-violet-300 to-purple-800',
    card: 'border-violet-100 hover:border-violet-200 hover:shadow-[0_18px_45px_-24px_rgba(109,40,217,0.35)]',
    sheen: 'from-violet-300 via-purple-600 to-fuchsia-950',
    marker: 'bg-purple-600 shadow-purple-600/30',
    accentText: 'text-purple-700',
    accentBg: 'bg-purple-600',
    accentBorder: 'border-purple-600',
    accentRing: 'peer-focus-visible:ring-purple-500',
    selected: 'border-purple-600 bg-violet-50/40 ring-1 ring-purple-600 shadow-sm',
  },
};
