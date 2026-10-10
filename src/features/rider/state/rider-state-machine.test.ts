import assert from 'node:assert/strict';
import { calculateSovereignFareQuote } from '@/core/logic/geospatial-kernel';
import type { Offer } from '@/core/types';
import {
  createInitialRiderMachineState,
  riderDashboardReducer,
  shouldShowAdRiver,
} from './rider-state-machine';

const destination = {
  id: 'amman-wadi-al-seer',
  label: 'وادي السير - عمّان',
  governorate: 'عمّان',
  district: 'وادي السير',
  coords: { lat: 31.9586, lng: 35.8684 },
  tortuosityFactor: 1.37,
  fareQuote: calculateSovereignFareQuote({ lat: 31.9539, lng: 35.9106 }, { lat: 31.9586, lng: 35.8684 }, 1.37),
  serverEstimatedFare: 3.75,
};

let state = createInitialRiderMachineState();
assert.equal(state.screen, 'IDLE_MAP');
assert.equal(shouldShowAdRiver(state), true);

state = riderDashboardReducer(state, { type: 'OPEN_DESTINATION' });
assert.equal(state.screen, 'DESTINATION_SELECTION');
assert.equal(shouldShowAdRiver(state), false);

state = riderDashboardReducer(state, { type: 'CONFIRM_DESTINATION', destination });
assert.deepEqual(state.destination, destination);
assert.equal(state.screen, 'DESTINATION_SELECTION');

state = riderDashboardReducer(state, { type: 'SEND_REQUEST' });
assert.equal(state.screen, 'DESTINATION_SELECTION');
assert.equal(state.offers.length, 0);
assert.equal(state.requestStartedAt !== null, true);
assert.equal(shouldShowAdRiver(state), false);

state = riderDashboardReducer(state, { type: 'SERVER_STATUS_RECEIVING_OFFERS' });
assert.equal(state.screen, 'RECEIVING_OFFERS');
assert.equal(shouldShowAdRiver(state), false);

const offers: Offer[] = [
  {
    driverId: 'server-offer-1',
    driverName: 'سائق متاح',
    driverRating: 4.8,
    driverRank: 'Gold',
    price: destination.serverEstimatedFare,
    driverVehicle: {
      make: 'سيارة',
      color: 'أبيض',
      plate: 'غير متاح',
      type: 'سيارة',
    },
    driverAffiliation: { type: 'independent', name: 'مستقل' },
    silencePreference: 'neutral',
  },
];
assert.equal(offers.length, 1);
assert.equal(offers[0].price, destination.serverEstimatedFare);

state = riderDashboardReducer(state, { type: 'RECEIVE_OFFERS', offers });
assert.equal(state.screen, 'RECEIVING_OFFERS');
assert.equal(state.offers.length, offers.length);
assert.equal(shouldShowAdRiver(state), false);

state = riderDashboardReducer(state, { type: 'SELECT_OFFER', offerId: offers[0].driverId });
assert.equal(state.screen, 'RECEIVING_OFFERS');
assert.equal(state.pendingAcceptedOfferId, offers[0].driverId);

state = riderDashboardReducer(state, {
  type: 'SERVER_STATUS_ACCEPTED',
  row: {
    id: 'request-1',
    accepted_offer_id: offers[0].driverId,
    final_fare: destination.serverEstimatedFare,
  },
});
assert.equal(state.screen, 'TRIP_ACTIVE');
assert.equal(state.activeTrip?.captainId, offers[0].driverId);
assert.equal(state.activeTrip?.distanceKm, destination.fareQuote.estimatedRoadDistanceKm);
assert.equal(shouldShowAdRiver(state), false);

state = riderDashboardReducer(state, { type: 'SERVER_STATUS_COMPLETED', row: { status: 'COMPLETED' } });
assert.equal(state.screen, 'RATING_MODAL');
assert.equal(state.completedTrip?.captainId, offers[0].driverId);

state = riderDashboardReducer(state, { type: 'SUBMIT_RATING' });
assert.equal(state.screen, 'IDLE_MAP');
assert.equal(shouldShowAdRiver(state), true);

state = riderDashboardReducer(state, { type: 'OPEN_PURGE_LEDGER' });
assert.equal(state.screen, 'PURGE_LEDGER');
assert.equal(shouldShowAdRiver(state), true);

state = riderDashboardReducer(state, { type: 'OPEN_FAVORITE_CAPTAINS' });
assert.equal(state.screen, 'FAVORITE_CAPTAINS');
assert.equal(shouldShowAdRiver(state), true);

