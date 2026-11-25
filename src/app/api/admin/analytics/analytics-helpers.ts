import type {
  AnalyticsFilterState,
  AnalyticsPeriod,
  AnalyticsTimelinePoint,
} from '@/features/admin/types/admin-analytics';

export interface RawCountryRow {
  id: number;
  name_ar: string;
  country_code?: string;
}

export interface RawGovernorateRow {
  id: number;
  name_ar: string;
  country_id: number;
}

export interface RawDistrictRow {
  id: number;
  name_ar: string;
  governorate_id: number;
}

export interface RawProfileRow {
  id: string;
  role?: string | null;
  status?: string | null;
  country_id?: number | null;
  governorate_id?: number | null;
  district_id?: number | null;
  created_at?: string | null;
}

export interface RawCaptainProfileRow {
  id: string;
  verification_status?: string | null;
}

export interface RawTripRow {
  id: string;
  rider_id?: string | null;
  accepted_captain_id?: string | null;
  country_id?: number | null;
  status?: string | null;
  estimated_distance_km?: number | null;
  created_at?: string | null;
}

export interface RawWalletRow {
  profile_id?: string | null;
  balance?: number | null;
  paid_minutes_remaining?: number | null;
}

export interface GeoCoordinates {
  countryId: number | null;
  governorateId: number | null;
  districtId: number | null;
}

export function getPeriodStartMs(period: AnalyticsPeriod, nowMs: number): number | null {
  if (period === '24h') return nowMs - 24 * 60 * 60 * 1000;
  if (period === '7d') return nowMs - 7 * 24 * 60 * 60 * 1000;
  if (period === '30d') return nowMs - 30 * 24 * 60 * 60 * 1000;
  return null;
}

export function isWithinPeriod(iso: string | null | undefined, startMs: number | null): boolean {
  if (startMs === null) return true;
  if (!iso) return false;
  const ms = new Date(iso).getTime();
  return Number.isFinite(ms) && ms >= startMs;
}

export function resolveProfileGeo(
  p: RawProfileRow,
  govById: Map<number, RawGovernorateRow>,
): GeoCoordinates {
  const govId = p.governorate_id ?? null;
  const distId = p.district_id ?? null;
  const countryId = p.country_id ?? (govId ? govById.get(govId)?.country_id ?? null : null);
  return { countryId, governorateId: govId, districtId: distId };
}

export function matchesGeoScope(geo: GeoCoordinates, filters: AnalyticsFilterState): boolean {
  if (filters.countryId !== 'ALL' && geo.countryId !== Number(filters.countryId)) return false;
  if (filters.governorateId !== 'ALL' && geo.governorateId !== Number(filters.governorateId)) return false;
  if (filters.districtId !== 'ALL' && geo.districtId !== Number(filters.districtId)) return false;
  return true;
}

export function buildTimeline(
  profiles: RawProfileRow[],
  trips: RawTripRow[],
  period: AnalyticsPeriod,
  nowMs: number,
): AnalyticsTimelinePoint[] {
  const bucketDays = period === '24h' ? 1 : period === '7d' ? 7 : 14;
  const pointsMap = new Map<string, AnalyticsTimelinePoint>();

  for (let i = bucketDays - 1; i >= 0; i--) {
    const d = new Date(nowMs - i * 86400000);
    const key = d.toISOString().slice(0, 10);
    pointsMap.set(key, {
      date: key,
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      captains: 0,
      riders: 0,
      trips: 0,
    });
  }

  for (const p of profiles) {
    const key = (p.created_at || '').slice(0, 10);
    const pt = pointsMap.get(key);
    if (!pt) continue;
    const role = String(p.role || '').toUpperCase();
    if (role === 'CAPTAIN') pt.captains++;
    else if (role === 'RIDER') pt.riders++;
  }

  for (const t of trips) {
    const key = (t.created_at || '').slice(0, 10);
    const pt = pointsMap.get(key);
    if (pt) pt.trips++;
  }

  return Array.from(pointsMap.values());
}
