import { EMPTY_ADMIN_GROUPS_SUMMARY } from '../constants';
import type {
  AdminWhatsAppGeoOption,
  AdminWhatsAppGroupLinkItem,
  AdminWhatsAppGroupsSummary,
  WhatsAppGroupActivityFilter,
  WhatsAppGroupLinkStatus,
  WhatsAppGroupZoneSortMode,
} from '../types';

export interface WhatsAppGroupZoneFilterInput {
  searchTerm: string;
  statusFilter: 'ALL' | WhatsAppGroupLinkStatus;
  governorateFilter: string;
  districtFilter: string;
  activityFilter: WhatsAppGroupActivityFilter;
  sortMode: WhatsAppGroupZoneSortMode;
}

export interface WhatsAppGroupZoneFilterResult {
  items: AdminWhatsAppGroupLinkItem[];
  summary: AdminWhatsAppGroupsSummary;
  governorateOptions: AdminWhatsAppGeoOption[];
  districtOptions: AdminWhatsAppGeoOption[];
}

export function normalizeSearchText(value: string | null | undefined): string {
  return String(value ?? '')
    .normalize('NFKC')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .trim()
    .toLowerCase();
}

export function normalizePhoneDigits(value: string | null | undefined): string {
  return String(value ?? '').replace(/[^0-9]/g, '');
}

function safeTimestamp(iso: string | null | undefined): number {
  const ts = Date.parse(iso || '');
  return Number.isFinite(ts) ? ts : 0;
}

export function getGroupGovernorateKey(item: Pick<AdminWhatsAppGroupLinkItem, 'governorateId' | 'governorateName'>): string {
  if (item.governorateId !== null && item.governorateId !== undefined) return String(item.governorateId);
  return item.governorateName.trim() || 'UNASSIGNED';
}

export function getGroupDistrictKey(item: Pick<AdminWhatsAppGroupLinkItem, 'districtId' | 'districtName'>): string {
  if (item.districtId !== null && item.districtId !== undefined) return String(item.districtId);
  return item.districtName.trim() || 'UNASSIGNED';
}

export function compareWhatsAppGroupZones(
  a: AdminWhatsAppGroupLinkItem,
  b: AdminWhatsAppGroupLinkItem,
  sortMode: WhatsAppGroupZoneSortMode,
): number {
  const statusDiff = (a.status === 'ACTIVE' ? 0 : 1) - (b.status === 'ACTIVE' ? 0 : 1);
  const tieBreak = () => a.groupCode.localeCompare(b.groupCode, 'en') || a.id.localeCompare(b.id, 'en');
  if (sortMode === 'least_spread') {
    return (
      statusDiff ||
      a.activeMembersCount - b.activeMembersCount ||
      a.captainsCount - b.captainsCount ||
      a.ridersCount - b.ridersCount ||
      a.totalQualifiedSeconds - b.totalQualifiedSeconds ||
      tieBreak()
    );
  }
  if (sortMode === 'least_captain_ops') {
    return (
      statusDiff ||
      a.totalQualifiedSeconds - b.totalQualifiedSeconds ||
      a.activeCaptainsCount - b.activeCaptainsCount ||
      a.qualifiedTripsCount - b.qualifiedTripsCount ||
      a.captainsCount - b.captainsCount ||
      tieBreak()
    );
  }
  if (sortMode === 'least_rider_activity') {
    return (
      statusDiff ||
      a.activeRidersCount - b.activeRidersCount ||
      a.ridersCount - b.ridersCount ||
      a.qualifiedTripsCount - b.qualifiedTripsCount ||
      tieBreak()
    );
  }
  if (sortMode === 'most_minutes') {
    return (
      b.totalQualifiedSeconds - a.totalQualifiedSeconds ||
      b.currentMonthQualifiedSeconds - a.currentMonthQualifiedSeconds ||
      b.qualifiedTripsCount - a.qualifiedTripsCount ||
      tieBreak()
    );
  }
  return safeTimestamp(b.createdAt) - safeTimestamp(a.createdAt) || tieBreak();
}

