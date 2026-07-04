import type { Offer } from '@/core/types';
import type { RiderLocation } from './rider-map';
import { cellToLatLng, gridDisk } from 'h3-js';

type SupabaseRpcLike = {
  rpc: (name: string, args: Record<string, number>) => PromiseLike<{ data: unknown; error: unknown }>;
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
      callback: (payload: { new?: Record<string, unknown> }) => void,
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
}

export interface RideRequestInsertInput {
  riderId: string;
  origin: RiderLocation;
  destination: RiderLocation;
  originH3: string;
  destinationH3: string;
  destinationAddressAr: string;
  serverEstimatedFare: number;
  countryId: number;
}

export interface RideRequestInsertPayload {
  rider_id: string;
  origin_lat: number;
  origin_lng: number;
  destination_lat: number;
  destination_lng: number;
  origin_h3: string;
  destination_h3: string;
  destination_address_ar: string;
  server_estimated_fare: number;
  country_id: number;
  status: 'PENDING';
}

export interface RideRequestRow {
  id: string;
  status: string;
  server_estimated_fare?: number;
}

export interface CaptainPresencePoint {
  id: string;
  serial: string;
  h3Cell: string;
  coordinates: RiderLocation;
  updatedAt: string | null;
  etaMinutes?: number;
  rank?: string;
}

export interface CaptainPresenceQueryInput {
  centerH3Cell: string;
  countryId?: number | null;
  nowMs?: number;
  ringSize?: number;
  ttlMs?: number;
}

const CAPTAIN_PRESENCE_TTL_MS = 60_000;

export async function calculateServerFare(client: SupabaseRpcLike, input: ServerFareInput): Promise<number> {
  const args = {
    lat1: toFiniteNumber(input.origin.lat, 'lat1'),
    lng1: toFiniteNumber(input.origin.lng, 'lng1'),
    lat2: toFiniteNumber(input.destination.lat, 'lat2'),
    lng2: toFiniteNumber(input.destination.lng, 'lng2'),
    p_country_id: toStrictPositiveInteger(input.countryId, 'p_country_id'),
  };

  const { data, error } = await client.rpc('calculate_server_fare', args);
  if (error) throw error;

  return parseServerEstimatedFare(data);
}

export function buildRideRequestInsertPayload(input: RideRequestInsertInput): RideRequestInsertPayload {
  return {
    rider_id: input.riderId,
    origin_lat: toFiniteNumber(input.origin.lat, 'origin_lat'),
    origin_lng: toFiniteNumber(input.origin.lng, 'origin_lng'),
    destination_lat: toFiniteNumber(input.destination.lat, 'destination_lat'),
    destination_lng: toFiniteNumber(input.destination.lng, 'destination_lng'),
    origin_h3: input.originH3,
    destination_h3: input.destinationH3,
    destination_address_ar: input.destinationAddressAr,
    server_estimated_fare: toFiniteNumber(input.serverEstimatedFare, 'server_estimated_fare'),
    country_id: toStrictPositiveInteger(input.countryId, 'country_id'),
    status: 'PENDING',
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

  return {
    id: String(row.id),
    status: String(row.status),
    server_estimated_fare:
      typeof row.server_estimated_fare === 'number' ? row.server_estimated_fare : undefined,
  };
}

export async function fetchRideOffers(client: SupabaseFromLike, requestId: string): Promise<Offer[]> {
  const { data, error } = await client
    .from('ride_offers')
    .select('*')
    .eq('request_id', requestId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return Array.isArray(data) ? data.map(mapRideOfferRow).filter(Boolean) as Offer[] : [];
}

export async function cancelRideRequest(client: SupabaseFromLike, requestId: string) {
  const { error } = await client
    .from('ride_requests')
    .update({ status: 'CANCELLED' })
    .eq('id', requestId);

  if (error) throw error;
}

export async function fetchAvailableCaptainPresence(
  client: SupabaseFromLike,
  input: string | CaptainPresenceQueryInput,
): Promise<CaptainPresencePoint[]> {
  const query = typeof input === 'string'
    ? { centerH3Cell: input, ttlMs: CAPTAIN_PRESENCE_TTL_MS, ringSize: 0 }
    : input;
  const nowMs = query.nowMs ?? Date.now();
  const ttlMs = query.ttlMs ?? CAPTAIN_PRESENCE_TTL_MS;
  const staleBeforeIso = new Date(nowMs - ttlMs).toISOString();
  const h3Cells = gridDisk(query.centerH3Cell, query.ringSize ?? 1);
  const h3Columns = ['h3_cell', 'current_h3', 'h3'];
  const availabilityFilters: Array<{ column: string; value: unknown } | null> = [
    { column: 'is_available', value: true },
    { column: 'status', value: 'AVAILABLE' },
    { column: 'status', value: 'available' },
    null,
  ];
  const countryModes = query.countryId ? [true, false] : [false];
  let lastMissingColumnError: unknown = null;

  for (const h3Column of h3Columns) {
    for (const includeCountry of countryModes) {
      for (const availabilityFilter of availabilityFilters) {
        const result = await runCaptainPresenceQuery({
          client,
          h3Column,
          h3Cells,
          availabilityFilter,
          staleBeforeIso,
          countryId: includeCountry ? query.countryId : null,
        });

        if (!result.error) {
          const data = result.data;
          return Array.isArray(data)
            ? data
                .map(mapCaptainPresenceRow)
                .filter((row): row is CaptainPresencePoint => !!row && isCaptainPresenceFresh(row, nowMs, ttlMs))
            : [];
        }

        if (isMissingColumnError(result.error) || isInvalidEnumValueError(result.error)) {
          lastMissingColumnError = result.error;
          continue;
        }

        throw result.error;
      }
    }
  }

  if (lastMissingColumnError) throw lastMissingColumnError;

  return [];
}

export function subscribeToRideRequestStatus(
  client: SupabaseRealtimeLike,
  requestId: string,
  onStatus: (row: Record<string, unknown>) => void,
  onError?: (error: unknown) => void,
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
        if (payload.new) onStatus(payload.new);
      },
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
  };
}

