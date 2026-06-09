'use client';

import { useState, useEffect, useMemo } from 'react';
import { collection, query, where, onSnapshot, documentId } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from './use-auth';
import type { User } from '@/core/types';
import { getSurroundingGridIds } from '@/lib/geo-grid';
import { trackSovereignError } from '@/lib/error-tracker';

/**
 * [Sovereign Rider Sidebar Radar]
 * يراقب تواجد الفرسان المفضلين النشطين في المربعات المجاورة المحيطة بالراكب.
 */
export function useRiderSidebarRadar() {
  const { user } = useAuth();
  const [nearbyFavorites, setNearbyFavorites] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Memoize favorite IDs to prevent re-renders from array reference changes
  const favoriteIds = useMemo(() => user?.favoriteDrivers || [], [user?.favoriteDrivers]);

  useEffect(() => {
    // This hook is only for riders with favorite drivers.
    if (user?.role !== 'rider' || favoriteIds.length === 0) {
      setIsLoading(false);
      setNearbyFavorites([]);
      return;
    }

    let unsubscribe = () => {};
    let isMounted = true;
    setIsLoading(true);

    const getRadarPositions = (lat: number, lng: number) => {
        if (!isMounted) return;

        const riderSurroundingGrids = getSurroundingGridIds(lat, lng);
        
        // Fetch all favorite drivers active in those grid segments
        const q = query(
          collection(db, 'users'),
          where(documentId(), 'in', favoriteIds)
        );

        unsubscribe = onSnapshot(q, 
          (snapshot) => {
            const allFavorites = snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User));
            const nearby = allFavorites.filter(driver => 
              driver.gridId && riderSurroundingGrids.includes(driver.gridId)
            );
            setNearbyFavorites(nearby);
            setIsLoading(false);
          },
          (error) => {
            trackSovereignError(error, { context: 'RiderSidebarRadar' });
            setIsLoading(false);
          }
        );
    };

    // Attempt current positioning with central Amman fallback
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
           getRadarPositions(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
           trackSovereignError(error, { context: 'RiderSidebarRadar_GPS' });
           // Fallback to central Amman
           getRadarPositions(31.95, 35.91);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    } else {
      getRadarPositions(31.95, 35.91);
    }

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [user?.role, favoriteIds]);

  return { nearbyFavorites, isLoading };
}
