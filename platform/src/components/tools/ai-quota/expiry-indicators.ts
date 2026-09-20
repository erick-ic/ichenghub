export interface ExpiryIndicator {
  id: string;
  sourceCheckInId?: string;
  nameZh: string;
  nameEn: string;
  amount: number;
  startsAt: number;
  expiresAt: number;
}

export function normalizeExpiryIndicators(value: unknown): ExpiryIndicator[] {
  if (!Array.isArray(value)) return [];
  const ids = new Set<string>();
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object' || typeof item.id !== 'string' || ids.has(item.id)
      || !Number.isFinite(item.startsAt) || !Number.isFinite(item.expiresAt)
      || !Number.isFinite(new Date(item.startsAt).getTime()) || !Number.isFinite(new Date(item.expiresAt).getTime())
      || item.expiresAt <= item.startsAt || !Number.isFinite(item.amount) || item.amount < 0) return [];
    ids.add(item.id);
    return [{ id: item.id, ...(typeof item.sourceCheckInId === 'string' ? { sourceCheckInId: item.sourceCheckInId } : {}),
      nameZh: typeof item.nameZh === 'string' ? item.nameZh : '',
      nameEn: typeof item.nameEn === 'string' ? item.nameEn : '', amount: item.amount,
      startsAt: item.startsAt, expiresAt: item.expiresAt }];
  });
}

export function expiryProgress(item: ExpiryIndicator, now: number) {
  return {
    remainingMinutes: Math.max(0, Math.ceil((item.expiresAt - now) / 60_000)),
    percent: Math.max(0, Math.min(100, (item.expiresAt - now) / (item.expiresAt - item.startsAt) * 100)),
  };
}

export function localDateTime(timestamp: number): string {
  if (!Number.isFinite(timestamp)) return '';
  const date = new Date(timestamp);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}T${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