export function subscribeToRideOffers(
  client: SupabaseRealtimeLike,
  requestId: string,
  onChange: () => void,
  onError?: (error: unknown) => void,
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
      () => onChange(),
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
  };
}

export function mapRiderMarketplaceError(error: unknown) {
  const message = `${(error as { message?: string })?.message || error || ''}`.toLowerCase();

  if (message.includes('jwt') || message.includes('permission') || message.includes('auth') || message.includes('rider_id')) {
    return 'لا يمكنك إنشاء هذا الطلب حالياً. يرجى تسجيل الدخول مرة أخرى.';
  }

  if (message.includes('network') || message.includes('fetch') || message.includes('timeout') || message.includes('gateway')) {
    return 'فشل الاتصال بالخدمة. تحقق من الإنترنت ثم حاول مرة أخرى.';
  }

  if (message.includes('calculate_server_fare') || message.includes('server_estimated_fare')) {
    return 'تعذر حساب السعر من الخادم. حاول اختيار الوجهة مرة أخرى.';
  }

  return 'تعذر إرسال طلب الرحلة. حاول مرة أخرى بعد قليل.';
}

function parseServerEstimatedFare(data: unknown) {
  if (typeof data === 'number') return toFiniteNumber(data, 'server_estimated_fare');

  const firstRow = Array.isArray(data) ? data[0] : data;
  const value = (firstRow as { server_estimated_fare?: unknown } | null)?.server_estimated_fare;

  return toFiniteNumber(value, 'server_estimated_fare');
}

function mapRideOfferRow(row: Record<string, unknown>): Offer | null {
  const driverId = firstString(row.driver_id, row.captain_id, row.driverId, row.captainId, row.id);
  const price = firstNumber(row.offer_price, row.price, row.fare, row.server_estimated_fare);

  if (!driverId || price === null) return null;

  const vehicle = (isRecord(row.driver_vehicle) ? row.driver_vehicle : isRecord(row.vehicle) ? row.vehicle : {}) as Record<string, unknown>;

  return {
    driverId,
    price,
    driverName: firstString(row.driver_name, row.captain_name, row.driver_serial, row.captain_serial) || 'سائق',
    driverRating: firstNumber(row.driver_rating, row.captain_rating, row.rating) ?? 5,
    driverRank: parseDriverRank(firstString(row.driver_rank, row.captain_rank, row.rank)),
    driverVehicle: {
      make: firstString(vehicle.make, row.vehicle_make) || 'سيارة',
      color: firstString(vehicle.color, row.vehicle_color) || '',
      year: firstNumber(vehicle.year, row.vehicle_year) ?? undefined,
      plate: firstString(vehicle.plate, row.vehicle_plate) || 'غير متاح',
      type: firstString(vehicle.type, row.vehicle_type) || firstString(vehicle.make, row.vehicle_make) || 'سيارة',
    },
    driverAffiliation: {
      type: firstString(row.affiliation_type) || 'independent',
      name: firstString(row.affiliation_name) || 'مستقل',
      phone: firstString(row.driver_phone, row.captain_phone, row.phone) ?? undefined,
    },
    silencePreference: 'neutral',
  };
}

