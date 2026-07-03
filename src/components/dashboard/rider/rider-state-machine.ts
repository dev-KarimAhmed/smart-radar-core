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
  localRatings: Array<RiderLocalRating & { tripId: string; submittedAt: number }>;
  requestStartedAt: number | null;
  requestId: string | null;
  requestCancelledAt: number | null;
}

export type RiderMachineAction =
  | { type: 'OPEN_DESTINATION' }
  | { type: 'CONFIRM_DESTINATION'; destination: RiderDestination }
  | { type: 'SEND_REQUEST' }
  | { type: 'SERVER_REQUEST_CREATED'; requestId: string }
  | { type: 'SERVER_STATUS_RECEIVING_OFFERS' }
  | { type: 'REQUEST_FAILED' }
  | { type: 'REQUEST_CANCELLED' }
  | { type: 'RECEIVE_OFFERS'; offers: Offer[] }
  | { type: 'SELECT_OFFER'; offerId: string }
  | { type: 'COMPLETE_TRIP' }
  | { type: 'SUBMIT_RATING'; rating: RiderLocalRating }
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
    localRatings: [],
    requestStartedAt: null,
    requestId: null,
    requestCancelledAt: null,
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

function buildActiveTrip(state: RiderMachineState, selectedOffer: Offer): RiderActiveTrip {
  const vehicle = selectedOffer.driverVehicle || {};
  const distanceKm = state.destination?.fareQuote?.estimatedRoadDistanceKm ?? 0;

  return {
    tripId: `local-trip-${Date.now()}`,
    captainId: selectedOffer.driverId,
    captainName: selectedOffer.driverName,
    captainSerial: selectedOffer.driverName || selectedOffer.driverId,
    captainPhone: selectedOffer.driverAffiliation?.phone || '',
    vehicleType: vehicle.type || `${vehicle.make || 'سيارة'} ${vehicle.color || ''}`.trim(),
    vehiclePlate: vehicle.plate || 'غير متاح',
    finalPrice:
      selectedOffer.price === -1
        ? state.destination?.serverEstimatedFare ?? 0
        : selectedOffer.price,
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
      };

    case 'SERVER_REQUEST_CREATED':
      if (state.screen !== 'DESTINATION_SELECTION') return state;
      return { ...state, requestId: action.requestId, requestStartedAt: state.requestStartedAt ?? Date.now() };

    case 'SERVER_STATUS_RECEIVING_OFFERS':
      if (state.screen !== 'DESTINATION_SELECTION' && state.screen !== 'RECEIVING_OFFERS') return state;
      if (!state.requestStartedAt && state.screen !== 'RECEIVING_OFFERS') return state;
      return { ...state, screen: 'RECEIVING_OFFERS' };

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
      };

    case 'RECEIVE_OFFERS':
      if (state.screen !== 'RECEIVING_OFFERS') return state;
      return { ...state, offers: action.offers };

    case 'SELECT_OFFER': {
      if (state.screen !== 'RECEIVING_OFFERS') return state;
      const selectedOffer = state.offers.find((offer) => offer.driverId === action.offerId);
      if (!selectedOffer) return state;
      return {
        ...state,
        screen: 'TRIP_ACTIVE',
        activeTrip: buildActiveTrip(state, selectedOffer),
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
        localRatings: [
          ...state.localRatings,
          {
            ...action.rating,
            tripId: state.completedTrip.tripId,
            submittedAt: Date.now(),
          },
        ],
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
      return {
        ...createInitialRiderMachineState(),
        localRatings: state.localRatings,
      };

    default:
      return state;
  }
}

export function useRiderDashboardMachine() {
  const [state, dispatch] = React.useReducer(riderDashboardReducer, undefined, createInitialRiderMachineState);

  React.useEffect(() => {
    if (state.localRatings.length === 0) return;

    try {
      localStorage.setItem('radar_rider_local_ratings', JSON.stringify(state.localRatings));
    } catch (error) {
      console.warn('Failed to store local rider ratings:', error);
    }
  }, [state.localRatings]);

  return { state, dispatch, showAdRiver: shouldShowAdRiver(state) };
}
