import assert from 'node:assert/strict';
import test from 'node:test';
import {
  setCaptainCancelCooldown,
  getCaptainCancelCooldown,
  clearCaptainCancelCooldown,
  calculateRemainingCooldown,
  formatSecondsToMMSS,
  toEpochMs,
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
// REQUIREMENT 1 & USER EXAMPLE:
// - Trip duration: 60 minutes.
// - Trip starts at 10:00 AM.
// - Trip gets cancelled at 10:30 AM.
// - Elapsed time: 30 minutes.
// - Remaining time: 30 minutes.
// - Freeze duration must be 30 minutes only, not 60 minutes.
// =========================================================================
test('calculateRemainingCooldown: exact user example (60 min trip, cancelled after 30 min -> 30 min freeze)', () => {
  const startTime = new Date('2026-11-02T10:00:00.000Z').getTime();
  const cancellationTime = new Date('2026-11-02T10:30:00.000Z').getTime();
  const tripDurationMinutes = 60;

  const result = calculateRemainingCooldown({
    totalTripMinutes: tripDurationMinutes,
    startedAtMs: startTime,
    cancellationTime,
  });

  assert.equal(result.remainingMinutes, 30);
  assert.equal(result.remainingSeconds, 1800);
  assert.equal(result.elapsedSeconds, 1800);
  assert.equal(result.freezeDurationMs, 30 * 60 * 1000);
  assert.equal(result.scheduledEndTimeMs, new Date('2026-11-02T11:00:00.000Z').getTime());
});

// =========================================================================
// REQUIREMENT 2: Do not use the original trip duration as the freeze duration
// =========================================================================
test('calculateRemainingCooldown: does not use original duration (60 min trip, cancelled after 50 min -> 10 min freeze)', () => {
  const startTime = new Date('2026-11-02T10:00:00.000Z').getTime();
  const cancellationTime = new Date('2026-11-02T10:50:00.000Z').getTime();

  const result = calculateRemainingCooldown({
    totalTripMinutes: 60,
    startedAtMs: startTime,
    cancellationTime,
  });

  assert.equal(result.remainingMinutes, 10);
  assert.equal(result.remainingSeconds, 600);
  assert.equal(result.elapsedSeconds, 3000);
  assert.notEqual(result.remainingMinutes, 60);
});

// =========================================================================
// REQUIREMENT 3: If cancelled BEFORE trip starts, captain must NOT be frozen
// (Freeze duration must be ZERO so captain is not locked out or disabled)
// =========================================================================
test('calculateRemainingCooldown: cancelled before start with acceptedAt and pickupEta yields 0 freeze', () => {
  const acceptedAt = new Date('2026-11-02T10:00:00.000Z').getTime();
  const pickupEtaMinutes = 10;
  const cancellationTime = new Date('2026-11-02T10:20:00.000Z').getTime(); // cancelled before start

  const result = calculateRemainingCooldown({
    totalTripMinutes: 60,
    startedAtMs: null,
    acceptedAtMs: acceptedAt,
    pickupEtaMinutes,
    cancellationTime,
  });

  // Sovereign Rule: Since trip never started, freeze duration is 0
  assert.equal(result.remainingMinutes, 0);
  assert.equal(result.remainingSeconds, 0);
  assert.equal(result.freezeDurationMs, 0);
  assert.equal(result.elapsedSeconds, 0);
});

test('calculateRemainingCooldown: cancelled before start when captain has arrived at pickup yields 0 freeze', () => {
  const arrivedAt = new Date('2026-11-02T10:10:00.000Z').getTime();
  const cancellationTime = new Date('2026-11-02T10:20:00.000Z').getTime();

  const result = calculateRemainingCooldown({
    totalTripMinutes: 40,
    startedAtMs: null,
    arrivedAtMs: arrivedAt,
    cancellationTime,
  });

  // Sovereign Rule: Since trip never started, freeze duration is 0
  assert.equal(result.remainingMinutes, 0);
  assert.equal(result.remainingSeconds, 0);
  assert.equal(result.freezeDurationMs, 0);
  assert.equal(result.elapsedSeconds, 0);
});

test('calculateRemainingCooldown: unilateral cancel before start without startedAtMs yields 0 freeze', () => {
  const cancellationTime = Date.now();

  const result = calculateRemainingCooldown({
    totalTripMinutes: 30,
    startedAtMs: null,
    cancellationTime,
  });

  assert.equal(result.remainingMinutes, 0);
  assert.equal(result.remainingSeconds, 0);
  assert.equal(result.freezeDurationMs, 0);
});

test('calculateRemainingCooldown: cancellation prior to start timestamp yields 0 freeze', () => {
  const now = Date.now();
  const futureStart = now + 5000;

  const result = calculateRemainingCooldown({
    totalTripMinutes: 30,
    startedAtMs: futureStart,
    cancellationTime: now,
  });

  assert.equal(result.remainingMinutes, 0);
  assert.equal(result.remainingSeconds, 0);
  assert.equal(result.freezeDurationMs, 0);
});

// =========================================================================
// REQUIREMENT 4: If cancelled after scheduled end time, freeze duration should be zero
// =========================================================================
test('calculateRemainingCooldown: zero freeze if cancelled after scheduled end time on active trip', () => {
  const startTime = new Date('2026-11-02T10:00:00.000Z').getTime();
  // Scheduled end: 11:00 AM. Cancelled at 11:05 AM (overdue by 5 min)
  const cancellationTime = new Date('2026-11-02T11:05:00.000Z').getTime();

  const result = calculateRemainingCooldown({
    totalTripMinutes: 60,
    startedAtMs: startTime,
    cancellationTime,
  });

  assert.equal(result.remainingMinutes, 0);
  assert.equal(result.remainingSeconds, 0);
  assert.equal(result.freezeDurationMs, 0);
});

test('calculateRemainingCooldown: zero freeze if cancelled before start but after scheduled end time', () => {
  const acceptedAt = new Date('2026-11-02T10:00:00.000Z').getTime();
  // Scheduled end: 10:00 AM + 30 min = 10:30 AM. Cancelled at 10:45 AM
  const cancellationTime = new Date('2026-11-02T10:45:00.000Z').getTime();

  const result = calculateRemainingCooldown({
    totalTripMinutes: 30,
    startedAtMs: null,
    acceptedAtMs: acceptedAt,
    cancellationTime,
  });

  assert.equal(result.remainingMinutes, 0);
  assert.equal(result.remainingSeconds, 0);
  assert.equal(result.freezeDurationMs, 0);
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

// =========================================================================
// REQUIREMENT 6: Handle timezone and date-time consistency properly
// =========================================================================
test('calculateRemainingCooldown: timezone consistency across ISO strings, Date objects, and epoch ms', () => {
  // 10:00 UTC represented with +03:00 timezone (13:00 +03:00) vs UTC string vs Date object
  const startIsoWithOffset = '2026-11-02T13:00:00.000+03:00';
  const cancelIsoWithDiffOffset = '2026-11-02T10:30:00.000Z'; // 30 minutes later in UTC

  const res1 = calculateRemainingCooldown({
    totalTripMinutes: 60,
    startedAtMs: startIsoWithOffset,
    cancellationTime: cancelIsoWithDiffOffset,
  });

  const res2 = calculateRemainingCooldown({
    totalTripMinutes: 60,
    startedAtMs: new Date(startIsoWithOffset),
    cancellationTime: new Date(cancelIsoWithDiffOffset),
  });

  const res3 = calculateRemainingCooldown({
    totalTripMinutes: 60,
    startedAtMs: toEpochMs(startIsoWithOffset),
    cancellationTime: toEpochMs(cancelIsoWithDiffOffset),
  });

  assert.equal(res1.remainingMinutes, 30);
  assert.equal(res1.remainingSeconds, 1800);
  assert.equal(res1.remainingSeconds, res2.remainingSeconds);
  assert.equal(res1.remainingSeconds, res3.remainingSeconds);
  assert.equal(res1.scheduledEndTimeMs, res2.scheduledEndTimeMs);
});

// =========================================================================
// BACKWARD COMPATIBILITY: Positional parameters support
// =========================================================================
test('calculateRemainingCooldown: backward compatible positional parameters', () => {
  const now = Date.now();
  const startedAt = now - 30 * 60 * 1000;
  const res = calculateRemainingCooldown(60, startedAt, now);

  assert.equal(res.remainingMinutes, 30);
  assert.equal(res.remainingSeconds, 1800);
});

test('formatSecondsToMMSS correctly formats minutes and seconds', () => {
  assert.equal(formatSecondsToMMSS(0), '0:00');
  assert.equal(formatSecondsToMMSS(45), '0:45');
  assert.equal(formatSecondsToMMSS(1200), '20:00');
  assert.equal(formatSecondsToMMSS(1199), '19:59');
  assert.equal(formatSecondsToMMSS(3665), '1:01:05');
});
