import assert from 'node:assert/strict';
import { buildDetailedStarsPayload } from './rating-types';

async function runTests() {
  // Test 1: Full 5-star rating with compliant ad and favorite
  const payload1 = buildDetailedStarsPayload({
    captain: {
      adCompliance: 'compliant',
      communication: 5,
    },
    vehicle: {
      interior: 5,
      exterior: 5,
      comfort: 5,
    },
    isFavorite: true,
  });

  assert.deepEqual(payload1.captain, {
    ad_compliance: 1,
    communication: 1.0,
  });
  assert.deepEqual(payload1.vehicle, {
    interior: 1.0,
    exterior: 1.0,
    comfort: 1.0,
  });
  assert.equal(payload1.raw_scores.is_favorite, true);
  assert.equal(payload1.raw_scores.ad_compliance, 'compliant');

  // Test 2: Non-compliant ad with 4-star communication
  const payload2 = buildDetailedStarsPayload({
    captain: {
      adCompliance: 'non_compliant',
      communication: 4,
    },
    vehicle: {
      interior: 3,
      exterior: 4,
      comfort: 5,
    },
    isFavorite: false,
  });

  assert.deepEqual(payload2.captain, {
    ad_compliance: 0,
    communication: 0.8,
  });
  assert.deepEqual(payload2.vehicle, {
    interior: 0.6,
    exterior: 0.8,
    comfort: 1.0,
  });
  assert.equal(payload2.raw_scores.ad_compliance, 'non_compliant');

  // Test 3: Unrated items are omitted from payload so they don't count against captain
  const payload3 = buildDetailedStarsPayload({
    captain: {
      adCompliance: null,
      communication: 0,
    },
    vehicle: {
      interior: 5,
      exterior: 0,
      comfort: 0,
    },
    isFavorite: false,
  });

  assert.deepEqual(payload3.captain, {});
  assert.deepEqual(payload3.vehicle, {
    interior: 1.0,
  });

  // Test 4: Sovereign 72-Hour Rating Memory Window
  const now = 1700000000000;
  const recentTripTime = now - (24 * 60 * 60 * 1000); // 24 hours ago
  const expiredTripTime = now - (73 * 60 * 60 * 1000); // 73 hours ago

  const { isRatingWindowExpired, RATING_MEMORY_WINDOW_HOURS } = await import('./rating-types');
  assert.equal(RATING_MEMORY_WINDOW_HOURS, 72);
  assert.equal(isRatingWindowExpired(recentTripTime, now), false, '24h trip should be within active rating window');
  assert.equal(isRatingWindowExpired(expiredTripTime, now), true, '73h trip should be flagged as expired window');
  assert.equal(isRatingWindowExpired(null, now), false, 'Missing timestamp should not throw');

  console.log('All Dual-Entity Rating payload unit tests passed successfully!');
}

void runTests();
