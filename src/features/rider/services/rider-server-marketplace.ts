import type { Offer } from '@/core/types';
import { buildGoogleMapsUrl, isValidCoordinatePair, normalizeExternalMapUrl } from '../../captain/services/ride-location';
import type {
  RideRequestInsertInput,
  RideRequestInsertPayload,
  RideRequestRow,
  ServerFareInput,
  SupabaseFromLike,
  SupabaseInsertLike,
  SupabaseMarketplaceRpcLike,
  SupabaseRpcLike,
} from '../types/rider-marketplace-types';
import {
  parseServerEstimatedFare,
  toFiniteNumber,
  toPositiveMetric,
  toStrictPositiveInteger,
} from './marketplace/rider-marketplace-parsers';
import { enrichRideOfferRows } from './marketplace/rider-offer-enrichment';
import { mapRideOfferRow } from './marketplace/rider-offer-mapper';

// Re-export types
export * from '../types/rider-marketplace-types';

// Re-export sub-module functions and helpers
export * from './marketplace/rider-marketplace-parsers';
export * from './marketplace/rider-captain-presence';
export * from './marketplace/rider-marketplace-errors';
export * from './marketplace/rider-offer-mapper';
export * from './marketplace/rider-offer-enrichment';
export * from './marketplace/rider-marketplace-subscriptions';

export async function calculateServerFare(client: SupabaseRpcLike, input: ServerFareInput): Promise<number> {
  const args: Record<string, number> = {
    lat1: toFiniteNumber(input.origin.lat, 'lat1'),
    lng1: toFiniteNumber(input.origin.lng, 'lng1'),
    lat2: toFiniteNumber(input.destination.lat, 'lat2'),
    lng2: toFiniteNumber(input.destination.lng, 'lng2'),
    p_country_id: toStrictPositiveInteger(input.countryId, 'p_country_id'),
  };

  const roadKm = Number(input.roadKm);
  if (Number.isFinite(roadKm) && roadKm > 0) args.p_road_km = roadKm;

  const durationMinutes = Number(input.durationMinutes);
  if (Number.isFinite(durationMinutes) && durationMinutes > 0) args.p_minutes = durationMinutes;

  const { data, error } = await client.rpc('calculate_server_fare', args);
  if (error) throw error;

  return parseServerEstimatedFare(data);
}

export function buildRideRequestInsertPayload(input: RideRequestInsertInput): RideRequestInsertPayload {
  const originLat = toFiniteNumber(input.origin.lat, 'origin_lat');
  const originLng = toFiniteNumber(input.origin.lng, 'origin_lng');
  const destinationLat = toFiniteNumber(input.destination.lat, 'destination_lat');
  const destinationLng = toFiniteNumber(input.destination.lng, 'destination_lng');
  if (!isValidCoordinatePair(originLat, originLng) || !isValidCoordinatePair(destinationLat, destinationLng)) {
    throw new Error('invalid_ride_coordinates');
  }

  const pickupMapUrl = normalizeExternalMapUrl(input.pickupGoogleMapsUrl) || buildGoogleMapsUrl(originLat, originLng);
  if (!pickupMapUrl) throw new Error('invalid_pickup_map_url');

  return {
    rider_id: input.riderId,
    origin_lat: originLat,
    origin_lng: originLng,
    origin_address: input.pickupAddress?.trim() || null,
    origin_google_maps_url: pickupMapUrl,
    estimated_distance_km: toPositiveMetric(input.routeDistanceKm),
    estimated_duration_minutes: toPositiveMetric(input.routeDurationMinutes),
    destination_lat: destinationLat,
    destination_lng: destinationLng,
    origin_h3: input.originH3,
    destination_h3: input.destinationH3,
    destination_address_ar: input.destinationAddressAr,
    server_estimated_fare: toFiniteNumber(input.serverEstimatedFare, 'server_estimated_fare'),
    country_id: toStrictPositiveInteger(input.countryId, 'country_id'),
    status: 'PENDING',
    pricing_preference: input.pricingPreference || null,
    number_of_riders: input.numberOfRiders && input.numberOfRiders >= 1 ? Math.min(Math.max(1, Math.round(input.numberOfRiders)), 10) : 1,
  };
}

