import type { RoadRoutePoint, RoadRouteEstimate } from './road-route';

export interface RawRoute {
  distanceKm: number;
  minutes: number;
  modelsCongestion: boolean;
}

export const MAX_ROUTE_DISTANCE_KM = 40000;
export const MAX_ROUTE_TO_STRAIGHT_DISTANCE_RATIO = 4;

export function getMapboxToken(): string {
  if (typeof process === 'undefined' || !process.env) return '';
  return (
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN ||
    process.env.MAPBOX_ACCESS_TOKEN ||
    ''
  ).trim();
}

/**
 * Mapbox Directions API (driving-traffic):
 * Free tier provides 100,000 requests/month forever ($0 cost).
 * Provides live real-time traffic and highway corridor routing matching Google Maps.
 */
export async function requestMapboxRoute(
  baseUrl: string,
  token: string,
  origin: RoadRoutePoint,
  destination: RoadRoutePoint,
  signal: AbortSignal
): Promise<RawRoute | null> {
  if (!token) return null;
  const endpoint = `${baseUrl}/directions/v5/mapbox/driving-traffic/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=false&alternatives=true&access_token=${encodeURIComponent(
    token
  )}`;
  const response = await fetch(endpoint, {
    signal,
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) return null;

  const payload = (await response.json()) as {
    code?: string;
    routes?: Array<{ distance?: number; duration?: number }>;
  };
  if (payload.code !== 'Ok' || !payload.routes || payload.routes.length === 0) return null;

  const bestRoute = pickOptimalMapboxRoute(payload.routes);
  const distanceKm = Number(bestRoute?.distance) / 1000;
  const minutes = Number(bestRoute?.duration) / 60;
  if (!Number.isFinite(distanceKm) || !Number.isFinite(minutes)) return null;

  return { distanceKm, minutes, modelsCongestion: true };
}

/**
 * Among alternative routes returned by Mapbox Directions API, intelligently selects the
 * real-world driving route:
 * - Eliminates high-detour options (e.g. multi-km U-turns on divided highways).
 * - Between viable routes with similar duration (within 10% or 120s of the fastest), prefers
 *   the arterial / highway corridor rather than narrow, bumpy residential shortcuts.
 * - When speeds are comparable, picks the shorter direct route.
 */
export function pickOptimalMapboxRoute(
  routes: Array<{ distance?: number; duration?: number }>
): { distance?: number; duration?: number } | undefined {
  if (routes.length <= 1) return routes[0];

  const fastestDuration = Math.min(...routes.map((r) => Number(r.duration) || Infinity));

  const viable = routes.filter((r) => {
    const dur = Number(r.duration) || Infinity;
    return dur <= fastestDuration * 1.1 || dur <= fastestDuration + 120;
  });

  if (viable.length === 1) return viable[0];

  return [...viable].sort((a, b) => {
    const durA = Number(a.duration) || 1;
    const durB = Number(b.duration) || 1;
    const distA = Number(a.distance) || 0;
    const distB = Number(b.distance) || 0;
    const speedA = distA / durA;
    const speedB = distB / durB;

    const minSpeed = Math.min(speedA, speedB);
    if (minSpeed > 0 && Math.abs(speedB - speedA) / minSpeed > 0.05) {
      return speedB - speedA;
    }

    return distA - distB;
  })[0];
}

/** Valhalla: free FOSSGIS instance, no API key, `Access-Control-Allow-Origin: *`. */
export async function requestValhallaRoute(
  baseUrl: string,
  origin: RoadRoutePoint,
  destination: RoadRoutePoint,
  signal: AbortSignal
): Promise<RawRoute | null> {
  const query = JSON.stringify({
    locations: [
      { lat: origin.lat, lon: origin.lng },
      { lat: destination.lat, lon: destination.lng },
    ],
    costing: 'auto',
    directions_options: { units: 'kilometers' },
  });

  const response = await fetch(`${baseUrl}/route?json=${encodeURIComponent(query)}`, {
    signal,
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) return null;

  const payload = (await response.json()) as {
    trip?: { status?: number; summary?: { length?: number; time?: number } };
  };
  if (payload.trip?.status !== 0) return null;

  const distanceKm = Number(payload.trip?.summary?.length);
  const minutes = Number(payload.trip?.summary?.time) / 60;
  if (!Number.isFinite(distanceKm) || !Number.isFinite(minutes)) return null;

  return { distanceKm, minutes, modelsCongestion: true };
}

export async function requestOsrmRoute(
  baseUrl: string,
  origin: RoadRoutePoint,
  destination: RoadRoutePoint,
  signal: AbortSignal
): Promise<RawRoute | null> {
  const endpoint = `${baseUrl}/route/v1/driving/${origin.lng},${origin.lat};${destination.lng},${destination.lat}?overview=false&steps=false`;
  const response = await fetch(endpoint, { signal, headers: { Accept: 'application/json' } });
  if (!response.ok) return null;

  const payload = (await response.json()) as {
    code?: string;
    routes?: Array<{ distance?: number; duration?: number }>;
  };
  if (payload.code !== 'Ok') return null;

  const distanceKm = Number(payload.routes?.[0]?.distance) / 1000;
  const minutes = Number(payload.routes?.[0]?.duration) / 60;
  if (!Number.isFinite(distanceKm) || !Number.isFinite(minutes)) return null;

  return { distanceKm, minutes, modelsCongestion: false };
}

export async function requestProxyRoute(
  origin: RoadRoutePoint,
  destination: RoadRoutePoint,
  tortuosityFactor: number,
  trafficFactor: number,
  signal: AbortSignal
): Promise<RawRoute | null> {
  const response = await fetch('/api/road-route', {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ origin, destination, tortuosityFactor, trafficFactor }),
  });
  if (!response.ok) return null;

  const payload = (await response.json()) as Partial<RoadRouteEstimate>;
  const distanceKm = Number(payload.distanceKm);
  const minutes = Number(payload.durationMinutes);
  if (!Number.isFinite(distanceKm) || !Number.isFinite(minutes)) return null;
  if (payload.isFallback) return null;

  return { distanceKm, minutes, modelsCongestion: true };
}

export function isPlausibleRoute(raw: RawRoute, straightDistanceKm: number): boolean {
  if (raw.distanceKm <= 0 || raw.minutes <= 0) return false;
  if (raw.distanceKm > MAX_ROUTE_DISTANCE_KM) return false;
  if (straightDistanceKm <= 0) return false;

  return raw.distanceKm <= Math.max(
    straightDistanceKm * MAX_ROUTE_TO_STRAIGHT_DISTANCE_RATIO,
    straightDistanceKm + 25
  );
}
