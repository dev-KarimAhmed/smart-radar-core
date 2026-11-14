import React from 'react';
import { X } from 'lucide-react';
import type { AppLanguage } from '@/lib/i18n/simple-copy';
import type { Offer } from '@/core/types';
import type { RiderMachineState } from '../../state/rider-state-machine';
import type { CaptainPresencePoint } from '../../services/rider-server-marketplace';
import { buildCaptainOfferFromOffer } from '../../services/rider-offer-presentation';
import { getOfferCountdown } from '../../services/offer-countdown';
import type { RiderLocation } from '../rider-map';
import { CaptainOfferCard } from '../captain-offer-card';
import { styles } from './receiving-offers-types';

interface ReceivingOffersListViewProps {
  activeOffers: Offer[];
  state: RiderMachineState;
  captainLocations: CaptainPresencePoint[];
  riderLocation: RiderLocation;
  preferredCaptainIds: string[];
  language: AppLanguage;
  labels: any;
  currencyLabel: string;
  acceptingOfferId: string | null;
  expandedOfferId: string | null;
  onToggleExpandOffer: (offerId: string) => void;
  onAcceptOffer: (offer: Offer) => void;
  onCancelRideRequest: () => void;
  isCancellingRideRequest: boolean;
  firstSeenAtRef: React.RefObject<Map<string, number>>;
  now: number;
  isArabic: boolean;
  t: (key: string) => string;
}

export function ReceivingOffersListView({
  activeOffers,
  state,
  captainLocations,
  riderLocation,
  preferredCaptainIds,
  language,
  labels,
  currencyLabel,
  acceptingOfferId,
  expandedOfferId,
  onToggleExpandOffer,
  onAcceptOffer,
  onCancelRideRequest,
  isCancellingRideRequest,
  firstSeenAtRef,
  now,
  isArabic,
  t,
}: ReceivingOffersListViewProps) {
  return (
    <div className="space-y-4">
      <div className={styles.offerList}>
        {activeOffers.map((offer) => {
          const { offer: captainOffer, isPreferred } = buildCaptainOfferFromOffer(
            offer,
            {
              captainLocations,
              riderLocation,
              destination: state.destination,
              preferredCaptainIds,
              language,
              serverEstimatedFare: state.destination?.serverEstimatedFare,
            },
            labels,
          );

          const offerKey = offer.id || offer.driverId;
          const firstSeen = firstSeenAtRef.current?.get(offerKey);

          return (
            <CaptainOfferCard
              key={offerKey}
              offer={captainOffer}
              currencyCode={currencyLabel || 'EGP'}
              isAccepting={acceptingOfferId === offerKey}
              isPreferred={isPreferred}
              isExpanded={expandedOfferId === captainOffer.id}
              countdown={getOfferCountdown(offer, firstSeen, now)}
              onToggleExpand={() => onToggleExpandOffer(captainOffer.id)}
              onAccept={() => onAcceptOffer(offer)}
            />
          );
        })}
      </div>

      <button
        type="button"
        onClick={onCancelRideRequest}
        disabled={isCancellingRideRequest}
        className="group flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-rose-500/40 bg-rose-500/15 text-sm font-black text-rose-200 shadow-lg shadow-rose-950/40 transition-all duration-200 hover:border-rose-500/70 hover:bg-rose-500/25 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
      >
        <X className="h-4 w-4 text-rose-400 transition-transform group-hover:rotate-90" />
        <span>
          {isCancellingRideRequest
            ? (isArabic ? 'جاري إلغاء الطلب...' : t('request.cancelling'))
            : (isArabic ? 'إلغاء الطلب' : t('request.cancel'))}
        </span>
      </button>
    </div>
  );
}
