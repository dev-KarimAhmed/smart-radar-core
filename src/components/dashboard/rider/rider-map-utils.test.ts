import assert from 'node:assert/strict';
import { latLngToCell, gridDistance } from 'h3-js';
import { generateMockCaptainDots } from './rider-map-utils';

const riderCell = latLngToCell(31.9539, 35.9106, 9);
const captains = generateMockCaptainDots(riderCell);

assert.equal(captains.length >= 3, true);
assert.equal(captains.length <= 5, true);
assert.equal(new Set(captains.map((captain) => captain.h3Cell)).size, captains.length);

for (const captain of captains) {
  assert.equal(typeof captain.coordinates.lat, 'number');
  assert.equal(typeof captain.coordinates.lng, 'number');
  assert.equal(gridDistance(riderCell, captain.h3Cell) <= 2, true);
}

console.log('rider map utility checks passed');
