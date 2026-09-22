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
  const startsAt = now;
  const id = reusable?.id ?? crypto.randomUUID();
  const record: ExpiryIndicator = {
    id, sourceCheckInId: item.id, nameZh: item.nameZh ?? '', nameEn: item.nameEn ?? '',
    amount: item.reward, creditedAmount: item.creditedAmount ?? (platform.balance ? item.reward : 0), startsAt, expiresAt: startsAt + item.validityMinutes! * 60_000,
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

// 每个签到批次仅结算一次；手动补录的倒计时不影响余额。
export function settleExpiredCheckIns(platform: Platform, now = Date.now()): Platform {
  let deduction = 0;
  let changed = false;
  const expiryIndicators = platform.expiryIndicators?.map((record) => {
    if (!record.sourceCheckInId || record.expiredDeducted || record.expiresAt > now) return record;
    const linked = platform.checkIns?.find((item) => item.expiryRecordId === record.id);
    deduction += record.creditedAmount ?? linked?.creditedAmount ?? record.amount;
    changed = true;
    return { ...record, expiredDeducted: true };
  });
  if (!changed) return platform;
  return {
    ...platform,
    expiryIndicators,
    balance: platform.balance ? { ...platform.balance,
      current: Number(Math.max(0, platform.balance.current - deduction).toFixed(2)) } : undefined,
  };
}

export function resetForNewDay(platform: Platform): Platform {
  return {
    ...platform,
    indicators: platform.indicators.map((ind) => ind.resetDaily === false ? ind : { ...ind, used: 0 }),
    balance: platform.balance?.resetDaily
      ? { ...platform.balance, current: platform.balance.initial }
      : platform.balance,
    checkIns: platform.checkIns?.map((item) => ({ ...item, completedDate: undefined, completedRecordId: undefined, creditedAmount: undefined, expiryRecordId: undefined })),
  };
}

export function toggleCheckIn(platform: Platform, checkInId: string, today: string, now = Date.now()): Platform {
  platform = settleExpiredCheckIns(platform, now);
  const item = platform.checkIns?.find((entry) => entry.id === checkInId);
  if (!item) return platform;
  const completed = item.completedDate === today;
  const alreadyDeducted = platform.expiryIndicators?.some((record) => record.id === item.expiryRecordId && record.expiredDeducted);
  const amount = completed ? (alreadyDeducted ? 0 : item.creditedAmount ?? 0) : platform.balance ? item.reward : 0;
  const created = !completed && item.validityMinutes ? makeExpiryRecord(platform, item, today, now) : undefined;
  const expiryRecordId = created?.id;
  const recordId = !completed && !item.validityMinutes ? crypto.randomUUID() : undefined;
  const history = completed
    ? item.history?.filter((record) => record.id !== item.completedRecordId)
    : recordId ? [...(item.history ?? []), { id: recordId, date: today, at: now, creditedAmount: amount }] : item.history;
  const expiryIndicators = completed
    ? platform.expiryIndicators?.filter((record) => record.id !== item.expiryRecordId)
    : created?.records ?? platform.expiryIndicators;
  return {
    ...platform,
    expiryIndicators,
    balance: platform.balance ? { ...platform.balance, current: Number((completed
      ? Math.max(0, platform.balance.current - amount) : platform.balance.current + amount).toFixed(2)) } : undefined,
    checkIns: platform.checkIns?.map((entry) => entry.id === checkInId ? {
      ...entry,
      expiryRecordId,
      history,
      completedRecordId: recordId,
      completedDate: completed ? undefined : today,
      creditedAmount: completed ? undefined : amount,
    } : entry),
  };
}
