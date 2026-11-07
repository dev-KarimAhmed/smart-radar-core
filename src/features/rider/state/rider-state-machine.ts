import React from 'react';
import type {
  RiderMachineScreen,
  RiderDestination,
  RiderLocalRating,
  RiderActiveTripCaptain,
  RiderActiveTrip,
  RiderMachineState,
  RiderMachineAction,
} from './rider-state-types';
import {
  RIDER_STATE_STORAGE_KEY,
  initialRiderMachineState,
} from './rider-state-types';
import {
  firstString,
  firstNumber,
  extractRowStartTime,
  buildDestinationFromRow,
  buildActiveTrip,
} from './rider-state-helpers';

export type {
  RiderMachineScreen,
  RiderDestination,
  RiderLocalRating,
  RiderActiveTripCaptain,
  RiderActiveTrip,
  RiderMachineState,
  RiderMachineAction,
};
export {
  RIDER_STATE_STORAGE_KEY,
  initialRiderMachineState,
};
export {
  firstString,
  firstNumber,
  extractRowStartTime,
  buildDestinationFromRow,
  buildActiveTrip,
};

export function createInitialRiderMachineState(): RiderMachineState {
  if (typeof window !== 'undefined') {
    try {
      const saved = window.localStorage.getItem(RIDER_STATE_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as RiderMachineState;
        if (
          parsed &&
          parsed.requestId &&
          (parsed.screen === 'RECEIVING_OFFERS' || parsed.screen === 'TRIP_ACTIVE' || parsed.screen === 'RATING_MODAL')
        ) {
          return parsed;
        }
      }
    } catch {}
  }
  return initialRiderMachineState;
}

export function shouldShowAdRiver(state: RiderMachineState): boolean {
  if (
    state.screen === 'TRIP_ACTIVE' ||
    state.screen === 'RATING_MODAL' ||
    state.screen === 'DESTINATION_SELECTION' ||
    state.screen === 'RECEIVING_OFFERS'
  ) {
    return false;
  }

  return true;
}

export function riderDashboardReducer(state: RiderMachineState, action: RiderMachineAction): RiderMachineState {
  switch (action.type) {
    case 'OPEN_DESTINATION':
      if (state.screen === 'TRIP_ACTIVE' || state.screen === 'RATING_MODAL' || state.screen === 'RECEIVING_OFFERS') {
        return state;
      }
      return { ...state, screen: 'DESTINATION_SELECTION' };

    case 'CONFIRM_DESTINATION':
      if (state.screen !== 'DESTINATION_SELECTION' && state.screen !== 'RECEIVING_OFFERS') return state;
      return { ...state, destination: action.destination };

    case 'SEND_REQUEST':
      if ((state.screen !== 'DESTINATION_SELECTION' && state.screen !== 'RECEIVING_OFFERS') || !state.destination) return state;
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
      if (state.screen !== 'DESTINATION_SELECTION' && state.screen !== 'RECEIVING_OFFERS') return state;
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
      if (state.screen !== 'TRIP_ACTIVE' || !state.activeTrip) {
        if (state.requestId) {
          if (typeof window !== 'undefined') {
            try {
              window.localStorage.removeItem(RIDER_STATE_STORAGE_KEY);
            } catch {}
          }
          return initialRiderMachineState;
        }
        return state;
      }
      return {
        ...state,
        screen: 'RATING_MODAL',
        completedTrip: {
          ...state.activeTrip,
          status: String(action.row?.status || 'COMPLETED').toUpperCase(),
          finalPrice: firstNumber(action.row?.final_fare, action.row?.final_price) ?? state.activeTrip.finalPrice,
        },
        activeTrip: null,
      };

    case 'REQUEST_FAILED':
      if (state.screen !== 'DESTINATION_SELECTION') return state;
      return { ...state, requestStartedAt: null, requestId: null };

    case 'REQUEST_CANCELLED':
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.removeItem(RIDER_STATE_STORAGE_KEY);
        } catch {}
      }
      if (state.screen === 'TRIP_ACTIVE') {
        const destination = state.destination || (state.activeTrip?.destinationLabel ? {
          id: state.activeTrip.tripId,
          label: state.activeTrip.destinationLabel,
          governorate: '',
          district: '',
          coords: {
            lat: (state.activeTrip as any).destinationLat ?? 0,
            lng: (state.activeTrip as any).destinationLng ?? 0,
          },
          originCell: state.activeTrip.originCell,
          destinationCell: state.activeTrip.destinationCell,
        } : null);

        return {
          ...initialRiderMachineState,
          destination,
          screen: 'DESTINATION_SELECTION',
          requestCancelledAt: Date.now(),
          autoRetryRequested: true,
        };
      }
      if (state.screen !== 'RECEIVING_OFFERS') {
        return state;
      }
      return {
        ...initialRiderMachineState,
        destination: state.destination,
        screen: 'RECEIVING_OFFERS',
        offers: [],
        requestCancelledAt: Date.now(),
        pendingAcceptedOfferId: null,
      };

    case 'REHYDRATE_SEARCHING': {
      if (state.screen !== 'IDLE_MAP') return state;
      return {
        ...state,
        screen: 'RECEIVING_OFFERS',
        requestId: action.requestId,
        destination: state.destination ?? buildDestinationFromRow(action.requestId, action.row),
        requestStartedAt: state.requestStartedAt ?? extractRowStartTime(action.row),
      };
    }

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
        return {
          ...stateWithOffers,
          screen: 'RECEIVING_OFFERS',
          requestStartedAt: state.requestStartedAt ?? extractRowStartTime(action.row),
        };
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
      if (state.screen !== 'RATING_MODAL') return state;
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.removeItem(RIDER_STATE_STORAGE_KEY);
        } catch {}
      }
      return initialRiderMachineState;

    case 'OPEN_PURGE_LEDGER':
      if (state.screen === 'TRIP_ACTIVE' || state.screen === 'RATING_MODAL' || state.screen === 'RECEIVING_OFFERS') return state;
      return { ...state, screen: 'PURGE_LEDGER' };

    case 'OPEN_FAVORITE_CAPTAINS':
      if (state.screen === 'TRIP_ACTIVE' || state.screen === 'RATING_MODAL' || state.screen === 'RECEIVING_OFFERS') return state;
      return { ...state, screen: 'FAVORITE_CAPTAINS' };

    case 'RETURN_TO_MAP':
      if (state.screen === 'TRIP_ACTIVE' || state.screen === 'RATING_MODAL' || state.screen === 'RECEIVING_OFFERS') return state;
      return { ...state, screen: 'IDLE_MAP' };

    case 'CLEAR_AUTO_RETRY':
      return { ...state, autoRetryRequested: false };

    case 'RESET_TO_IDLE':
      if (typeof window !== 'undefined') {
        try {
          window.localStorage.removeItem(RIDER_STATE_STORAGE_KEY);
        } catch {}
      }
      return initialRiderMachineState;

    default:
      return state;
  }
}

export function useRiderDashboardMachine() {
  const [state, dispatch] = React.useReducer(riderDashboardReducer, undefined, createInitialRiderMachineState);

  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (
        state.requestId &&
        (state.screen === 'RECEIVING_OFFERS' || state.screen === 'TRIP_ACTIVE' || state.screen === 'RATING_MODAL')
      ) {
        window.localStorage.setItem(RIDER_STATE_STORAGE_KEY, JSON.stringify(state));
      } else {
        window.localStorage.removeItem(RIDER_STATE_STORAGE_KEY);
      }
    } catch {}
  }, [state]);

  return { state, dispatch, showAdRiver: shouldShowAdRiver(state) };
}
