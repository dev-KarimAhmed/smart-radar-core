import { estimateTripMinutes, timeOfDayTrafficMultiplier } from '@/shared/services/trip-duration';

export interface RoadRoutePoint {
  lat: number;
  lng: number;
}

export interface RoadRouteEstimate {
  distanceKm: number;
  durationMinutes: number;
  isFallback: boolean;
  /**
   * Which engine produced this, and between which two points.
   *
   * Carried on the estimate because "the distance is wrong" has been diagnosed three times
   * now from a screenshot of the answer alone, which cannot distinguish a bad router from
   * good routing between the wrong two points — and those need completely different fixes.
   */
  source?: RouteProvider | 'haversine-fallback';
  origin?: RoadRoutePoint;
  destination?: RoadRoutePoint;
}

/**
 * Two free, keyless, CORS-enabled OSM routers, tried in order.
 *
 * They agree on DISTANCE to within a few percent — measured on three Cairo/Giza routes:
 *
 *   Tahrir      -> Mall of Arabia   OSRM 28.83 km | Valhalla 29.91 km
 *   Mohandessin -> Mall of Arabia   OSRM 24.63 km | Valhalla 25.64 km
 *   Sh. Zayed   -> Mall of Arabia   OSRM  7.71 km | Valhalla  7.51 km
 *
 * They do NOT agree on DURATION, and OSRM is the one that is wrong:
 *
 *   Tahrir      -> Mall of Arabia   OSRM 25.8 min (67 km/h!) | Valhalla 40.8 min (44 km/h)
 *   Mohandessin -> Mall of Arabia   OSRM 24.2 min (61 km/h)  | Valhalla 37.3 min (41 km/h)
 *   Sh. Zayed   -> Mall of Arabia   OSRM 10.0 min (46 km/h)  | Valhalla 25.8 min (17 km/h)
 *
 * 67 km/h across Cairo is not a traffic estimate, it is a speed-limit sum. OSRM's public
 * profile assigns each way its maximum speed and models no junction, signal or congestion
 * cost at all. Valhalla penalises road class, turns and stops, which lands it in the same
 * range as the Google figures the client measured (16.4 km in 31 min = 32 km/h).
 *
 * Valhalla is therefore primary and OSRM is the fallback: OSRM's distance is fine, so it is
 * still far better than the local haversine estimate when Valhalla is unreachable.
 */
const DEFAULT_VALHALLA_URL = 'https://valhalla1.openstreetmap.de';
const DEFAULT_OSRM_URL = 'https://router.project-osrm.org';
/**
 * 'proxy' is this app's own /api/road-route, tried last and only in a browser.
 *
 * Direct-from-browser stays first on purpose: it spreads load across users rather than
 * pointing every request in the system at a community fair-use server from one IP. The
 * proxy is the rescue for the browsers that cannot reach the routers at all — ad-blockers,
 * corporate DNS, captive portals — which previously dropped straight to a straight-line
 * guess. On the server this entry is skipped, so the endpoint calling back into here cannot
 * recurse.
 */
const ROUTE_PROVIDERS = ['valhalla', 'osrm', 'proxy'] as const;
type RouteProvider = (typeof ROUTE_PROVIDERS)[number];

interface RawRoute {
  distanceKm: number;
  minutes: number;
  /**
   * Whether the engine's duration already accounts for real-world slowdown. Valhalla's
   * does; OSRM's does not, and only OSRM's gets multiplied by the traffic factor. Applying
   * it to both would double-count on the engine that already models the cost.
   */
  modelsCongestion: boolean;
}
/**
 * 1.5s was too tight for the free public OSRM endpoint, which is shared and rate-limited:
 * the request was being aborted while the router was still answering, and every abort
 * dropped the trip onto the local estimate. 4.5s costs nothing and converts a good share of
 * those into real routed answers. The rider sees a debounced spinner either way.
 */
const ROUTE_TIMEOUT_MS = 4500;
/**
 * One retry on top of the initial attempt. A dropped connection or a momentary rate-limit
 * from the shared free router is often gone a beat later, so a single extra try converts
 * a meaningful share of transient failures into a real routed answer instead of the local
 * estimate. Not retried: a response the router actually answered (bad/implausible route) —
 * that's a real result, not a hiccup, and retrying it would just waste time.
 */
const ROUTE_FETCH_ATTEMPTS = 2;

/**
 * The primary router gets a tighter deadline and no retry, because it is the least reliable
 * link in the chain. Measured: valhalla1.openstreetmap.de answered fine in the morning and
 * was timing out entirely a few hours later, while OSRM stayed up throughout. With the
 * shared 4.5s budget and two attempts, EVERY trip then sat for ~9s before OSRM was even
 * asked — the rider waiting on a spinner for a router that was never going to answer.
 *
 * A community instance being occasionally unavailable is not a bug to fix; it is a property
 * to design around.
 */
const PRIMARY_TIMEOUT_MS = 2500;

