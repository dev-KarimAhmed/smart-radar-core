import assert from 'node:assert/strict';
import {
  buildRideRequestInsertPayload,
  calculateServerFare,
  createRideRequest,
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

console.log('rider server marketplace checks passed');
