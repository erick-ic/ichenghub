export const PLATFORM_COLORS = ['graphite', 'garnet', 'champagne', 'sapphire', 'jade', 'amethyst'] as const;

export type PlatformColor = (typeof PLATFORM_COLORS)[number];

export const DEFAULT_PLATFORM_COLOR: PlatformColor = 'graphite';

export function normalizePlatformColor(value: unknown): PlatformColor {
  return typeof value === 'string' && PLATFORM_COLORS.includes(value as PlatformColor)
    ? value as PlatformColor
    : DEFAULT_PLATFORM_COLOR;
}

export const PLATFORM_COLOR_STYLES: Record<PlatformColor, {
  swatch: string;
  card: string;
  sheen: string;
  marker: string;
}> = {
  graphite: {
    swatch: 'from-zinc-400 to-zinc-800',
    card: 'border-zinc-100 hover:border-zinc-200 hover:shadow-[0_18px_45px_-24px_rgba(24,24,27,0.35)]',
    sheen: 'from-zinc-300 via-zinc-600 to-zinc-900',
    marker: 'bg-zinc-700 shadow-zinc-700/30',
  },
  garnet: {
    swatch: 'from-rose-400 to-red-800',
    card: 'border-rose-100 hover:border-rose-200 hover:shadow-[0_18px_45px_-24px_rgba(190,18,60,0.38)]',
    sheen: 'from-rose-300 via-[#e52129] to-rose-950',
    marker: 'bg-[#e52129] shadow-red-600/30',
  },
  champagne: {
    swatch: 'from-amber-200 to-amber-600',
    card: 'border-amber-100 hover:border-amber-200 hover:shadow-[0_18px_45px_-24px_rgba(180,83,9,0.35)]',
    sheen: 'from-amber-200 via-amber-500 to-yellow-800',
    marker: 'bg-amber-500 shadow-amber-500/30',
  },
  sapphire: {
    swatch: 'from-sky-300 to-blue-800',
    card: 'border-sky-100 hover:border-sky-200 hover:shadow-[0_18px_45px_-24px_rgba(29,78,216,0.35)]',
    sheen: 'from-sky-300 via-blue-600 to-indigo-950',
    marker: 'bg-blue-600 shadow-blue-600/30',
  },
  jade: {
    swatch: 'from-emerald-300 to-teal-800',
    card: 'border-emerald-100 hover:border-emerald-200 hover:shadow-[0_18px_45px_-24px_rgba(4,120,87,0.35)]',
    sheen: 'from-emerald-300 via-teal-600 to-emerald-950',
    marker: 'bg-teal-600 shadow-teal-600/30',
  },
  amethyst: {
    swatch: 'from-violet-300 to-purple-800',
    card: 'border-violet-100 hover:border-violet-200 hover:shadow-[0_18px_45px_-24px_rgba(109,40,217,0.35)]',
    sheen: 'from-violet-300 via-purple-600 to-fuchsia-950',
    marker: 'bg-purple-600 shadow-purple-600/30',
  },
};
