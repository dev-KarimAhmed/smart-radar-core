import type { Trip } from '@/core/types';
import type { CaptainCancelCooldownState } from '../../services/captain-cancel-cooldown';

export interface RadarMapViewProps {
  language: 'ar' | 'en';
  isActive: boolean;
  driverLocation: { lat: number; lng: number } | null;
  currentH3Cell?: string;
  paidMinutes: number;
  bonusMinutes: number;
  currency?: string;
  radarLockMessage?: string;
  cancelCooldown?: CaptainCancelCooldownState;
  requests: Trip[];
  pendingOfferRequestId?: string | null;
  pendingOffersCount?: Record<string, number>;
  onCancelOffer?: (tripId: string) => Promise<boolean | void>;
  isCancellingOffer?: boolean;
  captainPricingMode?: 'FREE' | 'APP' | 'TAXI' | null;
  currentTariff?: any;
  isOfficeTaxi?: boolean;
  subRole?: string | null;
  onSelectRequest: (request: Trip, initialPrice?: string, pricingMode?: 'FREE' | 'APP' | 'TAXI') => void;
  onIgnoreRequest: (requestId: string) => void;
  onSubmitDirectBid?: (request: Trip, price: number, waitSeconds?: number, pricingMode?: 'FREE' | 'APP' | 'TAXI') => Promise<void> | void;
  onEditTariff?: () => void;
}

export interface ConfirmModalTripState {
  trip: Trip;
  price: number;
  pricingMode: 'FREE' | 'APP' | 'TAXI';
  isAdditional: boolean;
  previousPrice?: number;
}
