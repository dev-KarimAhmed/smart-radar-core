'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Offer, Trip, User } from '@/core/types';

interface RiderOperationsContextType {
  trip: Trip | null;
  tripStatus: 'idle';
  acceptedDriver: User | null;
  isRequestModalOpen: boolean;
  openRequestModal: () => void;
  closeRequestModal: () => void;
  requestRide: () => Promise<void>;
  isRequesting: boolean;
  cancelTrip: () => Promise<void>;
  isCancelling: boolean;
  rateTrip: (ratings: unknown) => Promise<void>;
  isRating: boolean;
  executeRedPathGuillotine: () => Promise<void>;
  isExecutingGuillotine: boolean;
  confirmCheckpoint: () => Promise<void>;
  isConfirmingCheckpoint: boolean;
  selectOffer: (offer: Offer) => Promise<void>;
  isSelectingOffer: boolean;
  seats: string;
  setSeats: (seats: string) => void;
  dropoff: string;
  setDropoff: (dropoff: string) => void;
  pickup: string;
  setPickup: (link: string) => void;
  requiresOfficialRate: boolean;
  setRequiresOfficialRate: (requires: boolean) => void;
  isResolvingUrl: boolean;
  calculateSovereignMetrics: () => Promise<void>;
  pasteFromClipboard: () => Promise<void>;
  estimatedDistance: number;
  estimatedTime: number;
  pulsedDrivers: never[];
  isPulsing: boolean;
  isLocationConfirmed: boolean;
  resetLocationMetrics: () => void;
  isRadarActive: boolean | null;
}

export const RiderOperationsContext = createContext<RiderOperationsContextType | undefined>(undefined);

const resolvedPromise = () => Promise.resolve();

/**
 * Compatibility facade for old dashboard chrome.
 *
 * The production rider workflow now lives in `RiderViewTab` and its Supabase
 * realtime subscriptions. This provider intentionally does not mount legacy
 * Firestore trip listeners or Firebase transaction hooks.
 */
export function RiderOperationsProvider({ children }: { children: ReactNode }) {
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [seats, setSeats] = useState('1');
  const [dropoff, setDropoff] = useState('');
  const [pickup, setPickup] = useState('');
  const [requiresOfficialRate, setRequiresOfficialRate] = useState(false);

  const openRequestModal = useCallback(() => {
    setIsRequestModalOpen(true);
    window.dispatchEvent(new CustomEvent('rider-open-destination'));
  }, []);

  const closeRequestModal = useCallback(() => {
    setIsRequestModalOpen(false);
  }, []);

  const resetLocationMetrics = useCallback(() => {
    setDropoff('');
    setPickup('');
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem('sovereign_trip_status', 'idle');
      window.dispatchEvent(new CustomEvent('sovereign-status-change', {
        detail: { role: 'rider', status: 'idle' },
      }));
    } catch {
      // Session storage may be unavailable in private or restricted contexts.
    }
  }, []);

  const value = useMemo<RiderOperationsContextType>(() => ({
    trip: null,
    tripStatus: 'idle',
    acceptedDriver: null,
    isRequestModalOpen,
    openRequestModal,
    closeRequestModal,
    requestRide: resolvedPromise,
    isRequesting: false,
    cancelTrip: resolvedPromise,
    isCancelling: false,
    rateTrip: resolvedPromise,
    isRating: false,
    executeRedPathGuillotine: resolvedPromise,
    isExecutingGuillotine: false,
    confirmCheckpoint: resolvedPromise,
    isConfirmingCheckpoint: false,
    selectOffer: resolvedPromise,
    isSelectingOffer: false,
    seats,
    setSeats,
    dropoff,
    setDropoff,
    pickup,
    setPickup,
    requiresOfficialRate,
    setRequiresOfficialRate,
    isResolvingUrl: false,
    calculateSovereignMetrics: resolvedPromise,
    pasteFromClipboard: resolvedPromise,
    estimatedDistance: 0,
    estimatedTime: 0,
    pulsedDrivers: [],
    isPulsing: false,
    isLocationConfirmed: false,
    resetLocationMetrics,
    isRadarActive: true,
  }), [
    closeRequestModal,
    dropoff,
    isRequestModalOpen,
    openRequestModal,
    pickup,
    requiresOfficialRate,
    resetLocationMetrics,
    seats,
  ]);

  return <RiderOperationsContext.Provider value={value}>{children}</RiderOperationsContext.Provider>;
}

export function useRiderOperations() {
  const context = useContext(RiderOperationsContext);
  return context || null;
}
