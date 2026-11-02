import React from 'react';
import { RadioTower, Clock } from 'lucide-react';
import type { CaptainCancelCooldownState } from '../../services/captain-cancel-cooldown';
import { formatSecondsToMMSS } from '../../services/captain-cancel-cooldown';
import type { Trip } from '@/core/types';
import { styles } from './radar-map.styles';
import { StateCard } from './radar-map.helpers';
import { RadarRequestCard } from './radar-request-card';
import type { RadarCopyType } from './radar-copy';

interface RadarRequestsQueueProps {
  language: 'ar' | 'en';
  currency: string;
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
      <div className={styles.style202_23}>
        <div>
          <p className={styles.style204_24}>{copy.queueBadge}</p>
          <h2 className={styles.style205_25}>{copy.sheetTitle}</h2>
        </div>
        <span className={styles.style208_27}>{requests.length}</span>
      </div>

      <div className={styles.style211_28}>
        {radarLockMessage ? (
          <StateCard tone="amber" icon={<RadioTower className={styles.style213_29} />} title={copy.radarLocked} body={radarLockMessage} />
        ) : cancelCooldown?.isActive ? (
          <div className="flex flex-col items-center justify-center gap-3.5 rounded-2xl border border-rose-500/35 bg-gradient-to-b from-rose-950/40 via-rose-950/20 to-black/60 p-6 text-center shadow-xl shadow-rose-950/30">
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-500/40 bg-rose-500/10 text-rose-400 shadow-lg shadow-rose-500/20">
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-rose-500" />
              </span>
              <Clock className="h-7 w-7 text-rose-400 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-black text-rose-200">
                {copy.cooldownTitle}
              </h3>
              <p className="text-xs text-rose-300/80 leading-relaxed max-w-xs mx-auto">
                {copy.cooldownBody}
              </p>
            </div>
            <div className="mt-1 flex items-center gap-2 rounded-2xl border border-rose-500/50 bg-rose-950/80 px-5 py-2.5 font-mono text-2xl font-black text-rose-300 shadow-inner tracking-wider">
              <Clock className="h-5 w-5 text-rose-400" />
              <span>{formatSecondsToMMSS(cancelCooldown.remainingSeconds)}</span>
            </div>
          </div>
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
