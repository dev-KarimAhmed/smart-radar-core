'use client';

import React, { createContext, useContext, useRef, useCallback, useEffect, ReactNode } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { trackSovereignError } from '@/lib/error-tracker';

type AdStatsPayload = Record<string, Record<string, { impressions: number; clicks: number }>>;

interface AdStatsContextType {
  logImpression: (adId: string, district: string) => void;
  logClick: (adId: string, district: string) => void;
}

const AdStatsContext = createContext<AdStatsContextType | undefined>(undefined);

const SYNC_INTERVAL = 30 * 1000; // 30 seconds

export function AdStatsProvider({ children }: { children: ReactNode }) {
  const statsRef = useRef<AdStatsPayload>({});

  const syncToServer = useCallback(async () => {
    if (Object.keys(statsRef.current).length === 0) {
      return; // Nothing to sync
    }

    const payload = { ...statsRef.current };
    statsRef.current = {}; // Reset immediately (optimistic update)

    try {
      const functions = getFunctions();
      const syncAdStatsFn = httpsCallable(functions, 'syncAdStats');
      await syncAdStatsFn({ stats: payload });
    } catch (error) {
      trackSovereignError(error, { context: 'AdStatsSync' });
      // Restore on failure to retry later
      statsRef.current = { ...payload, ...statsRef.current };
    }
  }, []);

  // Interval Sync
  useEffect(() => {
    const timer = setInterval(syncToServer, SYNC_INTERVAL);
    return () => {
      clearInterval(timer);
      syncToServer(); // Flush final batch on exit
    };
  }, [syncToServer]);

  // Flush remaining stats before PWA background suspends
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && Object.keys(statsRef.current).length > 0) {
        syncToServer();
      }
    };
    
    const handleBeforeUnload = () => {
      if (Object.keys(statsRef.current).length > 0) {
        syncToServer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [syncToServer]);

  const logImpression = useCallback((adId: string, district: string) => {
    if (!adId || !district) return;
    const cleanDistrict = district.replace(/ /g, '_');
    statsRef.current[adId] = statsRef.current[adId] || {};
    statsRef.current[adId][cleanDistrict] = statsRef.current[adId][cleanDistrict] || { impressions: 0, clicks: 0 };
    statsRef.current[adId][cleanDistrict].impressions += 1;
  }, []);

  const logClick = useCallback((adId: string, district: string) => {
    if (!adId || !district) return;
    const cleanDistrict = district.replace(/ /g, '_');
    statsRef.current[adId] = statsRef.current[adId] || {};
    statsRef.current[adId][cleanDistrict] = statsRef.current[adId][cleanDistrict] || { impressions: 0, clicks: 0 };
    statsRef.current[adId][cleanDistrict].clicks += 1;
  }, []);

  const value = { logImpression, logClick };

  return <AdStatsContext.Provider value={value}>{children}</AdStatsContext.Provider>;
}

export function useAdStats() {
  const context = useContext(AdStatsContext);
  if (!context) {
    throw new Error('useAdStats must be used within an AdStatsProvider');
  }
  return context;
}
