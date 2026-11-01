import assert from 'node:assert/strict';
import test from 'node:test';

import { getOfferCountdown } from './offer-countdown';

const BASE_TIMESTAMP = 1_700_000_000_000; // Realistic ms timestamp

test('getOfferCountdown returns active countdown when within wait_seconds window', () => {
  const now = BASE_TIMESTAMP;
  const firstSeen = BASE_TIMESTAMP - 10_000; // 10 seconds ago
  const offer = { wait_seconds: 60 };

  const countdown = getOfferCountdown(offer, firstSeen, now);

  assert.equal(countdown.hasCountdown, true);
  assert.equal(countdown.isExpired, false);
  assert.equal(countdown.remainingSeconds, 50); // 60 - 10 = 50s
  assert.ok(countdown.percentRemaining > 80);
});

test('getOfferCountdown expires immediately when elapsed exceeds wait_seconds', () => {
  const now = BASE_TIMESTAMP;
  const firstSeen = BASE_TIMESTAMP - 60_000; // 60 seconds ago
  const offer = { wait_seconds: 60 };

  const countdown = getOfferCountdown(offer, firstSeen, now);

  assert.equal(countdown.hasCountdown, true);
  assert.equal(countdown.isExpired, true);
  assert.equal(countdown.remainingSeconds, 0);
  assert.equal(countdown.percentRemaining, 0);
});

test('getOfferCountdown defaults to 90s when wait_seconds is missing or invalid', () => {
  const now = BASE_TIMESTAMP;
  const firstSeen = BASE_TIMESTAMP - 10_000; // 10 seconds ago
  const offer = {}; // no wait_seconds

  const countdown = getOfferCountdown(offer, firstSeen, now);

  assert.equal(countdown.hasCountdown, true);
  assert.equal(countdown.isExpired, false);
  assert.equal(countdown.remainingSeconds, 80); // 90 - 10 = 80s
});

test('getOfferCountdown prioritizes created_at over firstSeenAtMs so rider and captain expire in lockstep', () => {
  const now = BASE_TIMESTAMP;
  // Offer created 120s ago with wait_seconds = 120
  const created_at = new Date(now - 120_000).toISOString();
  // Rider polled it only 10s ago
  const firstSeen = now - 10_000;
  const offer = { wait_seconds: 120, created_at };

  const countdown = getOfferCountdown(offer, firstSeen, now);

  assert.equal(countdown.hasCountdown, true);
  assert.equal(countdown.isExpired, true, 'must be expired since 120s elapsed from created_at');
  assert.equal(countdown.remainingSeconds, 0);
});

test('getOfferCountdown accurately reflects remaining seconds from created_at', () => {
  const now = BASE_TIMESTAMP;
  // Offer created 100s ago with wait_seconds = 120 -> 20s remaining
  const created_at = new Date(now - 100_000).toISOString();
  // Rider saw it 5s ago
  const firstSeen = now - 5_000;
  const offer = { wait_seconds: 120, created_at };

  const countdown = getOfferCountdown(offer, firstSeen, now);

  assert.equal(countdown.hasCountdown, true);
  assert.equal(countdown.isExpired, false);
  assert.equal(countdown.remainingSeconds, 20); // 120 - 100 = 20s
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

test('getOfferCountdown caps wait_seconds at MAX_OFFER_COUNTDOWN_SECONDS (180s) preventing 11+ min timers', () => {
  const now = BASE_TIMESTAMP;
  const firstSeen = BASE_TIMESTAMP;
  // Captain entered 900s (15 mins)
  const offer = { wait_seconds: 900 };

  const countdown = getOfferCountdown(offer, firstSeen, now);

  assert.equal(countdown.hasCountdown, true);
  assert.equal(countdown.isExpired, false);
  assert.equal(countdown.remainingSeconds, 180, 'Must be clamped to 180 seconds');
});

test('getOfferCountdown clamps remaining seconds by maxAllowedRemainingSeconds', () => {
  const now = BASE_TIMESTAMP;
  const firstSeen = BASE_TIMESTAMP;
  const offer = { wait_seconds: 120 };

  // Ride request has only 35s remaining of its 4-minute lifespan
  const countdown = getOfferCountdown(offer, firstSeen, now, 35);

  assert.equal(countdown.hasCountdown, true);
  assert.equal(countdown.isExpired, false);
  assert.equal(countdown.remainingSeconds, 35, 'Must not exceed request remaining lifetime');
});

test('getOfferCountdown immediately expires when maxAllowedRemainingSeconds is 0 (search ended)', () => {
  const now = BASE_TIMESTAMP;
  const firstSeen = BASE_TIMESTAMP;
  const offer = { wait_seconds: 120 };

  // 4 minutes search ended
  const countdown = getOfferCountdown(offer, firstSeen, now, 0);

  assert.equal(countdown.hasCountdown, true);
  assert.equal(countdown.isExpired, true, 'Must be expired when trip search time reached 0');
  assert.equal(countdown.remainingSeconds, 0);
  assert.equal(countdown.percentRemaining, 0);
});
