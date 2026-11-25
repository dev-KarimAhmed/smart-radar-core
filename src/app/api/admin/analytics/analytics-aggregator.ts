import type {
  AdminAnalyticsPayload,
  AnalyticsFilterState,
  RegionAnalyticsItem,
} from '@/features/admin/types/admin-analytics';
import {
  buildTimeline,
  getPeriodStartMs,
  isWithinPeriod,
  matchesGeoScope,
  resolveProfileGeo,
  type RawCaptainProfileRow,
  type RawCountryRow,
  type RawDistrictRow,
  type RawGovernorateRow,
  type RawProfileRow,
  type RawTripRow,
  type RawWalletRow,
} from './analytics-helpers';
import { aggregateRegionBuckets } from './analytics-region-buckets';

export interface AnalyticsAggregationInput {
  filters: AnalyticsFilterState;
  countries: RawCountryRow[];
  governorates: RawGovernorateRow[];
  districts: RawDistrictRow[];
  profiles: RawProfileRow[];
  captainProfiles: RawCaptainProfileRow[];
  trips: RawTripRow[];
  wallets: RawWalletRow[];
  activeAds: number;
  pendingAds: number;
  nowMs?: number;
}

const ACTIVE_TRIP_STATUSES = new Set(['PENDING', 'ACCEPTED', 'ARRIVED', 'TRIP_ACTIVE', 'STARTED']);

/**
 * Pure analytics aggregation engine for the General Admin dashboard.
 * Computes filtered KPIs, timeline series, status distributions, and top/bottom places.
 */
