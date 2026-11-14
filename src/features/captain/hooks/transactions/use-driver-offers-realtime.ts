'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import type { RideOfferRow } from '../../services/driver-transactions-mapper';

interface UseDriverOffersRealtimeParams {
  captainId: string;
  pendingOffersCount: Record<string, number>;
  clearPendingOffer: (tripId?: string | null) => void;
  loadAcceptedRequest: (requestId: string) => Promise<void>;
}

export function useDriverOffersRealtime({
  captainId,
  pendingOffersCount,
  clearPendingOffer,
  loadAcceptedRequest,
}: UseDriverOffersRealtimeParams) {
  // 1. Periodic reconciliation of pending offers on radar
  useEffect(() => {
    const pendingTripIds = Object.keys(pendingOffersCount);
    if (pendingTripIds.length === 0 || !captainId) return;
    let isCancelled = false;

    const checkStillPending = async () => {
      const { data: acceptedRows } = await supabase
        .from('ride_requests')
        .select('id, status, accepted_captain_id')
        .in('id', pendingTripIds)
        .eq('accepted_captain_id', captainId);

      if (isCancelled) return;

      const myAccepted = (acceptedRows || []).find(
        (r: any) => String(r.status || '').toUpperCase() === 'ACCEPTED'
      );

      if (myAccepted?.id) {
        clearPendingOffer();
        try {
          await loadAcceptedRequest(String(myAccepted.id));
        } catch (e) {
          if (process.env.NODE_ENV !== 'production') console.warn('[Driver transactions] loadAcceptedRequest error:', e);
        }
        return;
      }

      const { data: radarRows, error } = await supabase.rpc('get_captain_radar_requests', {
        p_request_ids: pendingTripIds,
        p_limit: 50,
      });

      if (isCancelled || error) return;

      const activeMap = new Map<string, number>();
      for (const row of (radarRows || []) as any[]) {
        if (String(row?.status || '').toUpperCase() !== 'PENDING') continue;
        const createdAt = row.created_at ? new Date(row.created_at).getTime() : 0;
        activeMap.set(String(row.id), createdAt);
      }

      for (const tripId of pendingTripIds) {
        if (!activeMap.has(tripId)) clearPendingOffer(tripId);
      }
    };

    const intervalId = window.setInterval(() => void checkStillPending(), 3_000);
    void checkStillPending();

    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, [pendingOffersCount, captainId, clearPendingOffer, loadAcceptedRequest]);

  // 2. Realtime subscription to ride_offers for this captain
  useEffect(() => {
    if (!captainId) return;

    const channel = supabase
      .channel(`driver-offers-${captainId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'ride_offers', filter: `captain_id=eq.${captainId}` }, (payload) => {
        const row = payload.new as RideOfferRow | undefined;
        if (!row) return;
        const status = String(row.status || '').toUpperCase();
        const requestId = String(row.request_id || '');
        if (status === 'ACCEPTED' && requestId) {
          void loadAcceptedRequest(requestId).catch((error) => {
            if (process.env.NODE_ENV !== 'production') console.warn('[Driver transactions] accepted request load failed:', error);
          });
        }
      })
      .subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, [captainId, loadAcceptedRequest]);
}
