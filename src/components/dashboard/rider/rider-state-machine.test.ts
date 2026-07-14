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
assert.equal(shouldShowAdRiver(state), true);

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

console.log('rider reducer checks passed');
