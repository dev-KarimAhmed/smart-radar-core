import type { Offer } from '@/core/types';
import type { RiderLocation } from '../components/rider-map';
import { buildGoogleMapsUrl, isValidCoordinatePair, normalizeExternalMapUrl } from '../../captain/services/ride-location';
import {
  mapRiderMarketplaceError,
} from './rider-marketplace-errors';
import {
  type CaptainPresencePoint,
  type CaptainPresenceQueryInput,
  CAPTAIN_PRESENCE_TTL_MS,
  fetchAvailableCaptainPresence,
  mapCaptainPresenceRow,
  isCaptainPresenceFresh,
  captainRowMatchesPresenceQuery,
} from './captain-presence-service';
import {
  mapRideOfferRow,
  enrichRideOfferRows,
  fetchRowsByIds,
  parseDriverRank,
  firstString,
  firstNumber,
  isRecord,
} from './rider-offer-mapping';

export type {
  CaptainPresencePoint,
  CaptainPresenceQueryInput,
};
export {
  CAPTAIN_PRESENCE_TTL_MS,
  fetchAvailableCaptainPresence,
  mapCaptainPresenceRow,
  isCaptainPresenceFresh,
  captainRowMatchesPresenceQuery,
  mapRiderMarketplaceError,
  mapRideOfferRow,
  enrichRideOfferRows,
  fetchRowsByIds,
  parseDriverRank,
};

type SupabaseRpcLike = {
  rpc: (name: string, args: Record<string, number>) => PromiseLike<{ data: unknown; error: unknown }>;
};

type SupabaseMarketplaceRpcLike = {
  rpc: (name: string, args: Record<string, string | number>) => PromiseLike<{ data: unknown; error: unknown }>;
};

type SupabaseInsertLike = {
  from: (table: string) => {
    insert: (payload: RideRequestInsertPayload) => {
      select: (columns: string) => {
        single: () => PromiseLike<{ data: unknown; error: unknown }>;
      };
    };
  };
};

type SupabaseFromLike = {
  from: (table: string) => any;
};

type SupabaseRealtimeLike = {
  channel: (name: string) => {
    on: (
      type: 'postgres_changes',
      filter: {
        event: 'UPDATE' | 'INSERT' | 'DELETE' | '*';
        schema: 'public';
        table: string;
        filter: string;
      },
      callback: (payload: any) => void
    ) => {
      subscribe: (callback?: (status: string, error?: unknown) => void) => unknown;
    };
    unsubscribe?: () => Promise<unknown> | unknown;
  };
};

export interface ServerFareInput {
  origin: RiderLocation;
  destination: RiderLocation;
  countryId: number;
  roadKm?: number | null;
  durationMinutes?: number | null;
}

export interface RideRequestInsertInput {
  riderId: string;
  origin: RiderLocation;
  pickupAddress?: string;
  pickupGoogleMapsUrl?: string;
  destination: RiderLocation;
  originH3: string;
  destinationH3: string;
  destinationAddressAr: string;
  serverEstimatedFare: number;
  routeDistanceKm?: number;
  routeDurationMinutes?: number;
  countryId: number;
  pricingPreference?: 'FREE' | 'APP' | 'TAXI' | null;
  numberOfRiders?: number;
}

export interface RideRequestInsertPayload {
  rider_id: string;
  origin_lat: number;
  origin_lng: number;
  origin_address: string | null;
  origin_google_maps_url: string;
  estimated_distance_km: number | null;
  estimated_duration_minutes: number | null;
  destination_lat: number;
  destination_lng: number;
  origin_h3: string;
  destination_h3: string;
  destination_address_ar: string;
  server_estimated_fare: number;
  country_id: number;
  status: 'PENDING';
  pricing_preference?: 'FREE' | 'APP' | 'TAXI' | null;
  number_of_riders?: number;
}

export interface RideRequestRow {
  id: string;
  status: string;
  server_estimated_fare?: number;
}

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

function toPositiveMetric(value: number | undefined) {
  return Number.isFinite(value) && Number(value) > 0 ? Number(value) : null;
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
  const { data, error } = await client.rpc('get_passenger_bids', {
    p_request_id: requestId,
  });

  if (error) throw error;
  if (!Array.isArray(data)) return [];

  const enrichedRows = await enrichRideOfferRows(client as unknown as SupabaseFromLike, data as Record<string, unknown>[]);
  return enrichedRows.map(mapRideOfferRow).filter(Boolean) as Offer[];
}

export async function acceptRideOffer(
  client: SupabaseMarketplaceRpcLike,
  input: { requestId: string; offerId: string }
) {
  if (!input.requestId || !input.offerId) {
    throw new Error('ride_offer_id_required');
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
  input: { requestId: string }
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

export function subscribeToRideRequestStatus(
  client: SupabaseRealtimeLike,
  requestId: string,
  onStatus: (row: Record<string, unknown>) => void,
  onError?: (error: unknown) => void
) {
  const channel = client
    .channel(`ride-request-${requestId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'ride_requests',
        filter: `id=eq.${requestId}`,
      },
      (payload) => {
        if (payload.new) {
          onStatus(payload.new);
        }
      }
    )
    .subscribe((status, error) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        onError?.(error || new Error(status));
      }
    });

  let closed = false;

  return () => {
    if (closed) return;
    closed = true;

    const maybeChannel = channel as { unsubscribe?: () => Promise<unknown> | unknown };
    void maybeChannel.unsubscribe?.();
    if (typeof (client as any)?.removeChannel === 'function') {
      try {
        void (client as any).removeChannel(channel);
      } catch {}
    }
  };
}

export function subscribeToRideOffers(
  client: SupabaseRealtimeLike,
  requestId: string,
  onChange: () => void,
  onError?: (error: unknown) => void
) {
  const channel = client
    .channel(`ride-offers-${requestId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'ride_offers',
        filter: `request_id=eq.${requestId}`,
      },
      () => {
        onChange();
      }
    )
    .subscribe((status, error) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        onError?.(error || new Error(status));
      }
    });

  let closed = false;

  return () => {
    if (closed) return;
    closed = true;

    const maybeChannel = channel as { unsubscribe?: () => Promise<unknown> | unknown };
    void maybeChannel.unsubscribe?.();
    if (typeof (client as any)?.removeChannel === 'function') {
      try {
        void (client as any).removeChannel(channel);
      } catch {}
    }
  };
}

function parseServerEstimatedFare(data: unknown) {
  if (typeof data === 'number') return toFiniteNumber(data, 'server_estimated_fare');

  const firstRow = Array.isArray(data) ? data[0] : data;
  const value = (firstRow as { server_estimated_fare?: unknown } | null)?.server_estimated_fare;

  return toFiniteNumber(value, 'server_estimated_fare');
}

function toFiniteNumber(value: unknown, fieldName: string) {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    throw new Error(`invalid_${fieldName}`);
  }

  return numberValue;
}

function toStrictPositiveInteger(value: unknown, fieldName: string) {
  const numberValue = Number(value);
  if (!Number.isInteger(numberValue) || numberValue <= 0) {
    throw new Error(`invalid_${fieldName}`);
  }

  return numberValue;
}
