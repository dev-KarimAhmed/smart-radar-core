'use client';

import { useEffect, useState } from 'react';
import { dexieDb } from '@/lib/dexie-db';
import type { User } from '@/core/types';

export function useRiderSidebarRadar() {
  const [nearbyFavorites, setNearbyFavorites] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    dexieDb.favoriteCaptains.toArray()
      .then((rows) => {
        if (!active) return;
        const mapped: User[] = rows.map((row) => ({
          uid: String(row.captainId || row.id || row.tripId),
          name: row.captainName || 'كابتن',
          phone: row.captainPhone || '',
          role: 'driver',
          status: 'active',
          vehicle: row.vehicleInfo ? { make: row.vehicleInfo } : undefined,
        } as User));
        setNearbyFavorites(mapped);
      })
      .catch(() => {
        if (active) setNearbyFavorites([]);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { nearbyFavorites, isLoading };
}
