import assert from 'node:assert/strict';
import { fetchRoadRoute } from './road-route';

const origin = { lat: 30.0444, lng: 31.2357 };
const destination = { lat: 30.0626, lng: 31.2497 };

const originalFetch = globalThis.fetch;
let fetchCalls = 0;

function stubRouter(distanceMeters: number, durationSeconds: number) {
  fetchCalls = 0;
  globalThis.fetch = (async () => {
    fetchCalls += 1;
    return {
      ok: true,
      json: async () => ({
        code: 'Ok',
        routes: [{ distance: distanceMeters, duration: durationSeconds }],
      }),
    } as unknown as Response;
  }) as typeof fetch;
}

try {
  // A routed distance is used as-is, and the routed duration is scaled by the traffic
  // factor — OSRM reports free-flow time and models no congestion at all.
  stubRouter(4200, 20 * 60);
  const first = await fetchRoadRoute(origin, destination, 1.35, 1.25);
  assert.equal(first.isFallback, false);
  assert.equal(first.distanceKm, 4.2);
  assert.equal(first.durationMinutes, 25, '20 free-flow minutes at 1.25 traffic = 25');
  assert.equal(fetchCalls, 1);

  // The same trip must come from cache. Without this every nudge of the destination pin
  // fires another request at a shared free router and gets rate-limited into the fallback.
  const second = await fetchRoadRoute(origin, destination, 1.35, 1.25);
  assert.deepEqual(second, first);
  assert.equal(fetchCalls, 1, 'a repeated identical route must not re-hit the router');

  // A different traffic factor is a different answer, so it must not reuse the cached one.
  const lighterTraffic = await fetchRoadRoute(origin, destination, 1.35, 1.15);
  assert.equal(lighterTraffic.durationMinutes, 23, '20 free-flow minutes at 1.15 traffic = 23');
  assert.equal(fetchCalls, 2, 'a changed traffic factor must not hit the cache');

  // The factor is clamped: a nonsensical value can never invent hours of travel time.
  const clamped = await fetchRoadRoute(origin, destination, 1.35, 99);
  assert.equal(clamped.durationMinutes, 60, 'clamped to the 3x ceiling');

  // A router failure must fall back locally — and must NOT be cached, or the trip would
  // stay pinned to the estimate even after the router recovers. A single failed attempt is
  // retried once before giving up, so one fetchRoadRoute call makes two fetch calls here.
  const elsewhere = { lat: 29.9773, lng: 31.1325 };
  globalThis.fetch = (async () => {
    fetchCalls += 1;
    throw new Error('router unavailable');
  }) as typeof fetch;

  const callsBeforeFirstFallback = fetchCalls;
  const fallback = await fetchRoadRoute(origin, elsewhere, 1.35);
  assert.equal(fallback.isFallback, true);
  assert.ok(fallback.durationMinutes > 0);
  assert.equal(fetchCalls, callsBeforeFirstFallback + 2, 'a failed attempt is retried once before falling back');

  const callsBeforeRetry = fetchCalls;
  await fetchRoadRoute(origin, elsewhere, 1.35);
  assert.equal(fetchCalls, callsBeforeRetry + 2, 'a fallback must not be cached');

  // A transient failure that recovers on the retry must still produce a real routed answer.
  let attemptsSoFar = 0;
  const recovers = { lat: 30.1, lng: 31.3 };
  globalThis.fetch = (async () => {
    attemptsSoFar += 1;
    if (attemptsSoFar === 1) throw new Error('rate limited');
    return {
      ok: true,
      json: async () => ({ code: 'Ok', routes: [{ distance: 3000, duration: 600 }] }),
    } as unknown as Response;
  }) as typeof fetch;

  const recovered = await fetchRoadRoute(origin, recovers, 1.35, 1.25);
  assert.equal(recovered.isFallback, false, 'a retry that succeeds must be used, not the local estimate');
  assert.equal(attemptsSoFar, 2);
} finally {
  globalThis.fetch = originalFetch;
}

console.log('road route cache checks passed');
