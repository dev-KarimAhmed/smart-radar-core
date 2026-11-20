import type { Trip } from '@/core/types';
import { estimateHaversineDistanceKm } from './ride-location';
import {
  MAX_RADAR_REQUEST_AGE_MS,
  RADAR_FALLBACK_LIMIT,
  RADAR_MAX_DISTANCE_KM,
  mapRideRequestToTrip,
  type RadarLocation,
} from './driver-radar-mapper';
import {
  TIER_CAPABILITIES,
  type CaptainRankTier,
} from '@/core/logic/driver-tier';

export function mergePendingRadarRows(allRows: any[], pendingRows?: any[] | null): any[] {
  if (!pendingRows || !Array.isArray(pendingRows)) return allRows;
  const existingIds = new Set(allRows.map((r: any) => r.id));
  const merged = [...allRows];
  for (const pRow of pendingRows) {
    if (
      String((pRow as any)?.status || '').toUpperCase() === 'PENDING' &&
      !existingIds.has((pRow as any).id)
    ) {
      merged.push(pRow);
      existingIds.add((pRow as any).id);
    }
  }
  return merged;
}

export function normalizeTierRank(rank: unknown): CaptainRankTier {
  const normalized = String(rank || '').toUpperCase().trim();
  if (normalized === 'DIAMOND' || normalized === 'PLATINUM' || normalized === 'GOLD' || normalized === 'SILVER') {
    return normalized as CaptainRankTier;
  }
  return 'BRONZE';
}

/**
 * Computes the required delay in seconds before a request becomes visible to this rank.
 * Diamond: 3.5s priority (0s delay)
 * Platinum: 2.5s priority (1.0s delay)
 * Gold: 1.0s priority (2.5s delay)
 * Silver: 1.0s priority (2.5s delay)
 * Bronze: 0.0s priority (3.5s delay)
 */
export function getDispatchDelaySeconds(rank: CaptainRankTier): number {
  const maxPrioritySeconds = 3.5;
  const rankPriority = TIER_CAPABILITIES[rank]?.dispatchPrioritySeconds ?? 0;
  return Math.max(0, maxPrioritySeconds - rankPriority);
}

export function filterAndRankRadarRequests({
  allRows,
  activePendingTripIds,
  loc,
  cells,
  now = Date.now(),
  captainRank,
}: {
  allRows: any[];
  activePendingTripIds?: string[];
  loc: RadarLocation;
  cells: string[];
  now?: number;
  captainRank?: CaptainRankTier | string | null;
}): Trip[] {
  const mappedRequests = Array.isArray(allRows)
    ? (allRows.map(mapRideRequestToTrip).filter(Boolean) as Trip[])
    : [];

  const tier = normalizeTierRank(captainRank);
  const requiredDelaySec = getDispatchDelaySeconds(tier);
  const maxRadiusKm = Math.max(
    RADAR_MAX_DISTANCE_KM,
    TIER_CAPABILITIES[tier]?.radarRangeKm ?? RADAR_MAX_DISTANCE_KM,
  );

  return mappedRequests
    .filter((request) => {
      const isPendingOffer = Boolean(activePendingTripIds && activePendingTripIds.includes(request.id));
      if (isPendingOffer) return true;

      const createdMs = request.createdAt ? new Date(request.createdAt).getTime() : 0;
      if (createdMs <= 0 || now - createdMs > MAX_RADAR_REQUEST_AGE_MS) {
        return false;
      }

      // Sovereign V2.6: Enforce technical dispatch priority window
      const elapsedSeconds = (now - createdMs) / 1000;
      if (elapsedSeconds < requiredDelaySec) {
        return false;
      }

      return true;
    })
    .map((request) => {
      const driverDistanceKm =
        estimateHaversineDistanceKm(loc.lat, loc.lng, request.pickupCoords.lat, request.pickupCoords.lng) ??
        Number.POSITIVE_INFINITY;
      const isInH3Disk = request.h3Index ? cells.includes(request.h3Index) : false;
      return { request, driverDistanceKm, isInH3Disk };
    })
    .filter(({ driverDistanceKm }) => Number.isFinite(driverDistanceKm) && driverDistanceKm <= maxRadiusKm)
    .sort((a, b) => {
      if (a.isInH3Disk !== b.isInH3Disk) return a.isInH3Disk ? -1 : 1;
      return a.driverDistanceKm - b.driverDistanceKm;
    })
    .slice(0, RADAR_FALLBACK_LIMIT)
    .map(({ request }) => request);
}

export function hasNewPendingRequests(requests: Trip[], previousIds: Set<string>): boolean {
  for (const req of requests) {
    if (!previousIds.has(req.id)) {
      return true;
    }
  }
  return false;
}
