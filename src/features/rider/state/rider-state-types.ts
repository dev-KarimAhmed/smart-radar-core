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

export interface RiderActiveTripCaptain {
  serial_number?: string | null;
  serial?: string | null;
  nickname?: string | null;
  full_name?: string | null;
  name?: string | null;
  phone?: string | null;
  plate_number?: string | null;
  license_plate?: string | null;
  vehicle_model?: string | null;
  vehicle_color?: string | null;
  facebook_url?: string | null;
  instagram_url?: string | null;
  [key: string]: unknown;
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
  acceptedAtMs?: number | null;
  arrivedAtMs?: number | null;
  startedAtMs?: number | null;
  pickupEtaMinutes?: number | null;
  tripDurationMinutes?: number | null;
  captain?: RiderActiveTripCaptain | null;
  status?: string;
  cancel_requested_by?: 'rider' | 'captain' | null;
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
  autoRetryRequested?: boolean;
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
  | { type: 'CLEAR_AUTO_RETRY' }
  | { type: 'HYDRATE_CAPTAIN_PHONE'; captainId: string; phone: string }
  | { type: 'RESET_TO_IDLE' };

export const RIDER_STATE_STORAGE_KEY = 'radar_active_rider_machine_state';

export const initialRiderMachineState: RiderMachineState = {
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
