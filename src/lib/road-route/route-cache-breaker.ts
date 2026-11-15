import {
  RoadRouteEstimate,
  RoadRoutePoint,
  RouteProvider,
  PROVIDER_FAILURE_LIMIT,
  PROVIDER_COOLDOWN_MS,
  ROUTE_CACHE_LIMIT,
} from './route-types';

export const providerFailures = new Map<RouteProvider, { count: number; until: number }>();

export function isProviderCoolingDown(provider: RouteProvider): boolean {
  const record = providerFailures.get(provider);
  if (!record) return false;
  if (record.until > Date.now()) return true;
  providerFailures.delete(provider);
  return false;
}

export function noteProviderFailure(provider: RouteProvider): void {
  const record = providerFailures.get(provider) ?? { count: 0, until: 0 };
  record.count += 1;
  if (record.count >= PROVIDER_FAILURE_LIMIT) {
    record.until = Date.now() + PROVIDER_COOLDOWN_MS;
    record.count = 0;
  }
  providerFailures.set(provider, record);
}

export function noteProviderSuccess(provider: RouteProvider): void {
  providerFailures.delete(provider);
}

/** Test seam: module-level breaker state would otherwise leak between test cases. */
export function resetRouteProviderHealth(): void {
  providerFailures.clear();
}

export const routeCache = new Map<string, RoadRouteEstimate>();

export function buildRouteCacheKey(
  origin: RoadRoutePoint,
  destination: RoadRoutePoint,
  tortuosityFactor: number,
  trafficFactor: number,
  timeOfDayFactor: number,
): string {
  const round = (value: number) => value.toFixed(4);
  return [
    round(origin.lat), round(origin.lng),
    round(destination.lat), round(destination.lng),
    tortuosityFactor.toFixed(2),
    trafficFactor.toFixed(2),
    timeOfDayFactor.toFixed(2),
  ].join(',');
}

export function rememberRoute(key: string, estimate: RoadRouteEstimate): void {
  if (estimate.isFallback) return;
  if (routeCache.size >= ROUTE_CACHE_LIMIT) {
    const oldestKey = routeCache.keys().next().value;
    if (oldestKey !== undefined) routeCache.delete(oldestKey);
  }
  routeCache.set(key, estimate);
}
