import type { Platform } from './AiQuotaTracker';

export function resetForNewDay(platform: Platform): Platform {
  return {
    ...platform,
    indicators: platform.indicators.map((ind) => ind.resetDaily === false ? ind : { ...ind, used: 0 }),
    balance: platform.balance?.resetDaily
      ? { ...platform.balance, current: platform.balance.initial }
      : platform.balance,
    checkIns: platform.checkIns?.map((item) => ({ ...item, completedDate: undefined, creditedAmount: undefined })),
  };
}

export function toggleCheckIn(platform: Platform, checkInId: string, today: string): Platform {
  const item = platform.checkIns?.find((entry) => entry.id === checkInId);
  if (!item) return platform;
  const completed = item.completedDate === today;
  const amount = completed ? item.creditedAmount ?? 0 : platform.balance ? item.reward : 0;
  return {
    ...platform,
    balance: platform.balance ? { ...platform.balance, current: completed
      ? Math.max(0, platform.balance.current - amount) : platform.balance.current + amount } : undefined,
    checkIns: platform.checkIns?.map((entry) => entry.id === checkInId ? {
      ...entry,
      completedDate: completed ? undefined : today,
      creditedAmount: completed ? undefined : amount,
    } : entry),
  };
}
