import assert from 'node:assert/strict';
import {
  calculateSovereignDistance,
  calculateSovereignFareQuote,
  getDistrictFromCoords,
  getH3CellCentroid,
  getH3Neighbors,
  latLngToH3Cell,
} from './geospatial-kernel';

const amman = { lat: 31.9539, lng: 35.9106 };
const sweifieh = { lat: 31.9586, lng: 35.8684 };

const cell = latLngToH3Cell(amman.lat, amman.lng, 9);
assert.match(cell, /^[0-9a-f]{15}$/i, 'latLngToH3Cell should return an official H3 index');

const centroid = getH3CellCentroid(amman.lat, amman.lng, 9);
assert.ok(Math.abs(centroid.lat - amman.lat) < 0.01, 'H3 centroid should stay close to source latitude');
assert.ok(Math.abs(centroid.lng - amman.lng) < 0.01, 'H3 centroid should stay close to source longitude');

const neighbors = getH3Neighbors(cell, 1);
assert.ok(neighbors.includes(cell), 'gridDisk should include the origin cell');
assert.ok(neighbors.length >= 7, 'gridDisk ring 1 should include nearby cells');

assert.equal(getDistrictFromCoords(amman.lat, amman.lng).district, 'Amman');

const distance = calculateSovereignDistance(amman.lat, amman.lng, sweifieh.lat, sweifieh.lng);
assert.ok(distance > 4 && distance < 7, `district tortuosity distance should be realistic, got ${distance}`);

const quote = calculateSovereignFareQuote(amman, sweifieh, 1.37);
assert.ok(quote.originCell && quote.destinationCell, 'fare quote should expose H3 cells');
assert.ok(quote.estimatedRoadDistanceKm > quote.straightDistanceKm, 'fare quote should apply district tortuosity');
assert.ok(quote.guidePriceJod >= 1.75, 'fare quote should respect the local fare floor');

console.log('geospatial-kernel checks passed');
