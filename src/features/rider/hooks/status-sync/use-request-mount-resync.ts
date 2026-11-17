import React from 'react';
import { supabase } from '@/lib/supabase-client';
import { getSupabaseAuthHeaders } from '@/shared/services/supabase-auth-headers';
import type { Offer } from '@/core/types';
import { cancelRideRequest, fetchRideOffers } from '../../services/rider-server-marketplace';
import type { RiderMachineAction } from '../../state/rider-state-machine';

export function useRequestMountResync(params: {
  userId: string | undefined;
  dispatch: React.Dispatch<RiderMachineAction>;
}) {
  const { userId, dispatch } = params;

  React.useEffect(() => {
    if (!userId) {
      dispatch({ type: 'RESET_TO_IDLE' });
      return;
    }

    let isCancelled = false;

    (async () => {
      const { data, error } = await supabase
        .from('ride_requests')
        .select('*')
        .eq('rider_id', userId)
        .not('status', 'in', '("COMPLETED","CANCELLED")')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (isCancelled) return;

      if (error || !data) {
        dispatch({ type: 'RESET_TO_IDLE' });
        return;
      }

      const row = data as Record<string, unknown>;
      const requestId = String(row.id || '');
      if (!requestId) {
        dispatch({ type: 'RESET_TO_IDLE' });
        return;
      }

      const status = String(row.status || '').toUpperCase();
      if (status === 'PENDING' || status === 'RECEIVING_OFFERS') {
        const createdAt = row.created_at ? new Date(row.created_at as string).getTime() : 0;
        const now = Date.now();
        // If the request was created more than 180 seconds (3 minutes) ago, it is expired.
        if (createdAt > 0 && now - createdAt > 180000) {
          void cancelRideRequest(supabase, requestId).catch(() => {});
          dispatch({ type: 'RESET_TO_IDLE' });
          return;
        }
        dispatch({ type: 'REHYDRATE_SEARCHING', requestId, row });
        return;
      }

      // Stale active trip guard: ignore and auto-close abandoned trips from previous sessions (> 4 hours)
      const lastTouch = new Date((row.started_at || row.updated_at || row.created_at || 0) as string).getTime();
      if (lastTouch > 0 && Date.now() - lastTouch > 4 * 60 * 60 * 1000) {
        try {
          const authHeaders = await getSupabaseAuthHeaders({ 'Content-Type': 'application/json' });
          await fetch('/api/trip/mutual-cancel', {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({ requestId, action: 'ACCEPT', role: 'rider' }),
          });
        } catch {}
        dispatch({ type: 'RESET_TO_IDLE' });
        return;
      }

      let offers: Offer[] = [];
      let hydratedCaptain: Record<string, unknown> | null = null;
      try {
        const authHeaders = await getSupabaseAuthHeaders();
        const [fetchedOffers, captainCardRes] = await Promise.all([
          fetchRideOffers(supabase, requestId).catch(() => [] as Offer[]),
          authHeaders.Authorization
            ? fetch(`/api/trip/captain-card?requestId=${encodeURIComponent(requestId)}`, {
                method: 'GET',
                headers: authHeaders,
                cache: 'no-store',
              })
                .then((res) => (res.ok ? res.json() : null))
                .catch(() => null)
            : Promise.resolve(null),
        ]);
        offers = fetchedOffers;
        if (captainCardRes?.success && captainCardRes.captain) {
          hydratedCaptain = captainCardRes.captain as Record<string, unknown>;
        }
      } catch (offersError) {
        if (process.env.NODE_ENV !== 'production') console.warn('[Rider status sync] resync offers fetch failed:', offersError);
      }

      if (isCancelled) return;
      const hydratedRow = hydratedCaptain ? { ...row, captain: hydratedCaptain } : row;
      dispatch({ type: 'REHYDRATE_ACTIVE_TRIP', requestId, row: hydratedRow, offers });
    })();

    return () => {
      isCancelled = true;
    };
  }, [dispatch, userId]);
}