export function computeWhatsAppGroupsSummary(
  groups: AdminWhatsAppGroupLinkItem[],
): AdminWhatsAppGroupsSummary {
  return groups.reduce<AdminWhatsAppGroupsSummary>(
    (acc, item) => {
      acc.totalGroups += 1;
      if (item.status === 'ACTIVE') {
        acc.activeGroups += 1;
        if (item.totalQualifiedSeconds > 0) acc.productiveActiveGroups = (acc.productiveActiveGroups ?? 0) + 1;
      } else {
        acc.inactiveGroups += 1;
      }
      acc.totalActiveMembers += item.activeMembersCount;
      acc.totalCaptains += item.captainsCount;
      acc.totalRiders += item.ridersCount;
      acc.totalActiveCaptains += item.activeCaptainsCount;
      acc.totalActiveRiders += item.activeRidersCount;
      acc.totalQualifiedSeconds += Math.max(0, item.totalQualifiedSeconds);
      acc.currentMonthQualifiedSeconds = (acc.currentMonthQualifiedSeconds ?? 0) + Math.max(0, item.currentMonthQualifiedSeconds);
      acc.totalQualifiedTrips += Math.max(0, item.qualifiedTripsCount);
      acc.currentMonthQualifiedTrips = (acc.currentMonthQualifiedTrips ?? 0) + Math.max(0, item.currentMonthQualifiedTrips ?? 0);
      return acc;
    },
    { ...EMPTY_ADMIN_GROUPS_SUMMARY },
  );
}

export function filterAndSortWhatsAppGroupZones(
  groups: AdminWhatsAppGroupLinkItem[],
  filters: WhatsAppGroupZoneFilterInput,
  unassignedLabel = 'UNASSIGNED',
): WhatsAppGroupZoneFilterResult {
  const govMap = new Map<string, AdminWhatsAppGeoOption>();
  const distMap = new Map<string, AdminWhatsAppGeoOption>();
  let hasUnassignedGov = false;

  for (const item of groups) {
    const govKey = getGroupGovernorateKey(item);
    if (govKey === 'UNASSIGNED') hasUnassignedGov = true;
    else if (item.governorateName.trim() && !govMap.has(govKey)) {
      govMap.set(govKey, { id: govKey, name: item.governorateName.trim() });
    }
    const distKey = getGroupDistrictKey(item);
    if (
      item.districtName.trim() &&
      (filters.governorateFilter === 'ALL' || govKey === filters.governorateFilter) &&
      !distMap.has(distKey)
    ) {
      distMap.set(distKey, { id: distKey, name: item.districtName.trim(), governorateId: govKey });
    }
  }

  const q = normalizeSearchText(filters.searchTerm);
  const qDigits = normalizePhoneDigits(filters.searchTerm);
  const filtered = groups
    .filter((item) => {
      if (filters.statusFilter !== 'ALL' && item.status !== filters.statusFilter) return false;
      if (filters.governorateFilter !== 'ALL' && getGroupGovernorateKey(item) !== filters.governorateFilter) return false;
      if (filters.districtFilter !== 'ALL' && getGroupDistrictKey(item) !== filters.districtFilter) return false;
      if (filters.activityFilter === 'ZERO_MINUTES' && item.totalQualifiedSeconds > 0) return false;
      if (filters.activityFilter === 'ZERO_MONTH_MINUTES' && item.currentMonthQualifiedSeconds > 0) return false;
      if (filters.activityFilter === 'MISSING_PAIR' && item.captainsCount > 0 && item.ridersCount > 0) return false;
      if (filters.activityFilter === 'HAS_MINUTES' && item.totalQualifiedSeconds <= 0) return false;
      if (!q) return true;
      const phoneMatch = qDigits.length >= 3 && normalizePhoneDigits(item.leaderPhone).includes(qDigits);
      return (
        phoneMatch ||
        normalizeSearchText(item.groupName).includes(q) ||
        normalizeSearchText(item.groupCode).includes(q) ||
        normalizeSearchText(item.leaderFullName).includes(q) ||
        normalizeSearchText(item.leaderPhone).includes(q) ||
        normalizeSearchText(item.governorateName).includes(q) ||
        normalizeSearchText(item.districtName).includes(q)
      );
    })
    .sort((a, b) => compareWhatsAppGroupZones(a, b, filters.sortMode));

  const governorateOptions = Array.from(govMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'ar'));
  if (hasUnassignedGov) governorateOptions.push({ id: 'UNASSIGNED', name: unassignedLabel });

  return {
    items: filtered,
    summary: computeWhatsAppGroupsSummary(filtered),
    governorateOptions,
    districtOptions: Array.from(distMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'ar')),
  };
}
