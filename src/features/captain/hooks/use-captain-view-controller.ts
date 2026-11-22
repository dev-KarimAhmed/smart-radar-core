import React from 'react';
import type { Trip } from '@/core/types';
import type { useDriverOperations } from '../hooks/use-driver-operations';
import type { CaptainDashboardAction, CaptainDashboardState } from '../state/captain-state-machine';
import {
  getCaptainAdPackage,
  getCaptainOperatingEligibility,
  subscribeCaptainAdPackage,
  type CaptainAdPackage,
} from '../services/captain-ads-package';

type DriverOperations = ReturnType<typeof useDriverOperations>;

interface UseCaptainViewControllerParams {
  user: any;
  driverOps: DriverOperations | null;
  wallet?: any;
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
  wallet,
  currentTariff,
  state,
  dispatch,
  dismissPriceSetup,
  isStandalone,
}: UseCaptainViewControllerParams) {
  const [isInstallModalOpen, setIsInstallModalOpen] = React.useState(false);
  const [isManualPriceSetupOpen, setIsManualPriceSetupOpen] = React.useState(false);
  const [isPendingActivation, setIsPendingActivation] = React.useState(false);
  const [isPackageModalOpen, setIsPackageModalOpen] = React.useState(false);
  const [adPackage, setAdPackage] = React.useState<CaptainAdPackage>(() => getCaptainAdPackage(user?.uid || '', user));
  const [_prefilledOfferPrice, setPrefilledOfferPrice] = React.useState<number | null>(null);
  const [_prefilledPricingMode, setPrefilledPricingMode] = React.useState<'FREE' | 'APP' | 'TAXI' | null>(null);

  const operatingEligibility = React.useMemo(() => {
    return getCaptainOperatingEligibility({
      adPackage,
      totalUsableMinutes: wallet?.totalUsableMinutes ?? 0,
      language: user?.language === 'en' ? 'en' : 'ar',
    });
  }, [adPackage, wallet?.totalUsableMinutes, user]);

  React.useEffect(() => {
    const onPkgUpdated = (e: any) => {
      if (e?.detail?.package) setAdPackage(e.detail.package);
      else setAdPackage(getCaptainAdPackage(user?.uid || '', user));
    };
    window.addEventListener('radar_captain_ad_package_updated', onPkgUpdated);
    return () => window.removeEventListener('radar_captain_ad_package_updated', onPkgUpdated);
  }, [user]);

  // Security guard: If a captain has 'active' status but not eligible or tariff missing, revert to 'idle'
  React.useEffect(() => {
    if (!operatingEligibility.isEligible && driverOps?.driverStatus === 'active') {
      void driverOps.toggleDriverStatus('idle');
    }
  }, [operatingEligibility.isEligible, driverOps]);

  // Check pending PWA install prompt
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const pending = localStorage.getItem('radar_pending_pwa_install_prompt');
    if (pending === 'true') {
      localStorage.removeItem('radar_pending_pwa_install_prompt');
      if (!isStandalone) {
        setIsInstallModalOpen(true);
      }
    }
  }, [isStandalone]);

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

  const handleToggleCaptainStatus = React.useCallback(() => {
    if (driverOps?.driverStatus === 'active') {
      void driverOps.toggleDriverStatus('idle');
      return;
    }
    if (!operatingEligibility.isEligible) {
      setIsPackageModalOpen(true);
      return;
    }
    setIsPendingActivation(true);
  }, [driverOps, operatingEligibility.isEligible]);

  const handleActivatePackage = React.useCallback(() => {
    if (user?.uid) {
      subscribeCaptainAdPackage(user.uid);
    }
    setIsPackageModalOpen(false);
  }, [user?.uid]);

  const handleGoToPayment = React.useCallback(() => {
    setIsPackageModalOpen(false);
    dispatch({ type: 'OPEN_WALLET' });
  }, [dispatch]);

  return {
    isInstallModalOpen,
    setIsInstallModalOpen,
    isManualPriceSetupOpen,
    setIsManualPriceSetupOpen,
    isPendingActivation,
    setIsPendingActivation,
    isPackageModalOpen,
    setIsPackageModalOpen,
    adPackage,
    operatingEligibility,
    handleToggleCaptainStatus,
    handleActivatePackage,
    handleGoToPayment,
    handleClosePriceSetup,
    submitBid,
    submitDirectBid,
    selectRequest,
    completeTrip,
  };
}
