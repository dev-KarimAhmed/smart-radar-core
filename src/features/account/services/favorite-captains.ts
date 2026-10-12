import { dexieDb } from '@/lib/dexie-db';
import { supabase } from '@/lib/supabase-client';

/**
 * Rider -> captain favourites. The single owner of this concept.
 *
 * public.rider_favorite_captains is the source of truth, keyed by (rider, captain).
 * dexieDb.favoriteCaptainIds is its local mirror, keyed by captainId, so the hearts still
 * render offline.
 *
 * What this replaced: two screens each writing their own record — the rating modal to
 * reviews.gave_heart, the trip history to a Dexie row keyed by tripId — with no shared
 * notion of what a favourite is. That is why the same captain showed a filled heart on one
 * trip and an empty one on the next, and why the captain's own card never saw it.
 */

/** Legacy per-trip favourites are pushed to the server once, then stop being consulted. */
let legacyPushAttempted = false;

async function readCache(): Promise<Set<string>> {
  try {
    const rows = await dexieDb.favoriteCaptainIds.toArray();
    return new Set(rows.map((row) => String(row.captainId)));
  } catch {
    return new Set();
  }
}

async function writeCache(captainIds: Set<string>) {
  try {
    await dexieDb.favoriteCaptainIds.clear();
    await dexieDb.favoriteCaptainIds.bulkPut(
      [...captainIds].map((captainId) => ({ captainId, heartedAt: Date.now() })),
    );
  } catch {
    // An unwritable cache costs offline rendering, nothing else.
  }
}

/**
 * Rescues favourites that only ever existed on this device.
 *
 * The trip-history heart wrote Dexie and localStorage and never called the server, so those
 * favourites exist nowhere else. Dropping the per-trip table without this would silently
 * delete real rider data. Runs once per session, and is safe to run again: the upsert is
 * keyed by the pair.
 */
async function pushFavoritesFromLegacyCache(riderId: string) {
  if (legacyPushAttempted) return;
  legacyPushAttempted = true;

  try {
    const legacy = await dexieDb.favoriteCaptains.toArray();
    const captainIds = [...new Set(
      legacy.map((row) => String(row?.captainId || '')).filter(Boolean),
    )];
    if (captainIds.length === 0) return;

    const { error } = await supabase
      .from('rider_favorite_captains')
      .upsert(
        captainIds.map((captainId) => ({ rider_id: riderId, captain_id: captainId })),
        { onConflict: 'rider_id,captain_id' },
      );

    if (error && (process.env.NODE_ENV !== 'production')) {
      console.warn('[Favorites] legacy migration failed:', error);
    }
  } catch (error) {
    if ((process.env.NODE_ENV !== 'production')) console.warn('[Favorites] legacy migration error:', error);
  }
}

export async function fetchFavoriteCaptainIds(): Promise<Set<string>> {
  const { data: session } = await supabase.auth.getSession();
  const riderId = session.session?.user?.id;

  // Signed out: the cache is all there is.
  if (!riderId) return readCache();

  await pushFavoritesFromLegacyCache(riderId);

  const { data, error } = await supabase
    .from('rider_favorite_captains')
    .select('captain_id');

  if (error) {
    if ((process.env.NODE_ENV !== 'production')) console.warn('[Favorites] fetch failed:', error);
    // Offline or denied — show what was last known rather than an empty list, which would
    // read as "you have no favourites" and invite the rider to re-add them all.
    return readCache();
  }

  const ids = new Set((data ?? []).map((row) => String((row as { captain_id: string }).captain_id)));
  await writeCache(ids);
  return ids;
}

/**
 * Adds or removes the favourite and returns the resulting state.
 *
 * Server first, because that copy is what the CAPTAIN reads. The cache follows only once the
 * server has accepted it, so the two can never disagree in the direction that matters.
 */
export async function setFavoriteCaptain(captainId: string, isFavorite: boolean) {
  const { data: session } = await supabase.auth.getSession();
  const riderId = session.session?.user?.id;
  if (!riderId) throw new Error('authentication_required');
  if (!captainId) throw new Error('captain_id_required');

  if (isFavorite) {
    const { error } = await supabase
      .from('rider_favorite_captains')
      .upsert({ rider_id: riderId, captain_id: captainId }, { onConflict: 'rider_id,captain_id' });
    if (error) throw error;

    try {
      await dexieDb.favoriteCaptainIds.put({ captainId, heartedAt: Date.now() });
    } catch { /* cache only */ }
    return true;
  }

  const { error } = await supabase
    .from('rider_favorite_captains')
    .delete()
    .eq('rider_id', riderId)
    .eq('captain_id', captainId);
  if (error) throw error;

  try {
    await dexieDb.favoriteCaptainIds.delete(captainId);
    // Also clear the legacy per-trip rows for this captain, or a removed favourite would be
    // re-migrated by pushFavoritesFromLegacyCache on the next session and come back.
    const stale = await dexieDb.favoriteCaptains.filter((row) => String(row?.captainId || '') === captainId).toArray();
    await Promise.all(stale.map((row) => (row.id === undefined ? null : dexieDb.favoriteCaptains.delete(row.id))));
  } catch { /* cache only */ }

  return false;
}
