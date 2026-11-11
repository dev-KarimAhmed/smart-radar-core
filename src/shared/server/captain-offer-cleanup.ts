import type { SupabaseClient } from '@supabase/supabase-js';

export const ACTIVE_TRIP_STATUSES = new Set([
  'ACCEPTED',
  'EN_ROUTE',
  'ARRIVED',
  'STARTED',
  'TRIP_ACTIVE',
  'ACTIVE',
  'IN_PROGRESS',
]);

export const STALE_ACTIVE_TRIP_MS = 4 * 60 * 60 * 1000;

export function isActiveTripRow(
  row: Record<string, unknown> | null | undefined,
  nowMs: number = Date.now(),
): boolean {
  if (!row) return false;
  const status = String(row.status || '').trim().toUpperCase();
  if (!ACTIVE_TRIP_STATUSES.has(status)) return false;

  const rawTouch = row.started_at || row.accepted_at || row.updated_at || row.created_at;
  if (!rawTouch) return true;

  const touchMs = Date.parse(String(rawTouch));
  if (!Number.isFinite(touchMs) || touchMs <= 0) return true;

  return nowMs - touchMs <= STALE_ACTIVE_TRIP_MS;
}

export interface OfferRowForCleanup {
  id?: unknown;
  status?: unknown;
  request_id?: unknown;
}

export function partitionOfferCleanupIds(
  rows: OfferRowForCleanup[],
  keepRequestId?: string | null,
  excludeOfferId?: string | null,
): { cancellableIds: string[]; deletableIds: string[] } {
  const cancellableIds: string[] = [];
  const deletableIds: string[] = [];
  const normalizedKeepRequestId = keepRequestId ? String(keepRequestId).trim() : '';
  const normalizedExcludeOfferId = excludeOfferId ? String(excludeOfferId).trim() : '';

  for (const row of rows) {
    const id = row?.id ? String(row.id).trim() : '';
    if (!id) continue;
    if (normalizedExcludeOfferId && id === normalizedExcludeOfferId) continue;

    const reqId = row?.request_id ? String(row.request_id).trim() : '';
    if (normalizedKeepRequestId && reqId === normalizedKeepRequestId) continue;

    const rawStatus = row?.status == null ? 'PENDING' : String(row.status).trim().toUpperCase();
    if (rawStatus === 'ACCEPTED') continue;

    if (rawStatus === 'PENDING' || rawStatus === '') {
      cancellableIds.push(id);
      deletableIds.push(id);
    } else if (rawStatus === 'CANCELLED') {
      deletableIds.push(id);
    }
  }

  return { cancellableIds, deletableIds };
}

/**
 * Returns a map of `captainId -> activeRequestId` for any captain in `captainIds`
 * currently engaged in a non-terminal active ride request (other than `excludeRequestId`).
 */
export async function findBusyCaptainTripMap(
  adminClient: SupabaseClient,
  captainIds: string[],
  excludeRequestId?: string | null,
  nowMs: number = Date.now(),
): Promise<Map<string, string>> {
  const uniqueIds = Array.from(new Set(captainIds.map((id) => String(id || '').trim()).filter(Boolean)));
  const busyMap = new Map<string, string>();
  if (uniqueIds.length === 0) return busyMap;

  const { data, error } = await adminClient
    .from('ride_requests')
    .select('id, status, accepted_captain_id, started_at, accepted_at, updated_at, created_at')
    .in('accepted_captain_id', uniqueIds)
    .not('status', 'in', '("COMPLETED","CANCELLED")');

  if (error || !Array.isArray(data)) {
    return busyMap;
  }

  const normalizedExclude = excludeRequestId ? String(excludeRequestId).trim() : '';

  for (const rawRow of data) {
    const row = rawRow as Record<string, unknown>;
    const rowId = row?.id ? String(row.id).trim() : '';
    const capId = row?.accepted_captain_id ? String(row.accepted_captain_id).trim() : '';
    if (!rowId || !capId) continue;
    if (normalizedExclude && rowId === normalizedExclude) continue;
    if (!isActiveTripRow(row, nowMs)) continue;

    if (!busyMap.has(capId)) {
      busyMap.set(capId, rowId);
    }
  }

  return busyMap;
}

/**
 * Marks all non-accepted PENDING offers by `captainId` (outside `keepRequestId` / `excludeOfferId`)
 * as CANCELLED and deletes them from `ride_offers` so Supabase Realtime (`REPLICA IDENTITY FULL`)
 * notifies waiting riders immediately and removes stale offers from the database.
 */
export async function cancelAndDeleteOtherCaptainOffers(
  adminClient: SupabaseClient,
  captainId: string,
  keepRequestId?: string | null,
  excludeOfferId?: string | null,
): Promise<{ cancelledCount: number; deletedCount: number }> {
  const normalizedCaptainId = String(captainId || '').trim();
  if (!normalizedCaptainId) {
    return { cancelledCount: 0, deletedCount: 0 };
  }

  const { data: rows, error: findErr } = await adminClient
    .from('ride_offers')
    .select('id, status, request_id')
    .eq('captain_id', normalizedCaptainId);

  if (findErr || !Array.isArray(rows) || rows.length === 0) {
    return { cancelledCount: 0, deletedCount: 0 };
  }

  const { cancellableIds, deletableIds } = partitionOfferCleanupIds(
    rows as OfferRowForCleanup[],
    keepRequestId,
    excludeOfferId,
  );

  if (cancellableIds.length > 0) {
    const nowIso = new Date().toISOString();
    await adminClient
      .from('ride_offers')
      .update({ status: 'CANCELLED', updated_at: nowIso })
      .in('id', cancellableIds);
  }

  if (deletableIds.length > 0) {
    await adminClient
      .from('ride_offers')
      .delete()
      .in('id', deletableIds);
  }

  return {
    cancelledCount: cancellableIds.length,
    deletedCount: deletableIds.length,
  };
}

const captainLockChains = new Map<string, Promise<void>>();

/**
 * Serializes concurrent offer-acceptance operations targeting the same captain within the
 * active Node server instance (paired with Postgres advisory locks in `accept_ride_offer`).
 */
export async function withCaptainAcceptLock<T>(
  captainId: string,
  fn: () => Promise<T>,
): Promise<T> {
  const key = String(captainId || '').trim();
  if (!key) return fn();

  const previous = captainLockChains.get(key) ?? Promise.resolve();
  let releaseCurrent: () => void = () => {};
  const currentGate = new Promise<void>((resolve) => {
    releaseCurrent = resolve;
  });

  const tail = previous.then(() => currentGate);
  captainLockChains.set(key, tail);

  await previous;
  try {
    return await fn();
  } finally {
    releaseCurrent();
    if (captainLockChains.get(key) === tail) {
      captainLockChains.delete(key);
    }
  }
}
