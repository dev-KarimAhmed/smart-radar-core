import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getDispatchDelaySeconds,
  normalizeTierRank,
  filterAndRankRadarRequests,
} from './driver-radar-requests-filter';

test('getDispatchDelaySeconds grants correct priority leads to higher ranks', () => {
  assert.equal(getDispatchDelaySeconds('DIAMOND'), 0); // 3.5 - 3.5 = 0s delay
  assert.equal(getDispatchDelaySeconds('PLATINUM'), 1.0); // 3.5 - 2.5 = 1.0s
  assert.equal(getDispatchDelaySeconds('GOLD'), 2.5); // 3.5 - 1.0 = 2.5s
  assert.equal(getDispatchDelaySeconds('SILVER'), 2.5); // 3.5 - 1.0 = 2.5s
  assert.equal(getDispatchDelaySeconds('BRONZE'), 3.5); // 3.5 - 0.0 = 3.5s
});

test('normalizeTierRank defaults safely to BRONZE for unknown values', () => {
  assert.equal(normalizeTierRank('diamond'), 'DIAMOND');
  assert.equal(normalizeTierRank('platinum'), 'PLATINUM');
  assert.equal(normalizeTierRank('invalid'), 'BRONZE');
  assert.equal(normalizeTierRank(null), 'BRONZE');
});

test('filterAndRankRadarRequests staggers visibility based on rank dispatch priority', () => {
  const now = 1700000010000;
  // Request created 500ms ago
  const freshRow = {
    id: 'req-fresh',
    status: 'PENDING',
    created_at: new Date(now - 500).toISOString(),
    origin_lat: 31.95,
    origin_lng: 35.91,
    origin_h3: '891f1d48857ffff',
    destination_lat: 31.96,
    destination_lng: 35.92,
  };

  const loc = { lat: 31.95, lng: 35.91 };
  const cells = ['891f1d48857ffff'];

  // 1. Diamond captain receives it immediately (delay 0s <= 0.5s)
  const diamondRequests = filterAndRankRadarRequests({
    allRows: [freshRow],
    loc,
    cells,
    now,
    captainRank: 'DIAMOND',
  });
  assert.equal(diamondRequests.length, 1);
  assert.equal(diamondRequests[0].id, 'req-fresh');

  // 2. Platinum captain (delay 1.0s > 0.5s) cannot see it yet
  const platinumRequests = filterAndRankRadarRequests({
    allRows: [freshRow],
    loc,
    cells,
    now,
    captainRank: 'PLATINUM',
  });
  assert.equal(platinumRequests.length, 0);

  // 3. Bronze captain (delay 3.5s > 0.5s) cannot see it yet
  const bronzeRequests = filterAndRankRadarRequests({
    allRows: [freshRow],
    loc,
    cells,
    now,
    captainRank: 'BRONZE',
  });
  assert.equal(bronzeRequests.length, 0);

  // 4. At 1.5s elapsed, Platinum now sees it, but Bronze still does not
  const platAt1500 = filterAndRankRadarRequests({
    allRows: [freshRow],
    loc,
    cells,
    now: now + 1000, // 1500ms elapsed
    captainRank: 'PLATINUM',
  });
  assert.equal(platAt1500.length, 1);

  const bronzeAt1500 = filterAndRankRadarRequests({
    allRows: [freshRow],
    loc,
    cells,
    now: now + 1000,
    captainRank: 'BRONZE',
  });
  assert.equal(bronzeAt1500.length, 0);

  // 5. At 4.0s elapsed, Bronze finally sees it
  const bronzeAt4000 = filterAndRankRadarRequests({
    allRows: [freshRow],
    loc,
    cells,
    now: now + 3500, // 4000ms elapsed
    captainRank: 'BRONZE',
  });
  assert.equal(bronzeAt4000.length, 1);
});

test('filterAndRankRadarRequests always allows active pending offer regardless of delay', () => {
  const now = 1700000010000;
  const freshRow = {
    id: 'req-active-bid',
    status: 'PENDING',
    created_at: new Date(now - 200).toISOString(),
    origin_lat: 31.95,
    origin_lng: 35.91,
    origin_h3: '891f1d48857ffff',
    destination_lat: 31.96,
    destination_lng: 35.92,
  };

  const loc = { lat: 31.95, lng: 35.91 };
  const cells = ['891f1d48857ffff'];

  // Bronze captain with active bid sees it immediately
  const requests = filterAndRankRadarRequests({
    allRows: [freshRow],
    activePendingTripIds: ['req-active-bid'],
    loc,
    cells,
    now,
    captainRank: 'BRONZE',
  });
  assert.equal(requests.length, 1);
  assert.equal(requests[0].id, 'req-active-bid');
});
