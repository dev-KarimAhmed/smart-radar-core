import assert from 'node:assert/strict';
import {
  buildRideRequestInsertPayload,
  calculateServerFare,
  createRideRequest,
  fetchAvailableCaptainPresence,
  mapRiderMarketplaceError,
} from './rider-server-marketplace';

const origin = { lat: 31.9539, lng: 35.9106 };
const destination = { lat: 31.9586, lng: 35.8684 };

let rpcCall: { name: string; args: Record<string, number> } | null = null;
const rpcClient = {
  rpc(name: string, args: Record<string, number>) {
    rpcCall = { name, args };
    return Promise.resolve({ data: { server_estimated_fare: 3.75 }, error: null });
  },
};

const fare = await calculateServerFare(rpcClient, { origin, destination, countryId: 2 });
assert.equal(fare, 3.75);
assert.deepEqual(rpcCall, {
  name: 'calculate_server_fare',
  args: {
    lat1: 31.9539,
    lng1: 35.9106,
    lat2: 31.9586,
    lng2: 35.8684,
    p_country_id: 2,
  },
});

// With a routed distance and duration the fare must be quoted from THEM, not from the
// server's own haversine + 2.2 min/km fallback — otherwise the rider is shown one route and
// charged for another.
const routedFare = await calculateServerFare(rpcClient, {
  origin,
  destination,
  countryId: 2,
  roadKm: 8.2,
  durationMinutes: 14,
});
assert.equal(routedFare, 3.75);
assert.deepEqual(rpcCall, {
  name: 'calculate_server_fare',
  args: {
    lat1: 31.9539,
    lng1: 35.9106,
    lat2: 31.9586,
    lng2: 35.8684,
    p_country_id: 2,
    p_road_km: 8.2,
    p_minutes: 14,
  },
});

// A zero or missing route must be omitted rather than sent, so the RPC falls back instead
// of pricing a trip at zero km.
await calculateServerFare(rpcClient, { origin, destination, countryId: 2, roadKm: 0, durationMinutes: null });
const fallbackArgs = Object.keys((rpcCall as unknown as { args: Record<string, number> }).args).sort();
assert.deepEqual(fallbackArgs, ['lat1', 'lat2', 'lng1', 'lng2', 'p_country_id']);

const payload = buildRideRequestInsertPayload({
  riderId: '98f30e5e-17db-45e9-bf89-72c0d169b320',
  origin,
  pickupAddress: 'Amman pickup',
  routeDistanceKm: 8.2,
  routeDurationMinutes: 14,
  destination,
  originH3: '892db3c2c87ffff',
  destinationH3: '892db320003ffff',
  destinationAddressAr: 'وادي السير - عمّان',
  serverEstimatedFare: fare,
  countryId: 2,
});

assert.deepEqual(payload, {
  rider_id: '98f30e5e-17db-45e9-bf89-72c0d169b320',
  origin_lat: 31.9539,
  origin_lng: 35.9106,
  origin_address: 'Amman pickup',
  origin_google_maps_url: 'https://www.google.com/maps/search/?api=1&query=31.9539%2C35.9106',
  estimated_distance_km: 8.2,
  estimated_duration_minutes: 14,
  destination_lat: 31.9586,
  destination_lng: 35.8684,
  origin_h3: '892db3c2c87ffff',
  destination_h3: '892db320003ffff',
  destination_address_ar: 'وادي السير - عمّان',
  server_estimated_fare: 3.75,
  country_id: 2,
  status: 'PENDING',
});

let insertedPayload: unknown = null;
const insertClient = {
  from(table: string) {
    assert.equal(table, 'ride_requests');
    return {
      insert(payloadToInsert: unknown) {
        insertedPayload = payloadToInsert;
        return {
          select(columns: string) {
            assert.equal(columns, 'id,status,server_estimated_fare');
            return {
              single() {
                return Promise.resolve({
                  data: { id: 'ride-request-1', status: 'PENDING', server_estimated_fare: 3.75 },
                  error: null,
                });
              },
            };
          },
        };
      },
    };
  },
};

const request = await createRideRequest(insertClient, payload);
assert.equal(request.id, 'ride-request-1');
assert.equal(request.status, 'PENDING');
assert.deepEqual(insertedPayload, payload);

assert.equal(
  mapRiderMarketplaceError({ message: 'permission denied for table ride_requests' }),
  'تعذر إنشاء طلب الرحلة بسبب صلاحيات قاعدة البيانات. تأكد من تفعيل سياسة إدخال طلبات الرحلات للراكب.',
);
assert.equal(
  mapRiderMarketplaceError({ message: 'Failed to fetch' }),
  'فشل الاتصال بالخدمة. تحقق من الإنترنت ثم حاول مرة أخرى.',
);

// Dynamic 9-Captain Market Quota & Replenishment Test:
// When 10 captains are in the pool, rider sees exactly 9.
// When 1 drops out, the 10th captain immediately backfills to keep the quota at 9.
const now = Date.now();
const testCenterH3 = '893e62d5b2fffff';

const makePool = (unavailableCount: number) => {
  return Array.from({ length: 10 }, (_, i) => ({
    captain_id: `cap-${i + 1}`,
    location_lat: 29.93 + i * 0.001,
    location_lng: 30.91 + i * 0.001,
    h3_cell: testCenterH3,
    country_id: 2,
    is_available: i >= unavailableCount,
    updated_at: new Date(now - i * 1000).toISOString(),
  }));
};

const mockPresenceClient = (rows: unknown[]) => ({
  from(table: string) {
    assert.equal(table, 'captain_locations');
    return {
      select() {
        return {
          gte() {
            return {
              limit() {
                return Promise.resolve({ data: rows, error: null });
              },
            };
          },
        };
      },
    };
  },
});

// Scenario 1: 10 captains available -> capped at 9 (cap-1 to cap-9)
const initialCaptains = await fetchAvailableCaptainPresence(
  mockPresenceClient(makePool(0)) as any,
  { centerH3Cell: testCenterH3, countryId: 2, ringSize: 0, nowMs: now }
);
assert.equal(initialCaptains.length, 9);
assert.equal(initialCaptains[0].id, 'cap-1');
assert.equal(initialCaptains[8].id, 'cap-9');

// Scenario 2: cap-1 disappears (1 unavailable out of 10) -> cap-10 immediately fills the 9th slot!
const refilledCaptains = await fetchAvailableCaptainPresence(
  mockPresenceClient(makePool(1)) as any,
  { centerH3Cell: testCenterH3, countryId: 2, ringSize: 0, nowMs: now }
);
assert.equal(refilledCaptains.length, 9);
assert.equal(refilledCaptains[0].id, 'cap-2');
assert.equal(refilledCaptains[8].id, 'cap-10'); // cap-10 took the spot!

// Scenario 3: cap-1 and cap-2 disappear (only 8 available in total pool) -> returns 8
const depletedCaptains = await fetchAvailableCaptainPresence(
  mockPresenceClient(makePool(2)) as any,
  { centerH3Cell: testCenterH3, countryId: 2, ringSize: 0, nowMs: now }
);
assert.equal(depletedCaptains.length, 8);

console.log('rider server marketplace checks passed');

