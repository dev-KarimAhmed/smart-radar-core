import React from 'react';
import { dexieDb, type RiderTripLedgerEntry } from '@/lib/dexie-db';
import { supabase } from '@/lib/supabase-client';

import { styles } from './history-styles';

export { styles } from './history-styles';

export interface HistoricalTrip {
  tripId: string;
  captainId?: string;
  serialId?: string;
  captainName: string;
  captainRank: 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE';
  captainPhone: string;
  vehicleInfo: string;
  finalPrice: number;
  timestamp: number;
  pickupAddress?: string;
  destinationAddress?: string;
  distanceKm?: number;
  durationMinutes?: number;
  originLat?: number;
  originLng?: number;
  destinationLat?: number;
  destinationLng?: number;
}

export const HISTORY_TTL_MS = 3 * 24 * 60 * 60 * 1000;
export const UNAVAILABLE_FALLBACK = '';

export function normalizeCaptainRank(value: unknown): HistoricalTrip['captainRank'] {
  const normalized = `${value || ''}`.toUpperCase();
  if (normalized.includes('PLATINUM')) return 'PLATINUM';
  if (normalized.includes('GOLD')) return 'GOLD';
  if (normalized.includes('SILVER')) return 'SILVER';
  return 'BRONZE';
}

export function formatVehicleInfo(vehicle: any) {
  if (!vehicle || typeof vehicle !== 'object') return UNAVAILABLE_FALLBACK;
  const parts = [
    vehicle.make,
    vehicle.vehicle_make,
    vehicle.brand,
    vehicle.vehicle_brand,
    vehicle.model,
    vehicle.vehicle_model,
    vehicle.color,
    vehicle.vehicle_color,
    vehicle.plate,
    vehicle.plate_number,
    vehicle.vehicle_plate,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join(' - ') : UNAVAILABLE_FALLBACK;
}

export function isPlainRecord(value: unknown): value is Record<string, any> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function firstHistoryString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return '';
}

