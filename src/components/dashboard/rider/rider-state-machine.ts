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
  | { type: 'REQUEST_FAILED' }
  | { type: 'REQUEST_CANCELLED' }
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

function buildActiveTrip(state: RiderMachineState, acceptedRow: Record<string, unknown>): RiderActiveTrip | null {
  const acceptedOfferId =
    firstString(acceptedRow.accepted_offer_id, acceptedRow.offer_id, acceptedRow.selected_offer_id) ||
    state.pendingAcceptedOfferId;
  const acceptedCaptainId = firstString(acceptedRow.accepted_driver_id, acceptedRow.driver_id, acceptedRow.captain_id);
  const selectedOffer = state.offers.find((offer) => (
    offer.id === acceptedOfferId ||
    offer.driverId === acceptedOfferId ||
    offer.driverId === acceptedCaptainId
  ));

  if (!selectedOffer && !acceptedCaptainId) return null;

  const vehicle = selectedOffer?.driverVehicle || {};
  const distanceKm = state.destination?.fareQuote?.estimatedRoadDistanceKm ?? 0;

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
    destinationLabel: state.destination?.label || 'وجهة',
    distanceKm,
    originCell: state.destination?.originCell ?? state.destination?.fareQuote?.originCell,
    destinationCell: state.destination?.destinationCell ?? state.destination?.fareQuote?.destinationCell,
    tortuosityFactor: state.destination?.fareQuote?.tortuosityFactor,
    etaSeconds: Math.max(4 * 60, Math.round((distanceKm || 4) * 85)),
    startedAt: Date.now(),
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
      if (state.screen !== 'RECEIVING_OFFERS') return state;
      const activeTrip = buildActiveTrip(state, action.row);
      if (!activeTrip) return state;
      return {
        ...state,
        screen: 'TRIP_ACTIVE',
        activeTrip,
        requestCancelledAt: null,
      };
    }

    case 'REQUEST_FAILED':
      if (state.screen !== 'DESTINATION_SELECTION') return state;
      return { ...state, requestStartedAt: null, requestId: null };

    case 'REQUEST_CANCELLED':
      if (state.screen !== 'DESTINATION_SELECTION' && state.screen !== 'RECEIVING_OFFERS') return state;
      return {
        ...state,
        screen: 'RECEIVING_OFFERS',
        offers: [],
        requestCancelledAt: Date.now(),
        pendingAcceptedOfferId: null,
      };

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
