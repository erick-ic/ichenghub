// 将旧版置顶状态迁移成列表顺序，此后顺序完全由用户控制。
export function migratePlatformOrder<T extends { pinned?: boolean }>(items: T[]): T[] {
  return [...items].sort((a, b) => Number(!!b.pinned) - Number(!!a.pinned))
    .map((item) => item.pinned ? { ...item, pinned: false } : item);
}

// 筛选时只调整可见卡片占据的位置，隐藏卡片保持原位。
export function movePlatform<T extends { id: string }>(items: T[], visibleIds: string[], from: string, to: string): T[] {
  const visible = new Set(visibleIds);
  const ordered = items.filter((item) => visible.has(item.id));
  const source = ordered.findIndex((item) => item.id === from);
  const target = ordered.findIndex((item) => item.id === to);
  if (source < 0 || target < 0 || source === target) return items;
  ordered.splice(target, 0, ordered.splice(source, 1)[0]);
  let index = 0;
  return items.map((item) => visible.has(item.id) ? ordered[index++] : item);
}
