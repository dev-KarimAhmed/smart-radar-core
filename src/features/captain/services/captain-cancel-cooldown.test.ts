import assert from 'node:assert/strict';
import test from 'node:test';
import {
  setCaptainCancelCooldown,
  getCaptainCancelCooldown,
  clearCaptainCancelCooldown,
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

