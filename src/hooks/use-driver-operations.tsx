'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode, useEffect } from 'react';
import { useAuth } from './use-auth';
import type { Trip, User as RiderUser, MarketPulse } from '@/core/types';
import { useMarketPulse } from './use-market-pulse';

// 🚩 Import native life segments
import { useDriverLifecycle } from './use-driver-lifecycle';
import { useDriverRadar } from './driver/use-driver-radar';
import { useDriverTransactions } from './driver/use-driver-transactions';

type DriverStatus = 'active' | 'idle' | 'busy' | 'rating';

interface DriverOpsContextType {
  driverStatus: DriverStatus;
  activeRequest: Trip | null;
  acceptedRider: RiderUser | null;
  isDormancyWarningVisible: boolean;
  resetDormancyTimer: () => void;
  submitOffer: (payload: { tripId: string; offerPrice: number; }) => Promise<void>;
  isSubmittingOffer: boolean;
  endTrip: () => Promise<void>;
  isEndingTrip: boolean;
  rateAndFinishTrip: (rating: number) => Promise<void>;
  isRatingRider: boolean;
  isRequestListOpen: boolean;
  toggleRequestList: (open?: boolean) => void;
  toggleDriverStatus: (desiredStatus: 'active' | 'idle') => void;
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
}

export const DriverOperationsContext = createContext<DriverOpsContextType | undefined>(undefined);

export function DriverOperationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  
  const [isRequestListOpen, setListOpen] = useState(false);
  const toggleRequestList = useCallback((open?: boolean) => setListOpen(prev => open ?? !prev), []);

  // 1. Inactivity tracking
  const { 
    driverStatus, setDriverStatus, isDormancyWarningVisible, 
    resetDormancyTimer, toggleDriverStatus, updateDriverDoc 
  } = useDriverLifecycle(user);

  // 2. Local surrounding demand search scanning
  const { 
    driverLocation, requests, rejectRequest, rejectedTripIds, driverSpeed,
    currentDistrict, currentH3Cell, isDisconnectionLockActive
  } = useDriverRadar(user, driverStatus, updateDriverDoc);

  // 3. Transactions & bidding states
  const { 
    activeRequest, acceptedRider, submitOffer: rawSubmitOffer, isSubmittingOffer, 
    endTrip, isEndingTrip, rateAndFinishTrip, isRatingRider, requestWeeklyReport, isRequestingReport 
  } = useDriverTransactions(user, setDriverStatus, updateDriverDoc);
  
  // 4. District surge status
  const { pulseData, loadingPulse } = useMarketPulse(user?.role === 'driver');

  // Submit offer wrapper matching expected properties
  const submitOffer = useCallback(async (payload: { tripId: string; offerPrice: number }) => {
    await rawSubmitOffer(payload, rejectRequest);
  }, [rawSubmitOffer, rejectRequest]);

  // Keep request list tidy during active trip bounds
  useEffect(() => {
    if (driverStatus === 'busy' || driverStatus === 'rating') {
      setListOpen(false);
    }
  }, [driverStatus]);

  const value = useMemo(() => ({
    driverStatus, activeRequest, acceptedRider, isDormancyWarningVisible, isRequestListOpen,
    resetDormancyTimer, submitOffer, isSubmittingOffer, endTrip, isEndingTrip,
    rateAndFinishTrip, isRatingRider, toggleRequestList, toggleDriverStatus, requests, driverLocation,
    rejectRequest, rejectedTripIds, requestWeeklyReport, isRequestingReport,
    pulseData, loadingPulse, driverSpeed, currentDistrict, currentH3Cell, isDisconnectionLockActive
  }), [
    driverStatus, activeRequest, acceptedRider, isDormancyWarningVisible, isRequestListOpen,
    resetDormancyTimer, submitOffer, isSubmittingOffer, endTrip, isEndingTrip,
    rateAndFinishTrip, isRatingRider, toggleRequestList, toggleDriverStatus, requests, driverLocation,
    rejectRequest, rejectedTripIds, requestWeeklyReport, isRequestingReport,
    pulseData, loadingPulse, driverSpeed, currentDistrict, currentH3Cell, isDisconnectionLockActive
  ]);

  return <DriverOperationsContext.Provider value={value}>{children}</DriverOperationsContext.Provider>;
}

export const useDriverOperations = () => {
  const ctx = useContext(DriverOperationsContext);
  if (!ctx) throw new Error('useDriverOperations must be used within a DriverOperationsProvider');
  return ctx;
};
