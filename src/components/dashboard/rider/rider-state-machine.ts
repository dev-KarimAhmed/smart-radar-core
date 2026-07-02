import React from 'react';
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
}

export type RiderMachineAction =
  | { type: 'OPEN_DESTINATION' }
  | { type: 'CONFIRM_DESTINATION'; destination: RiderDestination }
  | { type: 'SEND_REQUEST' }
  | { type: 'RECEIVE_OFFERS'; offers: Offer[] }
  | { type: 'SELECT_OFFER'; offerId: string }
  | { type: 'COMPLETE_TRIP' }
  | { type: 'SUBMIT_RATING'; rating: RiderLocalRating }
  | { type: 'OPEN_PURGE_LEDGER' }
  | { type: 'OPEN_FAVORITE_CAPTAINS' }
  | { type: 'RETURN_TO_MAP' };

export function createInitialRiderMachineState(): RiderMachineState {
  return {
    screen: 'IDLE_MAP',
    destination: null,
    offers: [],
    activeTrip: null,
    completedTrip: null,
    localRatings: [],
    requestStartedAt: null,
  };
}

export function buildMockCaptainOffers(destination: RiderDestination): Offer[] {
  const districtSeed = destination.district.charCodeAt(0) || 7;
  const basePrice = 2.1 + (districtSeed % 4) * 0.25;

  return [
    {
      driverId: 'demo-captain-d-102',
      driverName: 'D-102',
      driverRating: 4.9,
      driverRank: 'Platinum',
      price: Number((basePrice + 0.35).toFixed(2)),
      driverVehicle: {
        make: 'Toyota Corolla',
        color: 'White',
        year: 2023,
        plate: '77-102',
        type: 'Hybrid sedan',
      },
      driverAffiliation: { type: 'independent', name: 'مستقل' },
      silencePreference: 'silent',
    },
    {
      driverId: 'demo-captain-d-118',
      driverName: 'D-118',
      driverRating: 4.7,
      driverRank: 'Gold',
      price: Number(basePrice.toFixed(2)),
      driverVehicle: {
        make: 'Hyundai Ioniq',
        color: 'Silver',
        year: 2022,
        plate: '22-118',
        type: 'Eco sedan',
      },
      driverAffiliation: { type: 'independent', name: 'مستقل' },
      silencePreference: 'neutral',
    },
    {
      driverId: 'demo-captain-d-131',
      driverName: 'D-131',
      driverRating: 4.5,
      driverRank: 'Silver',
      price: Number((basePrice - 0.3).toFixed(2)),
      driverVehicle: {
        make: 'Kia Niro',
        color: 'Black',
        year: 2021,
        plate: '31-131',
        type: 'Compact hybrid',
      },
      driverAffiliation: { type: 'independent', name: 'مستقل' },
      isDumping: true,
      displayTarget: 'reserve_3',
    },
  ];
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

  return {
    tripId: `local-trip-${Date.now()}`,
    captainId: selectedOffer.driverId,
    captainName: selectedOffer.driverName,
    captainSerial: selectedOffer.driverName || selectedOffer.driverId,
    captainPhone: '0790000102',
    vehicleType: vehicle.type || `${vehicle.make || 'Vehicle'} ${vehicle.color || ''}`.trim(),
    vehiclePlate: vehicle.plate || '77-102',
    finalPrice: selectedOffer.price === -1 ? 2.75 : selectedOffer.price,
    destinationLabel: state.destination?.label || 'وجهة محلية',
    etaSeconds: 5 * 60,
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
        screen: 'RECEIVING_OFFERS',
        offers: [],
        activeTrip: null,
        completedTrip: null,
        requestStartedAt: Date.now(),
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

    default:
      return state;
  }
}

export function useRiderDashboardMachine() {
  const [state, dispatch] = React.useReducer(riderDashboardReducer, undefined, createInitialRiderMachineState);

  React.useEffect(() => {
    if (state.screen !== 'RECEIVING_OFFERS' || state.offers.length > 0 || !state.destination) return;

    const timer = window.setTimeout(() => {
      dispatch({ type: 'RECEIVE_OFFERS', offers: buildMockCaptainOffers(state.destination!) });
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [state.screen, state.offers.length, state.destination]);

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
