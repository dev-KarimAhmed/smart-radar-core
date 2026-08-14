export interface RoadRoutePoint {
  lat: number;
  lng: number;
}

export interface RoadRouteEstimate {
  distanceKm: number;
  durationMinutes: number;
  isFallback: boolean;
}

const DEFAULT_OSRM_URL = 'https://router.project-osrm.org';
const ROUTE_TIMEOUT_MS = 1500;
const FALLBACK_TORTUOSITY_FACTOR = 1.3;
export const MIN_TORTUOSITY_FACTOR = 1.15;
export const MAX_TORTUOSITY_FACTOR = 1.35;
export const MAX_ROUTE_DISTANCE_KM = 1000;
// A road route can be longer than the straight line, but a result that is
// several times longer is usually a bad router response or a coordinate
// mismatch. In that case the local, bounded estimate is safer for the rider.
export const MAX_ROUTE_TO_STRAIGHT_DISTANCE_RATIO = 4;

export function normalizeTortuosityFactor(value: number) {
  const factor = Number.isFinite(value) ? value : FALLBACK_TORTUOSITY_FACTOR;
  return Math.min(MAX_TORTUOSITY_FACTOR, Math.max(MIN_TORTUOSITY_FACTOR, factor));
}

export function validateRouteDistanceKm(distanceKm: number) {
  if (!Number.isFinite(distanceKm) || distanceKm <= 0 || distanceKm > MAX_ROUTE_DISTANCE_KM) {
    throw new Error('invalid_route_distance');
  }
}

/**
 * Gets a road-network estimate from OSRM and falls back to a local estimate
 * when the router is unavailable. Google Maps is intentionally not queried.
 */
export async function fetchRoadRoute(
  origin: RoadRoutePoint,
  destination: RoadRoutePoint,
  tortuosityFactor = FALLBACK_TORTUOSITY_FACTOR,
): Promise<RoadRouteEstimate> {
  const normalizedTortuosityFactor = normalizeTortuosityFactor(tortuosityFactor);
  const fallback = createFallbackEstimate(origin, destination, normalizedTortuosityFactor);
  const baseUrl = process.env.NEXT_PUBLIC_OSRM_URL?.trim() || DEFAULT_OSRM_URL;
  const endpoint = `${baseUrl.replace(/\/$/, '')}/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=false&steps=false`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), ROUTE_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) return fallback;

    const payload = (await response.json()) as {
      code?: string;
      routes?: Array<{ distance?: number; duration?: number }>;
    };
    const route = payload.routes?.[0];
    const distanceKm = Number(route?.distance) / 1000;
    const durationMinutes = Number(route?.duration) / 60;
    const straightDistanceKm = calculateHaversineKm(origin, destination);
    const hasPlausibleRoadDistance =
      straightDistanceKm > 0 &&
      distanceKm <= Math.max(
        straightDistanceKm * MAX_ROUTE_TO_STRAIGHT_DISTANCE_RATIO,
        straightDistanceKm + 25,
      );

    if (
      payload.code !== 'Ok' ||
      !Number.isFinite(distanceKm) ||
      !Number.isFinite(durationMinutes) ||
      distanceKm <= 0 ||
      distanceKm > MAX_ROUTE_DISTANCE_KM ||
      durationMinutes <= 0 ||
      !hasPlausibleRoadDistance
    ) {
      return fallback;
    }

    const estimate = {
      distanceKm: roundMetric(distanceKm),
      durationMinutes: Math.max(1, Math.ceil(durationMinutes)),
      isFallback: false,
    };
    validateRouteDistanceKm(estimate.distanceKm);
    auditDistance('osrm', origin, destination, normalizedTortuosityFactor, estimate);
    return estimate;
  } catch {
    return fallback;
  } finally {
    clearTimeout(timeoutId);
  }
}

function createFallbackEstimate(
  origin: RoadRoutePoint,
  destination: RoadRoutePoint,
  tortuosityFactor: number,
): RoadRouteEstimate {
  const straightDistanceKm = calculateHaversineKm(origin, destination);
  const distanceKm = straightDistanceKm * normalizeTortuosityFactor(tortuosityFactor);
  validateRouteDistanceKm(distanceKm);

  const estimate = {
    distanceKm: roundMetric(distanceKm),
    durationMinutes: Math.max(3, Math.round(distanceKm * 2.2)),
    isFallback: true,
  };
  auditDistance('haversine-fallback', origin, destination, normalizeTortuosityFactor(tortuosityFactor), estimate);
  return estimate;
}

export function calculateHaversineKm(origin: RoadRoutePoint, destination: RoadRoutePoint) {
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

function auditDistance(
  source: 'osrm' | 'haversine-fallback',
  origin: RoadRoutePoint,
  destination: RoadRoutePoint,
  tortuosityFactor: number,
  estimate: RoadRouteEstimate,
) {
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

function roundMetric(value: number) {
  return Number(value.toFixed(2));
}