state = riderDashboardReducer(state, { type: 'RESET_TO_IDLE' });
assert.equal(state.screen, 'IDLE_MAP');
assert.equal(shouldShowAdRiver(state), true);

const blocked = riderDashboardReducer(createInitialRiderMachineState(), {
  type: 'SELECT_OFFER',
  offerId: 'missing',
});
assert.equal(blocked.screen, 'IDLE_MAP');

// A reload mid-auction must not lose the destination.
//
// REHYDRATE_SEARCHING restored the screen and the request id and nothing else, so
// state.destination came back null and the offers screen rendered "الوجهة: غير متاح" for a
// request whose address was in the very row it rehydrated from. It also cost every offer
// card its trip distance, which is measured from destination.coords.
const rehydrated = riderDashboardReducer(createInitialRiderMachineState(), {
  type: 'REHYDRATE_SEARCHING',
  requestId: 'req-1',
  row: {
    id: 'req-1',
    status: 'PENDING',
    destination_address_ar: 'الحي الرابع - السادس من أكتوبر',
    destination_lat: 29.9585,
    destination_lng: 30.9188,
    destination_h3: '8a2ffff',
    origin_h3: '8a1ffff',
    server_estimated_fare: 241.89,
  },
});
assert.equal(rehydrated.screen, 'RECEIVING_OFFERS');
assert.equal(rehydrated.destination?.label, 'الحي الرابع - السادس من أكتوبر');
assert.equal(rehydrated.destination?.coords.lat, 29.9585);
assert.equal(rehydrated.destination?.coords.lng, 30.9188);
assert.equal(rehydrated.destination?.serverEstimatedFare, 241.89);
assert.equal(rehydrated.destination?.destinationCell, '8a2ffff');

// No row (an older caller, or a row with neither address nor coordinates) must stay null
// rather than producing an empty destination that reads as a real one.
const rehydratedBare = riderDashboardReducer(createInitialRiderMachineState(), {
  type: 'REHYDRATE_SEARCHING',
  requestId: 'req-2',
});
// Delayed REQUEST_CANCELLED must be dropped when rider is in DESTINATION_SELECTION
const destSelectionState = riderDashboardReducer(createInitialRiderMachineState(), { type: 'OPEN_DESTINATION' });
assert.equal(destSelectionState.screen, 'DESTINATION_SELECTION');
const cancelledDuringDestSelection = riderDashboardReducer(destSelectionState, { type: 'REQUEST_CANCELLED' });
assert.equal(cancelledDuringDestSelection.screen, 'DESTINATION_SELECTION');

// REQUEST_CANCELLED when actively receiving offers correctly flags cancellation
const withDest = riderDashboardReducer(destSelectionState, { type: 'CONFIRM_DESTINATION', destination });
const sent = riderDashboardReducer(withDest, { type: 'SEND_REQUEST' });
const receivingOffersState = riderDashboardReducer(sent, { type: 'SERVER_STATUS_RECEIVING_OFFERS' });
assert.equal(receivingOffersState.screen, 'RECEIVING_OFFERS');
const cancelledDuringReceiving = riderDashboardReducer(receivingOffersState, { type: 'REQUEST_CANCELLED' });
assert.equal(cancelledDuringReceiving.screen, 'RECEIVING_OFFERS');
assert.equal(cancelledDuringReceiving.offers.length, 0);
assert.equal(cancelledDuringReceiving.requestCancelledAt !== null, true);

// REQUEST_CANCELLED when in TRIP_ACTIVE flags autoRetryRequested and clears activeTrip
const activeTripState = riderDashboardReducer(receivingOffersState, {
  type: 'SERVER_STATUS_ACCEPTED',
  row: { id: 'req-active-1', accepted_driver_id: 'driver-1' },
});
assert.equal(activeTripState.screen, 'TRIP_ACTIVE');
assert.notEqual(activeTripState.activeTrip, null);

const captainCancelledState = riderDashboardReducer(activeTripState, { type: 'REQUEST_CANCELLED' });
assert.equal(captainCancelledState.screen, 'DESTINATION_SELECTION');
assert.equal(captainCancelledState.autoRetryRequested, true);
assert.equal(captainCancelledState.activeTrip, null);

// RESET_TO_IDLE from captain cancelled dialog resets cleanly to IDLE_MAP
const resetFromCancelled = riderDashboardReducer(captainCancelledState, { type: 'RESET_TO_IDLE' });
assert.equal(resetFromCancelled.screen, 'IDLE_MAP');
assert.equal(resetFromCancelled.activeTrip, null);
assert.equal(resetFromCancelled.autoRetryRequested, undefined);

console.log('rider reducer checks passed');
