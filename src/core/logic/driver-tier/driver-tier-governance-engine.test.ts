import test from 'node:test';
import assert from 'node:assert/strict';
import {
  evaluateDriverTier,
  calculateUpwardScore,
  calculateDownwardScore,
  TIER_CAPABILITIES,
  UPWARD_TARGET_FAVORITES,
} from './driver-tier-governance-engine';
import {
  SAFETY_SHIELD_DURATION_DAYS,
  SAFETY_SHIELD_DURATION_MS,
  isShieldGracePeriodActive,
  resolveDownwardTransition,
} from './driver-tier-safety-shield';
import type { DriverTierEvaluationInput } from './driver-tier-types';

test('Upward score adheres strictly to 40% favorites / 35% activity / 25% rating', () => {
  const baseInput: DriverTierEvaluationInput = {
    captainId: 'cap-1',
    currentRank: 'BRONZE',
    evaluatedTripsCount: 20,
    ratingsCount: 20,
    upward: {
      uniqueRiderFavoritesCount: 100, // 100/100 = 1.0 * 40 = 40
      fieldActivityAndBroadcastScore: 1.0, // 1.0 * 35 = 35
      positivePassengerRatingScore: 1.0, // 1.0 * 25 = 25
    },
    downward: {
      documentedNegativeRatingScore: 0,
      inactivityScore: 0,
      favoriteRemovalScore: 0,
    },
  };

  const perfectScore = calculateUpwardScore(baseInput);
  assert.equal(perfectScore, 100);

  // Test isolated 40% favorites
  const favOnly = calculateUpwardScore({
    ...baseInput,
    upward: { uniqueRiderFavoritesCount: 50, fieldActivityAndBroadcastScore: 0, positivePassengerRatingScore: 0 },
  });
  // 50/100 * 40 = 20
  assert.equal(favOnly, 20);

  // Test isolated 35% activity
  const actOnly = calculateUpwardScore({
    ...baseInput,
    upward: { uniqueRiderFavoritesCount: 0, fieldActivityAndBroadcastScore: 1.0, positivePassengerRatingScore: 0 },
  });
  assert.equal(actOnly, 35);

  // Test isolated 25% positive rating
  const rateOnly = calculateUpwardScore({
    ...baseInput,
    upward: { uniqueRiderFavoritesCount: 0, fieldActivityAndBroadcastScore: 0, positivePassengerRatingScore: 1.0 },
  });
  assert.equal(rateOnly, 25);
});

test('Downward score adheres strictly to 60% negative / 30% inactivity / 10% removal', () => {
  const baseInput: DriverTierEvaluationInput = {
    captainId: 'cap-1',
    currentRank: 'GOLD',
    evaluatedTripsCount: 20,
    ratingsCount: 20,
    upward: { uniqueRiderFavoritesCount: 20, fieldActivityAndBroadcastScore: 0.5, positivePassengerRatingScore: 0.5 },
    downward: {
      documentedNegativeRatingScore: 1.0, // 1.0 * 60 = 60
      inactivityScore: 1.0, // 1.0 * 30 = 30
      favoriteRemovalScore: 1.0, // 1.0 * 10 = 10
    },
  };

  const maxDownward = calculateDownwardScore(baseInput);
  assert.equal(maxDownward, 100);

  // Negative rating alone (60%)
  const negOnly = calculateDownwardScore({
    ...baseInput,
    downward: { documentedNegativeRatingScore: 1.0, inactivityScore: 0, favoriteRemovalScore: 0 },
  });
  assert.equal(negOnly, 60);

  // Inactivity alone (30%)
  const inactOnly = calculateDownwardScore({
    ...baseInput,
    downward: { documentedNegativeRatingScore: 0, inactivityScore: 1.0, favoriteRemovalScore: 0 },
  });
  assert.equal(inactOnly, 30);

  // Favorite removal alone (10%)
  const remOnly = calculateDownwardScore({
    ...baseInput,
    downward: { documentedNegativeRatingScore: 0, inactivityScore: 0, favoriteRemovalScore: 1.0 },
  });
  assert.equal(remOnly, 10);
});

