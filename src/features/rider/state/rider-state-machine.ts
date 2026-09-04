import React from 'react';
import type { SovereignFareQuote } from '@/core/logic/geospatial-kernel';
import type { Offer } from '@/core/types';

export type RiderMachineScreen =
  | 'IDLE_MAP'
  | 'DESTINATION_SELECTION'
  | 'RECEIVING_OFFERS'
  | 'TRIP_ACTIVE'
  | 'RATING_MODAL'
  | 'PURGE_LEDGER'
  | 'FAVORITE_CAPTAINS';

export interface RiderDestination {
  id: string;
  label: string;
  governorate: string;
  district: string;
  coords: {
    lat: number;
    lng: number;
  };
  tortuosityFactor?: number;
  fareQuote?: SovereignFareQuote;
  serverEstimatedFare?: number;
  originCell?: string;
  destinationCell?: string;
}

export interface RiderLocalRating {
  captain: number;
  vehicle: number;
  favorite: boolean;
}

export interface RiderActiveTrip {
  tripId: string;
  captainId: string;
  captainName: string;
  captainSerial: string;
  captainPhone: string;
  vehicleType: string;
  vehiclePlate: string;
  finalPrice: number;
  destinationLabel: string;
  distanceKm: number;
  originCell?: string;
  destinationCell?: string;
  tortuosityFactor?: number;
  etaSeconds: number;
  startedAt: number;
  captain?: any;
  status?: string;
}

export interface RiderMachineState {
  screen: RiderMachineScreen;
  destination: RiderDestination | null;
  offers: Offer[];
  activeTrip: RiderActiveTrip | null;
  completedTrip: RiderActiveTrip | null;
  requestStartedAt: number | null;
  requestId: string | null;
  requestCancelledAt: number | null;
  pendingAcceptedOfferId: string | null;
}

export type RiderMachineAction =
  | { type: 'OPEN_DESTINATION' }
  | { type: 'CONFIRM_DESTINATION'; destination: RiderDestination }
  | { type: 'SEND_REQUEST' }
  | { type: 'SERVER_REQUEST_CREATED'; requestId: string }
  | { type: 'SERVER_STATUS_RECEIVING_OFFERS' }
  | { type: 'SERVER_STATUS_ACCEPTED'; row: Record<string, unknown> }
  | { type: 'SERVER_STATUS_COMPLETED'; row?: Record<string, unknown> }
  | { type: 'REQUEST_FAILED' }
  | { type: 'REQUEST_CANCELLED' }
  | { type: 'REHYDRATE_SEARCHING'; requestId: string; row?: Record<string, unknown> }
  | { type: 'REHYDRATE_ACTIVE_TRIP'; requestId: string; row: Record<string, unknown>; offers: Offer[] }
  | { type: 'RECEIVE_OFFERS'; offers: Offer[] }
  | { type: 'SELECT_OFFER'; offerId: string }
  | { type: 'COMPLETE_TRIP' }
  | { type: 'SUBMIT_RATING' }
  | { type: 'OPEN_PURGE_LEDGER' }
  | { type: 'OPEN_FAVORITE_CAPTAINS' }
  | { type: 'RETURN_TO_MAP' }
  | { type: 'RESET_TO_IDLE' };

export function createInitialRiderMachineState(): RiderMachineState {
  return {
    screen: 'IDLE_MAP',
    destination: null,
    offers: [],
    activeTrip: null,
    completedTrip: null,
    requestStartedAt: null,
    requestId: null,
    requestCancelledAt: null,
    pendingAcceptedOfferId: null,
  };
}

export function shouldShowAdRiver(state: RiderMachineState): boolean {
  if (state.screen === 'TRIP_ACTIVE' || state.screen === 'RATING_MODAL' || state.screen === 'DESTINATION_SELECTION') {
    return false;
  }

  if (state.screen === 'RECEIVING_OFFERS') {
    return state.offers.length === 0;
  }

  return true;
}

