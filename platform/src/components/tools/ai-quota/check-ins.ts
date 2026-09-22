import type { CheckIn, CheckInRecord } from './AiQuotaTracker';

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
    const historyIds = new Set<string>();
    const history: CheckInRecord[] = Array.isArray(item.history) ? item.history.flatMap((record) => {
      if (!record || typeof record.id !== 'string' || historyIds.has(record.id)
        || typeof record.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(record.date)
        || !Number.isFinite(record.creditedAmount) || record.creditedAmount < 0) return [];
      historyIds.add(record.id);
      return [{ id: record.id, date: record.date, creditedAmount: record.creditedAmount,
        at: Number.isFinite(record.at) && Number.isFinite(new Date(record.at).getTime()) ? record.at : undefined }];
    }) : [];
    let completedRecordId = typeof item.completedRecordId === 'string' ? item.completedRecordId : undefined;
    // 已签到但缺少当日 history（含带有效期追踪的旧数据）：按已知信息补一条，不推测具体时间。
    const previous = typeof item.completedDate === 'string'
      ? history.find((record) => record.date === item.completedDate) : undefined;
    if (typeof item.completedDate === 'string' && !previous) {
      completedRecordId = `legacy-${id}-${item.completedDate}`;
      history.push({ id: completedRecordId, date: item.completedDate, creditedAmount: Math.max(0, Number(item.creditedAmount) || 0) });
    } else if (!completedRecordId) {
      completedRecordId = previous?.id;
    }
    return [{
      history,
      completedRecordId,
      id,
      nameZh: typeof item.nameZh === 'string' ? item.nameZh : '',
      nameEn: typeof item.nameEn === 'string' ? item.nameEn : '',
      validityMinutes: Number.isFinite(item.validityMinutes) && Number(item.validityMinutes) >= 1 && Number.isFinite(new Date(Date.now() + Number(item.validityMinutes) * 60000).getTime()) ? Math.floor(Number(item.validityMinutes)) : undefined,
      validityStartMode: item.validityStartMode === 'midnight' ? 'midnight' : item.validityStartMode === 'checkin' ? 'checkin' : undefined,
      expiryRecordId: typeof item.expiryRecordId === 'string' ? item.expiryRecordId : undefined,
      reward: Math.max(0, Number(item.reward) || 0),
      completedDate: typeof item.completedDate === 'string' ? item.completedDate : undefined,
      creditedAmount: Math.max(0, Number(item.creditedAmount) || 0),
    }];
  });
}
