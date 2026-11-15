'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { MarketPulse } from '@/core/types';
import { useDriverLifecycle } from './use-driver-lifecycle';
import { useDriverRadar } from './use-driver-radar';
import { useCaptainLocationPulse } from './use-captain-location-pulse';
import { useCaptainRadarMinuteConsumption } from './use-captain-radar-minute-consumption';
import { useDriverTransactions } from './use-driver-transactions';
import { sovereignEventBroker } from '@/lib/event-broker';
import type {
  DriverStatus,
  DriverOpsContextType,
} from '../types/driver-operations-types';
import { useDriverOperationsActions } from './use-driver-operations-actions';

export type { DriverStatus, DriverOpsContextType };

export const DriverOperationsContext = createContext<DriverOpsContextType | undefined>(undefined);

export function DriverOperationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isRequestListOpen, setListOpen] = useState(false);
  const toggleRequestList = useCallback((open?: boolean) => setListOpen((prev) => open ?? !prev), []);

  const {
    driverStatus,
    accountSecurityStatus,
    setDriverStatus,
    isDormancyWarningVisible,
    isUpdatingStatus,
    resetDormancyTimer,
    toggleDriverStatus: rawToggleDriverStatus,
    activationNonce,
    updateDriverDoc,
  } = useDriverLifecycle(user);

  useEffect(() => {
    const unsubStatus = sovereignEventBroker.on('DRIVER_STATUS_CHANGE', (status) => {
      setDriverStatus(status);
    });
    const unsubDoc = sovereignEventBroker.on('DRIVER_DOC_UPDATE', (data) => {
      void updateDriverDoc(data);
    });
    return () => {
      unsubStatus();
      unsubDoc();
    };
  }, [setDriverStatus, updateDriverDoc]);

  const toggleDriverStatus = useCallback((desiredStatus: 'active' | 'idle') => {
    return rawToggleDriverStatus(desiredStatus);
  }, [rawToggleDriverStatus]);

  const {
    activeRequest,
    acceptedRider,
    handshakeAt,
    pendingOfferRequestId,
    pendingOffersCount,
    submitOffer: rawSubmitOffer,
    isSubmittingOffer,
    cancelOffer: rawCancelOffer,
    isCancellingOffer,
    markArrivedAtPickup: rawMarkArrivedAtPickup,
    startTrip: rawStartTrip,
    isUpdatingTripStep,
    endTrip: rawEndTrip,
    isEndingTrip,
    cancelActiveTrip: rawCancelActiveTrip,
    acknowledgeMutualCancel: rawAcknowledgeMutualCancel,
    isCancellingTrip,
    rateAndFinishTrip: rawRateAndFinishTrip,
    isRatingRider,
    requestWeeklyReport: rawRequestWeeklyReport,
    isRequestingReport,
  } = useDriverTransactions(user, setDriverStatus, driverStatus);

  const pendingTripIds = useMemo(() => {
    return Object.keys(pendingOffersCount || {});
  }, [pendingOffersCount]);

  const {
    driverLocation,
    requests,
    rejectRequest: rawRejectRequest,
    rejectedTripIds,
    driverSpeed,
    currentDistrict,
    currentH3Cell,
    isDisconnectionLockActive,
    radarLockMessage,
    cancelCooldown,
  } = useDriverRadar(user, driverStatus, pendingTripIds);

  useCaptainLocationPulse({
    user,
    driverStatus,
    location: driverLocation,
  });

  useCaptainRadarMinuteConsumption({
    user,
    driverStatus,
    onBundleExhausted: () => setDriverStatus('idle'),
  });

  const {
    rejectRequest,
    submitOffer,
    cancelOffer,
    markArrivedAtPickup,
    startTrip,
    endTrip,
    cancelActiveTrip,
    acknowledgeMutualCancel,
    rateAndFinishTrip,
    requestWeeklyReport,
  } = useDriverOperationsActions({
    rawSubmitOffer,
    rawCancelOffer,
    rawMarkArrivedAtPickup,
    rawStartTrip,
    rawEndTrip,
    rawCancelActiveTrip,
    rawAcknowledgeMutualCancel,
    rawRateAndFinishTrip,
    rawRequestWeeklyReport,
    rawRejectRequest,
  });

  const pulseData = useMemo<MarketPulse[]>(() => [], []);
  const loadingPulse = false;

  useEffect(() => {
    if (driverStatus === 'busy' || driverStatus === 'rating') {
      setListOpen(false);
    }
  }, [driverStatus]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.setItem('radar_driver_status', String(driverStatus));
      window.dispatchEvent(new CustomEvent('radar-status-change', {
        detail: { role: 'driver', status: driverStatus },
      }));
    } catch {
      // Non-critical UI broadcast only.
    }
  }, [driverStatus]);

  const value = useMemo<DriverOpsContextType>(() => ({
    driverStatus,
    activeRequest,
    acceptedRider,
    handshakeAt,
    pendingOfferRequestId,
    pendingOffersCount,
    isDormancyWarningVisible,
    isUpdatingStatus,
    resetDormancyTimer,
    submitOffer,
    isSubmittingOffer,
    cancelOffer,
    isCancellingOffer,
    markArrivedAtPickup,
    startTrip,
    isUpdatingTripStep,
    endTrip,
    isEndingTrip,
    cancelActiveTrip,
    acknowledgeMutualCancel,
    isCancellingTrip,
    rateAndFinishTrip,
    isRatingRider,
    isRequestListOpen,
    toggleRequestList,
    toggleDriverStatus,
    activationNonce,
    requests,
    driverLocation,
    rejectRequest,
    rejectedTripIds,
    requestWeeklyReport,
    isRequestingReport,
    pulseData,
    loadingPulse,
    driverSpeed,
    currentDistrict,
    currentH3Cell,
    isDisconnectionLockActive,
    radarLockMessage,
    cancelCooldown,
    accountSecurityStatus,
  }), [
    acceptedRider,
    accountSecurityStatus,
    acknowledgeMutualCancel,
    activationNonce,
    activeRequest,
    cancelActiveTrip,
    cancelCooldown,
    cancelOffer,
    currentDistrict,
    currentH3Cell,
    driverLocation,
    driverSpeed,
    driverStatus,
    endTrip,
    handshakeAt,
    pendingOfferRequestId,
    pendingOffersCount,
    isCancellingOffer,
    isCancellingTrip,
    isDisconnectionLockActive,
    isDormancyWarningVisible,
    isEndingTrip,
    isRatingRider,
    isRequestListOpen,
    isRequestingReport,
    isSubmittingOffer,
    isUpdatingStatus,
    isUpdatingTripStep,
    loadingPulse,
    markArrivedAtPickup,
    pulseData,
    rateAndFinishTrip,
    rejectRequest,
    rejectedTripIds,
    requestWeeklyReport,
    requests,
    resetDormancyTimer,
    submitOffer,
    startTrip,
    toggleDriverStatus,
    toggleRequestList,
  ]);

  return <DriverOperationsContext.Provider value={value}>{children}</DriverOperationsContext.Provider>;
}

export const useDriverOperations = () => {
  const ctx = useContext(DriverOperationsContext);
  return ctx || null;
};
