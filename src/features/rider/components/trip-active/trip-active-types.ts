import type { RiderActiveTrip } from '../../state/rider-state-machine';
import type { TripCountdown } from '@/shared/services/trip-countdown';

export interface TripActiveScreenProps {
  isArabic: boolean;
  activeTrip: RiderActiveTrip;
  countdown?: TripCountdown;
  etaSeconds?: number;
  currencyLabel: string;
  isCancellingRideRequest: boolean;
  onEmergencyWhatsapp: () => void;
  onCancelRideRequest: () => void;
}
