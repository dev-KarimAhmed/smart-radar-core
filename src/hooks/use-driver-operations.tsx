'use client';

import React, { createContext, useContext, useState, useCallback, useMemo, ReactNode, useEffect } from 'react';
import { useAuth } from './use-auth';
import type { Trip, User as RiderUser, MarketPulse } from '@/core/types';
import { useMarketPulse } from './use-market-pulse';

// 🚩 Import native life segments
import { useDriverLifecycle } from './use-driver-lifecycle';
import { useDriverRadar } from './driver/use-driver-radar';
import { useDriverTransactions } from './driver/use-driver-transactions';
import { sovereignEventBroker } from '@/lib/event-broker';
import { logAuditAction } from '@/lib/audit-logger';

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
    resetDormancyTimer, toggleDriverStatus: rawToggleDriverStatus, updateDriverDoc 
  } = useDriverLifecycle(user);

  const toggleDriverStatus = useCallback((desiredStatus: 'active' | 'idle') => {
    rawToggleDriverStatus(desiredStatus);
    if (user?.uid) {
      logAuditAction({
        actorId: user.uid,
        actorName: user.name || 'Unknown Driver',
        actorRole: 'driver',
        action: 'DRIVER_STATUS_CHANGE',
        securityClearance: 'INFO',
        details: {
          previousStatus: driverStatus,
          desiredStatus
        }
      });
    }
  }, [rawToggleDriverStatus, user, driverStatus]);

  // 🔔 [الربط النسيجي عبر وسيط الأحداث السيادي]: الربط والاقتران الضعيف لمنع التداخل والسباغيتي
  useEffect(() => {
    const unsubStatus = sovereignEventBroker.on('DRIVER_STATUS_CHANGE', (status) => {
      setDriverStatus(status);
    });
    const unsubDoc = sovereignEventBroker.on('DRIVER_DOC_UPDATE', (data) => {
      updateDriverDoc(data);
    });
    return () => {
      unsubStatus();
      unsubDoc();
    };
  }, [setDriverStatus, updateDriverDoc]);

  // 2. Local surrounding demand search scanning (Loosely Coupled - Communicates via SovereignEventBroker)
  const { 
    driverLocation, requests, rejectRequest: rawRejectRequest, rejectedTripIds, driverSpeed,
    currentDistrict, currentH3Cell, isDisconnectionLockActive
  } = useDriverRadar(user, driverStatus);

  const rejectRequest = useCallback((tripId: string) => {
    rawRejectRequest(tripId);
    if (user?.uid) {
      logAuditAction({
        actorId: user.uid,
        actorName: user.name || 'Unknown Driver',
        actorRole: 'driver',
        action: 'DRIVER_REJECT_REQUEST',
        securityClearance: 'INFO',
        details: {
          tripId
        }
      });
    }
  }, [rawRejectRequest, user]);

  // 3. Transactions & bidding states (Loosely Coupled - Communicates via SovereignEventBroker)
  const { 
    activeRequest, acceptedRider, submitOffer: rawSubmitOffer, isSubmittingOffer, 
    endTrip: rawEndTrip, isEndingTrip, rateAndFinishTrip: rawRateAndFinishTrip, isRatingRider, requestWeeklyReport: rawRequestWeeklyReport, isRequestingReport 
  } = useDriverTransactions(user);

  const endTrip = useCallback(async () => {
    await rawEndTrip();
    if (user?.uid) {
      await logAuditAction({
        actorId: user.uid,
        actorName: user.name || 'Unknown Driver',
        actorRole: 'driver',
        action: 'DRIVER_END_TRIP',
        securityClearance: 'INFO',
        details: {
          tripId: activeRequest?.id || 'unknown'
        }
      });
    }
  }, [rawEndTrip, user, activeRequest]);

  const rateAndFinishTrip = useCallback(async (rating: number) => {
    await rawRateAndFinishTrip(rating);
    if (user?.uid) {
      await logAuditAction({
        actorId: user.uid,
        actorName: user.name || 'Unknown Driver',
        actorRole: 'driver',
        action: 'DRIVER_RATE_RIDER',
        securityClearance: 'INFO',
        details: {
          tripId: activeRequest?.id || 'unknown',
          riderId: acceptedRider?.uid || 'unknown',
          rating
        }
      });
    }
  }, [rawRateAndFinishTrip, user, activeRequest, acceptedRider]);

  const requestWeeklyReport = useCallback(async () => {
    await rawRequestWeeklyReport();
    if (user?.uid) {
      await logAuditAction({
        actorId: user.uid,
        actorName: user.name || 'Unknown Driver',
        actorRole: 'driver',
        action: 'DRIVER_REQUEST_WEEKLY_REPORT',
        securityClearance: 'INFO',
        details: {}
      });
    }
  }, [rawRequestWeeklyReport, user]);
  
  // 4. District surge status
  const { pulseData, loadingPulse } = useMarketPulse(user?.role === 'driver');

  // Submit offer wrapper matching expected properties
  const submitOffer = useCallback(async (payload: { tripId: string; offerPrice: number }) => {
    await rawSubmitOffer(payload, rejectRequest);
    if (user?.uid) {
      await logAuditAction({
        actorId: user.uid,
        actorName: user.name || 'Unknown Driver',
        actorRole: 'driver',
        action: 'DRIVER_SUBMIT_OFFER',
        securityClearance: 'INFO',
        details: {
          tripId: payload.tripId,
          offerPrice: payload.offerPrice
        }
      });
    }
  }, [rawSubmitOffer, rejectRequest, user]);

  // Keep request list tidy during active trip bounds
  useEffect(() => {
    if (driverStatus === 'busy' || driverStatus === 'rating') {
      setListOpen(false);
    }
  }, [driverStatus]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('sovereign_driver_status', String(driverStatus));
        window.dispatchEvent(new CustomEvent('sovereign-status-change', {
          detail: { role: 'driver', status: driverStatus }
        }));
      } catch (e) {
        console.error("Failed to update sovereign_driver_status in sessionStorage/dispatchEvent:", e);
      }
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
  return ctx || null;
};
