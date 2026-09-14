// 统一的北京时间（UTC+8）工具。
//
// 背景：PostgreSQL 存 UTC，服务器 TZ 未设置时 Node 也按 UTC 运行，
// 直接用 toISOString() 截断日期或 getHours() 会把北京凌晨的访问归到前一天。
// 所有面向中文用户的「按日 / 按小时」聚合与日期展示都应使用这里的函数。

const BEIJING_OFFSET_MS = 8 * 60 * 60 * 1000;

function toBeijing(d: Date): Date {
  return new Date(d.getTime() + BEIJING_OFFSET_MS);
}

/** 返回北京时间的日历日 key，格式 YYYY-MM-DD */
export function getBeijingDayKey(d: Date): string {
  return toBeijing(d).toISOString().split('T')[0];
}

/** 返回北京时间的小时（0-23） */
export function getBeijingHour(d: Date): number {
  return toBeijing(d).getUTCHours();
}

/**
 * 返回「当前北京日历日 00:00」对应的 UTC 绝对时刻。
 * 用于以北京自然日为边界的查询（如当天去重窗口）。
 */
export function getBeijingTodayStart(now: Date = new Date()): Date {
  const beijingNow = toBeijing(now);
  const beijingMidnight = Date.UTC(
    beijingNow.getUTCFullYear(),
    beijingNow.getUTCMonth(),
    beijingNow.getUTCDate(),
    0,
    0,
    0,
    0,
  );
  return new Date(beijingMidnight - BEIJING_OFFSET_MS);
}

/** 返回「下一个北京日历日 00:00」对应的 UTC 绝对时刻，用于计算当日锁的剩余秒数 */
export function getBeijingNextMidnight(now: Date = new Date()): Date {
  return new Date(getBeijingTodayStart(now).getTime() + 24 * 3600 * 1000);
}

/**
 * 返回「北京时区某月 1 日 00:00」对应的 UTC 绝对时刻。
 * monthOffset=0 为本月，-1 为上月，用于月度环比统计的边界。
 */
export function getBeijingMonthStart(now: Date = new Date(), monthOffset = 0): Date {
  const beijingNow = toBeijing(now);
  const beijingMonthStart = Date.UTC(
    beijingNow.getUTCFullYear(),
    beijingNow.getUTCMonth() + monthOffset,
    1,
    0,
    0,
    0,
    0,
  );
  return new Date(beijingMonthStart - BEIJING_OFFSET_MS);
}
