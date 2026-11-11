import assert from 'node:assert/strict';
import {
  cancelAndDeleteOtherCaptainOffers,
  findBusyCaptainTripMap,
  isActiveTripRow,
  partitionOfferCleanupIds,
  STALE_ACTIVE_TRIP_MS,
  withCaptainAcceptLock,
} from './captain-offer-cleanup';

const NOW_MS = Date.UTC(2026, 10, 11, 18, 0, 0);

// 1. isActiveTripRow checks
assert.equal(isActiveTripRow(null, NOW_MS), false);
assert.equal(isActiveTripRow({ status: 'PENDING', created_at: new Date(NOW_MS).toISOString() }, NOW_MS), false);
assert.equal(isActiveTripRow({ status: 'COMPLETED', updated_at: new Date(NOW_MS).toISOString() }, NOW_MS), false);
assert.equal(isActiveTripRow({ status: 'CANCELLED', updated_at: new Date(NOW_MS).toISOString() }, NOW_MS), false);
assert.equal(isActiveTripRow({ status: 'ACCEPTED', accepted_at: new Date(NOW_MS - 60_000).toISOString() }, NOW_MS), true);
assert.equal(isActiveTripRow({ status: 'arrived', updated_at: new Date(NOW_MS - 60_000).toISOString() }, NOW_MS), true);
assert.equal(isActiveTripRow({ status: 'TRIP_ACTIVE', started_at: new Date(NOW_MS - 60_000).toISOString() }, NOW_MS), true);
assert.equal(
  isActiveTripRow(
    { status: 'ACCEPTED', accepted_at: new Date(NOW_MS - STALE_ACTIVE_TRIP_MS - 1_000).toISOString() },
    NOW_MS,
  ),
  false,
);
assert.equal(isActiveTripRow({ status: 'ACCEPTED' }, NOW_MS), true);

// 2. partitionOfferCleanupIds checks
const partitioned = partitionOfferCleanupIds(
  [
    { id: 'offer-accepted', request_id: 'req-1', status: 'ACCEPTED' },
    { id: 'offer-same-req', request_id: 'req-1', status: 'PENDING' },
    { id: 'offer-other-1', request_id: 'req-2', status: 'PENDING' },
    { id: 'offer-other-2', request_id: 'req-3', status: 'pending' },
    { id: 'offer-other-null', request_id: 'req-4', status: null },
    { id: 'offer-other-cancelled', request_id: 'req-5', status: 'CANCELLED' },
    { id: 'offer-other-rejected', request_id: 'req-6', status: 'REJECTED' },
    { id: 'offer-other-accepted', request_id: 'req-7', status: 'ACCEPTED' },
  ],
  'req-1',
  'offer-accepted',
);

assert.deepEqual(partitioned.cancellableIds, ['offer-other-1', 'offer-other-2', 'offer-other-null']);
assert.deepEqual(partitioned.deletableIds, [
  'offer-other-1',
  'offer-other-2',
  'offer-other-null',
  'offer-other-cancelled',
]);

// 3. findBusyCaptainTripMap checks
const mockBusyAdminClient = {
  from(table: string) {
    assert.equal(table, 'ride_requests');
    return {
      select() {
        return {
          in() {
            return {
              not() {
                return Promise.resolve({
                  data: [
                    {
                      id: 'req-current',
                      status: 'ACCEPTED',
                      accepted_captain_id: 'cap-1',
                      accepted_at: new Date(NOW_MS - 30_000).toISOString(),
                    },
                    {
                      id: 'req-stale',
                      status: 'ACCEPTED',
                      accepted_captain_id: 'cap-1',
                      accepted_at: new Date(NOW_MS - STALE_ACTIVE_TRIP_MS - 60_000).toISOString(),
                    },
                    {
                      id: 'req-active-other',
                      status: 'ARRIVED',
                      accepted_captain_id: 'cap-2',
                      accepted_at: new Date(NOW_MS - 120_000).toISOString(),
                    },
                    {
                      id: 'req-pending-ignore',
                      status: 'PENDING',
                      accepted_captain_id: 'cap-3',
                      created_at: new Date(NOW_MS - 10_000).toISOString(),
                    },
                  ],
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

const busyMap = await findBusyCaptainTripMap(
  mockBusyAdminClient as any,
  ['cap-1', 'cap-2', 'cap-3'],
  'req-current',
  NOW_MS,
);
assert.equal(busyMap.has('cap-1'), false);
assert.equal(busyMap.get('cap-2'), 'req-active-other');
assert.equal(busyMap.has('cap-3'), false);

// 4. cancelAndDeleteOtherCaptainOffers checks
let updatedIds: string[] = [];
let updatedStatus = '';
let deletedIds: string[] = [];

const mockCleanupAdminClient = {
  from(table: string) {
    assert.equal(table, 'ride_offers');
    return {
      select() {
        return {
          eq(col: string, val: string) {
            assert.equal(col, 'captain_id');
            assert.equal(val, 'cap-busy');
            return Promise.resolve({
              data: [
                { id: 'o-win', request_id: 'req-win', status: 'ACCEPTED' },
                { id: 'o-lose-1', request_id: 'req-lose-1', status: 'PENDING' },
                { id: 'o-lose-2', request_id: 'req-lose-2', status: 'CANCELLED' },
                { id: 'o-rejected', request_id: 'req-old', status: 'REJECTED' },
              ],
              error: null,
            });
          },
        };
      },
      update(payload: { status: string }) {
        updatedStatus = payload.status;
        return {
          in(_col: string, ids: string[]) {
            updatedIds = ids;
            return Promise.resolve({ error: null });
          },
        };
      },
      delete() {
        return {
          in(_col: string, ids: string[]) {
            deletedIds = ids;
            return Promise.resolve({ error: null });
          },
        };
      },
    };
  },
};

const cleanupResult = await cancelAndDeleteOtherCaptainOffers(
  mockCleanupAdminClient as any,
  'cap-busy',
  'req-win',
  'o-win',
);

assert.equal(updatedStatus, 'CANCELLED');
assert.deepEqual(updatedIds, ['o-lose-1']);
assert.deepEqual(deletedIds, ['o-lose-1', 'o-lose-2']);
assert.deepEqual(cleanupResult, { cancelledCount: 1, deletedCount: 2 });

// 5. withCaptainAcceptLock serialization & independence checks
const trace: string[] = [];
await Promise.all([
  withCaptainAcceptLock('cap-lock-test', async () => {
    trace.push('a-start');
    await new Promise((r) => setTimeout(r, 25));
    trace.push('a-end');
  }),
  withCaptainAcceptLock('cap-lock-test', async () => {
    trace.push('b-start');
    await new Promise((r) => setTimeout(r, 5));
    trace.push('b-end');
  }),
  withCaptainAcceptLock('cap-other', async () => {
    trace.push('c-start');
    trace.push('c-end');
  }),
]);

assert.deepEqual(trace.filter((e) => e.startsWith('a-') || e.startsWith('b-')), [
  'a-start',
  'a-end',
  'b-start',
  'b-end',
]);
assert.ok(trace.indexOf('c-end') < trace.indexOf('a-end'));

console.log('captain offer cleanup checks passed');
