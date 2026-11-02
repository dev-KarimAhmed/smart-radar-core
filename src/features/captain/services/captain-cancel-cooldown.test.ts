import assert from 'node:assert/strict';
import test from 'node:test';
import {
  setCaptainCancelCooldown,
  getCaptainCancelCooldown,
  clearCaptainCancelCooldown,
  calculateRemainingCooldown,
  formatSecondsToMMSS,
} from './captain-cancel-cooldown';

// Mock localStorage for test environment
const storage = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => storage.get(k) ?? null,
  setItem: (k: string, v: string) => storage.set(k, v),
  removeItem: (k: string) => storage.delete(k),
  clear: () => storage.clear(),
};
(globalThis as any).window = {
  dispatchEvent: () => true,
};

test('captain cancel cooldown starts inactive when no record exists', () => {
  storage.clear();
  const state = getCaptainCancelCooldown();
  assert.equal(state.isActive, false);
  assert.equal(state.remainingSeconds, 0);
});

test('captain cancel cooldown activates for specified trip duration', () => {
  storage.clear();
  // 20 minute trip
  setCaptainCancelCooldown(20);
  const state = getCaptainCancelCooldown();
  assert.equal(state.isActive, true);
  assert.equal(state.totalMinutes, 20);
  assert.ok(state.remainingSeconds > 19 * 60 && state.remainingSeconds <= 20 * 60);
});

test('captain cancel cooldown auto-expires when timestamp has elapsed', () => {
  storage.clear();
  // Set expired timestamp in the past
  storage.set('radar_captain_cancel_cooldown_until', String(Date.now() - 5000));
  storage.set('radar_captain_cancel_cooldown_minutes', '20');

  const state = getCaptainCancelCooldown();
  assert.equal(state.isActive, false);
  assert.equal(state.remainingSeconds, 0);
  assert.equal(storage.get('radar_captain_cancel_cooldown_until'), undefined);
});

test('clearing captain cancel cooldown resets immediately', () => {
  setCaptainCancelCooldown(30);
  assert.equal(getCaptainCancelCooldown().isActive, true);

  clearCaptainCancelCooldown();
  assert.equal(getCaptainCancelCooldown().isActive, false);
});

test('calculateRemainingCooldown: full duration when trip has not started', () => {
  const res = calculateRemainingCooldown(60, null);
  assert.equal(res.remainingMinutes, 60);
  assert.equal(res.remainingSeconds, 3600);
  assert.equal(res.elapsedSeconds, 0);
});

test('calculateRemainingCooldown: freezes ONLY remaining duration when cancelled halfway (e.g. 60 min trip, 30 min elapsed -> 30 min cooldown)', () => {
  const now = Date.now();
  const startedAt = now - 30 * 60 * 1000; // 30 minutes ago
  const res = calculateRemainingCooldown(60, startedAt, now);
  assert.equal(res.remainingMinutes, 30);
  assert.equal(res.remainingSeconds, 1800);
  assert.equal(res.elapsedSeconds, 1800);
});

test('calculateRemainingCooldown: freezes 10 min remaining when 50 min elapsed on 60 min trip', () => {
  const now = Date.now();
  const startedAt = now - 50 * 60 * 1000; // 50 minutes ago
  const res = calculateRemainingCooldown(60, startedAt, now);
  assert.equal(res.remainingMinutes, 10);
  assert.equal(res.remainingSeconds, 600);
  assert.equal(res.elapsedSeconds, 3000);
});

test('calculateRemainingCooldown: zero cooldown if trip exceeded estimated duration before cancel', () => {
  const now = Date.now();
  const startedAt = now - 25 * 60 * 1000; // 25 minutes ago on a 20 min trip
  const res = calculateRemainingCooldown(20, startedAt, now);
  assert.equal(res.remainingMinutes, 0);
  assert.equal(res.remainingSeconds, 0);
  assert.equal(res.elapsedSeconds, 1500);
});

test('setCaptainCancelCooldown with 0 minutes or 0 seconds clears cooldown', () => {
  setCaptainCancelCooldown(20);
  assert.equal(getCaptainCancelCooldown().isActive, true);

  setCaptainCancelCooldown(0, 0);
  assert.equal(getCaptainCancelCooldown().isActive, false);
});

test('formatSecondsToMMSS correctly formats minutes and seconds', () => {
  assert.equal(formatSecondsToMMSS(0), '0:00');
  assert.equal(formatSecondsToMMSS(45), '0:45');
  assert.equal(formatSecondsToMMSS(1200), '20:00');
  assert.equal(formatSecondsToMMSS(1199), '19:59');
  assert.equal(formatSecondsToMMSS(3665), '1:01:05');
});
