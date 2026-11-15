import React from 'react';
import type { AppLanguage } from '@/lib/i18n/simple-copy';
import type { Offer } from '@/core/types';
import type { RiderMachineState } from '../../state/rider-state-machine';
import type { CaptainPresencePoint } from '../../services/rider-server-marketplace';
import type { RiderLocation } from '../rider-map';

export const TOTAL_SEARCH_SECONDS = 240; // 4 minutes
export const STAGE_DURATION_SECONDS = 48; // 240 / 5 = 48s for each of the 5 scan perimeters

export const styles = {
  cancelledWrapper: "space-y-4 pointer-events-auto",
  rtl: "text-right",
  ltr: "text-left",
  wrapper: "space-y-3.5",
  offerList: "space-y-3",
} as const;

export interface RadarStage {
  index: number;
  radiusKm: number;
  title: string;
  description: string;
  badge: string;
}

export interface ReceivingOffersScreenProps {
  isArabic: boolean;
  language: AppLanguage;
  state: RiderMachineState;
  currencyLabel: string;
  riderLocation: RiderLocation;
  captainLocations: CaptainPresencePoint[];
  preferredCaptainIds: string[];
  acceptingOfferId: string | null;
  expandedOfferId: string | null;
  onToggleExpandOffer: (offerId: string) => void;
  captainSearchRadiusKm: number;
  isExpandingCaptainSearch: boolean;
  isCancellingRideRequest: boolean;
  onCancelRideRequest: () => void;
  onAcceptOffer: (offer: Offer) => void;
  onRetry: () => void;
  firstSeenAtRef: React.RefObject<Map<string, number>>;
}
