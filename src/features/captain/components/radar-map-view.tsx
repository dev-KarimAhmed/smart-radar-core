'use client';

import React from 'react';
import type { Trip } from '@/core/types';
import { useAuth } from '@/hooks/use-auth';
import { usePricePerKmSetup } from '../hooks/use-price-per-km-setup';
import { DEFAULT_MAP_CENTER } from '@/shared/services/maplibre-runtime';

import { radarCopy } from './radar/radar-copy';
import { styles } from './radar/radar-map.styles';
import type { RadarMapViewProps } from './radar/radar-map.types';
import { RadarMapCanvas } from './radar/radar-map-canvas';
import { RadarRequestsQueue } from './radar/radar-requests-queue';
import { RadarOfferConfirmModal } from './radar/radar-offer-confirm-modal';
import { useRadarOfferFlow } from './radar/use-radar-offer-flow';
import { useRadarMaplibre } from './radar/use-radar-maplibre';

export type { RadarMapViewProps };

export function RadarMapView({
  language,
  isActive,
  driverLocation,
  paidMinutes,
  bonusMinutes,
  currency = 'JOD',
  radarLockMessage,
  requests,
  pendingOfferRequestId = null,
  pendingOffersCount,
  onCancelOffer,
  isCancellingOffer = false,
  captainPricingMode = null,
  currentTariff = null,
  isOfficeTaxi = false,
  subRole = null,
  onSelectRequest,
  onIgnoreRequest,
  onSubmitDirectBid,
  onEditTariff,
}: RadarMapViewProps) {
  const { user } = useAuth();
  const { currentTariff: hookTariff } = usePricePerKmSetup(user);
  const activeTariff = currentTariff ?? hookTariff;

  const [expandedCardIds, setExpandedCardIds] = React.useState<Record<string, boolean>>({});
  const [cancellingRequestId, setCancellingRequestId] = React.useState<string | null>(null);

  const copy = radarCopy[language];
  const mapContainerRef = React.useRef<HTMLDivElement | null>(null);
  const visibleLocation = driverLocation || DEFAULT_MAP_CENTER;
  const totalMinutes = paidMinutes + bonusMinutes;

  const {
    directPrices,
    setDirectPrices,
    lastSubmittedPrices,
    setLastSubmittedPrices,
    priceErrors,
    setPriceErrors,
    submittingRequestId,
    confirmModalTrip,
    setConfirmModalTrip,
    modalPrice,
    setModalPrice,
    waitSeconds,
    setWaitSeconds,
    handlePastePrice,
    handleInitiateOffer,
    handleConfirmSubmitBid,
  } = useRadarOfferFlow({
    activeTariff,
    captainPricingMode,
    isOfficeTaxi,
    subRole,
    pendingOffersCount,
    pendingOfferRequestId,
    onSubmitDirectBid,
  });

  const { mapIssue, isMapReady, recenter } = useRadarMaplibre({
    mapContainerRef,
    visibleLocation,
    requests,
    onSelectRequest,
  });

  const handleCancelOffer = React.useCallback(async (requestId: string) => {
    if (cancellingRequestId || isCancellingOffer || !onCancelOffer) return;
    setCancellingRequestId(requestId);
    try {
      await onCancelOffer(requestId);
      setLastSubmittedPrices((prev) => {
        const next = { ...prev };
        delete next[requestId];
        return next;
      });
    } finally {
      setCancellingRequestId(null);
    }
  }, [cancellingRequestId, isCancellingOffer, onCancelOffer, setLastSubmittedPrices]);

  const toggleCard = React.useCallback((id: string) => {
    setExpandedCardIds((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const sortedRequests = React.useMemo(() => {
    if (!pendingOfferRequestId || !requests.length) return requests;
    return [...requests].sort((a, b) => {
      if (a.id === pendingOfferRequestId) return -1;
      if (b.id === pendingOfferRequestId) return 1;
      return 0;
    });
  }, [requests, pendingOfferRequestId]);

  return (
    <section className={styles.style144_1}>
      <RadarMapCanvas
        language={language}
        isActive={isActive}
        radarLockMessage={radarLockMessage}
        totalMinutes={totalMinutes}
        isMapReady={isMapReady}
        mapIssue={mapIssue}
        requests={requests}
        copy={copy}
        mapContainerRef={mapContainerRef}
        onSelectRequest={onSelectRequest}
        onRecenter={recenter}
      />

      <RadarRequestsQueue
        language={language}
        currency={currency}
        copy={copy}
        requests={requests}
        sortedRequests={sortedRequests}
        radarLockMessage={radarLockMessage}
        driverLocation={driverLocation}
        activeTariff={activeTariff}
        captainPricingMode={captainPricingMode}
        subRole={subRole}
        isOfficeTaxi={isOfficeTaxi}
        expandedCardIds={expandedCardIds}
        onToggleExpand={toggleCard}
        pendingOffersCount={pendingOffersCount}
        pendingOfferRequestId={pendingOfferRequestId}
        lastSubmittedPrices={lastSubmittedPrices}
        directPrices={directPrices}
        priceErrors={priceErrors}
        submittingRequestId={submittingRequestId}
        cancellingRequestId={cancellingRequestId}
        isCancellingOffer={isCancellingOffer}
        onInitiateOffer={handleInitiateOffer}
        onCancelOffer={handleCancelOffer}
        onIgnoreRequest={onIgnoreRequest}
        onPastePrice={handlePastePrice}
        onUpdateDirectPrice={(tripId, val) => setDirectPrices((prev) => ({ ...prev, [tripId]: val }))}
        onClearPriceError={(tripId) => setPriceErrors((prev) => ({ ...prev, [tripId]: false }))}
        onEditTariff={onEditTariff}
      />

      {confirmModalTrip && (
        <RadarOfferConfirmModal
          language={language}
          currency={currency}
          copy={copy}
          confirmModalTrip={confirmModalTrip}
          modalPrice={modalPrice}
          setModalPrice={setModalPrice}
          waitSeconds={waitSeconds}
          setWaitSeconds={setWaitSeconds}
          submittingRequestId={submittingRequestId}
          lastSubmittedPrices={lastSubmittedPrices}
          onClose={() => setConfirmModalTrip(null)}
          onConfirm={handleConfirmSubmitBid}
        />
      )}
    </section>
  );
}
