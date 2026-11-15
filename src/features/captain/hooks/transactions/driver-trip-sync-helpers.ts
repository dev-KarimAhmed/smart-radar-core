/**
 * Helper routines for Driver Trip Realtime Sync & Cooldown Calculations.
 */

import { supabase } from '@/lib/supabase-client';
import { getServerTime } from '@/lib/server-time';
import type { Trip } from '@/core/types';
import {
  type RideRequestRow,
} from '../../services/driver-transactions-mapper';
import {
  setCaptainCancelCooldown,
  clearCaptainCancelCooldown,
  calculateRemainingCooldown,
} from '../../services/captain-cancel-cooldown';

export function computeAndApplyCancellationCooldown(
  row?: RideRequestRow | null,
  targetReq?: Trip | null
) {
  const tripMinutes = Math.max(
    1,
    Number(row?.estimated_duration_minutes || targetReq?.estimatedDurationMinutes || targetReq?.estimatedTime) > 0
      ? Math.round(Number(row?.estimated_duration_minutes || targetReq?.estimatedDurationMinutes || targetReq?.estimatedTime))
      : Number(row?.estimated_distance_km || targetReq?.estimatedDistance) > 0
        ? Math.max(5, Math.round(Number(row?.estimated_distance_km || targetReq?.estimatedDistance) * 2.5))
        : 20
  );

  const cancellationTime = (row?.cancelled_at || row?.updated_at || getServerTime()) as string | number | Date;
  const status = String(row?.status || targetReq?.status || '').toUpperCase();
  const isTripActive = status === 'TRIP_ACTIVE' || status === 'IN_PROGRESS';
  const rawStartedAt = (row?.started_at as string | undefined) || targetReq?.startedAtMs;
  const startedAt = isTripActive ? rawStartedAt : null;
  const acceptedAt = (row?.accepted_at as string | undefined) || targetReq?.acceptedAtMs;
  const arrivedAt = (row?.arrived_at as string | undefined) || targetReq?.arrivedAtMs;
  const pickupEta = (row?.pickup_eta_minutes as number | undefined) ?? targetReq?.pickup_eta_minutes;

  const { remainingMinutes, remainingSeconds, scheduledEndTimeMs } = calculateRemainingCooldown({
    totalTripMinutes: tripMinutes,
    startedAtMs: startedAt,
    acceptedAtMs: acceptedAt,
    arrivedAtMs: arrivedAt,
    pickupEtaMinutes: pickupEta,
    cancellationTime,
  });

  if (remainingSeconds > 0) {
    setCaptainCancelCooldown(remainingMinutes, remainingSeconds, scheduledEndTimeMs);
  } else {
    clearCaptainCancelCooldown();
  }

  return { remainingMinutes, remainingSeconds, scheduledEndTimeMs };
}

export async function fetchMountTripState(captainId: string) {
  const { data, error } = await supabase
    .from('ride_requests')
    .select('id, created_at, updated_at, started_at')
    .eq('accepted_captain_id', captainId)
    .not('status', 'in', '("COMPLETED","CANCELLED")')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    try {
      const { data: cancelledRow } = await supabase
        .from('ride_requests')
        .select('id, status, started_at, accepted_at, arrived_at, pickup_eta_minutes, estimated_duration_minutes, estimated_distance_km, cancelled_at, updated_at')
        .eq('accepted_captain_id', captainId)
        .eq('status', 'CANCELLED')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      return { activeTripId: null, cancelledRow: (cancelledRow as RideRequestRow) || null };
    } catch {
      return { activeTripId: null, cancelledRow: null };
    }
  }

  const row = data as Record<string, unknown>;
  const requestId = String(row.id || '');
  const lastTouch = new Date((row.started_at || row.updated_at || row.created_at || 0) as string).getTime();

  if (lastTouch > 0 && Date.now() - lastTouch > 4 * 60 * 60 * 1000) {
    return { activeTripId: null, cancelledRow: null };
  }

  return { activeTripId: requestId, cancelledRow: null };
}
