import type { Platform } from './AiQuotaTracker';

export function hasDailyQuota(platform: Platform): boolean {
  return platform.indicators.some((item) => item.resetDaily !== false && item.limit > item.used);
}

export function hasPendingCheckIns(platform: Platform, today: string): boolean {
  return !!platform.checkIns?.some((item) => item.completedDate !== today);
}

export function getDailySummary(platforms: Platform[], today: string) {
  const checkIns = platforms.flatMap((platform) => platform.checkIns ?? []);
  const completed = checkIns.filter((item) => item.completedDate === today).length;
  return {
    total: checkIns.length,
    completed,
    pending: checkIns.length - completed,
    availablePlatforms: platforms.filter(hasDailyQuota).length,
  };
}
