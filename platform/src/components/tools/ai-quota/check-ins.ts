import type { CheckIn } from './AiQuotaTracker';

// 兼容旧版单条签到配置，以及导入文件中的多条签到配置。
export function normalizeCheckIns(value: unknown, legacyValue?: unknown): CheckIn[] {
  const source = Array.isArray(value) ? value : legacyValue && typeof legacyValue === 'object'
    ? [legacyValue] : [];
  const seenIds = new Set<string>();
  return source.flatMap((raw, index) => {
    if (!raw || typeof raw !== 'object') return [];
    const item = raw as Record<string, unknown>;
    if (item.enabled === false) return [];
    const preferredId = typeof item.id === 'string' && item.id ? item.id : `legacy-check-in-${index}`;
    const id = seenIds.has(preferredId) ? `${preferredId}-${index}` : preferredId;
    seenIds.add(id);
    return [{
      id,
      nameZh: typeof item.nameZh === 'string' ? item.nameZh : '',
      nameEn: typeof item.nameEn === 'string' ? item.nameEn : '',
      reward: Math.max(0, Number(item.reward) || 0),
      completedDate: typeof item.completedDate === 'string' ? item.completedDate : undefined,
      creditedAmount: Math.max(0, Number(item.creditedAmount) || 0),
    }];
  });
}
