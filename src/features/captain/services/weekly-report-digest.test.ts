import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatWeeklyDigestNotification,
  partitionCaptainsForLoadBalancing,
  type WeeklyCaptainStats,
} from './weekly-report-digest';

test('formatWeeklyDigestNotification formats privacy-preserving aggregate summary', () => {
  const stats: WeeklyCaptainStats = {
    captainId: 'cap-77',
    favoritesDelta: 2,
    positiveRatingsCount: 3,
    vehicleNegativeCount: 1,
    captainNegativeCount: 3,
  };

  const digest = formatWeeklyDigestNotification(stats);
  assert.equal(digest.captainId, 'cap-77');
  assert.equal(
    digest.messageAr,
    'إحصائيات الأسبوع: المفضلة +2 | تقييم إيجابي +3 | سلبي مركبة -1 | سلبي كابتن -3',
  );
  assert.equal(
    digest.messageEn,
    'Weekly Stats: Favorites +2 | Positive +3 | Vehicle Issues -1 | Captain Issues -3',
  );
  assert.doesNotMatch(digest.messageAr, /راكب|رحلة رقم|محمد|أحمد/);
});

test('partitionCaptainsForLoadBalancing clusters captains geographically and staggers intervals', () => {
  const captains: WeeklyCaptainStats[] = [
    { captainId: 'c1', governorateId: 'amman', districtId: 'zahran', favoritesDelta: 1, positiveRatingsCount: 5, vehicleNegativeCount: 0, captainNegativeCount: 0 },
    { captainId: 'c2', governorateId: 'amman', districtId: 'zahran', favoritesDelta: 2, positiveRatingsCount: 3, vehicleNegativeCount: 0, captainNegativeCount: 0 },
    { captainId: 'c3', governorateId: 'irbid', districtId: 'qasabah', favoritesDelta: 0, positiveRatingsCount: 2, vehicleNegativeCount: 1, captainNegativeCount: 0 },
    { captainId: 'c4', governorateId: 'zarqa', districtId: 'russeifa', favoritesDelta: 3, positiveRatingsCount: 8, vehicleNegativeCount: 0, captainNegativeCount: 1 },
  ];

  const batches = partitionCaptainsForLoadBalancing(captains, 30_000);
  assert.equal(batches.length, 3, 'Should produce 3 distinct geographic clusters');

  const ammanBatch = batches.find((b) => b.batchKey === 'amman_zahran');
  assert.ok(ammanBatch);
  assert.equal(ammanBatch.captains.length, 2);

  // Staggering verification
  assert.equal(batches[0].delayOffsetMs, 0);
  assert.equal(batches[1].delayOffsetMs, 30_000);
  assert.equal(batches[2].delayOffsetMs, 60_000);
});
