import { cellToLatLng, gridDisk } from 'h3-js';
import type {
  CaptainPresencePoint,
  CaptainPresenceQueryInput,
  SupabaseFromLike,
} from '../../types/rider-marketplace-types';
import { firstNumber, firstString, hasAny } from './rider-marketplace-parsers';

export const CAPTAIN_PRESENCE_TTL_MS = 60_000;

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
  // السقف الأقصى لحلقة H3: مقفول عند 7 (ما يعادل 2.5 كم فقط ليس أكثر) والافتراضي 4 (1.5 كم)
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

export function isCaptainPresenceFresh(
  captain: Pick<CaptainPresencePoint, 'updatedAt'>,
  nowMs = Date.now(),
  ttlMs = CAPTAIN_PRESENCE_TTL_MS,
): boolean {
  if (!captain.updatedAt) return false;
  const updatedMs = Date.parse(captain.updatedAt);
  return Number.isFinite(updatedMs) && nowMs - updatedMs <= ttlMs;
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

export function captainRowMatchesPresenceQuery(
  row: Record<string, unknown>,
  h3Cells: string[],
  countryId?: number | null,
): boolean {
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
