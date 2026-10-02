'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const styles = {
  root: '',
} as const;

export type RiderTripStatus = 'idle' | 'searching' | 'busy' | 'rating' | string;

interface RiderOperationsContextType {
  tripStatus: RiderTripStatus;
  setTripStatus: (status: RiderTripStatus) => void;
}

export const RiderOperationsContext = createContext<RiderOperationsContextType | undefined>(undefined);

/**
 * [ACT-PWA-11] Purged zombie mock promises from RiderOperationsProvider.
 * Now cleanly provides sovereign real-time rider status tracking.
 */
export function RiderOperationsProvider({ children }: { children: ReactNode }) {
  const [tripStatus, setTripStatus] = useState<RiderTripStatus>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = window.localStorage.getItem('radar_rider_trip_status');
        if (saved) return saved;
      } catch {}
    }
    return 'idle';
  });

  useEffect(() => {
    const handleStatusChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ role?: string; status?: string }>;
      if (customEvent.detail?.role === 'rider' && customEvent.detail?.status) {
        const newStatus = customEvent.detail.status;
        setTripStatus(newStatus);
        try {
          window.localStorage.setItem('radar_rider_trip_status', newStatus);
        } catch {}
      }
    };
    window.addEventListener('sovereign-status-change', handleStatusChange);
    return () => window.removeEventListener('sovereign-status-change', handleStatusChange);
  }, []);

  const value = useMemo<RiderOperationsContextType>(() => ({
    tripStatus,
    setTripStatus,
  }), [tripStatus]);

  return (
    <RiderOperationsContext.Provider value={value}>
      {children}
    </RiderOperationsContext.Provider>
  );
}

export function useRiderOperations(): RiderOperationsContextType {
  const context = useContext(RiderOperationsContext);
  if (!context) {
    return {
      tripStatus: 'idle',
      setTripStatus: () => {},
    };
  }
  return context;
}
