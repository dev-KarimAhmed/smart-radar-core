import React from 'react';
import { RadioTower } from 'lucide-react';
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
        ) : requests.length === 0 ? (
          <StateCard tone="empty" icon={<RadioTower className={styles.style215_30} />} title={copy.noRequestsTitle} body={copy.empty} />
        ) : (
          <div className={styles.style217_31}>
            {sortedRequests.map((request) => {
              const offerCount = pendingOffersCount?.[request.id] ?? (pendingOfferRequestId === request.id ? 1 : 0);
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
