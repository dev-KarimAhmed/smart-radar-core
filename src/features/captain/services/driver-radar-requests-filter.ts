import type { Trip } from '@/core/types';
import { estimateHaversineDistanceKm } from './ride-location';
import {
  MAX_RADAR_REQUEST_AGE_MS,
  RADAR_FALLBACK_LIMIT,
  RADAR_MAX_DISTANCE_KM,
  mapRideRequestToTrip,
  type RadarLocation,
} from './driver-radar-mapper';

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

export function filterAndRankRadarRequests({
  allRows,
  activePendingTripIds,
  loc,
  cells,
  now = Date.now(),
}: {
  allRows: any[];
  activePendingTripIds?: string[];
  loc: RadarLocation;
  cells: string[];
  now?: number;
}): Trip[] {
  const mappedRequests = Array.isArray(allRows)
    ? (allRows.map(mapRideRequestToTrip).filter(Boolean) as Trip[])
    : [];

  return mappedRequests
    .filter((request) => {
      const isPendingOffer = Boolean(activePendingTripIds && activePendingTripIds.includes(request.id));
      if (isPendingOffer) return true;
      const createdMs = request.createdAt ? new Date(request.createdAt).getTime() : 0;
      return createdMs > 0 && now - createdMs <= MAX_RADAR_REQUEST_AGE_MS;
    })
    .map((request) => {
      const driverDistanceKm =
        estimateHaversineDistanceKm(loc.lat, loc.lng, request.pickupCoords.lat, request.pickupCoords.lng) ??
        Number.POSITIVE_INFINITY;
      const isInH3Disk = request.h3Index ? cells.includes(request.h3Index) : false;
      return { request, driverDistanceKm, isInH3Disk };
    })
    .filter(({ driverDistanceKm }) => Number.isFinite(driverDistanceKm) && driverDistanceKm <= RADAR_MAX_DISTANCE_KM)
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