function mapCaptainPresenceRow(row: Record<string, unknown>): CaptainPresencePoint | null {
  const id = firstString(row.captain_id, row.driver_id, row.user_id, row.id);
  const h3Cell = firstString(row.current_h3, row.h3_cell, row.h3);
  let lat = firstNumber(row.lat, row.latitude, row.current_lat);
  let lng = firstNumber(row.lng, row.longitude, row.current_lng);
  const updatedAt = firstString(row.updated_at, row.updatedAt, row.pulsed_at, row.last_seen_at);

  if (!id || !h3Cell) return null;

  if (lat === null || lng === null) {
    try {
      const [cellLat, cellLng] = cellToLatLng(h3Cell);
      lat = cellLat;
      lng = cellLng;
    } catch {
      return null;
    }
  }

  return {
    id,
    serial: firstString(row.serial, row.captain_serial, row.driver_serial) || id.slice(0, 8),
    h3Cell,
    coordinates: { lat, lng },
    updatedAt,
    etaMinutes: firstNumber(row.eta_minutes, row.etaMinutes) ?? undefined,
    rank: firstString(row.rank, row.driver_rank, row.captain_rank) || undefined,
  };
}

export function isCaptainPresenceFresh(
  captain: Pick<CaptainPresencePoint, 'updatedAt'>,
  nowMs = Date.now(),
  ttlMs = CAPTAIN_PRESENCE_TTL_MS,
) {
  if (!captain.updatedAt) return false;
  const updatedMs = Date.parse(captain.updatedAt);
  return Number.isFinite(updatedMs) && nowMs - updatedMs <= ttlMs;
}

async function runCaptainPresenceQuery({
  client,
  h3Column,
  h3Cells,
  availabilityFilter,
  staleBeforeIso,
  countryId,
}: {
  client: SupabaseFromLike;
  h3Column: string;
  h3Cells: string[];
  availabilityFilter: { column: string; value: unknown } | null;
  staleBeforeIso: string;
  countryId?: number | null;
}) {
  let captainQuery = client
    .from('captain_locations')
    .select('*')
    .in(h3Column, h3Cells)
    .gte('updated_at', staleBeforeIso)
    .limit(50);

  if (availabilityFilter) {
    captainQuery = captainQuery.eq(availabilityFilter.column, availabilityFilter.value);
  }

  if (countryId) {
    captainQuery = captainQuery.eq('country_id', toStrictPositiveInteger(countryId, 'country_id'));
  }

  return captainQuery;
}

function isMissingColumnError(error: unknown) {
  const code = String((error as { code?: unknown })?.code || '');
  const message = String((error as { message?: unknown })?.message || '').toLowerCase();
  return code === '42703' || message.includes('does not exist');
}

function isInvalidEnumValueError(error: unknown) {
  const code = String((error as { code?: unknown })?.code || '');
  const message = String((error as { message?: unknown })?.message || '').toLowerCase();
  return code === '22P02' && message.includes('invalid input value for enum');
}

function parseDriverRank(value: string | null): Offer['driverRank'] {
  const normalized = `${value || ''}`.toLowerCase();
  if (normalized.includes('platinum')) return 'Platinum';
  if (normalized.includes('gold')) return 'Gold';
  if (normalized.includes('silver')) return 'Silver';
  return 'Bronze';
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

function firstNumber(...values: unknown[]) {
  for (const value of values) {
    const numberValue = Number(value);
    if (Number.isFinite(numberValue)) return numberValue;
  }
  return null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
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