export function firstHistoryNumber(...values: unknown[]) {
  for (const value of values) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

export function getCaptainIdFromTrip(trip: any) {
  return firstHistoryString(
    trip?.captain_id,
    trip?.accepted_captain_id,
    trip?.driver_id,
    trip?.captain?.id,
    trip?.captain_profile?.id,
    trip?.metadata?.captain_id,
    trip?.metadata?.captainId,
    trip?.acceptedOffer?.captain_id,
    trip?.acceptedOffer?.captain?.id,
    trip?.acceptedOffer?.driverId
  );
}

export function getHistoryCaptainName(trip: any, acceptedOffer?: any) {
  return firstHistoryString(
    trip?.captain?.full_name,
    trip?.captain?.name,
    trip?.captain_profile?.full_name,
    trip?.metadata?.captain_name,
    trip?.metadata?.captainName,
    acceptedOffer?.driverName,
    acceptedOffer?.captain?.full_name,
    trip?.driver_name,
    trip?.captain_name,
    trip?.driverName
  ) || 'Captain';
}

export function getHistoryCaptainPhone(trip: any, acceptedOffer?: any) {
  return firstHistoryString(
    trip?.captain?.phone,
    trip?.captain?.phone_number,
    trip?.captain_profile?.phone,
    trip?.metadata?.captain_phone,
    trip?.metadata?.captainPhone,
    acceptedOffer?.driverVehicle?.phone,
    acceptedOffer?.captain?.phone,
    trip?.driver_phone,
    trip?.captain_phone,
    trip?.driverPhone
  );
}

export function getHistoryCaptainRank(trip: any, acceptedOffer?: any) {
  return normalizeCaptainRank(
    firstHistoryString(
      trip?.captain_rank,
      trip?.captainRank,
      trip?.captain?.rank,
      trip?.captain?.tier,
      trip?.captain_profile?.rank,
      trip?.captain_profile?.tier,
      trip?.captain_profile?.membership_tier,
      trip?.metadata?.captain_rank,
      trip?.metadata?.captainRank,
      acceptedOffer?.driverRank,
      acceptedOffer?.tier,
      trip?.driver_rank,
      trip?.driverRank
    ) || firstHistoryNumber(trip?.captain?.rating, trip?.captain?.trust_score, acceptedOffer?.driverRating, 5)
  );
}

export function getHistoryVehicleInfo(trip: any, acceptedOffer?: any) {
  const metadata = isPlainRecord(trip?.metadata) ? trip.metadata : {};
  const vehicle = acceptedOffer?.driverVehicle || trip?.driver_vehicle || trip?.vehicle || {};
  const captainProfile = trip?.captain_profile || {};
  const captain = trip?.captain || {};
  const parts = [
    firstHistoryString(
      metadata.vehicle_make,
      metadata.vehicle_brand,
      captainProfile.vehicle_make,
      captainProfile.vehicle_brand,
      captain.vehicle_make,
      captain.vehicle_brand,
      vehicle.make,
      vehicle.vehicle_make,
      vehicle.brand,
      vehicle.vehicle_brand
    ),
    firstHistoryString(
      metadata.vehicle_model,
      captainProfile.vehicle_model,
      captain.vehicle_model,
      vehicle.model,
      vehicle.vehicle_model
    ),
    firstHistoryString(
      metadata.vehicle_color,
      captainProfile.vehicle_color,
      captain.vehicle_color,
      vehicle.color,
      vehicle.vehicle_color
    ),
    firstHistoryString(
      metadata.vehicle_year,
      captainProfile.vehicle_year,
      captain.vehicle_year,
      vehicle.year,
      vehicle.vehicle_year
    ),
    firstHistoryString(
      metadata.vehicle_plate,
      metadata.plate_number,
      captainProfile.vehicle_plate,
      captainProfile.plate_number,
      captain.vehicle_plate,
      captain.plate_number,
      vehicle.plate,
      vehicle.plate_number,
      vehicle.vehicle_plate
    ),
  ].filter(Boolean);

  return parts.length > 0
    ? parts.join(' - ')
    : firstHistoryString(metadata.vehicle_info, metadata.vehicleInfo, trip?.vehicleInfo, formatVehicleInfo(vehicle));
}

export async function fetchSafeCaptainCardsMap(ids: string[]): Promise<Map<string, any> | null> {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  if (uniqueIds.length === 0) return new Map<string, any>();

  try {
    const { data, error } = await supabase.rpc('get_safe_captain_cards', {
      p_captain_ids: uniqueIds,
    });
    if (error || !Array.isArray(data)) return null;
    return new Map(data.map((row: any) => [String(row.id), row]));
  } catch {
    return null;
  }
}

export async function fetchSafeCounterpartProfilesMap(ids: string[]): Promise<Map<string, any> | null> {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  if (uniqueIds.length === 0) return new Map<string, any>();

  try {
    const { data, error } = await supabase.rpc('get_safe_counterpart_profiles', {
      p_user_ids: uniqueIds,
    });
    if (error || !Array.isArray(data)) return null;
    return new Map(data.map((row: any) => [String(row.id), row]));
  } catch {
    return null;
  }
}

export async function fetchRowsByIds(tableName: string, ids: string[]) {
  const uniqueIds = Array.from(new Set(ids.filter(Boolean)));
  if (uniqueIds.length === 0) return new Map<string, any>();

  try {
    const { data, error } = await supabase
      .from(tableName)
      .select('*')
      .in('id', uniqueIds);

    if (error || !data) {
      if (process.env.NODE_ENV !== 'production') console.warn(`[HistoryTab ${tableName} enrichment skipped]`, error);
      return new Map<string, any>();
    }

    return new Map(data.map((row: any) => [row.id, row]));
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') console.warn(`[HistoryTab ${tableName} enrichment failed]`, error);
    return new Map<string, any>();
  }
}

export async function enrichCaptainDetails(rows: any[]) {
  const captainIds = Array.from(new Set(rows.map(getCaptainIdFromTrip).filter(Boolean)));
  if (captainIds.length === 0) return rows;

  const [rpcCardsMap, rpcProfilesMap] = await Promise.all([
    fetchSafeCaptainCardsMap(captainIds),
    fetchSafeCounterpartProfilesMap(captainIds),
  ]);

  let profileMap: Map<string, any>;
  let captainProfileMap: Map<string, any>;

  if (rpcCardsMap !== null || rpcProfilesMap !== null) {
    profileMap = new Map<string, any>();
    captainProfileMap = rpcCardsMap ?? new Map<string, any>();
    for (const cid of captainIds) {
      const card = rpcCardsMap?.get(cid);
      const prof = rpcProfilesMap?.get(cid);
      if (card || prof) {
        profileMap.set(cid, {
          ...(card || {}),
          ...(prof || {}),
          id: cid,
          full_name: firstHistoryString(prof?.full_name, card?.full_name),
          phone: firstHistoryString(prof?.phone),
          rating: prof?.rating ?? card?.rating,
          tier: prof?.tier ?? card?.tier,
          serial_id: prof?.serial_id ?? card?.serial_id,
        });
      }
    }
  } else {
    [profileMap, captainProfileMap] = await Promise.all([
      fetchRowsByIds('profiles', captainIds),
      fetchRowsByIds('captain_profiles', captainIds),
    ]);
  }

  return rows.map((row) => {
    const captainId = getCaptainIdFromTrip(row);
    const profile = captainId ? profileMap.get(captainId) : null;
    const captainProfile = captainId ? captainProfileMap.get(captainId) : null;
    const existingCaptain = isPlainRecord(row?.captain) ? row.captain : {};

    if (!profile && !captainProfile) return row;

    return {
      ...row,
      captain_id: row.captain_id || row.accepted_captain_id || captainId,
      captain: {
        ...existingCaptain,
        ...profile,
        ...(captainProfile ? {
          vehicle_type: captainProfile.vehicle_type,
          vehicle_brand: captainProfile.vehicle_brand,
          vehicle_model: captainProfile.vehicle_model,
          vehicle_color: captainProfile.vehicle_color,
          vehicle_year: captainProfile.vehicle_year,
          plate_number: captainProfile.plate_number,
          employment_type: captainProfile.employment_type,
          contact_page_url: captainProfile.contact_page_url,
          verification_status: captainProfile.verification_status,
        } : {}),
        id: captainId,
        full_name: firstHistoryString(profile?.full_name, existingCaptain.full_name, captainProfile?.full_name),
        phone: firstHistoryString(profile?.phone, existingCaptain.phone, captainProfile?.phone),
      },
      captain_profile: {
        ...(isPlainRecord(row?.captain_profile) ? row.captain_profile : {}),
        ...(captainProfile || {}),
      },
    };
  });
}

export function parseTripTimestamp(trip: any) {
  const raw = trip.completed_at ?? trip.completedAt ?? trip.created_at ?? trip.createdAt ?? trip.timestamp;
  if (typeof raw === 'number') return raw;
  if (raw?.seconds) return raw.seconds * 1000;
  const parsed = Date.parse(String(raw || ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function getTripHistoryId(row: any) {
  return String(row?.id || row?.request_id || row?.tripId || '');
}

export function appendUniqueTrips(existing: any[], incoming: any[]) {
  const seen = new Set(existing.map(getTripHistoryId).filter(Boolean));
  const merged = [...existing];

  for (const row of incoming) {
    const id = getTripHistoryId(row);
    if (!id || seen.has(id)) continue;
    merged.push(row);
    seen.add(id);
  }

  return merged;
}

export function mapLedgerRowToTripShape(row: any, captain?: any, captainProfile?: any, rider?: any) {
  const metadata = row?.metadata && typeof row.metadata === 'object' ? row.metadata : {};
  const vehicleInfo =
    metadata.vehicle_info ||
    metadata.vehicleInfo ||
    metadata.vehicle ||
    [
      metadata.vehicle_make || captainProfile?.vehicle_brand || captain?.vehicle_make || captain?.vehicle_brand,
      metadata.vehicle_model || captainProfile?.vehicle_model || captain?.vehicle_model,
      metadata.vehicle_color || captainProfile?.vehicle_color || captain?.vehicle_color,
      metadata.vehicle_year || captainProfile?.vehicle_year || captain?.vehicle_year,
      metadata.vehicle_plate || metadata.plate_number || captainProfile?.plate_number || captain?.vehicle_plate || captain?.plate_number,
    ]
      .filter(Boolean)
      .join(' - ');

  return {
    id: row.request_id || row.id,
    request_id: row.request_id,
    status: row.status || 'COMPLETED',
    completed_at: row.completed_at,
    created_at: row.completed_at || row.created_at,
    final_fare: row.final_fare,
    captain_id: row.captain_id,
    rider_id: row.rider_id,
    rider: rider || (row.rider_id ? {
      id: row.rider_id,
      full_name: metadata.rider_name || metadata.riderName || '',
    } : null),
    captain: captain || {
      id: row.captain_id,
      full_name: metadata.captain_name || metadata.captainName || 'Captain',
      phone: metadata.captain_phone || metadata.captainPhone || '',
      rating: metadata.captain_rating || metadata.captainRating || 5,
    },
    captain_profile: captainProfile || null,
    captain_rank: metadata.captain_rank || metadata.captainRank || captainProfile?.tier || captainProfile?.rank || captain?.tier || captain?.rank,
    destination_address_ar: metadata.destination_address_ar || metadata.destinationAddressAr || metadata.destination || '',
    destination_address: metadata.destination_address || metadata.destinationAddress || metadata.destination || '',
    metadata: {
      ...metadata,
      vehicle_info: vehicleInfo || UNAVAILABLE_FALLBACK,
    },
  };
}

export function tripShapeToRiderLedgerEntry(trip: any): RiderTripLedgerEntry | null {
  const tripId = getTripHistoryId(trip);
  const timestamp = parseTripTimestamp(trip);
  if (!tripId || !timestamp) return null;

  const acceptedOffer = trip.offers?.find((o: any) => o.driverId === trip.driverId) || trip.acceptedOffer;
  const vehicleInfo = getHistoryVehicleInfo(trip, acceptedOffer);
  const destinationAddress = trip.destination_address_ar || trip.destination_address || trip.destinationAddress || trip.metadata?.destination_address || trip.destination || '';
  const pickupAddress = trip.pickup_address_ar || trip.pickup_address || trip.pickupAddress || trip.origin_address || trip.metadata?.pickup_address_ar || '';
  const distanceKm = trip.distance_km ?? trip.distanceKm ?? (trip.distance_meters ? Number((trip.distance_meters / 1000).toFixed(1)) : undefined);
  const durationMinutes = trip.duration_minutes ?? trip.durationMinutes ?? trip.metadata?.duration_minutes;
  const captainRating = typeof trip.captain?.rating === 'number' ? trip.captain.rating : undefined;

  return {
    tripId,
    captainId: getCaptainIdFromTrip(trip),
    captainName: getHistoryCaptainName(trip, acceptedOffer),
    captainRank: getHistoryCaptainRank(trip, acceptedOffer),
    captainPhone: getHistoryCaptainPhone(trip, acceptedOffer),
    vehicleInfo,
    finalPrice: Number(trip.final_fare ?? trip.settled_fare ?? trip.final_price ?? trip.offer_price ?? trip.server_estimated_fare ?? trip.offerPrice ?? 0),
    timestamp,
    purgeAt: timestamp + HISTORY_TTL_MS,
    destinationAddressAr: destinationAddress,
    pickupAddressAr: pickupAddress,
    distanceKm,
    durationMinutes,
    originLat: trip.origin_lat ?? trip.originLat ?? trip.metadata?.origin_lat,
    originLng: trip.origin_lng ?? trip.originLng ?? trip.metadata?.origin_lng,
    destinationLat: trip.destination_lat ?? trip.destinationLat ?? trip.metadata?.destination_lat,
    destinationLng: trip.destination_lng ?? trip.destinationLng ?? trip.metadata?.destination_lng,
    rating: captainRating,
  };
}

export function formatHistoryMoney(value: number, currencyLabel: string) {
  return currencyLabel ? `${Number(value).toFixed(2)} ${currencyLabel}` : Number(value).toFixed(2);
}

