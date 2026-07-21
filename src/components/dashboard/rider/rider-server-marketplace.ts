import type { Offer } from '@/core/types';
import type { RiderLocation } from './rider-map';
import { cellToLatLng, gridDisk } from 'h3-js';

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
      callback: (payload: any) => void,
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
  numberOfRiders: number;
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
  number_of_riders: number;
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
    number_of_riders: toStrictPositiveInteger(input.numberOfRiders, 'number_of_riders'),
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
  if (!Array.isArray(data)) return [];

  const enrichedRows = await enrichRideOfferRows(client, data as Record<string, unknown>[]);
  return enrichedRows.map(mapRideOfferRow).filter(Boolean) as Offer[];
}

export async function acceptRideOffer(
  client: SupabaseMarketplaceRpcLike,
  input: { requestId: string; offerId: string },
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

export async function submitRideRating(
  client: SupabaseMarketplaceRpcLike,
  input: { requestId: string; captainId: string; ratingValue: number; comment?: string },
) {
  if (input.comment && (process.env.NODE_ENV !== 'production')) {
    console.log('[Sovereign Feedback Comment]:', input.comment);
  }

  const { data, error } = await client.rpc('submit_ride_rating', {
    p_request_id: input.requestId,
    p_captain_id: input.captainId,
    p_rating_value: toStrictRating(input.ratingValue),
  });

  if (error) throw error;
  return data;
}

export async function cancelRideRequest(client: SupabaseMarketplaceRpcLike, requestId: string) {
  const { error } = await client.rpc('cancel_ride_request', {
    p_request_id: requestId,
  });

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
  const { data, error } = await client
    .from('captain_locations')
    .select('*')
    .gte('updated_at', staleBeforeIso)
    .limit(100);

  if (error) throw error;
  if (!Array.isArray(data)) return [];

  return data
    .filter((row) => captainRowMatchesPresenceQuery(row as Record<string, unknown>, h3Cells, query.countryId))
    .map(mapCaptainPresenceRow)
    .filter((row): row is CaptainPresencePoint => !!row && isCaptainPresenceFresh(row, nowMs, ttlMs));
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
        if (payload.new) {
          if (typeof window !== 'undefined') {
            const audio = new Audio('/sounds/notification.mp3');
            audio.volume = 0.5;
            audio.play().catch((err) => console.log("Audio autoplay blocked until user interaction:", err));
          }
          onStatus(payload.new);
        }
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
      (payload) => {
        const isInsert = payload && (
          payload.eventType === 'INSERT' ||
          payload.eventType === 'insert' ||
          payload.event === 'INSERT' ||
          payload.event === 'insert' ||
          !payload.eventType
        );
        if (isInsert) {
          if (typeof window !== 'undefined') {
            const audio = new Audio('/sounds/notification.mp3');
            audio.volume = 0.5;
            audio.play().catch((err) => console.log("Audio autoplay blocked until user interaction:", err));
          }
        }
        onChange();
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

export function mapRiderMarketplaceError(error: unknown) {
  const typedError = error as { message?: string; code?: string; details?: string; hint?: string };
  const message = [
    typedError?.code,
    typedError?.message,
    typedError?.details,
    typedError?.hint,
    error,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (message.includes('ride_offer_id_required') || message.includes('offer_id_required')) {
    return 'بيانات العرض غير مكتملة. انتظر تحديث العروض ثم حاول مرة أخرى.';
  }

  if (message.includes('ride_offer_not_found')) {
    return 'هذا العرض لم يعد متاحاً. انتظر وصول عرض جديد ثم حاول مرة أخرى.';
  }

  if (message.includes('ride_offer_not_pending')) {
    return 'هذا العرض تم التعامل معه بالفعل. اختر عرضاً آخر إذا كان متاحاً.';
  }

  if (message.includes('ride_request_not_accepting_offers')) {
    return 'لا يمكن قبول العرض الآن لأن حالة الرحلة تغيرت. حدّث العروض ثم حاول مرة أخرى.';
  }

  if (message.includes('not_request_owner')) {
    return 'لا يمكنك تنفيذ هذه العملية لهذا الطلب. سجّل الدخول بالحساب الصحيح ثم حاول مرة أخرى.';
  }

  if (
    message.includes('42501') ||
    message.includes('row-level security') ||
    message.includes('rls') ||
    message.includes('permission denied') ||
    message.includes('permission')
  ) {
    return 'تعذر إنشاء طلب الرحلة بسبب صلاحيات قاعدة البيانات. تأكد من تفعيل سياسة إدخال طلبات الرحلات للراكب.';
  }

  if (message.includes('jwt') || message.includes('auth') || message.includes('rider_id')) {
    return 'لا يمكنك إنشاء هذا الطلب حالياً. يرجى تسجيل الدخول مرة أخرى.';
  }

  if (message.includes('network') || message.includes('fetch') || message.includes('timeout') || message.includes('gateway')) {
    return 'فشل الاتصال بالخدمة. تحقق من الإنترنت ثم حاول مرة أخرى.';
  }

  if (message.includes('calculate_server_fare') || message.includes('server_estimated_fare')) {
    return 'تعذر حساب السعر من الخادم. حاول اختيار الوجهة مرة أخرى.';
  }

  if (
    message.includes('42703') ||
    message.includes('column') ||
    message.includes('destination_address_ar') ||
    message.includes('origin_h3') ||
    message.includes('destination_h3')
  ) {
    return 'جدول طلبات الرحلات لا يحتوي على كل الأعمدة المطلوبة. طبّق تحديث قاعدة البيانات ثم حاول مرة أخرى.';
  }

  if (
    message.includes('22p02') ||
    message.includes('invalid input value for enum') ||
    message.includes('ride_request_status') ||
    message.includes('pending')
  ) {
    return 'قيمة حالة الطلب غير متطابقة مع قاعدة البيانات. تأكد أن حالة الطلب تدعم PENDING بالحروف الكبيرة.';
  }

  if (message.includes('23503') || message.includes('foreign key') || message.includes('country_id')) {
    return 'بيانات الدولة أو الراكب غير متطابقة مع قاعدة البيانات. حدّث الحساب أو اختر الوجهة مرة أخرى.';
  }

  if (message.includes('23505') || message.includes('duplicate') || message.includes('active request')) {
    return 'يوجد طلب رحلة نشط بالفعل لهذا الحساب. أنهِ الطلب الحالي أو ألغِه ثم حاول مرة أخرى.';
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
  const offerId = firstString(row.id, row.offer_id, row.offerId);
  const driverId = firstString(row.driver_id, row.captain_id, row.driverId, row.captainId, row.id);
  const price = firstNumber(row.offer_price, row.price, row.fare, row.server_estimated_fare);

  if (!offerId || !driverId || price === null) return null;

  const profile = (isRecord(row.captain) ? row.captain : {}) as Record<string, unknown>;
  const captainProfile = (isRecord(row.captain_profile) ? row.captain_profile : {}) as Record<string, unknown>;
  const vehicle = (
    isRecord(row.driver_vehicle)
      ? row.driver_vehicle
      : isRecord(row.vehicle)
        ? row.vehicle
        : captainProfile
  ) as Record<string, unknown>;
  const vehicleBrand = firstString(vehicle.brand, vehicle.vehicle_brand, vehicle.make, vehicle.vehicle_make, row.vehicle_brand, row.vehicle_make);
  const vehicleModel = firstString(vehicle.model, vehicle.vehicle_model, row.vehicle_model);
  const vehicleType = firstString(vehicle.type, vehicle.vehicle_type, row.vehicle_type, vehicle.make, row.vehicle_make);
  const vehicleColor = firstString(vehicle.color, vehicle.vehicle_color, row.vehicle_color);
  const vehicleYear = firstNumber(vehicle.year, vehicle.vehicle_year, row.vehicle_year);
  const plate = firstString(vehicle.plate, vehicle.plate_number, vehicle.vehicle_plate, row.plate_number, row.vehicle_plate);
  const affiliationType = firstString(row.affiliation_type, vehicle.employment_type, profile.employment_type) || 'independent';
  const affiliationName = firstString(
    row.affiliation_name,
    vehicle.company_name,
    vehicle.companyName,
    vehicle.company,
    vehicle.officeName,
    vehicle.office_name,
    profile.company_name,
    profile.company,
  ) || (affiliationType === 'independent' ? 'مستقل' : affiliationType);
  const captainPhone = firstString(row.driver_phone, row.captain_phone, row.phone, profile.phone, profile.phone_number);

  const offer: Offer = {
    id: offerId,
    driverId,
    price,
    driverName: firstString(row.driver_name, row.captain_name, profile.full_name, profile.name, row.driver_serial, row.captain_serial, profile.serial_id) || 'سائق',
    driverRating: firstNumber(row.driver_rating, row.captain_rating, row.rating, profile.trust_score, profile.rating, profile.trust_rating) ?? 5,
    driverRank: parseDriverRank(firstString(row.driver_rank, row.captain_rank, row.rank, profile.tier, profile.rank)),
    driverVehicle: {
      make: [vehicleBrand, vehicleModel].filter(Boolean).join(' ') || vehicleType || 'سيارة',
      brand: vehicleBrand || '',
      model: vehicleModel || '',
      color: vehicleColor || '',
      year: vehicleYear ?? undefined,
      plate: plate || 'غير متاح',
      type: vehicleType || 'سيارة',
    },
    driverAffiliation: {
      type: affiliationType,
      name: affiliationName,
      phone: captainPhone ?? undefined,
    },
    silencePreference: 'neutral',
    distance_to_rider: firstNumber(row.distance_to_rider, row.distance) ?? undefined,
    pickup_eta_minutes: firstNumber(row.pickup_eta_minutes, row.eta, row.pickup_eta) ?? undefined,
    estimated_duration_minutes: firstNumber(row.estimated_duration_minutes, row.duration, row.estimated_duration) ?? undefined,
    captain: {
      ...captainProfile,
      ...profile,
      full_name: firstString(profile.full_name, profile.name, row.driver_name, row.captain_name) || undefined,
      phone: captainPhone || undefined,
      tier: firstString(profile.tier, row.driver_rank, row.captain_rank, row.rank) || undefined,
      trust_rating: firstNumber(profile.trust_score, profile.rating, profile.trust_rating, row.driver_rating, row.captain_rating) ?? undefined,
      vehicle_type: vehicleType || undefined,
      vehicle_brand: vehicleBrand || undefined,
      vehicle_model: vehicleModel || undefined,
      vehicle_color: vehicleColor || undefined,
      vehicle_year: vehicleYear ?? undefined,
      plate_number: plate || undefined,
      affiliation_type: affiliationType,
      affiliation_name: affiliationName,
    },
  };

  return offer;
}

async function enrichRideOfferRows(client: SupabaseFromLike, rows: Record<string, unknown>[]) {
  const captainIds = Array.from(
    new Set(rows.map((row) => firstString(row.captain_id, row.driver_id, row.captainId, row.driverId)).filter(Boolean) as string[]),
  );

  if (captainIds.length === 0) return rows;

  const [profileRows, captainProfileRows] = await Promise.all([
    fetchRowsByIds(client, 'profiles', 'id', captainIds),
    fetchRowsByIds(client, 'captain_profiles', 'id', captainIds),
  ]);

  const profileMap = new Map(profileRows.map((row) => [String(row.id), row]));
  const captainProfileMap = new Map(captainProfileRows.map((row) => [String(row.id), row]));

  return rows.map((row) => {
    const captainId = firstString(row.captain_id, row.driver_id, row.captainId, row.driverId);
    return {
      ...row,
      captain: captainId ? profileMap.get(captainId) || row.captain : row.captain,
      captain_profile: captainId ? captainProfileMap.get(captainId) || row.captain_profile : row.captain_profile,
    };
  });
}

async function fetchRowsByIds(
  client: SupabaseFromLike,
  tableName: string,
  idColumn: string,
  ids: string[],
): Promise<Record<string, unknown>[]> {
  try {
    const { data, error } = await client
      .from(tableName)
      .select('*')
      .in(idColumn, ids);

    if (error) throw error;
    return Array.isArray(data) ? data as Record<string, unknown>[] : [];
  } catch (error) {
    if ((process.env.NODE_ENV !== 'production')) {
      console.warn(`[Rider offers] Could not enrich ${tableName}:`, error);
    }
    return [];
  }
}

function mapCaptainPresenceRow(row: Record<string, unknown>): CaptainPresencePoint | null {
  const id = firstString(row.captain_id, row.driver_id, row.user_id, row.id);
  const h3Cell = firstString(row.current_h3, row.h3_cell, row.h3);
  let lat = firstNumber(row.location_lat, row.lat, row.latitude, row.current_lat);
  let lng = firstNumber(row.location_lng, row.lng, row.longitude, row.current_lng);
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

function captainRowMatchesPresenceQuery(
  row: Record<string, unknown>,
  h3Cells: string[],
  countryId?: number | null,
) {
  const h3Cell = firstString(row.current_h3, row.h3_cell, row.h3);
  if (!h3Cell || !h3Cells.includes(h3Cell)) return false;

  const rowCountryId = firstNumber(row.country_id, row.countryId);
  if (countryId && rowCountryId !== null && rowCountryId !== Number(countryId)) return false;
  if (countryId && rowCountryId === null && hasAny(row, 'country_id', 'countryId')) return false;

  if (hasAny(row, 'is_available') && row.is_available !== true) return false;

  const status = firstString(row.status, row.availability_status);
  if (status) {
    const normalized = status.toLowerCase();
    if (!['available', 'active', 'online'].includes(normalized)) return false;
  }

  return true;
}

function hasAny(row: Record<string, unknown>, ...keys: string[]) {
  return keys.some((key) => Object.prototype.hasOwnProperty.call(row, key));
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

function toStrictRating(value: unknown) {
  const numberValue = Number(value);
  if (!Number.isInteger(numberValue) || numberValue < 1 || numberValue > 5) {
    throw new Error('invalid_p_rating_value');
  }

  return numberValue;
}
