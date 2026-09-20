import assert from 'node:assert/strict';
import { test } from 'node:test';
import { normalizeCheckIns } from './check-ins';
import { resetForNewDay, toggleCheckIn } from './quota-state';
import type { Platform } from './AiQuotaTracker';

const today = '2026-09-20';

function makePlatform(): Platform {
  return {
    id: 'platform', nameZh: '测试', nameEn: 'Test',
    indicators: [
      { id: 'daily', nameZh: '每日', nameEn: 'Daily', used: 3, limit: 10, resetDaily: true },
      { id: 'persistent', nameZh: '累计', nameEn: 'Total', used: 7, limit: 20, resetDaily: false },
    ],
    balance: { current: 100, initial: 20, resetDaily: false },
    checkIns: [
      { id: 'first', nameZh: '签到一', reward: 10 },
      { id: 'second', nameZh: '签到二', reward: 20 },
    ],
  };
}

test('legacy single check-in migrates and retains completion and credited amount', () => {
  const items = normalizeCheckIns(undefined, {
    enabled: true, nameZh: '旧签到', reward: 100,
    completedDate: today, creditedAmount: 100,
  });
  assert.equal(items.length, 1);
  assert.equal(items[0].id, 'legacy-check-in-0');
  assert.equal(items[0].completedDate, today);
  assert.equal(items[0].creditedAmount, 100);
  assert.deepEqual(normalizeCheckIns(undefined, { enabled: false, reward: 100 }), []);
});

test('multiple check-ins accrue and undo independently', () => {
  const first = toggleCheckIn(makePlatform(), 'first', today);
  assert.equal(first.balance?.current, 110);
  assert.equal(first.checkIns?.[0].completedDate, today);
  assert.equal(first.checkIns?.[1].completedDate, undefined);

  const both = toggleCheckIn(first, 'second', today);
  assert.equal(both.balance?.current, 130);
  assert.equal(both.checkIns?.[1].completedDate, today);

  const undone = toggleCheckIn(both, 'first', today);
  assert.equal(undone.balance?.current, 120);
  assert.equal(undone.checkIns?.[0].completedDate, undefined);
  assert.equal(undone.checkIns?.[1].completedDate, today);
});

test('undo uses credited amount even after configured reward changes', () => {
  const claimed = toggleCheckIn(makePlatform(), 'first', today);
  claimed.checkIns![0].reward = 99;
  assert.equal(toggleCheckIn(claimed, 'first', today).balance?.current, 100);
});

test('check-in without a balance only changes its own status', () => {
  const platform = makePlatform();
  platform.balance = undefined;
  const claimed = toggleCheckIn(platform, 'first', today);
  assert.equal(claimed.balance, undefined);
  assert.equal(claimed.checkIns?.[0].creditedAmount, 0);
  assert.equal(claimed.checkIns?.[1].completedDate, undefined);
});

test('next-day reset applies selected rules to every check-in', () => {
  let platform = toggleCheckIn(toggleCheckIn(makePlatform(), 'first', today), 'second', today);
  const reset = resetForNewDay(platform);
  assert.deepEqual(reset.indicators.map((ind) => ind.used), [0, 7]);
  assert.equal(reset.balance?.current, 130);
  assert.deepEqual(reset.checkIns?.map((item) => item.completedDate), [undefined, undefined]);
  assert.equal(toggleCheckIn(reset, 'first', '2026-09-21').balance?.current, 140);

  platform = { ...platform, balance: { current: 130, initial: 20, resetDaily: true } };
  assert.equal(resetForNewDay(platform).balance?.current, 20);
});

test('exported multiple check-ins normalize after JSON round trip', () => {
  const original = makePlatform().checkIns;
  const restored = normalizeCheckIns(JSON.parse(JSON.stringify(original)));
  assert.deepEqual(restored.map(({ id, nameZh, reward, completedDate }) => ({ id, nameZh, reward, completedDate })),
    original?.map(({ id, nameZh, reward, completedDate }) => ({ id, nameZh, reward, completedDate })));
});