test('Data sufficiency: preserves rank without penalty when data is insufficient', () => {
  const input: DriverTierEvaluationInput = {
    captainId: 'cap-insufficient',
    currentRank: 'GOLD',
    evaluatedTripsCount: 2,
    ratingsCount: 2, // < 5 threshold
    upward: { uniqueRiderFavoritesCount: 2, fieldActivityAndBroadcastScore: 0.2, positivePassengerRatingScore: 0.2 },
    downward: { documentedNegativeRatingScore: 0.8, inactivityScore: 0.5, favoriteRemovalScore: 0.2 },
  };

  const result = evaluateDriverTier(input);
  assert.equal(result.decision, 'INSUFFICIENT_DATA');
  assert.equal(result.evaluatedRank, 'GOLD');
  assert.equal(result.isDataSufficient, false);
});

test('7-Day Safety Shield prevents instant demotion and requires human review', () => {
  const now = 1700000000000;
  const input: DriverTierEvaluationInput = {
    captainId: 'cap-threatened',
    currentRank: 'GOLD',
    evaluatedTripsCount: 25,
    ratingsCount: 25,
    currentTimeMs: now,
    upward: { uniqueRiderFavoritesCount: 20, fieldActivityAndBroadcastScore: 0.3, positivePassengerRatingScore: 0.4 },
    downward: {
      documentedNegativeRatingScore: 0.8, // 48
      inactivityScore: 0.3, // 9 -> total 57 >= 40 breach
      favoriteRemovalScore: 0,
    },
  };

  const result = evaluateDriverTier(input);
  assert.equal(result.decision, 'SHIELD_PROTECTED');
  assert.equal(result.evaluatedRank, 'GOLD'); // Not demoted immediately
  assert.ok(result.safetyShield);
  assert.equal(result.safetyShield.shieldActive, true);
  assert.equal(result.safetyShield.threatenedRank, 'GOLD');
  assert.equal(result.safetyShield.shieldExpiresAtMs, now + SAFETY_SHIELD_DURATION_MS);
  assert.equal(result.safetyShield.humanReviewRequired, true);

  // During active shield period, demotion remains blocked
  assert.equal(isShieldGracePeriodActive(result.safetyShield, now + 1000 * 60 * 60 * 24 * 3), true);

  // Manual human review resolution test
  const postReview = resolveDownwardTransition({
    currentRank: 'GOLD',
    targetRank: 'SILVER',
    activeShield: result.safetyShield,
    nowMs: now + SAFETY_SHIELD_DURATION_MS + 1000,
    humanReviewApprovedDemotion: true,
  });
  assert.equal(postReview.decision, 'DEMOTE');
  assert.equal(postReview.effectiveRank, 'SILVER');
});

test('Rank capabilities adhere to Sovereign V2.6 specifications', () => {
  assert.equal(TIER_CAPABILITIES.BRONZE.adCapacityMin, 5);
  assert.equal(TIER_CAPABILITIES.BRONZE.adCapacityMax, 10);
  assert.equal(TIER_CAPABILITIES.BRONZE.dispatchPrioritySeconds, 0);

  assert.equal(TIER_CAPABILITIES.SILVER.dispatchPrioritySeconds, 1.0);
  assert.equal(TIER_CAPABILITIES.SILVER.geographicScope, 'district_and_adjacent');

  assert.equal(TIER_CAPABILITIES.GOLD.cabinScreensEnabled, true);

  assert.equal(TIER_CAPABILITIES.PLATINUM.dispatchPrioritySeconds, 2.5);
  assert.equal(TIER_CAPABILITIES.PLATINUM.governorateNucleusEnabled, true);

  assert.equal(TIER_CAPABILITIES.DIAMOND.dispatchPrioritySeconds, 3.5);
  assert.equal(TIER_CAPABILITIES.DIAMOND.radarRangeKm, 4.0);
  assert.equal(TIER_CAPABILITIES.DIAMOND.geographicScope, 'nationwide');
  assert.equal(TIER_CAPABILITIES.DIAMOND.independentNucleusEnabled, true);
});