export function buildAdminAnalyticsPayload(input: AnalyticsAggregationInput): AdminAnalyticsPayload {
  const nowMs = input.nowMs ?? Date.now();
  const periodStartMs = getPeriodStartMs(input.filters.period, nowMs);

  const govById = new Map(input.governorates.map((g) => [g.id, g]));
  const capMetaById = new Map(input.captainProfiles.map((c) => [c.id, c]));
  const profileById = new Map(input.profiles.map((p) => [p.id, p]));

  const filteredProfiles = input.profiles.filter((p) => {
    const geo = resolveProfileGeo(p, govById);
    return matchesGeoScope(geo, input.filters) && isWithinPeriod(p.created_at, periodStartMs);
  });

  const filteredProfileIds = new Set(filteredProfiles.map((p) => p.id));
  const captains = filteredProfiles.filter((p) => String(p.role || '').toUpperCase() === 'CAPTAIN');
  const riders = filteredProfiles.filter((p) => String(p.role || '').toUpperCase() === 'RIDER');
  const delegates = filteredProfiles.filter((p) => String(p.role || '').toUpperCase() === 'DELEGATE');

  let activeCaptains = 0;
  let busyCaptains = 0;
  let verifiedCaptains = 0;
  let bannedCaptains = 0;

  for (const c of captains) {
    const st = String(c.status || '').toUpperCase();
    if (st === 'ACTIVE') activeCaptains++;
    else if (st === 'BUSY') busyCaptains++;
    else if (st === 'BANNED' || st === 'SUSPENDED') bannedCaptains++;
    if (String(capMetaById.get(c.id)?.verification_status || '').toUpperCase() === 'VERIFIED') {
      verifiedCaptains++;
    }
  }

  const filteredTrips = input.trips.filter((t) => {
    if (!isWithinPeriod(t.created_at, periodStartMs)) return false;
    const refProfile =
      (t.rider_id ? profileById.get(t.rider_id) : undefined) ||
      (t.accepted_captain_id ? profileById.get(t.accepted_captain_id) : undefined);
    const geo = refProfile
      ? resolveProfileGeo(refProfile, govById)
      : { countryId: t.country_id ?? null, governorateId: null, districtId: null };
    return matchesGeoScope(geo, input.filters);
  });

  let completedTrips = 0;
  let activeTrips = 0;
  let cancelledTrips = 0;
  let totalDistanceKm = 0;

  for (const t of filteredTrips) {
    const st = String(t.status || '').toUpperCase();
    if (st === 'COMPLETED') completedTrips++;
    else if (st === 'CANCELLED' || st === 'EXPIRED') cancelledTrips++;
    else if (ACTIVE_TRIP_STATUSES.has(st)) activeTrips++;
    totalDistanceKm += Number(t.estimated_distance_km || 0);
  }

  let totalCashBalance = 0;
  let totalPaidMinutes = 0;
  const hasGeoFilter =
    input.filters.countryId !== 'ALL' ||
    input.filters.governorateId !== 'ALL' ||
    input.filters.districtId !== 'ALL';

  for (const w of input.wallets) {
    if (hasGeoFilter && w.profile_id && !filteredProfileIds.has(w.profile_id)) continue;
    totalCashBalance += Number(w.balance || 0);
    totalPaidMinutes += Number(w.paid_minutes_remaining || 0);
  }

  const { allGovs, allDists } = aggregateRegionBuckets({
    filters: input.filters,
    countries: input.countries,
    governorates: input.governorates,
    districts: input.districts,
    profiles: input.profiles,
    trips: input.trips,
    profileById,
    govById,
    periodStartMs,
  });

  const byHigh = (a: RegionAnalyticsItem, b: RegionAnalyticsItem) => b.totalScore - a.totalScore || a.id - b.id;
  const byLow = (a: RegionAnalyticsItem, b: RegionAnalyticsItem) => a.totalScore - b.totalScore || a.id - b.id;

  const totalTrips = filteredTrips.length;
  const idleCaptains = Math.max(0, captains.length - activeCaptains - busyCaptains - bannedCaptains);

  return {
    geo: {
      countries: input.countries.map((c) => ({ id: c.id, name_ar: c.name_ar, country_code: c.country_code })),
      governorates: input.governorates,
      districts: input.districts,
    },
    summary: {
      totalCaptains: captains.length,
      activeCaptains: activeCaptains + busyCaptains,
      verifiedCaptains,
      bannedCaptains,
      totalRiders: riders.length,
      totalDelegates: delegates.length,
      activeAds: input.activeAds,
      pendingAds: input.pendingAds,
      totalTrips,
      completedTrips,
      activeTrips,
      cancelledTrips,
      completionRate: totalTrips > 0 ? Math.round((completedTrips / totalTrips) * 100) : 0,
      totalCashBalance: Number(totalCashBalance.toFixed(2)),
      totalPaidHours: Number((totalPaidMinutes / 60).toFixed(1)),
      totalDistanceKm: Number(totalDistanceKm.toFixed(1)),
    },
    timeline: buildTimeline(filteredProfiles, filteredTrips, input.filters.period, nowMs),
    chartRegions: (input.filters.governorateId !== 'ALL' ? allDists : allGovs).sort(byHigh).slice(0, 8),
    topGovernorates: [...allGovs].sort(byHigh).slice(0, 5),
    bottomGovernorates: [...allGovs].sort(byLow).slice(0, 5),
    topDistricts: [...allDists].sort(byHigh).slice(0, 5),
    bottomDistricts: [...allDists].sort(byLow).slice(0, 5),
    tripStatusDistribution: [
      { key: 'completed', nameAr: 'مكتملة', nameEn: 'Completed', value: completedTrips, color: '#10b981' },
      { key: 'active', nameAr: 'جارية / معلقة', nameEn: 'Active / Pending', value: activeTrips, color: '#14F5D5' },
      { key: 'cancelled', nameAr: 'ملغاة / منتهية', nameEn: 'Cancelled / Expired', value: cancelledTrips, color: '#f43f5e' },
    ],
    captainStatusDistribution: [
      { key: 'active', nameAr: 'متاح الآن', nameEn: 'Available', value: activeCaptains, color: '#14F5D5' },
      { key: 'busy', nameAr: 'في رحلة', nameEn: 'On Trip', value: busyCaptains, color: '#3b82f6' },
      { key: 'idle', nameAr: 'غير متصل', nameEn: 'Offline', value: idleCaptains, color: '#64748b' },
      { key: 'banned', nameAr: 'موقوف / محظور', nameEn: 'Banned', value: bannedCaptains, color: '#f43f5e' },
    ],
    generatedAt: new Date(nowMs).toISOString(),
  };
}
