import { estimateTripMinutes } from '@/shared/services/trip-duration';
import {
  RoadRouteEstimate,
  RoadRoutePoint,
  RouteProvider,
  DEFAULT_TRAFFIC_FACTOR,
  MIN_TRAFFIC_FACTOR,
  MAX_TRAFFIC_FACTOR,
  FALLBACK_TORTUOSITY_FACTOR,
  MIN_TORTUOSITY_FACTOR,
  MAX_TORTUOSITY_FACTOR,
  MAX_ROUTE_DISTANCE_KM,
} from './route-types';

export function normalizeTrafficFactor(value: number): number {
  const factor = Number.isFinite(value) ? value : DEFAULT_TRAFFIC_FACTOR;
  return Math.min(MAX_TRAFFIC_FACTOR, Math.max(MIN_TRAFFIC_FACTOR, factor));
}

export function normalizeTortuosityFactor(value: number): number {
  const factor = Number.isFinite(value) ? value : FALLBACK_TORTUOSITY_FACTOR;
  return Math.min(MAX_TORTUOSITY_FACTOR, Math.max(MIN_TORTUOSITY_FACTOR, factor));
}

export function validateRouteDistanceKm(distanceKm: number): void {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0 || distanceKm > MAX_ROUTE_DISTANCE_KM) {
    throw new Error('invalid_route_distance');
  }
}

export function calculateHaversineKm(origin: RoadRoutePoint, destination: RoadRoutePoint): number {
  const earthRadiusKm = 6371;
  const latitudeDelta = ((destination.lat - origin.lat) * Math.PI) / 180;
  const longitudeDelta = ((destination.lng - origin.lng) * Math.PI) / 180;
  const originLatitude = (origin.lat * Math.PI) / 180;
  const destinationLatitude = (destination.lat * Math.PI) / 180;
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(originLatitude) * Math.cos(destinationLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(haversine), Math.sqrt(Math.max(0, 1 - haversine)));
}

export function roundMetric(value: number): number {
  return Number(value.toFixed(2));
}

export function auditDistance(
  source: RouteProvider | 'haversine-fallback',
  origin: RoadRoutePoint,
  destination: RoadRoutePoint,
  tortuosityFactor: number,
  estimate: RoadRouteEstimate,
): void {
  if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') return;
  console.info('[Distance audit]', {
    source,
    origin,
    destination,
    tortuosityFactor,
    distanceKm: estimate.distanceKm,
    durationMinutes: estimate.durationMinutes,
  });
}

export function createFallbackEstimate(
  origin: RoadRoutePoint,
  destination: RoadRoutePoint,
  tortuosityFactor: number,
): RoadRouteEstimate {
  const straightDistanceKm = calculateHaversineKm(origin, destination);
  const distanceKm = straightDistanceKm * normalizeTortuosityFactor(tortuosityFactor);
  validateRouteDistanceKm(distanceKm);

  const estimate: RoadRouteEstimate = {
    distanceKm: roundMetric(distanceKm),
    durationMinutes: estimateTripMinutes(distanceKm),
    isFallback: true,
    source: 'haversine-fallback' as const,
    origin,
    destination,
  };
  auditDistance('haversine-fallback', origin, destination, normalizeTortuosityFactor(tortuosityFactor), estimate);
  return estimate;
}
