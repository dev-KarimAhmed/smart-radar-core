import React from 'react';
import { RadioTower, Clock } from 'lucide-react';
import type { CaptainCancelCooldownState } from '../../services/captain-cancel-cooldown';
import { formatSecondsToMMSS } from '../../services/captain-cancel-cooldown';
import type { Trip } from '@/core/types';
import { styles } from './radar-map.styles';
import { StateCard, formatMinutes } from './radar-map.helpers';
import { RadarRequestCard } from './radar-request-card';
import type { RadarCopyType } from './radar-copy';

interface RadarRequestsQueueProps {
  language: 'ar' | 'en';
  currency: string;
  totalMinutes?: number;
  copy: RadarCopyType;
  requests: Trip[];
  sortedRequests: Trip[];
  radarLockMessage?: string;
  cancelCooldown?: CaptainCancelCooldownState;
  driverLocation: { lat: number; lng: number } | null;
  activeTariff: any;
  captainPricingMode?: 'FREE' | 'APP' | 'TAXI' | null;
  subRole?: string | null;
  isOfficeTaxi?: boolean;
  expandedCardIds: Record<string, boolean>;
  onToggleExpand: (id: string) => void;
  pendingOffersCount?: Record<string, number>;
  pendingOfferRequestId?: string | null;
  lastSubmittedPrices: Record<string, number[]>;
  directPrices: Record<string, string>;
  priceErrors: Record<string, boolean>;
  submittingRequestId: string | null;
  cancellingRequestId: string | null;
  isCancellingOffer: boolean;
  onInitiateOffer: (trip: Trip) => void;
  onCancelOffer?: (tripId: string) => Promise<boolean | void>;
  onIgnoreRequest: (tripId: string) => void;
  onPastePrice: (tripId: string) => Promise<void>;
  onUpdateDirectPrice: (tripId: string, value: string) => void;
  onClearPriceError: (tripId: string) => void;
  onEditTariff?: () => void;
}

export function RadarRequestsQueue({
  language,
  currency,
  totalMinutes = 0,
  copy,
  requests,
  sortedRequests,
  radarLockMessage,
  cancelCooldown,
  driverLocation,
  activeTariff,
  captainPricingMode,
  subRole,
  isOfficeTaxi,
  expandedCardIds,
  onToggleExpand,
  pendingOffersCount,
  pendingOfferRequestId,
  lastSubmittedPrices,
  directPrices,
  priceErrors,
  submittingRequestId,
  cancellingRequestId,
  isCancellingOffer,
  onInitiateOffer,
  onCancelOffer,
  onIgnoreRequest,
  onPastePrice,
  onUpdateDirectPrice,
  onClearPriceError,
  onEditTariff,
}: RadarRequestsQueueProps) {
  return (
    <aside className={styles.style201_22}>
      <div className="flex items-center justify-between gap-2 rounded-2xl border border-teal-500/30 bg-[#06101E]/90 px-4 py-3 text-xs sm:text-sm font-black text-[#14F5D5] shadow-lg backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-[#14F5D5] shrink-0" />
          <span>
            {language === 'ar'
              ? `رصيد الانتشار ${formatMinutes(totalMinutes, language)}`
              : `Broadcast Quota: ${formatMinutes(totalMinutes, language)}`}
          </span>
        </div>
        {requests.length > 0 ? (
          <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 px-2.5 py-0.5 text-xs font-black text-emerald-300">
            {requests.length}
          </span>
        ) : null}
      </div>

      <div className={styles.style211_28}>
        {radarLockMessage ? (
          <StateCard tone="amber" icon={<RadioTower className={styles.style213_29} />} title={copy.radarLocked} body={radarLockMessage} />
        ) : requests.length === 0 ? (
          <StateCard tone="empty" icon={<RadioTower className={styles.style215_30} />} title={copy.noRequestsTitle} body={copy.empty} />
        ) : (
          <div className={styles.style217_31}>
            {sortedRequests.map((request) => {
              const offerCount = (pendingOffersCount?.[request.id] || 0) > 0 || pendingOfferRequestId === request.id ? 1 : 0;
              const requestSubmittedPrices = lastSubmittedPrices[request.id];
              const lastSubmittedPrice = requestSubmittedPrices && requestSubmittedPrices.length > 0
                ? requestSubmittedPrices[requestSubmittedPrices.length - 1]
                : undefined;

              return (
                <RadarRequestCard
                  key={request.id}
                  request={request}
                  language={language}
                  currency={currency}
                  copy={copy}
                  driverLocation={driverLocation}
                  activeTariff={activeTariff}
                  captainPricingMode={captainPricingMode}
                  subRole={subRole}
                  isOfficeTaxi={isOfficeTaxi}
                  isExpanded={Boolean(expandedCardIds[request.id])}
                  onToggleExpand={() => onToggleExpand(request.id)}
                  offerCount={offerCount}
                  lastSubmittedPrice={lastSubmittedPrice}
                  directPrice={directPrices[request.id]}
                  priceError={priceErrors[request.id]}
                  isSubmitting={submittingRequestId === request.id}
                  isCancelling={cancellingRequestId === request.id || isCancellingOffer}
                  onInitiateOffer={onInitiateOffer}
                  onCancelOffer={onCancelOffer}
                  onIgnoreRequest={onIgnoreRequest}
                  onPastePrice={onPastePrice}
                  onUpdateDirectPrice={onUpdateDirectPrice}
                  onClearPriceError={onClearPriceError}
                  onEditTariff={onEditTariff}
                />
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
}
