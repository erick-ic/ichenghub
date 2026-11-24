import type { Indicator } from './AiQuotaTracker';

export type IndicatorMode = 'usage' | 'remaining';

export function isRemainingIndicator(ind: Pick<Indicator, 'mode'>): boolean {
  return ind.mode === 'remaining';
}

function clampRemainingPercent(value: number): number {
  if (!Number.isFinite(value)) return 100;
  return Number(Math.max(0, Math.min(100, value)).toFixed(1));
}

export function remainingPercentToUsed(remainingPercent: number): number {
  return Number((100 - clampRemainingPercent(remainingPercent)).toFixed(1));
}

export function getUsagePercent(ind: Pick<Indicator, 'used' | 'limit'>): number {
  if (!Number.isFinite(ind.limit) || ind.limit <= 0) return 0;
  return Math.max(0, Math.min(100, (ind.used / ind.limit) * 100));
}

export function getRemainingPercent(ind: Pick<Indicator, 'used' | 'limit'>): number {
  if (!Number.isFinite(ind.limit) || ind.limit <= 0) return 0;
  const percent = ((ind.limit - ind.used) / ind.limit) * 100;
  return Number(Math.max(0, Math.min(100, percent)).toFixed(1));
}

export function normalizeIndicator(
  ind: Partial<Indicator> & { name?: string; unit?: string },
): Indicator {
  const isRemaining = ind.mode === 'remaining';
  const rawUsed = Number(ind.used) || 0;
  const rawLimit = Number(ind.limit) || 0;

  if (isRemaining) {
    return {
      id: String(ind.id),
      mode: 'remaining',
      nameZh: String(ind.nameZh ?? ind.name ?? ''),
      nameEn: String(ind.nameEn ?? ind.name ?? ''),
      used: Number(Math.max(0, Math.min(100, rawUsed)).toFixed(1)),
      limit: 100,
      unitZh: '%',
      unitEn: '%',
      resetDaily: ind.resetDaily !== false,
    };
  }

  return {
    id: String(ind.id),
    nameZh: String(ind.nameZh ?? ind.name ?? ''),
    nameEn: String(ind.nameEn ?? ind.name ?? ''),
    used: rawUsed,
    limit: rawLimit,
    unitZh: ind.unitZh ? String(ind.unitZh) : ind.unit ? String(ind.unit) : undefined,
    unitEn: ind.unitEn ? String(ind.unitEn) : ind.unit ? String(ind.unit) : undefined,
    resetDaily: ind.resetDaily !== false,
  };
}
