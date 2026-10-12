import assert from 'node:assert/strict';
import test from 'node:test';

import { computeTripCountdown, formatCountdown, tripCountdownPhase } from './trip-countdown';

const MINUTE = 60_000;
const ACCEPTED_AT = Date.parse('2026-09-03T10:00:00Z');
const STARTED_AT = Date.parse('2026-09-03T10:08:00Z');

test('the pickup countdown starts from the captain\'s distance, not the trip length', () => {
  // 30 km trip, captain 2 km away. The old formula produced 30 * 85s = 42 minutes for the
  // captain's arrival, because it read the trip's distance.
  const countdown = computeTripCountdown({
    status: 'ACCEPTED',
    acceptedAtMs: ACCEPTED_AT,
    pickupEtaMinutes: 6,
    tripDurationMinutes: 41,
    tripDistanceKm: 30,
    nowMs: ACCEPTED_AT,
  });

  assert.equal(countdown.phase, 'TO_PICKUP');
  assert.equal(countdown.totalSeconds, 6 * 60);
  assert.equal(countdown.display, '6:00');
});

test('once rolling it restarts from the routed trip duration', () => {
  const countdown = computeTripCountdown({
    status: 'TRIP_ACTIVE',
    acceptedAtMs: ACCEPTED_AT,
    startedAtMs: STARTED_AT,
    pickupEtaMinutes: 6,
    tripDurationMinutes: 41,
    nowMs: STARTED_AT,
  });

  assert.equal(countdown.phase, 'ON_TRIP');
  assert.equal(countdown.totalSeconds, 41 * 60);
  assert.equal(countdown.display, '41:00');
});

test('it counts down against the server anchor, so it survives a reload', () => {
  // Same anchor, "now" four minutes later — as if the rider reloaded mid-approach. The old
  // interval-based countdown reseeded from the top on every rebuild of activeTrip.
  const countdown = computeTripCountdown({
    status: 'ACCEPTED',
    acceptedAtMs: ACCEPTED_AT,
    pickupEtaMinutes: 6,
    nowMs: ACCEPTED_AT + 4 * MINUTE,
  });

  assert.equal(countdown.remainingSeconds, 2 * 60);
  assert.equal(countdown.display, '2:00');
});

test('past the estimate it counts UP rather than freezing at zero', () => {
  const countdown = computeTripCountdown({
    status: 'ACCEPTED',
    acceptedAtMs: ACCEPTED_AT,
    pickupEtaMinutes: 6,
    nowMs: ACCEPTED_AT + 9 * MINUTE + 30_000,
  });

  assert.equal(countdown.remainingSeconds, 0);
  assert.equal(countdown.overdueSeconds, 3 * 60 + 30);
  assert.equal(countdown.isOverdue, true);
  assert.equal(countdown.display, '+3:30');
});

test('no server anchor means a dash, never a countdown seeded from now', () => {
  const countdown = computeTripCountdown({
    status: 'ACCEPTED',
    acceptedAtMs: null,
    pickupEtaMinutes: 6,
    nowMs: ACCEPTED_AT,
  });

  assert.equal(countdown.hasCountdown, false);
  assert.equal(countdown.display, '--:--');
  assert.equal(countdown.phase, 'TO_PICKUP');
});

test('arrival stops the clock instead of leaving the approach running', () => {
  const countdown = computeTripCountdown({
    status: 'ARRIVED',
    acceptedAtMs: ACCEPTED_AT,
    arrivedAtMs: ACCEPTED_AT + 5 * MINUTE,
    pickupEtaMinutes: 6,
    nowMs: ACCEPTED_AT + 7 * MINUTE,
  });

  assert.equal(countdown.phase, 'AT_PICKUP');
  assert.equal(countdown.hasCountdown, false);
  assert.equal(countdown.display, '0:00');
});

test('a finished or cancelled trip counts nothing', () => {
  for (const status of ['COMPLETED', 'CANCELLED', 'PENDING', 'RECEIVING_OFFERS', '']) {
    assert.equal(tripCountdownPhase(status), 'NONE', status || '(empty)');
  }
});

test('a device clock running ahead of the server does not eat the countdown', () => {
  const countdown = computeTripCountdown({
    status: 'TRIP_ACTIVE',
    startedAtMs: STARTED_AT,
    tripDurationMinutes: 20,
    nowMs: STARTED_AT - 90 * MINUTE, // phone is an hour and a half behind
  });

  assert.equal(countdown.remainingSeconds, 20 * 60);
  assert.equal(countdown.isOverdue, false);
});

test('durations fall back to the shared estimators when the server has no routed value', () => {
  const pickup = computeTripCountdown({
    status: 'ACCEPTED',
    acceptedAtMs: ACCEPTED_AT,
    pickupEtaMinutes: null,
    pickupDistanceKm: 3,
    nowMs: ACCEPTED_AT,
  });
  // estimatePickupMinutes: 3 min/km
  assert.equal(pickup.totalSeconds, 9 * 60);

  const trip = computeTripCountdown({
    status: 'STARTED',
    startedAtMs: STARTED_AT,
    tripDurationMinutes: null,
    tripDistanceKm: 10,
    nowMs: STARTED_AT,
  });
  // estimateTripMinutes: 10 km urban at 40 km/h
  assert.equal(trip.totalSeconds, 15 * 60);
});

test('no duration source is a dash, not a one-minute countdown', () => {
  // eta_minutes on ride_offers is NOT NULL with a default of 5, so "unknown" has to travel
  // as an absent value. If it does and we still invented a duration, the rider would get a
  // 1-minute countdown that is overdue a minute later — the same lie in a smaller number.
  const countdown = computeTripCountdown({
    status: 'ACCEPTED',
    acceptedAtMs: ACCEPTED_AT,
    pickupEtaMinutes: null,
    pickupDistanceKm: null,
    nowMs: ACCEPTED_AT,
  });

  assert.equal(countdown.hasCountdown, false);
  assert.equal(countdown.display, '--:--');
});

test('past an hour the display grows an hours field', () => {
  assert.equal(formatCountdown(95 * 60 + 12), '1:35:12');
  assert.equal(formatCountdown(59 * 60 + 59), '59:59');
  assert.equal(formatCountdown(0), '0:00');
  assert.equal(formatCountdown(45, true), '+0:45');
});

console.log('trip countdown checks passed');
