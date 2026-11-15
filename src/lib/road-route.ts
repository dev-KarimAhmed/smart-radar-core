import { timeOfDayTrafficMultiplier } from '@/shared/services/trip-duration';
import {
  RoadRoutePoint,
  RoadRouteEstimate,
  RouteProvider,
  ROUTE_PROVIDERS,
  DEFAULT_MAPBOX_URL,
  DEFAULT_VALHALLA_URL,
  DEFAULT_OSRM_URL,
  OSM_ROAD_CALIBRATION_FACTOR,
  ROUTE_TIMEOUT_MS,
  ROUTE_FETCH_ATTEMPTS,
  PRIMARY_TIMEOUT_MS,
  FALLBACK_TORTUOSITY_FACTOR,
  DEFAULT_TRAFFIC_FACTOR,
} from './road-route/route-types';
import {
  normalizeTortuosityFactor,
  normalizeTrafficFactor,
  calculateHaversineKm,
  roundMetric,
  auditDistance,
  createFallbackEstimate,
} from './road-route/route-math';
import {
  isProviderCoolingDown,
  noteProviderFailure,
  noteProviderSuccess,
  buildRouteCacheKey,
  rememberRoute,
  routeCache,
} from './road-route/route-cache-breaker';
import {
  getMapboxToken,
  requestMapboxRoute,
  requestValhallaRoute,
  requestOsrmRoute,
  isPlausibleRoute,
} from './road-route/route-providers';

export {
  type RoadRoutePoint,
  type RoadRouteEstimate,
  type RouteProvider,
  OSM_ROAD_CALIBRATION_FACTOR,
  DEFAULT_TRAFFIC_FACTOR,
  MIN_TRAFFIC_FACTOR,
  MAX_TRAFFIC_FACTOR,
  MIN_TORTUOSITY_FACTOR,
  MAX_TORTUOSITY_FACTOR,
  MAX_ROUTE_DISTANCE_KM,
  MAX_ROUTE_TO_STRAIGHT_DISTANCE_RATIO,
} from './road-route/route-types';

export {
  normalizeTrafficFactor,
  normalizeTortuosityFactor,
  validateRouteDistanceKm,
  calculateHaversineKm,
} from './road-route/route-math';

export { resetRouteProviderHealth } from './road-route/route-cache-breaker';
export { getMapboxToken, pickOptimalMapboxRoute } from './road-route/route-providers';

/**
 * Gets a road-network estimate from Valhalla, then OSRM, and falls back to a local estimate
 * when neither router is reachable. Google Maps is intentionally not queried.
 */
export async function fetchRoadRoute(
  origin: RoadRoutePoint,
  destination: RoadRoutePoint,
  tortuosityFactor = FALLBACK_TORTUOSITY_FACTOR,
  trafficFactor = DEFAULT_TRAFFIC_FACTOR,
  when: Date = new Date(),
): Promise<RoadRouteEstimate> {
  const normalizedTortuosityFactor = normalizeTortuosityFactor(tortuosityFactor);
  const normalizedTrafficFactor = normalizeTrafficFactor(trafficFactor);

  const timeOfDayFactor = timeOfDayTrafficMultiplier(when);
  const cacheKey = buildRouteCacheKey(
    origin,
    destination,
    normalizedTortuosityFactor,
    normalizedTrafficFactor,
    timeOfDayFactor,
  );
  const cached = routeCache.get(cacheKey);
  if (cached) return cached;

  const straightDistanceKm = calculateHaversineKm(origin, destination);
  const mapboxToken = getMapboxToken();
  const baseUrls: Record<RouteProvider, string> = {
    mapbox: (process.env.NEXT_PUBLIC_MAPBOX_URL?.trim() || DEFAULT_MAPBOX_URL).replace(/\/$/, ''),
    valhalla: (process.env.NEXT_PUBLIC_VALHALLA_URL?.trim() || DEFAULT_VALHALLA_URL).replace(/\/$/, ''),
    osrm: (process.env.NEXT_PUBLIC_OSRM_URL?.trim() || DEFAULT_OSRM_URL).replace(/\/$/, ''),
  };

  providerLoop:
  for (const provider of ROUTE_PROVIDERS) {
    if (provider === 'mapbox' && !mapboxToken) continue;
    if (isProviderCoolingDown(provider)) continue;

    const isFastTimeout = provider === 'mapbox' || provider === 'valhalla';
    const timeoutMs = isFastTimeout ? PRIMARY_TIMEOUT_MS : ROUTE_TIMEOUT_MS;
    const attempts = isFastTimeout ? 1 : ROUTE_FETCH_ATTEMPTS;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const raw = provider === 'mapbox'
          ? await requestMapboxRoute(baseUrls.mapbox, mapboxToken, origin, destination, controller.signal)
          : provider === 'valhalla'
            ? await requestValhallaRoute(baseUrls.valhalla, origin, destination, controller.signal)
            : await requestOsrmRoute(baseUrls.osrm, origin, destination, controller.signal);

        if (!raw || !isPlausibleRoute(raw, straightDistanceKm)) {
          continue providerLoop;
        }

        const distanceKm = raw.distanceKm * OSM_ROAD_CALIBRATION_FACTOR;

        const baseMinutes = provider === 'osrm'
          ? raw.minutes * OSM_ROAD_CALIBRATION_FACTOR
          : raw.minutes;

        const minutes = raw.modelsCongestion
          ? baseMinutes
          : baseMinutes * normalizedTrafficFactor * timeOfDayFactor;

        const estimate: RoadRouteEstimate = {
          distanceKm: roundMetric(distanceKm),
          durationMinutes: Math.max(1, Math.ceil(minutes)),
          isFallback: false,
          source: provider,
          origin,
          destination,
        };

        noteProviderSuccess(provider);
        auditDistance(provider, origin, destination, normalizedTortuosityFactor, estimate);
        rememberRoute(cacheKey, estimate);
        return estimate;
      } catch {
        noteProviderFailure(provider);
      } finally {
        clearTimeout(timeoutId);
      }
    }
  }

  return createFallbackEstimate(origin, destination, normalizedTortuosityFactor);
}
