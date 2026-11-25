import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { buildAdminAnalyticsPayload } from './analytics-aggregator';

const NOW = new Date('2026-11-25T12:00:00.000Z').getTime();

const SAMPLE_DATA = {
  countries: [
    { id: 1, name_ar: 'الأردن', country_code: 'JO' },
    { id: 2, name_ar: 'مصر', country_code: 'EG' },
  ],
  governorates: [
    { id: 10, name_ar: 'عمّان', country_id: 1 },
    { id: 11, name_ar: 'إربد', country_id: 1 },
    { id: 20, name_ar: 'القاهرة', country_id: 2 },
  ],
  districts: [
    { id: 101, name_ar: 'لواء الجامعة', governorate_id: 10 },
    { id: 102, name_ar: 'وادي السير', governorate_id: 10 },
    { id: 111, name_ar: 'قصبة إربد', governorate_id: 11 },
    { id: 201, name_ar: 'مدينة نصر', governorate_id: 20 },
  ],
  profiles: [
    { id: 'c1', role: 'CAPTAIN', status: 'ACTIVE', country_id: 1, governorate_id: 10, district_id: 101, created_at: '2026-11-25T08:00:00.000Z' },
    { id: 'c2', role: 'CAPTAIN', status: 'IDLE', country_id: 1, governorate_id: 10, district_id: 101, created_at: '2026-11-20T08:00:00.000Z' },
    { id: 'c3', role: 'CAPTAIN', status: 'BUSY', country_id: 2, governorate_id: 20, district_id: 201, created_at: '2026-10-01T08:00:00.000Z' },
    { id: 'r1', role: 'RIDER', status: 'IDLE', country_id: 1, governorate_id: 10, district_id: 101, created_at: '2026-11-25T09:00:00.000Z' },
    { id: 'r2', role: 'RIDER', status: 'IDLE', country_id: 1, governorate_id: 10, district_id: 102, created_at: '2026-11-24T09:00:00.000Z' },
    { id: 'd1', role: 'DELEGATE', status: 'IDLE', country_id: 1, governorate_id: 10, district_id: 101, created_at: '2026-11-25T09:00:00.000Z' },
  ],
  captainProfiles: [
    { id: 'c1', verification_status: 'VERIFIED' },
    { id: 'c2', verification_status: 'PENDING' },
    { id: 'c3', verification_status: 'VERIFIED' },
  ],
  trips: [
    { id: 't1', rider_id: 'r1', accepted_captain_id: 'c1', country_id: 1, status: 'COMPLETED', estimated_distance_km: 8.5, created_at: '2026-11-25T10:00:00.000Z' },
    { id: 't2', rider_id: 'r2', accepted_captain_id: 'c2', country_id: 1, status: 'CANCELLED', estimated_distance_km: 4.0, created_at: '2026-11-22T10:00:00.000Z' },
    { id: 't3', rider_id: 'r1', accepted_captain_id: 'c1', country_id: 1, status: 'PENDING', estimated_distance_km: 5.5, created_at: '2026-11-25T11:00:00.000Z' },
  ],
  wallets: [
    { profile_id: 'c1', balance: 50, paid_minutes_remaining: 120 },
    { profile_id: 'c3', balance: 300, paid_minutes_remaining: 60 },
  ],
  activeAds: 3,
  pendingAds: 1,
  nowMs: NOW,
};

describe('admin analytics aggregator', () => {
  it('computes global KPIs, completion rate, and top/bottom places including zero-activity regions', () => {
    const res = buildAdminAnalyticsPayload({
      ...SAMPLE_DATA,
      filters: { countryId: 'ALL', governorateId: 'ALL', districtId: 'ALL', period: 'all', roleFocus: 'ALL' },
    });

    assert.equal(res.summary.totalCaptains, 3);
    assert.equal(res.summary.activeCaptains, 2);
    assert.equal(res.summary.verifiedCaptains, 2);
    assert.equal(res.summary.totalRiders, 2);
    assert.equal(res.summary.totalDelegates, 1);
    assert.equal(res.summary.totalTrips, 3);
    assert.equal(res.summary.completedTrips, 1);
    assert.equal(res.summary.completionRate, 33);
    assert.equal(res.summary.totalPaidHours, 3);

    assert.equal(res.topGovernorates[0].nameAr, 'عمّان');
    assert.equal(res.bottomGovernorates[0].nameAr, 'إربد');
    assert.equal(res.bottomGovernorates[0].totalScore, 0);

    assert.equal(res.topDistricts[0].nameAr, 'لواء الجامعة');
    assert.equal(res.bottomDistricts[0].nameAr, 'قصبة إربد');
  });

  it('filters metrics strictly by country, period, and roleFocus', () => {
    const res = buildAdminAnalyticsPayload({
      ...SAMPLE_DATA,
      filters: { countryId: '1', governorateId: 'ALL', districtId: 'ALL', period: '24h', roleFocus: 'CAPTAIN' },
    });

    assert.equal(res.summary.totalCaptains, 1);
    assert.equal(res.summary.totalRiders, 1);
    assert.equal(res.summary.totalTrips, 2);
    assert.equal(res.summary.totalPaidHours, 2);
    assert.ok(res.topGovernorates.every((g) => g.countryId === 1));
    assert.equal(res.topDistricts[0].id, 101);
    assert.equal(res.topDistricts[0].totalScore, 1);
  });
});
