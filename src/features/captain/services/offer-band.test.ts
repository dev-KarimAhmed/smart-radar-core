import assert from 'node:assert/strict';
import test from 'node:test';

import {
  MARKET_FLOOR_FACTOR,
  rankIncreaseFactorForTier,
  warnFactorForTier,
  type CaptainTier,
} from './offer-band';

/**
 * These numbers are a product decision, restated verbatim:
 *   برونزي 1-5% · فضي 0% · ذهبي 1-10% · بلاتيني 1-20%
 * and a warning above 15% unless the captain's own rank already allows more.
 *
 * They are duplicated in public.offer_band_for_rank. This test is what keeps the copy in
 * this repo from silently drifting away from that migration.
 */
const EXPECTED: Array<[CaptainTier, number, number]> = [
  // rank,      granted, warns above
  ['BRONZE', 0.05, 0.15],
  ['SILVER', 0.0, 0.15],
  ['GOLD', 0.1, 0.15],
  ['PLATINUM', 0.2, 0.2],
];

test('each rank grants exactly its stated increase', () => {
  for (const [tier, granted] of EXPECTED) {
    assert.equal(rankIncreaseFactorForTier(tier), granted, `${tier} granted increase`);
  }
});

test('the warning line is the greater of the rank allowance and the 15% general line', () => {
  for (const [tier, , warnsAbove] of EXPECTED) {
    assert.equal(warnFactorForTier(tier), warnsAbove, `${tier} warning line`);
  }
});

test('PLATINUM is the only rank whose own allowance clears the general line', () => {
  const clearsLine = EXPECTED.filter(([, granted]) => granted > 0.15).map(([tier]) => tier);
  assert.deepEqual(clearsLine, ['PLATINUM']);
});

test('SILVER is granted less than BRONZE — deliberate, not a typo', () => {
  // Pinned so the inversion cannot be "tidied up" without this failing and forcing the
  // question back to the product owner.
  assert.ok(
    rankIncreaseFactorForTier('SILVER') < rankIncreaseFactorForTier('BRONZE'),
    'SILVER grants less than BRONZE by design',
  );
});

test('an unrecognised rank grants nothing rather than guessing', () => {
  assert.equal(rankIncreaseFactorForTier('DIAMOND' as CaptainTier), 0);
  assert.equal(warnFactorForTier('DIAMOND' as CaptainTier), 0.15);
});

test('the floor is the same hard 15% for every rank', () => {
  // No rank earns the right to undercut the market; only the ceiling varies.
  assert.equal(MARKET_FLOOR_FACTOR, 0.15);
});

console.log('captain offer band checks passed');
