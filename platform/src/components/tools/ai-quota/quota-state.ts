import type { CheckIn, Platform } from './AiQuotaTracker';
import type { ExpiryIndicator } from './expiry-indicators';

function makeExpiryRecord(platform: Platform, item: CheckIn, today: string, now: number): { records: ExpiryIndicator[]; id: string } {
  const records = platform.expiryIndicators ?? [];
  const linkedIds = new Set(platform.checkIns?.map((entry) => entry.expiryRecordId).filter(Boolean));
  // 复用当天为这个签到奖励手动补录的记录，过去的批次仍单独保留。
  const matchesManual = (record: ExpiryIndicator) => !record.sourceCheckInId && !linkedIds.has(record.id)
    && new Date(record.startsAt).toLocaleDateString('en-CA') === today
    && record.amount === item.reward
    && record.nameZh.trim() === (item.nameZh ?? '').trim()
    && record.nameEn.trim() === (item.nameEn ?? '').trim();
  const reusable = records.find(matchesManual);
  const startsAt = Math.floor(now / 60_000) * 60_000;
  const id = reusable?.id ?? crypto.randomUUID();
  const record: ExpiryIndicator = {
    id, sourceCheckInId: item.id, nameZh: item.nameZh ?? '', nameEn: item.nameEn ?? '',
    amount: item.reward, startsAt, expiresAt: startsAt + item.validityMinutes! * 60_000,
  };
  return { records: reusable ? records.map((entry) => entry.id === id ? record : entry) : [...records, record], id };
}

// 编辑已完成的签到时，启用有效期追踪也会立即显示对应记录。
export function syncCheckInExpiryRecords(platform: Platform, today: string, now = Date.now()): Platform {
  let result = platform;
  for (const item of platform.checkIns ?? []) {
    if (item.completedDate !== today || !item.validityMinutes) continue;
    if (item.expiryRecordId && result.expiryIndicators?.some((record) => record.id === item.expiryRecordId)) {
      // 旧数据里若已同时存在自动记录和当天同名的手动补录，保留签到关联的记录。
      const otherLinkedIds = new Set(result.checkIns?.map((entry) => entry.expiryRecordId).filter(Boolean));
      const deduplicated = result.expiryIndicators.filter((record) => record.id === item.expiryRecordId
        || record.sourceCheckInId || otherLinkedIds.has(record.id)
        || new Date(record.startsAt).toLocaleDateString('en-CA') !== today
        || record.amount !== item.reward
        || record.nameZh.trim() !== (item.nameZh ?? '').trim()
        || record.nameEn.trim() !== (item.nameEn ?? '').trim());
      if (deduplicated.length !== result.expiryIndicators.length) result = { ...result, expiryIndicators: deduplicated };
      continue;
    }
    const { records, id } = makeExpiryRecord(result, item, today, now);
    result = { ...result, expiryIndicators: records,
      checkIns: result.checkIns?.map((entry) => entry.id === item.id ? { ...entry, expiryRecordId: id } : entry) };
  }
  return result;
}

export function resetForNewDay(platform: Platform): Platform {
  return {
    ...platform,
    indicators: platform.indicators.map((ind) => ind.resetDaily === false ? ind : { ...ind, used: 0 }),
    balance: platform.balance?.resetDaily
      ? { ...platform.balance, current: platform.balance.initial }
      : platform.balance,
    checkIns: platform.checkIns?.map((item) => ({ ...item, completedDate: undefined, creditedAmount: undefined, expiryRecordId: undefined })),
  };
}

export function toggleCheckIn(platform: Platform, checkInId: string, today: string, now = Date.now()): Platform {
  const item = platform.checkIns?.find((entry) => entry.id === checkInId);
  if (!item) return platform;
  const completed = item.completedDate === today;
  const amount = completed ? item.creditedAmount ?? 0 : platform.balance ? item.reward : 0;
  const created = !completed && item.validityMinutes ? makeExpiryRecord(platform, item, today, now) : undefined;
  const expiryRecordId = created?.id;
  const expiryIndicators = completed
    ? platform.expiryIndicators?.filter((record) => record.id !== item.expiryRecordId)
    : created?.records ?? platform.expiryIndicators;
  return {
    ...platform,
    expiryIndicators,
    balance: platform.balance ? { ...platform.balance, current: completed
      ? Math.max(0, platform.balance.current - amount) : platform.balance.current + amount } : undefined,
    checkIns: platform.checkIns?.map((entry) => entry.id === checkInId ? {
      ...entry,
      expiryRecordId,
      completedDate: completed ? undefined : today,
      creditedAmount: completed ? undefined : amount,
    } : entry),
  };
}
