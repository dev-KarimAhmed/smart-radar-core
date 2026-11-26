import type {
  AnalyticsFilterState,
  AnalyticsRoleFocus,
  RegionAnalyticsItem,
} from '@/features/admin/types/admin-analytics';
import {
  isWithinPeriod,
  type RawCountryRow,
  type RawDistrictRow,
  type RawGovernorateRow,
  type RawProfileRow,
  type RawTripRow,
} from './analytics-helpers';

export function aggregateRegionBuckets(params: {
  filters: AnalyticsFilterState;
  countries: RawCountryRow[];
  governorates: RawGovernorateRow[];
  districts: RawDistrictRow[];
  profiles: RawProfileRow[];
  trips: RawTripRow[];
  profileById: Map<string, RawProfileRow>;
  govById: Map<number, RawGovernorateRow>;
  periodStartMs: number | null;
}) {
  const { filters, countries, governorates, districts, profiles, trips, profileById, govById, periodStartMs } = params;
  const countryById = new Map(countries.map((c) => [c.id, c]));

  const scopedGovs = governorates.filter(
    (g) => filters.countryId === 'ALL' || g.country_id === Number(filters.countryId),
  );
  const scopedDists = districts.filter((d) => {
    const parentGov = govById.get(d.governorate_id);
    if (filters.governorateId !== 'ALL') return d.governorate_id === Number(filters.governorateId);
    if (filters.countryId !== 'ALL') return parentGov?.country_id === Number(filters.countryId);
    return true;
  });

  const govStats = new Map<number, RegionAnalyticsItem>(
    scopedGovs.map((g) => [
      g.id,
      {
        id: g.id,
        nameAr: g.name_ar,
        parentNameAr: countryById.get(g.country_id)?.name_ar || '',
        countryId: g.country_id,
        captains: 0,
        activeCaptains: 0,
        riders: 0,
        trips: 0,
        completedTrips: 0,
        totalScore: 0,
      },
    ]),
  );

  const distStats = new Map<number, RegionAnalyticsItem>(
    scopedDists.map((d) => {
      const gov = govById.get(d.governorate_id);
      return [
        d.id,
        {
          id: d.id,
          nameAr: d.name_ar,
          parentNameAr: gov?.name_ar || '',
          countryId: gov?.country_id || 0,
          captains: 0,
          activeCaptains: 0,
          riders: 0,
          trips: 0,
          completedTrips: 0,
          totalScore: 0,
        },
      ];
    }),
  );

  for (const p of profiles) {
    if (!isWithinPeriod(p.created_at, periodStartMs)) continue;
    const role = String(p.role || '').toUpperCase();
    const st = String(p.status || '').toUpperCase();
    const isCapActive = st === 'ACTIVE' || st === 'BUSY';

    for (const [targetId, map] of [
      [p.governorate_id, govStats],
      [p.district_id, distStats],
    ] as const) {
      if (!targetId || !map.has(targetId)) continue;
      const item = map.get(targetId)!;
      if (role === 'CAPTAIN') {
        item.captains++;
        if (isCapActive) item.activeCaptains++;
      } else if (role === 'RIDER') {
        item.riders++;
      }
    }
  }

  for (const t of trips) {
    if (!isWithinPeriod(t.created_at, periodStartMs)) continue;
    const refProfile =
      (t.rider_id ? profileById.get(t.rider_id) : undefined) ||
      (t.accepted_captain_id ? profileById.get(t.accepted_captain_id) : undefined);
    if (!refProfile) continue;
    const isComp = String(t.status || '').toUpperCase() === 'COMPLETED';
    for (const [targetId, map] of [
      [refProfile.governorate_id, govStats],
      [refProfile.district_id, distStats],
    ] as const) {
      if (!targetId || !map.has(targetId)) continue;
      const item = map.get(targetId)!;
      item.trips++;
      if (isComp) item.completedTrips++;
    }
  }

  const scoreItem = (r: RegionAnalyticsItem, roleFocus: AnalyticsRoleFocus): RegionAnalyticsItem => ({
    ...r,
    totalScore:
      roleFocus === 'CAPTAIN'
        ? r.captains
        : roleFocus === 'RIDER'
          ? r.riders
          : roleFocus === 'TRIPS'
            ? r.trips
            : r.captains + r.riders + r.trips,
  });

  return {
    allGovs: Array.from(govStats.values()).map((r) => scoreItem(r, filters.roleFocus)),
    allDists: Array.from(distStats.values()).map((r) => scoreItem(r, filters.roleFocus)),
  };
}
