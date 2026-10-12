import assert from 'node:assert/strict';
import { filterAdsByAudience, readAdAudience } from './ad-audience';

// readAdAudience — for_driver TRUE is the only captain signal.
assert.equal(readAdAudience({ for_driver: true }), 'captain');
assert.equal(readAdAudience({ for_driver: false }), 'rider');
assert.equal(readAdAudience({ forDriver: true }), 'captain');
assert.equal(readAdAudience({ for_driver: 'TRUE' }), 'captain');
assert.equal(readAdAudience({ for_driver: 'false' }), 'rider');

// A NULL / absent column defaults to the rider side, matching the column default.
assert.equal(readAdAudience({ for_driver: null }), 'rider');
assert.equal(readAdAudience({}), 'rider');
assert.equal(readAdAudience(undefined), 'rider');

// Truthy-but-not-true values must not leak rider ads to captains.
assert.equal(readAdAudience({ for_driver: 1 }), 'rider');
assert.equal(readAdAudience({ for_driver: 'yes' }), 'rider');

// filterAdsByAudience — each side sees only its own campaigns.
const pool = [
  { id: 'captain-ad', forDriver: true },
  { id: 'rider-ad', forDriver: false },
  { id: 'unset-ad' },
];

assert.deepEqual(filterAdsByAudience(pool, 'captain').map((ad) => ad.id), ['captain-ad']);
assert.deepEqual(filterAdsByAudience(pool, 'rider').map((ad) => ad.id), ['rider-ad', 'unset-ad']);

// No audience means no scoping — the unfiltered pool passes through untouched.
assert.equal(filterAdsByAudience(pool), pool);
assert.deepEqual(filterAdsByAudience([], 'captain'), []);

console.log('ad-audience: all assertions passed');
