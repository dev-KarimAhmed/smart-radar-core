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
  // A routed answer is used as-is, not recomputed from a speed constant.
  stubRouter(4200, 9 * 60);
  const first = await fetchRoadRoute(origin, destination, 1.35);
  assert.equal(first.isFallback, false);
  assert.equal(first.distanceKm, 4.2);
  assert.equal(first.durationMinutes, 9);
  assert.equal(fetchCalls, 1);

  // The same trip must come from cache. Without this every nudge of the destination pin
  // fires another request at a shared free router and gets rate-limited into the fallback.
  const second = await fetchRoadRoute(origin, destination, 1.35);
  assert.deepEqual(second, first);
  assert.equal(fetchCalls, 1, 'a repeated identical route must not re-hit the router');

  // A router failure must fall back locally — and must NOT be cached, or the trip would
  // stay pinned to the estimate even after the router recovers.
  const elsewhere = { lat: 29.9773, lng: 31.1325 };
  globalThis.fetch = (async () => {
    fetchCalls += 1;
    throw new Error('router unavailable');
  }) as typeof fetch;

  const fallback = await fetchRoadRoute(origin, elsewhere, 1.35);
  assert.equal(fallback.isFallback, true);
  assert.ok(fallback.durationMinutes > 0);

  const callsBeforeRetry = fetchCalls;
  await fetchRoadRoute(origin, elsewhere, 1.35);
  assert.equal(fetchCalls, callsBeforeRetry + 1, 'a fallback must not be cached');
} finally {
  globalThis.fetch = originalFetch;
}

console.log('road route cache checks passed');
