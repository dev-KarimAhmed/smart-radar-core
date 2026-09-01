import assert from 'node:assert/strict';
import { fetchRoadRoute } from './road-route';

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


try {
  // Valhalla is primary. Its duration already models road class, turns and stops, so it is
  // used exactly as reported — no traffic multiplier on top.
  stubValhalla(4.2, 20 * 60);
  const first = await fetchRoadRoute(origin, destination, 1.35, 1.25);
  assert.equal(first.isFallback, false);
  assert.equal(first.distanceKm, 4.2);
  assert.equal(first.durationMinutes, 20, "Valhalla's duration is congestion-aware already");
  assert.equal(fetchCalls, 1);

  // The same trip must come from cache. Without this every nudge of the destination pin
  // fires another request at a shared free router and gets rate-limited into the fallback.
  const second = await fetchRoadRoute(origin, destination, 1.35, 1.25);
  assert.deepEqual(second, first);
  assert.equal(fetchCalls, 1, 'a repeated identical route must not re-hit the router');

  // Valhalla ignores the traffic factor, but it is still part of the cache key, so a
  // changed factor re-asks the router and gets the same congestion-aware answer back.
  const lighterTraffic = await fetchRoadRoute(origin, destination, 1.35, 1.15);
  assert.equal(lighterTraffic.durationMinutes, 20);
  assert.equal(fetchCalls, 2, 'a changed traffic factor must not hit the cache');

  // Valhalla down, OSRM up: the chain falls through to OSRM rather than to the local
  // estimate, because OSRM's distance is still far better than haversine. Its duration IS
  // free-flow, so this is the one provider the traffic factor applies to.
  const osrmDestination = { lat: 30.0700, lng: 31.2600 };
  stubOsrmOnly(4200, 20 * 60);
  const viaOsrm = await fetchRoadRoute(origin, osrmDestination, 1.35, 1.25);
  assert.equal(viaOsrm.isFallback, false);
  assert.equal(viaOsrm.distanceKm, 4.2);
  assert.equal(viaOsrm.durationMinutes, 25, '20 free-flow minutes at 1.25 traffic = 25');
  assert.equal(fetchCalls, 3, 'two Valhalla attempts, then one OSRM attempt');

  // The factor is clamped: a nonsensical value can never invent hours of travel time.
  const clampDestination = { lat: 30.0800, lng: 31.2700 };
  stubOsrmOnly(4200, 20 * 60);
  const clamped = await fetchRoadRoute(origin, clampDestination, 1.35, 99);
  assert.equal(clamped.durationMinutes, 60, 'clamped to the 3x ceiling');

  // A route several times longer than the straight line means a bad answer or — far more
  // often — coordinates that do not point where the rider thinks. Reject it.
  const implausibleDestination = { lat: 30.0500, lng: 31.2400 };
  stubValhalla(400, 60 * 60);
  const implausible = await fetchRoadRoute(origin, implausibleDestination, 1.35, 1.25);
  assert.equal(implausible.isFallback, true, 'an implausible route must not be billed');

  // Both routers unreachable must fall back locally — and must NOT be cached, or the trip
  // would stay pinned to the estimate even after a router recovers.
  const elsewhere = { lat: 29.9773, lng: 31.1325 };
  globalThis.fetch = (async () => {
    fetchCalls += 1;
    throw new Error('router unavailable');
  }) as typeof fetch;

  const callsBeforeFirstFallback = fetchCalls;
  const fallback = await fetchRoadRoute(origin, elsewhere, 1.35);
  assert.equal(fallback.isFallback, true);
  assert.ok(fallback.durationMinutes > 0);
  assert.equal(
    fetchCalls,
    callsBeforeFirstFallback + 4,
    'two providers are each retried once before falling back',
  );

  const callsBeforeRetry = fetchCalls;
  await fetchRoadRoute(origin, elsewhere, 1.35);
  assert.equal(fetchCalls, callsBeforeRetry + 4, 'a fallback must not be cached');

  // A transient failure that recovers on the retry must still produce a real routed answer.
  let attemptsSoFar = 0;
  const recovers = { lat: 30.1, lng: 31.3 };
  globalThis.fetch = (async () => {
    attemptsSoFar += 1;
    if (attemptsSoFar === 1) throw new Error('rate limited');
    return jsonResponse({ trip: { status: 0, summary: { length: 3, time: 600 } } });
  }) as typeof fetch;

  const recovered = await fetchRoadRoute(origin, recovers, 1.35, 1.25);
  assert.equal(recovered.isFallback, false, 'a retry that succeeds must be used, not the local estimate');
  assert.equal(attemptsSoFar, 2);
} finally {
  globalThis.fetch = originalFetch;
}

console.log('road route cache checks passed');
