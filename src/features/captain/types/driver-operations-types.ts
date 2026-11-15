import type { MarketPulse, Trip, User as RiderUser } from '@/core/types';
import type { CaptainCancelCooldownState } from '../services/captain-cancel-cooldown';

export type DriverStatus = 'active' | 'idle' | 'busy' | 'rating';

export interface DriverOpsContextType {
  driverStatus: DriverStatus;
  accountSecurityStatus?: 'SUSPENDED' | 'BANNED' | null;
  activeRequest: Trip | null;
  acceptedRider: RiderUser | null;
  handshakeAt: number | null;
  pendingOfferRequestId: string | null;
  pendingOffersCount?: Record<string, number>;
  isDormancyWarningVisible: boolean;
  resetDormancyTimer: () => void;
  submitOffer: (payload: { tripId: string; offerPrice: number; waitSeconds: number; pricingMode?: 'FREE' | 'APP' | 'TAXI' }) => Promise<boolean>;
  isSubmittingOffer: boolean;
  cancelOffer: (tripId?: string) => Promise<boolean>;
  isCancellingOffer: boolean;
  markArrivedAtPickup: () => Promise<boolean>;
  startTrip: () => Promise<boolean>;
  isUpdatingTripStep: boolean;
  endTrip: () => Promise<boolean>;
  isEndingTrip: boolean;
  cancelActiveTrip: () => Promise<boolean>;
  acknowledgeMutualCancel: () => void;
  isCancellingTrip: boolean;
  rateAndFinishTrip: () => Promise<void>;
  isRatingRider: boolean;
  isRequestListOpen: boolean;
  toggleRequestList: (open?: boolean) => void;
  toggleDriverStatus: (desiredStatus: 'active' | 'idle') => Promise<boolean>;
  /** Increments on each self-activation, so gates like the tariff modal can re-run. */
  activationNonce: number;
  isUpdatingStatus: boolean;
  requests: Trip[];
  driverLocation: { lat: number; lng: number } | null;
  rejectRequest: (tripId: string) => void;
  rejectedTripIds: string[];
  requestWeeklyReport: () => Promise<void>;
  isRequestingReport: boolean;
  pulseData: MarketPulse[];
  loadingPulse: boolean;
  driverSpeed: number;
  currentDistrict?: string;
  currentH3Cell?: string;
  isDisconnectionLockActive?: boolean;
  radarLockMessage?: string;
  cancelCooldown?: CaptainCancelCooldownState;
}
