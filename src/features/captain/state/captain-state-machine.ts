import type { Trip } from '@/core/types';

export type CaptainScreen = 'RADAR_MAP' | 'BIDDING' | 'ACTIVE_TRIP' | 'RATING_MODAL' | 'WALLET' | 'PROFILE';
export type CaptainTripStep = 'IDLE' | 'OFFER_SUBMITTED' | 'ACCEPTED' | 'ARRIVED' | 'STARTED' | 'COMPLETED';

export interface CaptainCompletedTrip {
  requestId: string;
  riderId: string;
  riderName?: string;
}

export interface CaptainDashboardState {
  screen: CaptainScreen;
  tripStep: CaptainTripStep;
  selectedRequest: Trip | null;
  submittedOfferRequestId: string | null;
  submittedOfferId: string | null;
  completedTrip: CaptainCompletedTrip | null;
}

export type CaptainDashboardAction =
  | { type: 'OPEN_RADAR' }
  | { type: 'OPEN_WALLET' }
  | { type: 'OPEN_PROFILE' }
  | { type: 'SELECT_REQUEST'; request: Trip }
  | { type: 'IGNORE_REQUEST'; requestId: string }
  | { type: 'OFFER_SUBMITTED'; requestId: string; offerId?: string | null }
  | { type: 'SERVER_ACCEPTED'; request: Trip; offerId?: string | null; step?: CaptainTripStep }
  | { type: 'CONFIRM_ARRIVAL' }
  | { type: 'START_TRIP' }
  | { type: 'TRIP_COMPLETED'; completedTrip?: CaptainCompletedTrip }
  | { type: 'RATING_DISMISSED' }
  | { type: 'RESET_TO_RADAR' };

export const initialCaptainDashboardState: CaptainDashboardState = {
  screen: 'RADAR_MAP',
  tripStep: 'IDLE',
  selectedRequest: null,
  submittedOfferRequestId: null,
  submittedOfferId: null,
  completedTrip: null,
};

export function captainDashboardReducer(
  state: CaptainDashboardState,
  action: CaptainDashboardAction,
): CaptainDashboardState {
  switch (action.type) {
    case 'OPEN_RADAR':
      if (state.screen === 'ACTIVE_TRIP') return state;
      return { ...state, screen: 'RADAR_MAP', selectedRequest: null };

    case 'OPEN_WALLET':
      if (state.screen === 'ACTIVE_TRIP') return state;
      return { ...state, screen: 'WALLET' };

    case 'OPEN_PROFILE':
      if (state.screen === 'ACTIVE_TRIP') return state;
      return { ...state, screen: 'PROFILE' };

    case 'SELECT_REQUEST':
      if (state.screen === 'ACTIVE_TRIP') return state;
      return { ...state, screen: 'BIDDING', selectedRequest: action.request };

    case 'IGNORE_REQUEST':
      if (state.selectedRequest?.id !== action.requestId) return state;
      return { ...state, screen: 'RADAR_MAP', selectedRequest: null };

    case 'OFFER_SUBMITTED':
      return {
        ...state,
        screen: 'RADAR_MAP',
        tripStep: 'OFFER_SUBMITTED',
        submittedOfferRequestId: action.requestId,
        submittedOfferId: action.offerId || null,
        selectedRequest: null,
      };

    case 'SERVER_ACCEPTED':
      return {
        ...state,
        screen: 'ACTIVE_TRIP',
        tripStep: action.step || 'ACCEPTED',
        selectedRequest: action.request,
        submittedOfferRequestId: action.request.id,
        submittedOfferId: action.offerId || state.submittedOfferId,
      };

    case 'CONFIRM_ARRIVAL':
      if (state.screen !== 'ACTIVE_TRIP') return state;
      return { ...state, tripStep: 'ARRIVED' };

    case 'START_TRIP':
      if (state.screen !== 'ACTIVE_TRIP') return state;
      return { ...state, tripStep: 'STARTED' };

    case 'TRIP_COMPLETED':
      // A trip that ends without captured rider info (e.g. the server-sync
      // fallback below, firing after the trip already vanished) must not
      // clobber a rating modal that a fuller TRIP_COMPLETED dispatch already opened.
      if (!action.completedTrip && state.screen === 'RATING_MODAL') return state;
      return {
        ...state,
        screen: action.completedTrip ? 'RATING_MODAL' : 'RADAR_MAP',
        tripStep: 'COMPLETED',
        selectedRequest: null,
        submittedOfferRequestId: null,
        submittedOfferId: null,
        completedTrip: action.completedTrip || null,
      };

    case 'RATING_DISMISSED':
      if (state.screen !== 'RATING_MODAL') return state;
      return { ...state, screen: 'RADAR_MAP', completedTrip: null };

    case 'RESET_TO_RADAR':
      return initialCaptainDashboardState;

    default:
      return state;
  }
}
