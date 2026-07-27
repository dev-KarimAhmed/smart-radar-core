'use client';

import { useMemo } from 'react';
import type { User } from '@/core/types';

/**
 * Deprecated compatibility shim.
 *
 * Favorite-driver proximity is now owned by the Supabase captain presence
 * pipeline. This hook intentionally mounts no Firebase listeners.
 */
export function useRiderSidebarRadar() {
  const nearbyFavorites = useMemo<User[]>(() => [], []);

  return { nearbyFavorites, isLoading: false };
}
