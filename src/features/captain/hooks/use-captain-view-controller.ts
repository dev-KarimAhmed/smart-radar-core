import React from 'react';
import type { Trip } from '@/core/types';
import type { useDriverOperations } from '../hooks/use-driver-operations';
import type { CaptainDashboardAction, CaptainDashboardState } from '../state/captain-state-machine';

type DriverOperations = ReturnType<typeof useDriverOperations>;

interface UseCaptainViewControllerParams {
  user: any;
  driverOps: DriverOperations | null;
  currentTariff: {
    baseFare: number | null;
    pricePerKm: number | null;
    pricePerMin: number | null;
  };
  state: CaptainDashboardState;
  dispatch: React.Dispatch<CaptainDashboardAction>;
  dismissPriceSetup: () => void;
  isStandalone: boolean;
}

export function useCaptainViewController({
  user,
  driverOps,
  currentTariff,
  state,
  dispatch,
  dismissPriceSetup,
  isStandalone,
}: UseCaptainViewControllerParams) {
  const [isInstallModalOpen, setIsInstallModalOpen] = React.useState(false);
  const [isManualPriceSetupOpen, setIsManualPriceSetupOpen] = React.useState(false);
  const [isPendingActivation, setIsPendingActivation] = React.useState(false);
  const [_prefilledOfferPrice, setPrefilledOfferPrice] = React.useState<number | null>(null);
  const [_prefilledPricingMode, setPrefilledPricingMode] = React.useState<'FREE' | 'APP' | 'TAXI' | null>(null);

  // Check pending PWA install prompt
  React.useEffect(() => {
    if (typeof window === 'undefined' || !user) return;
    const pending = localStorage.getItem('radar_pending_pwa_install_prompt');
    if (pending === 'true') {
      localStorage.removeItem('radar_pending_pwa_install_prompt');
      if (!isStandalone) {
        setIsInstallModalOpen(true);
      }
    }
  }, [isStandalone, user]);

  // Security guard: If a captain has 'active' status in DB/state but tariff is incomplete, revert to 'idle'
  React.useEffect(() => {
    const isTariffMissing = currentTariff.baseFare === null || currentTariff.pricePerKm === null || currentTariff.pricePerMin === null;
    if (isTariffMissing && driverOps?.driverStatus === 'active') {
      void driverOps.toggleDriverStatus('idle');
    }
  }, [currentTariff.baseFare, currentTariff.pricePerKm, currentTariff.pricePerMin, driverOps]);

  const handleClosePriceSetup = React.useCallback(() => {
    setIsManualPriceSetupOpen(false);
    setIsPendingActivation(false);
    dismissPriceSetup();
    if (driverOps?.driverStatus === 'active') {
      const isTariffMissing = currentTariff.baseFare === null || currentTariff.pricePerKm === null || currentTariff.pricePerMin === null;
      if (isTariffMissing) {
        void driverOps.toggleDriverStatus('idle');
      }
    }
  }, [dismissPriceSetup, driverOps, currentTariff.baseFare, currentTariff.pricePerKm, currentTariff.pricePerMin]);

  const submitBid = async (price: number, waitSeconds: number, pricingMode?: 'FREE' | 'APP' | 'TAXI') => {
    if (!state.selectedRequest || !driverOps) return;
    const ok = await driverOps.submitOffer({ tripId: state.selectedRequest.id, offerPrice: price, waitSeconds, pricingMode });
    if (ok) dispatch({ type: 'OFFER_SUBMITTED', requestId: state.selectedRequest.id });
  };

  const submitDirectBid = async (request: Trip, price: number, waitSeconds = 120, pricingMode?: 'FREE' | 'APP' | 'TAXI') => {
    if (!driverOps) return;
    const ok = await driverOps.submitOffer({ tripId: request.id, offerPrice: price, waitSeconds, pricingMode });
    if (ok) dispatch({ type: 'OFFER_SUBMITTED', requestId: request.id });
  };

  const selectRequest = (request: Trip, initialPrice?: string | number, pricingMode?: 'FREE' | 'APP' | 'TAXI') => {
    const parsed = initialPrice ? parseFloat(String(initialPrice)) : null;
    setPrefilledOfferPrice(parsed && !isNaN(parsed) && parsed > 0 ? parsed : null);
    setPrefilledPricingMode(pricingMode ?? null);
    dispatch({ type: 'SELECT_REQUEST', request });
  };

  const completeTrip = async () => {
    if (!driverOps) return;
    const trip = driverOps.activeRequest;
    const riderId = trip?.riderId || driverOps.acceptedRider?.uid || '';
    const riderName = driverOps.acceptedRider?.name;
    const requestId = trip?.id || '';
    const ok = await driverOps.endTrip();
    if (!ok) return;
    if (requestId && riderId) {
      dispatch({
        type: 'TRIP_COMPLETED',
        completedTrip: { requestId, riderId, riderName },
      });
    }
  };

  return {
    isInstallModalOpen,
    setIsInstallModalOpen,
    isManualPriceSetupOpen,
    setIsManualPriceSetupOpen,
    isPendingActivation,
    setIsPendingActivation,
    handleClosePriceSetup,
    submitBid,
    submitDirectBid,
    selectRequest,
    completeTrip,
  };
}
