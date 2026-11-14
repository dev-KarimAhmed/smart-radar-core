import assert from 'node:assert/strict';
import test from 'node:test';
import {
  calculateRemainingCooldown,
  toEpochMs,
} from './captain-cancel-cooldown';

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
// =========================================================================
test('calculateRemainingCooldown: cancelled before start with acceptedAt and pickupEta yields 0 freeze', () => {
  const acceptedAt = new Date('2026-11-02T10:00:00.000Z').getTime();
  const pickupEtaMinutes = 10;
  const cancellationTime = new Date('2026-11-02T10:20:00.000Z').getTime();

  const result = calculateRemainingCooldown({
    totalTripMinutes: 60,
    startedAtMs: null,
    acceptedAtMs: acceptedAt,
    pickupEtaMinutes,
    cancellationTime,
  });

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
// REQUIREMENT 6: Handle timezone and date-time consistency properly
// =========================================================================
test('calculateRemainingCooldown: timezone consistency across ISO strings, Date objects, and epoch ms', () => {
  const startIsoWithOffset = '2026-11-02T13:00:00.000+03:00';
  const cancelIsoWithDiffOffset = '2026-11-02T10:30:00.000Z';

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
