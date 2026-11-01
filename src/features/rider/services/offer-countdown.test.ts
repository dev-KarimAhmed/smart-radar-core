import assert from 'node:assert/strict';
import test from 'node:test';

import { getOfferCountdown } from './offer-countdown';

test('getOfferCountdown returns active countdown when within wait_seconds window', () => {
  const now = 100_000;
  const firstSeen = 90_000; // 10 seconds ago
  const offer = { wait_seconds: 60 };

  const countdown = getOfferCountdown(offer, firstSeen, now);

  assert.equal(countdown.hasCountdown, true);
  assert.equal(countdown.isExpired, false);
  assert.equal(countdown.remainingSeconds, 50); // 60 - 10 = 50s
  assert.ok(countdown.percentRemaining > 80);
});

test('getOfferCountdown expires immediately when elapsed exceeds wait_seconds', () => {
  const now = 160_000;
  const firstSeen = 100_000; // 60 seconds ago
  const offer = { wait_seconds: 60 };

  const countdown = getOfferCountdown(offer, firstSeen, now);

  assert.equal(countdown.hasCountdown, true);
  assert.equal(countdown.isExpired, true);
  assert.equal(countdown.remainingSeconds, 0);
  assert.equal(countdown.percentRemaining, 0);
});

test('getOfferCountdown defaults to 90s when wait_seconds is missing or invalid', () => {
  const now = 100_000;
  const firstSeen = 90_000; // 10 seconds ago
  const offer = {}; // no wait_seconds

  const countdown = getOfferCountdown(offer, firstSeen, now);

  assert.equal(countdown.hasCountdown, true);
  assert.equal(countdown.isExpired, false);
  assert.equal(countdown.remainingSeconds, 80); // 90 - 10 = 80s
});

test('getOfferCountdown falls back to createdAt when firstSeenAtMs is undefined', () => {
  const now = new Date('2026-11-01T12:00:30Z').getTime();
  const createdAt = '2026-11-01T12:00:00Z'; // 30 seconds ago
  const offer = { wait_seconds: 60, createdAt };

  const countdown = getOfferCountdown(offer, undefined, now);

  assert.equal(countdown.hasCountdown, true);
  assert.equal(countdown.isExpired, false);
  assert.equal(countdown.remainingSeconds, 30); // 60 - 30 = 30s
});

test('getOfferCountdown expires properly using created_at fallback', () => {
  const now = new Date('2026-11-01T12:02:00Z').getTime();
  const created_at = '2026-11-01T12:00:00Z'; // 120 seconds ago
  const offer = { wait_seconds: 90, created_at };

  const countdown = getOfferCountdown(offer, undefined, now);

  assert.equal(countdown.hasCountdown, true);
  assert.equal(countdown.isExpired, true);
  assert.equal(countdown.remainingSeconds, 0);
  assert.equal(countdown.percentRemaining, 0);
});