/**
 * Rebuilds the rider's destination from the ride_requests row.
 *
 * The destination is chosen on the client and only ever lived in this state — so a reload
 * mid-request lost it. `REHYDRATE_SEARCHING` restored the screen and the request id and
 * nothing else, which is why the offers screen showed "الوجهة: غير متاح" for a request whose
 * address is sitting right there in the row it was rehydrated from.
 *
 * It also cost more than a label: buildCaptainOfferFromOffer measures the trip distance from
 * `destination.coords`, so after a reload every offer card lost its trip distance too.
 *
 * governorate/district stay empty on purpose — the row stores the composed address, not its
 * parts, and nothing downstream of a rehydrate reads them. Inventing a split by string
 * surgery on the label would be a guess dressed as data.
 */
function buildDestinationFromRow(
  requestId: string,
  row: Record<string, unknown> | undefined,
): RiderDestination | null {
  if (!row) return null;

  const label = firstString(
    row.destination_address_ar,
    row.destination_address,
    row.destination_address_en,
  );
  const lat = firstNumber(row.destination_lat);
  const lng = firstNumber(row.destination_lng);

  // A label with no coordinates is still worth restoring: the rider gets to see where they
  // asked to go, and the offer cards fall back to the routed distance on each offer's own
  // receipt for the number.
  if (!label && (lat === null || lng === null)) return null;

  return {
    id: requestId,
    label: label || '',
    governorate: '',
    district: '',
    coords: {
      lat: lat ?? 0,
      lng: lng ?? 0,
    },
    serverEstimatedFare: firstNumber(row.server_estimated_fare) ?? undefined,
    originCell: firstString(row.origin_h3) || undefined,
    destinationCell: firstString(row.destination_h3) || undefined,
  };
}

function buildActiveTrip(state: RiderMachineState, acceptedRow: Record<string, unknown>): RiderActiveTrip | null {
  const acceptedOfferId =
    firstString(acceptedRow.accepted_offer_id, acceptedRow.offer_id, acceptedRow.selected_offer_id) ||
    state.pendingAcceptedOfferId;
  const acceptedCaptainId = firstString(
    acceptedRow.accepted_driver_id,
    acceptedRow.driver_id,
    acceptedRow.captain_id,
    acceptedRow.accepted_captain_id,
  );
  const selectedOffer = state.offers.find((offer) => (
    offer.id === acceptedOfferId ||
    offer.driverId === acceptedOfferId ||
    offer.driverId === acceptedCaptainId
  ));

  if (!selectedOffer && !acceptedCaptainId) return null;

  const vehicle = selectedOffer?.driverVehicle || {};
  const distanceKm = state.destination?.fareQuote?.estimatedRoadDistanceKm
    ?? firstNumber(acceptedRow.estimated_distance_km, acceptedRow.route_distance_km)
    ?? 0;
  const estimatedTripMinutes = firstNumber(
    acceptedRow.estimated_duration_minutes,
    acceptedRow.route_duration_minutes,
    acceptedRow.trip_duration_minutes
  ) ?? Math.max(1, Math.ceil((distanceKm || 2) * 1.5));

  return {
    tripId: firstString(acceptedRow.trip_id, acceptedRow.active_trip_id, acceptedRow.id) || state.requestId || '',
    captainId: selectedOffer?.driverId || acceptedCaptainId || '',
    captainName: selectedOffer?.driverName || firstString(acceptedRow.driver_name, acceptedRow.captain_name) || 'السائق',
    captainSerial:
      selectedOffer?.driverName ||
      firstString(acceptedRow.driver_serial, acceptedRow.captain_serial, acceptedRow.driver_name, acceptedRow.captain_name) ||
      acceptedCaptainId ||
      'السائق',
    captainPhone: selectedOffer?.driverAffiliation?.phone || firstString(acceptedRow.driver_phone, acceptedRow.captain_phone, acceptedRow.phone) || '',
    vehicleType: vehicle.type || `${vehicle.make || 'سيارة'} ${vehicle.color || ''}`.trim(),
    vehiclePlate: vehicle.plate || firstString(acceptedRow.vehicle_plate, acceptedRow.plate) || 'غير متاح',
    finalPrice:
      firstNumber(
        acceptedRow.final_fare,
        acceptedRow.final_price,
        acceptedRow.accepted_price,
        acceptedRow.offer_price,
        acceptedRow.server_estimated_fare,
      ) ??
      (selectedOffer?.price === -1
        ? state.destination?.serverEstimatedFare ?? 0
        : selectedOffer?.price ?? state.destination?.serverEstimatedFare ?? 0),
    destinationLabel: state.destination?.label
      || firstString(acceptedRow.destination_address_ar, acceptedRow.destination_address, acceptedRow.destination_address_en)
      || 'وجهة',
    distanceKm,
    originCell: state.destination?.originCell ?? state.destination?.fareQuote?.originCell,
    destinationCell: state.destination?.destinationCell ?? state.destination?.fareQuote?.destinationCell,
    tortuosityFactor: state.destination?.fareQuote?.tortuosityFactor,
    etaSeconds: Math.round(estimatedTripMinutes * 60),
    startedAt: Date.now(),
    captain: selectedOffer?.captain || acceptedRow.captain || acceptedRow.captain_profile || null,
    status: String(acceptedRow.status || 'ACCEPTED').toUpperCase(),
  };
}