export async function createRideRequest(client: SupabaseInsertLike, payload: RideRequestInsertPayload): Promise<RideRequestRow> {
  const { data, error } = await client
    .from('ride_requests')
    .insert(payload)
    .select('id,status,server_estimated_fare')
    .single();

  if (error) throw error;

  const row = data as Partial<RideRequestRow> | null;
  if (!row?.id || !row.status) {
    throw new Error('ride_request_insert_missing_row');
  }

  const result: RideRequestRow = {
    id: String(row.id),
    status: String(row.status),
    server_estimated_fare:
      typeof row.server_estimated_fare === 'number' ? row.server_estimated_fare : undefined,
  };

  try {
    const ch = (client as any)?.channel?.('public:radar-feed');
    if (ch && typeof ch.send === 'function') {
      void ch.send({
        type: 'broadcast',
        event: 'RIDE_REQUEST_CREATED',
        payload: { requestId: result.id, originH3: payload.origin_h3 },
      });
    }
  } catch {}

  return result;
}

export async function fetchRideOffers(client: SupabaseMarketplaceRpcLike, requestId: string): Promise<Offer[]> {
  let rows: Record<string, unknown>[] | null = null;

  if (typeof window !== 'undefined' && typeof fetch === 'function') {
    try {
      const { getSupabaseAuthHeaders } = await import('@/shared/services/supabase-auth-headers');
      const headers = await getSupabaseAuthHeaders();
      if (headers.Authorization) {
        const res = await fetch(`/api/trip/offers?requestId=${encodeURIComponent(requestId)}`, {
          method: 'GET',
          headers,
          cache: 'no-store',
        });
        const json = await res.json().catch(() => null);
        if (res.ok && json?.success && Array.isArray(json.offers)) {
          rows = json.offers as Record<string, unknown>[];
        } else if (res.status >= 400 && res.status < 500 && typeof json?.error === 'string' && json.error) {
          throw new Error(json.error);
        }
      }
    } catch (err) {
      if (err instanceof Error && (err.message === 'not_request_owner' || err.message === 'valid_request_id_required')) {
        throw err;
      }
    }
  }

  if (rows === null) {
    const { data, error } = await client.rpc('get_passenger_bids', {
      p_request_id: requestId,
    });

    if (error) throw error;
    if (!Array.isArray(data)) return [];
    rows = data as Record<string, unknown>[];
  }

  if (!Array.isArray(rows) || rows.length === 0) return [];

  const enrichedRows = await enrichRideOfferRows(client as unknown as SupabaseFromLike, rows);
  return enrichedRows.map(mapRideOfferRow).filter(Boolean) as Offer[];
}

export async function acceptRideOffer(
  client: SupabaseMarketplaceRpcLike,
  input: { requestId: string; offerId: string },
) {
  if (!input.requestId || !input.offerId) {
    throw new Error('ride_offer_id_required');
  }

  if (typeof window !== 'undefined' && typeof fetch === 'function') {
    try {
      const { getSupabaseAuthHeaders } = await import('@/shared/services/supabase-auth-headers');
      const headers = await getSupabaseAuthHeaders({ 'Content-Type': 'application/json' });
      if (headers.Authorization) {
        const res = await fetch('/api/trip/accept-offer', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            requestId: input.requestId,
            offerId: input.offerId,
          }),
        });
        const json = await res.json().catch(() => null);
        if (res.ok && json?.success) {
          return json.data;
        }
        if (typeof json?.error === 'string' && json.error && json.error !== 'internal_server_error') {
          throw new Error(json.error);
        }
        if (res.status >= 400 && res.status < 500) {
          throw new Error('accept_offer_failed');
        }
      }
    } catch (err) {
      if (err instanceof Error && !/failed to fetch|networkerror|network request failed/i.test(err.message)) {
        throw err;
      }
    }
  }

  const { data, error } = await client.rpc('accept_ride_offer', {
    p_request_id: input.requestId,
    p_offer_id: input.offerId,
  });

  if (error) throw error;
  return data;
}

export async function completeRideTrip(
  client: SupabaseMarketplaceRpcLike,
  input: { requestId: string },
) {
  const { data, error } = await client.rpc('complete_ride_trip', {
    p_request_id: input.requestId,
  });

  if (error) throw error;
  return data;
}

export async function fetchRideRequestStatus(client: SupabaseFromLike, requestId: string) {
  const { data, error } = await client
    .from('ride_requests')
    .select('id,status,completed_at,cancelled_at,updated_at')
    .eq('id', requestId)
    .maybeSingle();

  if (error) throw error;
  return data as Record<string, unknown> | null;
}

export async function cancelRideRequest(client: SupabaseMarketplaceRpcLike, requestId: string) {
  const { error } = await client.rpc('cancel_ride_request', {
    p_request_id: requestId,
  });

  if (error) throw error;
}
