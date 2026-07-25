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

/**
 * Gets a road-network estimate from OSRM and falls back to a local estimate
 * when the router is unavailable. Google Maps is intentionally not queried.
 */
export async function fetchRoadRoute(
  origin: RoadRoutePoint,
  destination: RoadRoutePoint,
  tortuosityFactor = FALLBACK_TORTUOSITY_FACTOR,
): Promise<RoadRouteEstimate> {
  const fallback = createFallbackEstimate(origin, destination, tortuosityFactor);
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

    if (
      payload.code !== 'Ok' ||
      !Number.isFinite(distanceKm) ||
      !Number.isFinite(durationMinutes) ||
      distanceKm <= 0 ||
      durationMinutes <= 0
    ) {
      return fallback;
    }

    return {
      distanceKm: roundMetric(distanceKm),
      durationMinutes: Math.max(1, Math.ceil(durationMinutes)),
      isFallback: false,
    };
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
  const distanceKm = Math.max(0.1, straightDistanceKm * Math.max(1, tortuosityFactor));

  return {
    distanceKm: roundMetric(distanceKm),
    durationMinutes: Math.max(3, Math.round(distanceKm * 2.2)),
    isFallback: true,
  };
}

function calculateHaversineKm(origin: RoadRoutePoint, destination: RoadRoutePoint) {
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

function roundMetric(value: number) {
  return Number(value.toFixed(2));
}
