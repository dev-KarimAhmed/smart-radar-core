import assert from 'node:assert/strict';
import { latLngToCell, gridDistance } from 'h3-js';
import { AMMAN_FALLBACK_LOCATION, JORDAN_DISTRICT_DESTINATIONS, JORDAN_GOVERNORATES } from './jordan-destinations';
import { generateMockCaptainDots, RIDER_MOCK_LOCATION } from './rider-map-utils';

const riderCell = latLngToCell(31.9539, 35.9106, 9);
const captains = generateMockCaptainDots(riderCell);

assert.deepEqual(RIDER_MOCK_LOCATION, AMMAN_FALLBACK_LOCATION);
assert.equal(JORDAN_GOVERNORATES.length, 12);
assert.ok(JORDAN_DISTRICT_DESTINATIONS.length >= 50);
assert.equal(captains.length >= 3, true);
assert.equal(captains.length <= 5, true);
assert.equal(new Set(captains.map((captain) => captain.h3Cell)).size, captains.length);
assert.equal(captains[0].id, 'demo-captain-d-102');

for (const captain of captains) {
  assert.equal(typeof captain.coordinates.lat, 'number');
  assert.equal(typeof captain.coordinates.lng, 'number');
  assert.equal(gridDistance(riderCell, captain.h3Cell) <= 2, true);
}

console.log('rider map utility checks passed');