export function riderDashboardReducer(state: RiderMachineState, action: RiderMachineAction): RiderMachineState {
  switch (action.type) {
    case 'OPEN_DESTINATION':
      if (state.screen === 'TRIP_ACTIVE' || state.screen === 'RATING_MODAL' || state.screen === 'RECEIVING_OFFERS') {
        return state;
      }
      return { ...state, screen: 'DESTINATION_SELECTION' };

    case 'CONFIRM_DESTINATION':
      if (state.screen !== 'DESTINATION_SELECTION') return state;
      return { ...state, destination: action.destination };

    case 'SEND_REQUEST':
      if (state.screen !== 'DESTINATION_SELECTION' || !state.destination) return state;
      return {
        ...state,
        offers: [],
        activeTrip: null,
        completedTrip: null,
        requestStartedAt: Date.now(),
        requestId: null,
        requestCancelledAt: null,
        pendingAcceptedOfferId: null,
      };

    case 'SERVER_REQUEST_CREATED':
      if (state.screen !== 'DESTINATION_SELECTION') return state;
      return { ...state, requestId: action.requestId, requestStartedAt: state.requestStartedAt ?? Date.now() };

    case 'SERVER_STATUS_RECEIVING_OFFERS':
      if (state.screen !== 'DESTINATION_SELECTION' && state.screen !== 'RECEIVING_OFFERS') return state;
      if (!state.requestStartedAt && state.screen !== 'RECEIVING_OFFERS') return state;
      return { ...state, screen: 'RECEIVING_OFFERS' };

    case 'SERVER_STATUS_ACCEPTED': {
      if (state.screen !== 'RECEIVING_OFFERS' && state.screen !== 'TRIP_ACTIVE') return state;
      const activeTrip = buildActiveTrip(state, action.row);
      if (!activeTrip) return state;
      return {
        ...state,
        screen: 'TRIP_ACTIVE',
        activeTrip,
        requestCancelledAt: null,
      };
    }

    case 'SERVER_STATUS_COMPLETED':
      if (state.screen === 'RATING_MODAL') return state;
      if (state.screen !== 'TRIP_ACTIVE' || !state.activeTrip) return state;
      return {
        ...state,
        screen: 'RATING_MODAL',
        completedTrip: {
          ...state.activeTrip,
          status: String(action.row?.status || 'COMPLETED').toUpperCase(),
        },
        activeTrip: null,
      };

    case 'REQUEST_FAILED':
      if (state.screen !== 'DESTINATION_SELECTION') return state;
      return { ...state, requestStartedAt: null, requestId: null };

    case 'REQUEST_CANCELLED':
      // A trip already accepted (or further along) has nothing to retry —
      // unlike a pre-acceptance cancellation, drop straight back to idle
      // instead of parking on RECEIVING_OFFERS with a now-meaningless trip.
      if (state.screen === 'TRIP_ACTIVE') {
        return {
          ...createInitialRiderMachineState(),
          requestCancelledAt: Date.now(),
        };
      }
      if (state.screen !== 'DESTINATION_SELECTION' && state.screen !== 'RECEIVING_OFFERS') return state;
      return {
        ...state,
        screen: 'RECEIVING_OFFERS',
        offers: [],
        requestCancelledAt: Date.now(),
        pendingAcceptedOfferId: null,
      };

    case 'REHYDRATE_SEARCHING':
      if (state.screen !== 'IDLE_MAP') return state;
      return {
        ...state,
        screen: 'RECEIVING_OFFERS',
        requestId: action.requestId,
        // Keep whatever is already in state — it is the richer object, with the fare quote
        // and the governorate/district the picker knew. Only fall back to the row.
        destination: state.destination ?? buildDestinationFromRow(action.requestId, action.row),
        requestStartedAt: state.requestStartedAt ?? Date.now(),
      };

    case 'REHYDRATE_ACTIVE_TRIP': {
      if (state.screen !== 'IDLE_MAP') return state;
      const stateWithOffers = {
        ...state,
        offers: action.offers,
        requestId: action.requestId,
        destination: state.destination ?? buildDestinationFromRow(action.requestId, action.row),
      };
      const activeTrip = buildActiveTrip(stateWithOffers, action.row);
      if (!activeTrip) {
        return { ...stateWithOffers, screen: 'RECEIVING_OFFERS', requestStartedAt: state.requestStartedAt ?? Date.now() };
      }
      return { ...stateWithOffers, screen: 'TRIP_ACTIVE', activeTrip };
    }

    case 'RECEIVE_OFFERS':
      if (state.screen !== 'RECEIVING_OFFERS') return state;
      return { ...state, offers: action.offers };

    case 'SELECT_OFFER': {
      if (state.screen !== 'RECEIVING_OFFERS') return state;
      const selectedOffer = state.offers.find((offer) => offer.id === action.offerId || offer.driverId === action.offerId);
      if (!selectedOffer) return state;
      return {
        ...state,
        pendingAcceptedOfferId: selectedOffer.id || selectedOffer.driverId,
      };
    }

    case 'COMPLETE_TRIP':
      if (state.screen !== 'TRIP_ACTIVE' || !state.activeTrip) return state;
      return {
        ...state,
        screen: 'RATING_MODAL',
        completedTrip: state.activeTrip,
        activeTrip: null,
      };

    case 'SUBMIT_RATING':
      if (state.screen !== 'RATING_MODAL' || !state.completedTrip) return state;
      return {
        ...state,
        screen: 'IDLE_MAP',
        destination: null,
        offers: [],
        activeTrip: null,
        completedTrip: null,
        requestStartedAt: null,
        requestId: null,
        requestCancelledAt: null,
        pendingAcceptedOfferId: null,
      };

    case 'OPEN_PURGE_LEDGER':
      if (state.screen === 'TRIP_ACTIVE' || state.screen === 'RATING_MODAL' || state.screen === 'RECEIVING_OFFERS') return state;
      return { ...state, screen: 'PURGE_LEDGER' };

    case 'OPEN_FAVORITE_CAPTAINS':
      if (state.screen === 'TRIP_ACTIVE' || state.screen === 'RATING_MODAL' || state.screen === 'RECEIVING_OFFERS') return state;
      return { ...state, screen: 'FAVORITE_CAPTAINS' };

    case 'RETURN_TO_MAP':
      if (state.screen === 'TRIP_ACTIVE' || state.screen === 'RATING_MODAL' || state.screen === 'RECEIVING_OFFERS') return state;
      return { ...state, screen: 'IDLE_MAP' };

    case 'RESET_TO_IDLE':
      return createInitialRiderMachineState();

    default:
      return state;
  }
}

export function useRiderDashboardMachine() {
  const [state, dispatch] = React.useReducer(riderDashboardReducer, undefined, createInitialRiderMachineState);

  return { state, dispatch, showAdRiver: shouldShowAdRiver(state) };
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function firstNumber(...values: unknown[]) {
  for (const value of values) {
    const numberValue = Number(value);
    if (Number.isFinite(numberValue)) return numberValue;
  }
  return null;
}
