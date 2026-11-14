import { latLngToCell } from 'h3-js';
import { supabase } from '@/lib/supabase-client';
import { getSupabaseAuthHeaders } from '@/shared/services/supabase-auth-headers';
import {
  buildRideRequestInsertPayload,
  cancelRideRequest,
  createRideRequest,
} from '../../services/rider-server-marketplace';
import type { RiderDestination } from '../../state/rider-state-machine';
import type { RiderLocation } from '../../components/rider-map';

const H3_RIDER_REQUEST_RESOLUTION = 9;

export async function executeCreateRideRequest(params: {
  userId: string;
  riderLocation: RiderLocation;
  pickupAddress?: string;
  effectiveDestinationCoords: RiderLocation;
  effectiveDraftDestination: RiderDestination;
  currentRouteEstimate: any;
  countryId: number;
  pricingPreference: 'APP' | 'TAXI' | 'FREE' | null;
  effectiveRiderCount: number;
}) {
  const {
    userId,
    riderLocation,
    pickupAddress,
    effectiveDestinationCoords,
    effectiveDraftDestination,
    currentRouteEstimate,
    countryId,
    pricingPreference,
    effectiveRiderCount,
  } = params;

  const payload = buildRideRequestInsertPayload({
    riderId: userId,
    origin: riderLocation,
    pickupAddress,
    destination: effectiveDestinationCoords,
    originH3: effectiveDraftDestination.originCell || latLngToCell(riderLocation.lat, riderLocation.lng, H3_RIDER_REQUEST_RESOLUTION),
    destinationH3:
      effectiveDraftDestination.destinationCell ||
      latLngToCell(effectiveDestinationCoords.lat, effectiveDestinationCoords.lng, H3_RIDER_REQUEST_RESOLUTION),
    destinationAddressAr: effectiveDraftDestination.label,
    serverEstimatedFare: effectiveDraftDestination.serverEstimatedFare ?? 0,
    routeDistanceKm: currentRouteEstimate?.distanceKm ?? effectiveDraftDestination.fareQuote?.estimatedRoadDistanceKm ?? 2,
    routeDurationMinutes: currentRouteEstimate?.durationMinutes ?? Math.max(1, Math.ceil((effectiveDraftDestination.fareQuote?.estimatedRoadDistanceKm ?? 2) * 1.5)),
    countryId,
    pricingPreference: pricingPreference || null,
    numberOfRiders: effectiveRiderCount,
  });

  try {
    return await createRideRequest(supabase, payload);
  } catch (insertError: any) {
    const errorMsg = String(insertError?.message || '') + String(insertError?.code || '') + String(insertError?.details || '');
    const isDuplicateActive =
      insertError?.code === '23505' ||
      errorMsg.includes('unique_active_rider_request') ||
      errorMsg.includes('duplicate');

    if (isDuplicateActive && userId) {
      try {
        const { data: staleRows } = await (supabase as any)
          .from('ride_requests')
          .select('id, status')
          .eq('rider_id', userId)
          .in('status', ['PENDING', 'ACCEPTED', 'ARRIVED', 'TRIP_ACTIVE'])
          .order('created_at', { ascending: false })
          .limit(1);

        const staleId = staleRows?.[0]?.id;
        if (staleId) {
          try {
            await cancelRideRequest(supabase, staleId);
          } catch {
            const authHeaders = await getSupabaseAuthHeaders({ 'Content-Type': 'application/json' });
            await fetch('/api/trip/mutual-cancel', {
              method: 'POST',
              headers: authHeaders,
              body: JSON.stringify({ requestId: staleId, cancelledByRole: 'rider' }),
            }).catch(() => {});
          }
          return await createRideRequest(supabase, payload);
        }
      } catch {
        // Fall through to re-throw original insertError
      }
    }
    throw insertError;
  }
}