/**
 * Circuit breaker. After this many consecutive failures the provider is skipped entirely for
 * the cooldown, so a router that is simply down costs one slow request instead of one per
 * route lookup. I argued against adding this earlier on the grounds that a blocked network
 * fails fast — that was wrong: an unreachable host TIMES OUT, it does not refuse.
 */
const PROVIDER_FAILURE_LIMIT = 2;
const PROVIDER_COOLDOWN_MS = 120_000;
const providerFailures = new Map<RouteProvider, { count: number; until: number }>();

function isProviderCoolingDown(provider: RouteProvider) {
  const record = providerFailures.get(provider);
  if (!record) return false;
  if (record.until > Date.now()) return true;
  providerFailures.delete(provider);
  return false;
}

function noteProviderFailure(provider: RouteProvider) {
  const record = providerFailures.get(provider) ?? { count: 0, until: 0 };
  record.count += 1;
  if (record.count >= PROVIDER_FAILURE_LIMIT) {
    record.until = Date.now() + PROVIDER_COOLDOWN_MS;
    record.count = 0;
  }
  providerFailures.set(provider, record);
}

function noteProviderSuccess(provider: RouteProvider) {
  providerFailures.delete(provider);
}

/** Test seam: module-level breaker state would otherwise leak between test cases. */
export function resetRouteProviderHealth() {
  providerFailures.clear();
}

/**
 * Routes are cached because OSRM's default profile has no live traffic — the same two
 * points always produce the same distance and duration. Without this, every nudge of the
 * destination pin fired another request at a shared free server, which is exactly how you
 * get rate-limited into the fallback.
 *
 * Keyed on coordinates rounded to ~11 m, so a pin jitter of a few metres reuses the answer.
 */
const ROUTE_CACHE_LIMIT = 200;
const routeCache = new Map<string, RoadRouteEstimate>();

function buildRouteCacheKey(
  origin: RoadRoutePoint,
  destination: RoadRoutePoint,
  tortuosityFactor: number,
  trafficFactor: number,
  timeOfDayFactor: number,
) {
  const round = (value: number) => value.toFixed(4);
  return [
    round(origin.lat), round(origin.lng),
    round(destination.lat), round(destination.lng),
    tortuosityFactor.toFixed(2),
    trafficFactor.toFixed(2),
    // Part of the key, or a route first quoted in the 08:00 peak would keep serving that
    // rush-hour duration to everyone at 14:00 for as long as it stayed in the cache.
    timeOfDayFactor.toFixed(2),
  ].join(',');
}

function rememberRoute(key: string, estimate: RoadRouteEstimate) {
  // Only real routed answers are worth keeping; caching a fallback would pin a trip to the
  // local estimate even once the router recovers.
  if (estimate.isFallback) return;
  if (routeCache.size >= ROUTE_CACHE_LIMIT) {
    const oldestKey = routeCache.keys().next().value;
    if (oldestKey !== undefined) routeCache.delete(oldestKey);
  }
  routeCache.set(key, estimate);
}
const FALLBACK_TORTUOSITY_FACTOR = 1.3;
/** Used when the caller has no country-specific value; countries.traffic_factor overrides it. */
export const DEFAULT_TRAFFIC_FACTOR = 1.25;
export const MIN_TRAFFIC_FACTOR = 1;
export const MAX_TRAFFIC_FACTOR = 3;

export function normalizeTrafficFactor(value: number) {
  const factor = Number.isFinite(value) ? value : DEFAULT_TRAFFIC_FACTOR;
  return Math.min(MAX_TRAFFIC_FACTOR, Math.max(MIN_TRAFFIC_FACTOR, factor));
}
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

