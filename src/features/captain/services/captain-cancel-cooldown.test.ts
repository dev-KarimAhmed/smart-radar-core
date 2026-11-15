import assert from 'node:assert/strict';
import test from 'node:test';
import {
  setCaptainCancelCooldown,
  getCaptainCancelCooldown,
  clearCaptainCancelCooldown,
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
  setCaptainCancelCooldown(20);
  const state = getCaptainCancelCooldown();
  assert.equal(state.isActive, true);
  assert.equal(state.totalMinutes, 20);
  assert.ok(state.remainingSeconds > 19 * 60 && state.remainingSeconds <= 20 * 60);
});

test('captain cancel cooldown auto-expires when timestamp has elapsed', () => {
  storage.clear();
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

// =========================================================================
// REQUIREMENT 5: Ensure captain's freeze period is updated correctly with calculated remaining duration
// =========================================================================
test('setCaptainCancelCooldown correctly locks captain for remaining duration using scheduledEndTimeMs', () => {
  storage.clear();
  const now = Date.now();
  const targetEnd = now + 25 * 60 * 1000; // 25 minutes from now

  setCaptainCancelCooldown(25, 1500, targetEnd);
  const state = getCaptainCancelCooldown();

  assert.equal(state.isActive, true);
  assert.equal(state.totalMinutes, 25);
  assert.ok(state.remainingSeconds > 24 * 60 && state.remainingSeconds <= 25 * 60);
});

test('setCaptainCancelCooldown with 0 minutes or 0 seconds clears cooldown immediately', () => {
  setCaptainCancelCooldown(20);
  assert.equal(getCaptainCancelCooldown().isActive, true);

  setCaptainCancelCooldown(0, 0);
  assert.equal(getCaptainCancelCooldown().isActive, false);
});

test('setCaptainCancelCooldown with past target timestamp clears cooldown', () => {
  setCaptainCancelCooldown(20);
  assert.equal(getCaptainCancelCooldown().isActive, true);

  setCaptainCancelCooldown(0, 0, Date.now() - 1000);
  assert.equal(getCaptainCancelCooldown().isActive, false);
});

test('formatSecondsToMMSS correctly formats minutes and seconds', () => {
  assert.equal(formatSecondsToMMSS(0), '0:00');
  assert.equal(formatSecondsToMMSS(45), '0:45');
  assert.equal(formatSecondsToMMSS(1200), '20:00');
  assert.equal(formatSecondsToMMSS(1199), '19:59');
  assert.equal(formatSecondsToMMSS(3665), '1:01:05');
});
