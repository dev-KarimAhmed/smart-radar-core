import assert from 'node:assert/strict';
import { fetchRoadRoute, resetRouteProviderHealth } from './road-route';

const origin = { lat: 30.0444, lng: 31.2357 };
const destination = { lat: 30.0626, lng: 31.2497 };

const originalFetch = globalThis.fetch;
let fetchCalls = 0;

function jsonResponse(payload: unknown) {
  return { ok: true, json: async () => payload } as unknown as Response;
}

/** Valhalla is primary, so a Valhalla-shaped answer is what a healthy router looks like. */
function stubValhalla(distanceKm: number, durationSeconds: number) {
  fetchCalls = 0;
  globalThis.fetch = (async () => {
    fetchCalls += 1;
    return jsonResponse({ trip: { status: 0, summary: { length: distanceKm, time: durationSeconds } } });
  }) as typeof fetch;
}

/** Valhalla unreachable, OSRM answering — the fallback provider in the chain. */
function stubOsrmOnly(distanceMeters: number, durationSeconds: number) {
  fetchCalls = 0;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    fetchCalls += 1;
    if (String(input).includes('valhalla')) throw new Error('valhalla unavailable');
    return jsonResponse({ code: 'Ok', routes: [{ distance: distanceMeters, duration: durationSeconds }] });
  }) as typeof fetch;
}

/**
 * A fixed departure time. The duration became time-of-day dependent, so without pinning the
 * clock these assertions would pass or fail depending on the hour the suite happened to run.
 * 02:00 sits in the overnight trough where the curve is 0.85.
 */
const NIGHT = new Date('2026-09-08T02:00:00');
const NIGHT_FACTOR = 0.85;

try {
  // Valhalla is primary. Its duration already models road class, turns and stops, so it is
  // used exactly as reported — no country factor and no time-of-day factor on top.
  stubValhalla(4.2, 20 * 60);
  const first = await fetchRoadRoute(origin, destination, 1.35, 1.25, NIGHT);
  assert.equal(first.isFallback, false);
  assert.equal(first.distanceKm, 4.2);
  assert.equal(first.durationMinutes, 20, "Valhalla's duration is congestion-aware already");
  assert.equal(fetchCalls, 1);

  // The same trip must come from cache. Without this every nudge of the destination pin
  // fires another request at a shared free router and gets rate-limited into the fallback.
  const second = await fetchRoadRoute(origin, destination, 1.35, 1.25, NIGHT);
  assert.deepEqual(second, first);
  assert.equal(fetchCalls, 1, 'a repeated identical route must not re-hit the router');

  // A different departure hour is a different answer, so it must not reuse the cached one —
  // otherwise a route first quoted in the 08:00 peak keeps serving that duration at midday.
  const RUSH = new Date('2026-09-08T08:00:00');
  const atRush = await fetchRoadRoute(origin, destination, 1.35, 1.25, RUSH);
  assert.equal(fetchCalls, 2, 'a changed departure hour must not hit the cache');
  assert.equal(atRush.durationMinutes, 20, 'still congestion-aware, so still unscaled');

  // Valhalla down, OSRM up: the chain falls through rather than dropping to the local
  // estimate, because OSRM's distance is still far better than haversine. Its duration IS
  // free-flow, so it is the one that gets both factors.
  const osrmDestination = { lat: 30.0700, lng: 31.2600 };
  stubOsrmOnly(4200, 20 * 60);
  const viaOsrm = await fetchRoadRoute(origin, osrmDestination, 1.35, 1.25, NIGHT);
  assert.equal(viaOsrm.isFallback, false);
  assert.equal(viaOsrm.distanceKm, 4.2);
  assert.equal(
    viaOsrm.durationMinutes,
    Math.ceil(20 * 1.25 * NIGHT_FACTOR),
    '20 free-flow min x 1.25 traffic x 0.85 overnight',
  );
  assert.equal(fetchCalls, 2, 'primary gets ONE attempt, then OSRM answers first try');

  // The country factor is clamped: a nonsensical value cannot invent hours of travel time.
  const clampDestination = { lat: 30.0800, lng: 31.2700 };
  stubOsrmOnly(4200, 20 * 60);
  const clamped = await fetchRoadRoute(origin, clampDestination, 1.35, 99, NIGHT);
  assert.equal(clamped.durationMinutes, Math.ceil(20 * 3 * NIGHT_FACTOR), 'clamped to the 3x ceiling');

  // A route several times longer than the straight line means a bad answer or — far more
  // often — coordinates that do not point where the rider thinks. Reject it.
  const implausibleDestination = { lat: 30.0500, lng: 31.2400 };
  stubValhalla(400, 60 * 60);
  const implausible = await fetchRoadRoute(origin, implausibleDestination, 1.35, 1.25, NIGHT);
  assert.equal(implausible.isFallback, true, 'an implausible route must not be billed');

  // Both routers unreachable must fall back locally — and must NOT be cached, or the trip
  // would stay pinned to the estimate even after a router recovers.
  resetRouteProviderHealth();
  const elsewhere = { lat: 29.9773, lng: 31.1325 };
  globalThis.fetch = (async () => {
    fetchCalls += 1;
    throw new Error('router unavailable');
  }) as typeof fetch;

  const callsBeforeFirstFallback = fetchCalls;
  const fallback = await fetchRoadRoute(origin, elsewhere, 1.35, 1.25, NIGHT);
  assert.equal(fallback.isFallback, true);
  assert.ok(fallback.durationMinutes > 0);
  assert.equal(
    fetchCalls,
    callsBeforeFirstFallback + 3,
    'one attempt at the primary, then two at each remaining reachable provider',
  );

  // The breaker now has the primary on cooldown, so the next lookup must not pay for it
  // again. A router that is simply down should cost one slow request, not one per route.
  const callsBeforeBreaker = fetchCalls;
  await fetchRoadRoute(origin, elsewhere, 1.35, 1.25, NIGHT);
  assert.ok(
    fetchCalls - callsBeforeBreaker < 3,
    'a provider on cooldown must be skipped, not retried every time',
  );

  // A transient failure that recovers on the retry must still produce a real routed answer.
  resetRouteProviderHealth();
  let attemptsSoFar = 0;
  const recovers = { lat: 30.1, lng: 31.3 };
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    attemptsSoFar += 1;
    // The primary gets a single attempt, so the recovery has to happen on OSRM.
    if (String(input).includes('valhalla')) throw new Error('down');
    if (attemptsSoFar === 2) throw new Error('rate limited');
    return jsonResponse({ code: 'Ok', routes: [{ distance: 3000, duration: 600 }] });
  }) as typeof fetch;

  const recovered = await fetchRoadRoute(origin, recovers, 1.35, 1.25, NIGHT);
  assert.equal(recovered.isFallback, false, 'a retry that succeeds must be used, not the local estimate');
} finally {
  globalThis.fetch = originalFetch;
}

console.log('road route cache checks passed');