/** Valhalla: free FOSSGIS instance, no API key, `Access-Control-Allow-Origin: *`. */
async function requestValhallaRoute(
  baseUrl: string,
  origin: RoadRoutePoint,
  destination: RoadRoutePoint,
  signal: AbortSignal,
): Promise<RawRoute | null> {
  const query = JSON.stringify({
    locations: [
      { lat: origin.lat, lon: origin.lng },
      { lat: destination.lat, lon: destination.lng },
    ],
    costing: 'auto',
    // Without this the summary comes back in miles and every distance is 1.6x short.
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

async function requestOsrmRoute(
  baseUrl: string,
  origin: RoadRoutePoint,
  destination: RoadRoutePoint,
  signal: AbortSignal,
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

/**
 * This app's own server. It already applied the traffic factor, so the answer is reported as
 * congestion-aware and is not scaled a second time.
 */
async function requestProxyRoute(
  origin: RoadRoutePoint,
  destination: RoadRoutePoint,
  tortuosityFactor: number,
  trafficFactor: number,
  signal: AbortSignal,
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
  // The server fell back to its own straight-line guess. Ours is identical and free, so
  // there is nothing to gain by accepting it as though it were routed.
  if (payload.isFallback) return null;

  return { distanceKm, minutes, modelsCongestion: true };
}

/**
 * A road route is always at least the straight line and rarely more than a few times it.
 * Several times longer means a bad router answer or — far more often — coordinates that do
 * not point where the rider thinks they do.
 */
function isPlausibleRoute(raw: RawRoute, straightDistanceKm: number) {
  if (raw.distanceKm <= 0 || raw.minutes <= 0) return false;
  if (raw.distanceKm > MAX_ROUTE_DISTANCE_KM) return false;
  if (straightDistanceKm <= 0) return false;

  return raw.distanceKm <= Math.max(
    straightDistanceKm * MAX_ROUTE_TO_STRAIGHT_DISTANCE_RATIO,
    straightDistanceKm + 25,
  );
}

/**
 * Gets a road-network estimate from Valhalla, then OSRM, and falls back to a local estimate
 * when neither router is reachable. Google Maps is intentionally not queried.
 */
export async function fetchRoadRoute(
  origin: RoadRoutePoint,
  destination: RoadRoutePoint,
  tortuosityFactor = FALLBACK_TORTUOSITY_FACTOR,
  /**
   * Multiplier turning OSRM's free-flow duration into a realistic one, applied ONLY to an
   * OSRM answer. OSRM models no congestion whatsoever — measured across Cairo it reported
   * 67 km/h. Valhalla already prices road class, turns and stops, so its duration is used
   * as given; scaling it too would double-count.
   *
   * Deliberately NOT applied to the local fallback either: its 40 km/h city speed is
   * already a congested speed.
   */
  trafficFactor = DEFAULT_TRAFFIC_FACTOR,
  /**
   * When the trip departs, for the time-of-day multiplier. Injectable because the moment
   * this became time-dependent, a fixed input stopped producing a fixed output — which
   * makes the function untestable and its behaviour impossible to reason about from a log.
   * Also the seam for quoting a scheduled ride at its real departure hour rather than now.
   */
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
  // 'proxy' has no base URL of its own — it is this app's own same-origin endpoint.
  const baseUrls: Record<Exclude<RouteProvider, 'proxy'>, string> = {
    valhalla: (process.env.NEXT_PUBLIC_VALHALLA_URL?.trim() || DEFAULT_VALHALLA_URL).replace(/\/$/, ''),
    osrm: (process.env.NEXT_PUBLIC_OSRM_URL?.trim() || DEFAULT_OSRM_URL).replace(/\/$/, ''),
  };

  providerLoop:
  for (const provider of ROUTE_PROVIDERS) {
    // A relative URL has nothing to resolve against outside a browser, and on the server
    // this entry is the endpoint we are already inside.
    if (provider === 'proxy' && typeof window === 'undefined') continue;
    if (isProviderCoolingDown(provider)) continue;

    const isPrimary = provider === ROUTE_PROVIDERS[0];
    const timeoutMs = isPrimary ? PRIMARY_TIMEOUT_MS : ROUTE_TIMEOUT_MS;
    const attempts = isPrimary ? 1 : ROUTE_FETCH_ATTEMPTS;

    for (let attempt = 1; attempt <= attempts; attempt += 1) {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const raw = provider === 'valhalla'
          ? await requestValhallaRoute(baseUrls.valhalla, origin, destination, controller.signal)
          : provider === 'osrm'
            ? await requestOsrmRoute(baseUrls.osrm, origin, destination, controller.signal)
            : await requestProxyRoute(
                origin,
                destination,
                normalizedTortuosityFactor,
                normalizedTrafficFactor,
                controller.signal,
              );

        // The router answered, just not usefully. That is a real result, not a hiccup, so
        // retrying it would only waste time — hand over to the next provider instead of
        // dropping straight to the local estimate the way this used to.
        if (!raw || !isPlausibleRoute(raw, straightDistanceKm)) {
          // The router answered, so it is up. Do not count this against its health.
          continue providerLoop;
        }

        // A free-flow duration gets the country factor AND the time of day. A
        // congestion-aware one gets neither: Valhalla already prices the road, and the
        // proxy already applied both of these server-side.
        const minutes = raw.modelsCongestion
          ? raw.minutes
          : raw.minutes * normalizedTrafficFactor * timeOfDayFactor;

        const estimate: RoadRouteEstimate = {
          distanceKm: roundMetric(raw.distanceKm),
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
        // Timeout or dropped connection. This one counts: it is how a router that is simply
        // down gets taken out of the chain instead of costing every rider a stall.
        noteProviderFailure(provider);
      } finally {
        clearTimeout(timeoutId);
      }
    }
  }

  // Built only now, not up front: computing it eagerly also logged a "haversine-fallback"
  // audit line for every trip that then routed perfectly well, which made the logs read as
  // though the router had failed when it had not.
  return createFallbackEstimate(origin, destination, normalizedTortuosityFactor);
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
    // Shared with the server's own fallback, so a fare estimated without the router still
    // matches the duration the rider is shown.
    durationMinutes: estimateTripMinutes(distanceKm),
    isFallback: true,
    source: 'haversine-fallback' as const,
    origin,
    destination,
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
  source: RouteProvider | 'haversine-fallback',
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
