import { cellToLatLng, gridDisk } from 'h3-js';
import type { RiderLocation } from '../components/rider-map';

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

export const CAPTAIN_PRESENCE_TTL_MS = 60_000;

export async function fetchAvailableCaptainPresence(
  client: { from: (table: string) => any },
  input: string | CaptainPresenceQueryInput
): Promise<CaptainPresencePoint[]> {
  const query = typeof input === 'string'
    ? { centerH3Cell: input, ttlMs: CAPTAIN_PRESENCE_TTL_MS, ringSize: 0 }
    : input;
  const nowMs = query.nowMs ?? Date.now();
  const ttlMs = query.ttlMs ?? CAPTAIN_PRESENCE_TTL_MS;
  const staleBeforeIso = new Date(nowMs - ttlMs).toISOString();
  const ringSize = Math.min(Math.max(query.ringSize ?? 4, 0), 7);
  const h3Cells = gridDisk(query.centerH3Cell, ringSize);
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
    .filter((row): row is CaptainPresencePoint => !!row && isCaptainPresenceFresh(row, nowMs, ttlMs))
    .sort((a, b) => (Date.parse(b.updatedAt || '0') || 0) - (Date.parse(a.updatedAt || '0') || 0))
    .slice(0, 9);
}

export function mapCaptainPresenceRow(row: Record<string, unknown>): CaptainPresencePoint | null {
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
  ttlMs = CAPTAIN_PRESENCE_TTL_MS
) {
  if (!captain.updatedAt) return false;
  const updatedMs = Date.parse(captain.updatedAt);
  return Number.isFinite(updatedMs) && nowMs - updatedMs <= ttlMs;
}

export function captainRowMatchesPresenceQuery(
  row: Record<string, unknown>,
  h3Cells: string[],
  countryId?: number | null
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
