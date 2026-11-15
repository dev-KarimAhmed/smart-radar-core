'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import type { Trip, User } from '@/core/types';
import {
  mapRideRequestToTrip,
  type RideRequestRow,
} from '../../services/driver-transactions-mapper';
import {
  computeAndApplyCancellationCooldown,
  fetchMountTripState,
} from './driver-trip-sync-helpers';
import { useDriverOffersRealtime } from './use-driver-offers-realtime';
import { useDriverActiveTripRealtime } from './use-driver-active-trip-realtime';

interface UseDriverTripSyncParams {
  captainId: string;
  driverStatus?: string;
  setDriverStatus?: (status: 'active' | 'idle' | 'busy' | 'rating') => void;
  pendingOffersCount: Record<string, number>;
  clearPendingOffer: (tripId?: string | null) => void;
  activeReqRef: React.MutableRefObject<Trip | null>;
}

export function useDriverTripSync({
  captainId,
  driverStatus,
  setDriverStatus,
  pendingOffersCount,
  clearPendingOffer,
  activeReqRef,
}: UseDriverTripSyncParams) {
  const [activeRequest, setActiveReq] = useState<Trip | null>(null);
  useEffect(() => {
    activeReqRef.current = activeRequest;
  }, [activeRequest, activeReqRef]);

  const [acceptedRider, setAcceptedRider] = useState<User | null>(null);
  const [handshakeAt, setHandshakeAt] = useState<number | null>(null);
  const selfCancelledTripId = useRef<string | null>(null);

  const applyCancellationCooldownFromRequest = useCallback(
    (row?: RideRequestRow | null, fallbackReq?: Trip | null) => {
      const targetReq = fallbackReq || activeReqRef.current;
      return computeAndApplyCancellationCooldown(row, targetReq);
    },
    [activeReqRef]
  );

  const cleanUpAndReset = useCallback(() => {
    setActiveReq(null);
    setAcceptedRider(null);
    setHandshakeAt(null);
    selfCancelledTripId.current = null;
    clearPendingOffer();
    setDriverStatus?.('active');
    if (captainId) {
      void (async () => {
        try {
          await supabase.rpc('set_captain_status', { p_status: 'active' });
        } catch {}
      })();
    }
  }, [captainId, clearPendingOffer, setDriverStatus]);

  const loadAcceptedRequest = useCallback(async (requestId: string) => {
    const { data, error } = await supabase
      .from('ride_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (error) throw error;

    const trip = mapRideRequestToTrip(data as RideRequestRow);
    if (!trip) throw new Error('ride_request_missing_required_fields');

    setActiveReq(trip);
    setHandshakeAt(Date.now());
    clearPendingOffer();
    setDriverStatus?.('busy');

    if (captainId && trip.id) {
      void (async () => {
        try {
          const nowIso = new Date().toISOString();
          await supabase
            .from('ride_offers')
            .update({ status: 'CANCELLED', updated_at: nowIso })
            .eq('captain_id', captainId)
            .neq('request_id', trip.id)
            .eq('status', 'PENDING');
          await supabase
            .from('ride_offers')
            .delete()
            .eq('captain_id', captainId)
            .neq('request_id', trip.id)
            .in('status', ['PENDING', 'CANCELLED']);
        } catch {}
      })();
    }

    if (trip.riderId) {
      let riderRow: Record<string, unknown> | null = null;
      try {
        const { data: rpcProfiles, error: rpcError } = await supabase.rpc('get_safe_counterpart_profiles', {
          p_user_ids: [trip.riderId],
        });
        if (!rpcError && Array.isArray(rpcProfiles) && rpcProfiles.length > 0) {
          riderRow = rpcProfiles[0] as Record<string, unknown>;
        } else if (rpcError) {
          const { data: riderProfile } = await supabase
            .from('profiles')
            .select('id,full_name,phone,rating,country_id,governorate_id,district_id')
            .eq('id', trip.riderId)
            .maybeSingle();
          riderRow = (riderProfile as Record<string, unknown> | null) ?? null;
        }
      } catch {}

      if (riderRow) {
        setAcceptedRider({
          uid: String(riderRow.id),
          role: 'rider',
          name: String(riderRow.full_name || 'Rider'),
          phone: String(riderRow.phone || ''),
          governorate: String(riderRow.governorate_id || ''),
          district: String(riderRow.district_id || ''),
          rating: Number(riderRow.rating || 5),
        });
      }
    }
  }, [captainId, clearPendingOffer, setDriverStatus]);

  useEffect(() => {
    if (driverStatus === 'idle') clearPendingOffer();
  }, [driverStatus, clearPendingOffer]);

  // Hook up realtime offer monitoring
  useDriverOffersRealtime({
    captainId,
    pendingOffersCount,
    clearPendingOffer,
    loadAcceptedRequest,
  });

  // Hook up realtime active trip status monitoring
  useDriverActiveTripRealtime({
    activeRequest,
    setActiveReq,
    selfCancelledTripId,
    applyCancellationCooldownFromRequest,
    cleanUpAndReset,
  });

  // Mount recovery of open trip or cancelled cooldown
  useEffect(() => {
    if (!captainId) return;
    let isCancelled = false;

    void (async () => {
      const { activeTripId, cancelledRow } = await fetchMountTripState(captainId);
      if (isCancelled) return;

      if (activeTripId) {
        try {
          await loadAcceptedRequest(activeTripId);
        } catch (err) {
          if (process.env.NODE_ENV !== 'production') console.warn('[Driver transactions] active trip resync failed:', err);
        }
      } else if (cancelledRow) {
        applyCancellationCooldownFromRequest(cancelledRow, null);
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [captainId, loadAcceptedRequest, applyCancellationCooldownFromRequest]);

  return {
    activeRequest,
    acceptedRider,
    handshakeAt,
    selfCancelledTripId,
    loadAcceptedRequest,
    applyCancellationCooldownFromRequest,
    cleanUpAndReset,
  };
}
