'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { MarketPulse, Trip, User as RiderUser } from '@/core/types';
import { useDriverLifecycle } from './use-driver-lifecycle';
import { useDriverRadar } from './use-driver-radar';
import { useCaptainLocationPulse } from './use-captain-location-pulse';
import { useDriverTransactions } from './use-driver-transactions';
import { sovereignEventBroker } from '@/lib/event-broker';

const styles = {
  root: "",
} as const;


type DriverStatus = 'active' | 'idle' | 'busy' | 'rating';

interface DriverOpsContextType {
  driverStatus: DriverStatus;
  activeRequest: Trip | null;
  acceptedRider: RiderUser | null;
  handshakeAt: number | null;
  pendingOfferRequestId: string | null;
  isDormancyWarningVisible: boolean;
  resetDormancyTimer: () => void;
  submitOffer: (payload: { tripId: string; offerPrice: number }) => Promise<boolean>;
  isSubmittingOffer: boolean;
  markArrivedAtPickup: () => Promise<boolean>;
  startTrip: () => Promise<boolean>;
  isUpdatingTripStep: boolean;
  endTrip: () => Promise<boolean>;
  isEndingTrip: boolean;
  cancelActiveTrip: () => Promise<boolean>;
  isCancellingTrip: boolean;
  rateAndFinishTrip: (rating: number) => Promise<void>;
  isRatingRider: boolean;
  isRequestListOpen: boolean;
  toggleRequestList: (open?: boolean) => void;
  toggleDriverStatus: (desiredStatus: 'active' | 'idle') => Promise<boolean>;
  isUpdatingStatus: boolean;
  requests: Trip[];
  driverLocation: { lat: number; lng: number } | null;
  rejectRequest: (tripId: string) => void;
  rejectedTripIds: string[];
  requestWeeklyReport: () => Promise<void>;
  isRequestingReport: boolean;
  pulseData: MarketPulse[];
  loadingPulse: boolean;
  driverSpeed: number;
  currentDistrict?: string;
  currentH3Cell?: string;
  isDisconnectionLockActive?: boolean;
  radarLockMessage?: string;
}

export const DriverOperationsContext = createContext<DriverOpsContextType | undefined>(undefined);

export function DriverOperationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isRequestListOpen, setListOpen] = useState(false);
  const toggleRequestList = useCallback((open?: boolean) => setListOpen((prev) => open ?? !prev), []);

  const {
    driverStatus,
    setDriverStatus,
    isDormancyWarningVisible,
    isUpdatingStatus,
    resetDormancyTimer,
    toggleDriverStatus: rawToggleDriverStatus,
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
    driverLocation,
    requests,
    rejectRequest: rawRejectRequest,
    rejectedTripIds,
    driverSpeed,
    currentDistrict,
    currentH3Cell,
    isDisconnectionLockActive,
    radarLockMessage,
  } = useDriverRadar(user, driverStatus);

  useCaptainLocationPulse({
    user,
    driverStatus,
    location: driverLocation,
  });

  const rejectRequest = useCallback((tripId: string) => {
    rawRejectRequest(tripId);
  }, [rawRejectRequest]);

  const {
    activeRequest,
    acceptedRider,
    handshakeAt,
    pendingOfferRequestId,
    submitOffer: rawSubmitOffer,
    isSubmittingOffer,
    markArrivedAtPickup: rawMarkArrivedAtPickup,
    startTrip: rawStartTrip,
    isUpdatingTripStep,
    endTrip: rawEndTrip,
    isEndingTrip,
    cancelActiveTrip: rawCancelActiveTrip,
    isCancellingTrip,
    rateAndFinishTrip: rawRateAndFinishTrip,
    isRatingRider,
    requestWeeklyReport: rawRequestWeeklyReport,
    isRequestingReport,
  } = useDriverTransactions(user, setDriverStatus);

  const submitOffer = useCallback(async (payload: { tripId: string; offerPrice: number }) => {
    return rawSubmitOffer(payload);
  }, [rawSubmitOffer]);

  const markArrivedAtPickup = useCallback(async () => {
    return rawMarkArrivedAtPickup();
  }, [rawMarkArrivedAtPickup]);

  const startTrip = useCallback(async () => {
    return rawStartTrip();
  }, [rawStartTrip]);

  const endTrip = useCallback(async () => {
    return rawEndTrip();
  }, [rawEndTrip]);

  const cancelActiveTrip = useCallback(async () => {
    return rawCancelActiveTrip();
  }, [rawCancelActiveTrip]);

  const rateAndFinishTrip = useCallback(async (rating: number) => {
    await rawRateAndFinishTrip(rating);
  }, [rawRateAndFinishTrip]);

  const requestWeeklyReport = useCallback(async () => {
    await rawRequestWeeklyReport();
  }, [rawRequestWeeklyReport]);

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
    isDormancyWarningVisible,
    isUpdatingStatus,
    resetDormancyTimer,
    submitOffer,
    isSubmittingOffer,
    markArrivedAtPickup,
    startTrip,
    isUpdatingTripStep,
    endTrip,
    isEndingTrip,
    cancelActiveTrip,
    isCancellingTrip,
    rateAndFinishTrip,
    isRatingRider,
    isRequestListOpen,
    toggleRequestList,
    toggleDriverStatus,
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
  }), [
    acceptedRider,
    activeRequest,
    cancelActiveTrip,
    currentDistrict,
    currentH3Cell,
    driverLocation,
    driverSpeed,
    driverStatus,
    endTrip,
    handshakeAt,
    pendingOfferRequestId,
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
