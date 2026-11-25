import type { GeoLookup } from '@/features/admin/components/admin/geo-filter-bar';

export type AnalyticsPeriod = 'all' | '24h' | '7d' | '30d';
export type AnalyticsRoleFocus = 'ALL' | 'CAPTAIN' | 'RIDER' | 'TRIPS';

export interface AnalyticsFilterState {
  countryId: string;
  governorateId: string;
  districtId: string;
  period: AnalyticsPeriod;
  roleFocus: AnalyticsRoleFocus;
}

export interface AnalyticsSummary {
  totalCaptains: number;
  activeCaptains: number;
  verifiedCaptains: number;
  bannedCaptains: number;
  totalRiders: number;
  totalDelegates: number;
  activeAds: number;
  pendingAds: number;
  totalTrips: number;
  completedTrips: number;
  activeTrips: number;
  cancelledTrips: number;
  completionRate: number;
  totalCashBalance: number;
  totalPaidHours: number;
  totalDistanceKm: number;
}

export interface AnalyticsTimelinePoint {
  date: string;
  label: string;
  captains: number;
  riders: number;
  trips: number;
}

export interface RegionAnalyticsItem {
  id: number;
  nameAr: string;
  parentNameAr: string;
  countryId: number;
  captains: number;
  activeCaptains: number;
  riders: number;
  trips: number;
  completedTrips: number;
  totalScore: number;
}

export interface StatusSliceItem {
  key: string;
  nameAr: string;
  nameEn: string;
  value: number;
  color: string;
}

export interface AdminAnalyticsPayload {
  geo: GeoLookup;
  summary: AnalyticsSummary;
  timeline: AnalyticsTimelinePoint[];
  chartRegions: RegionAnalyticsItem[];
  topGovernorates: RegionAnalyticsItem[];
  bottomGovernorates: RegionAnalyticsItem[];
  topDistricts: RegionAnalyticsItem[];
  bottomDistricts: RegionAnalyticsItem[];
  tripStatusDistribution: StatusSliceItem[];
  captainStatusDistribution: StatusSliceItem[];
  generatedAt: string;
}
