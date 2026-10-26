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

async function getEffectiveRiderId(): Promise<string | null> {
  const { data: session } = await supabase.auth.getSession();
  if (session?.session?.user?.id) return session.session.user.id;

  if (typeof window !== 'undefined') {
    try {
      const rawSb = window.localStorage.getItem('sb-auth-token') || window.localStorage.getItem('supabase.auth.token');
      if (rawSb) {
        const parsed = JSON.parse(rawSb);
        if (parsed?.user?.id) return String(parsed.user.id);
      }
      const rawMock = window.localStorage.getItem('radar_sovereign_mock_user') || window.sessionStorage.getItem('radar_sovereign_mock_user');
      if (rawMock) {
        const parsedMock = JSON.parse(rawMock);
        if (parsedMock?.id) return String(parsedMock.id);
      }
      const fallbackId = window.localStorage.getItem('radar_rider_id');
      if (fallbackId) return fallbackId;
    } catch {
      // Ignore parse errors
    }
  }
  return null;
}

export async function fetchFavoriteCaptainIds(): Promise<Set<string>> {
  const localIds = await readCache();
  const riderId = await getEffectiveRiderId();

  // If signed out or offline, the local cache is returned immediately
  if (!riderId) return localIds;

  await pushFavoritesFromLegacyCache(riderId);

  try {
    const { data, error } = await supabase
      .from('rider_favorite_captains')
      .select('captain_id');

    if (!error && data) {
      for (const row of data) {
        if (row.captain_id) localIds.add(String(row.captain_id));
      }
      await writeCache(localIds);
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') console.warn('[Favorites] fetch failed:', error);
  }

  return localIds;
}

/**
 * Adds or removes the favourite and returns the resulting state.
 * Offline-first: writes immediately to Dexie so the rider never loses their choice,
 * then syncs seamlessly with Supabase if online.
 */
export async function setFavoriteCaptain(
  captainId: string,
  isFavorite: boolean,
  captainMeta?: { name?: string; phone?: string; rank?: string; serialId?: string; vehicle?: string }
) {
  if (!captainId) return false;

  const riderId = await getEffectiveRiderId();

  // 1. Write immediately to Dexie favoriteCaptainIds & favoriteCaptains
  if (isFavorite) {
    try {
      await dexieDb.favoriteCaptainIds.put({ captainId, heartedAt: Date.now() });
      const existing = await dexieDb.favoriteCaptains.filter((r) => String(r?.captainId || '') === captainId).first();
      if (!existing) {
        let captainName = captainMeta?.name || 'كابتن معتمد';
        let captainPhone = captainMeta?.phone || '';
        let captainRank: 'PLATINUM' | 'GOLD' | 'BRONZE' | 'SILVER' =
          captainMeta?.rank === 'GOLD' || captainMeta?.rank === 'BRONZE' || captainMeta?.rank === 'SILVER'
            ? captainMeta.rank
            : 'PLATINUM';
        let serialId = captainMeta?.serialId || ('C-' + captainId.slice(0, 4).toUpperCase());
        let vehicleInfo = captainMeta?.vehicle || 'مركبة معتمدة';

        try {
          const { data: prof } = await supabase
            .from('profiles')
            .select('full_name, phone, role, serial_id, vehicle_model, vehicle_plate')
            .eq('id', captainId)
            .maybeSingle();

          if (prof) {
            if (prof.full_name) captainName = prof.full_name;
            if (prof.phone) captainPhone = prof.phone;
            if (prof.serial_id) serialId = prof.serial_id;
            if (prof.vehicle_model || prof.vehicle_plate) {
              vehicleInfo = [prof.vehicle_model, prof.vehicle_plate].filter(Boolean).join(' - ');
            }
          }
        } catch {
          // ignore
        }

        await dexieDb.favoriteCaptains.add({
          tripId: `fav_${captainId}_${Date.now()}`,
          captainId,
          captainName,
          captainRank,
          captainPhone,
          vehicleInfo,
          finalPrice: 0,
          timestamp: Date.now(),
          heartedAt: Date.now(),
        });
      }
    } catch (cacheErr) {
      if (process.env.NODE_ENV !== 'production') console.warn('[Favorites] Cache write error:', cacheErr);
    }
  } else {
    try {
      await dexieDb.favoriteCaptainIds.delete(captainId);
      const stale = await dexieDb.favoriteCaptains.filter((row) => String(row?.captainId || '') === captainId).toArray();
      await Promise.all(stale.map((row) => (row.id === undefined ? null : dexieDb.favoriteCaptains.delete(row.id))));
    } catch (cacheErr) {
      if (process.env.NODE_ENV !== 'production') console.warn('[Favorites] Cache delete error:', cacheErr);
    }
  }

  // Notify components across the application
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('rider-favorites-updated', { detail: { captainId, isFavorite } }));
    window.dispatchEvent(new CustomEvent('radar_favorites_updated', { detail: { captainId, isFavorite } }));
  }

  // 2. Sync to Supabase in background
  if (riderId) {
    try {
      if (isFavorite) {
        await supabase
          .from('rider_favorite_captains')
          .upsert({ rider_id: riderId, captain_id: captainId }, { onConflict: 'rider_id,captain_id' });
      } else {
        await supabase
          .from('rider_favorite_captains')
          .delete()
          .eq('rider_id', riderId)
          .eq('captain_id', captainId);
      }
    } catch (serverError) {
      if (process.env.NODE_ENV !== 'production') console.warn('[Favorites] Server sync notice:', serverError);
    }
  }

  return isFavorite;
}
