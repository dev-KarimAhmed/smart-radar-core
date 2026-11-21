import { supabase } from '@/lib/supabase-client';
import { dexieDb } from '@/lib/dexie-db';
import type { ClaimReferralResult, LinkedCaptainInfo, ReferredRiderInfo } from './referral-types';

export * from './referral-types';
export * from './referral-storage';
export * from './referral-activity';

/**
 * Claims a captain referral link for the currently authenticated rider.
 * Automatically creates mutual favorites between Rider and Captain.
 * Blocks if rider is already linked to another captain.
 */
export async function claimCaptainReferral(captainRef: string): Promise<ClaimReferralResult> {
  const cleanRef = captainRef.trim();
  if (!cleanRef) {
    return { success: false, error: 'missing_referral_ref' };
  }

  const { data, error } = await supabase.rpc('claim_captain_referral', {
    p_captain_ref: cleanRef,
  });

  if (error) {
    return { success: false, error: error.message };
  }

  const result = data as ClaimReferralResult;

  if (result.success && result.captain_id) {
    try {
      await dexieDb.favoriteCaptainIds.put({
        captainId: result.captain_id,
        heartedAt: Date.now(),
      });
    } catch {
      // offline cache only
    }
  }

  return result;
}

/**
 * Removes the referral link and mutual favorites between rider and captain.
 * Returns the rider to "حر طليق" (free) state to link with any other captain.
 */
export async function removeCaptainReferral(): Promise<{
  success: boolean;
  removed_captain_id?: string;
  removed_captain_name?: string;
  error?: string;
}> {
  const { data, error } = await supabase.rpc('remove_captain_referral');

  if (error) {
    return { success: false, error: error.message };
  }

  const result = data as {
    success: boolean;
    removed_captain_id?: string;
    removed_captain_name?: string;
    error?: string;
  };

  if (result.success && result.removed_captain_id) {
    try {
      await dexieDb.favoriteCaptainIds.delete(result.removed_captain_id);
      const stale = await dexieDb.favoriteCaptains
        .filter((row) => String(row?.captainId || '') === result.removed_captain_id)
        .toArray();
      await Promise.all(
        stale.map((row) => (row.id === undefined ? null : dexieDb.favoriteCaptains.delete(row.id))),
      );
    } catch {
      // offline cache only
    }
  }

  return result;
}

/**
 * Gets the linked captain details for the current rider.
 */
export async function getRiderLinkedCaptain(): Promise<LinkedCaptainInfo> {
  const { data, error } = await supabase.rpc('get_rider_linked_captain');
  if (error || !data) {
    return { is_linked: false };
  }
  return data as LinkedCaptainInfo;
}

/**
 * Gets the list of referred riders (followers) for the current captain.
 */
export async function getCaptainReferredRiders(): Promise<ReferredRiderInfo[]> {
  const { data, error } = await supabase.rpc('get_captain_referred_riders');
  if (error || !data) {
    return [];
  }
  return data as ReferredRiderInfo[];
}

const CAPTAIN_FAVORITES_KEY_PREFIX = 'radar_captain_favorite_riders_';

function getLocalFavoriteRiders(captainId: string): ReferredRiderInfo[] {
  if (typeof window === 'undefined' || !captainId) return [];
  try {
    const raw = window.localStorage.getItem(CAPTAIN_FAVORITES_KEY_PREFIX + captainId);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveLocalFavoriteRiders(captainId: string, riders: ReferredRiderInfo[]) {
  if (typeof window === 'undefined' || !captainId) return;
  try {
    window.localStorage.setItem(CAPTAIN_FAVORITES_KEY_PREFIX + captainId, JSON.stringify(riders));
  } catch {}
}

/**
 * Gets the list of favorite riders for the current captain from captain_favorite_riders.
 * Reads local cache first for instant UI response and synchronizes with Supabase.
 */
export async function getCaptainFavoriteRiders(captainId?: string): Promise<ReferredRiderInfo[]> {
  let resolvedCaptainId = captainId;
  if (!resolvedCaptainId) {
    const { data: authData } = await supabase.auth.getUser();
    resolvedCaptainId = authData?.user?.id;
  }
  if (!resolvedCaptainId && typeof window !== 'undefined') {
    try {
      const rawSb = window.localStorage.getItem('sb-auth-token') || window.localStorage.getItem('supabase.auth.token');
      if (rawSb) {
        const parsed = JSON.parse(rawSb);
        if (parsed?.user?.id) resolvedCaptainId = String(parsed.user.id);
      }
    } catch {}
  }

  // 1. Read local cache first
  const localList = resolvedCaptainId ? getLocalFavoriteRiders(resolvedCaptainId) : [];
  const resultMap = new Map<string, ReferredRiderInfo>();
  for (const item of localList) {
    resultMap.set(item.rider_id, item);
  }

  // 2. Fetch from Supabase
  try {
    let query = supabase
      .from('captain_favorite_riders')
      .select('rider_id, created_at')
      .order('created_at', { ascending: false });

    if (resolvedCaptainId) {
      query = query.eq('captain_id', resolvedCaptainId);
    }

    const { data, error } = await query;
    if (!error && Array.isArray(data) && data.length > 0) {
      const riderIds = Array.from(
        new Set(data.map((row: any) => String(row?.rider_id || '')).filter(Boolean)),
      );

      const profileMap = new Map<string, any>();
      if (riderIds.length > 0) {
        try {
          const { data: safeProfiles, error: rpcErr } = await supabase.rpc(
            'get_safe_counterpart_profiles',
            { p_user_ids: riderIds },
          );
          if (!rpcErr && Array.isArray(safeProfiles)) {
            for (const prof of safeProfiles) {
              if (prof?.id) profileMap.set(String(prof.id), prof);
            }
          }
        } catch {
          // Safe fallback: return favorite link rows even if profile hydration fails
        }
      }

      for (const row of data) {
        const rId = String(row.rider_id);
        const profile = profileMap.get(rId);
        const existingLocal = resultMap.get(rId);

        resultMap.set(rId, {
          rider_id: rId,
          rider_name: profile?.full_name || existingLocal?.rider_name,
          rider_phone: profile?.phone || existingLocal?.rider_phone,
          rider_serial: profile?.serial_id || existingLocal?.rider_serial,
          linked_at: row.created_at || existingLocal?.linked_at || new Date().toISOString(),
          rating: profile?.rating,
          rating_count: profile?.rating_count,
        });
      }

      // Update local cache with freshly resolved remote data
      if (resolvedCaptainId) {
        saveLocalFavoriteRiders(resolvedCaptainId, Array.from(resultMap.values()));
      }
    }
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[Captain Referral] Fetch remote favorites warning:', err);
    }
  }

  return Array.from(resultMap.values());
}

/**
 * Gets a set of favorite rider IDs for the captain.
 */
export async function fetchFavoriteRiderIds(captainId?: string): Promise<Set<string>> {
  const riders = await getCaptainFavoriteRiders(captainId);
  return new Set(riders.map((r) => String(r.rider_id)).filter(Boolean));
}

/**
 * Sets or removes a rider from the captain's favorites.
 * Writes to local storage immediately and syncs with Supabase.
 */
export async function setCaptainFavoriteRider(
  riderId: string,
  isFavorite: boolean,
  riderMeta?: { name?: string; phone?: string; serial?: string },
  captainId?: string,
): Promise<boolean> {
  if (!riderId) return false;
  let resolvedCaptainId = captainId;
  if (!resolvedCaptainId) {
    const { data: authData } = await supabase.auth.getUser();
    resolvedCaptainId = authData?.user?.id;
  }
  if (!resolvedCaptainId && typeof window !== 'undefined') {
    try {
      const rawSb = window.localStorage.getItem('sb-auth-token') || window.localStorage.getItem('supabase.auth.token');
      if (rawSb) {
        const parsed = JSON.parse(rawSb);
        if (parsed?.user?.id) resolvedCaptainId = String(parsed.user.id);
      }
    } catch {}
  }
  if (!resolvedCaptainId) return false;

  // 1. Update local cache immediately
  const localList = getLocalFavoriteRiders(resolvedCaptainId);
  if (isFavorite) {
    const existsIndex = localList.findIndex((r) => r.rider_id === riderId);
    if (existsIndex >= 0) {
      localList[existsIndex] = {
        ...localList[existsIndex],
        rider_name: riderMeta?.name || localList[existsIndex].rider_name,
        rider_phone: riderMeta?.phone || localList[existsIndex].rider_phone,
        rider_serial: riderMeta?.serial || localList[existsIndex].rider_serial,
      };
    } else {
      localList.unshift({
        rider_id: riderId,
        rider_name: riderMeta?.name,
        rider_phone: riderMeta?.phone,
        rider_serial: riderMeta?.serial,
        linked_at: new Date().toISOString(),
      });
    }
    saveLocalFavoriteRiders(resolvedCaptainId, localList);
  } else {
    const filtered = localList.filter((r) => r.rider_id !== riderId);
    saveLocalFavoriteRiders(resolvedCaptainId, filtered);
  }

  // 2. Notify components across the application
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('radar_favorites_updated', { detail: { riderId, isFavorite } }));
    window.dispatchEvent(new CustomEvent('captain-favorites-updated', { detail: { riderId, isFavorite } }));
  }

  // 3. Sync with Supabase captain_favorite_riders table
  try {
    if (isFavorite) {
      await supabase
        .from('captain_favorite_riders')
        .upsert(
          { captain_id: resolvedCaptainId, rider_id: riderId },
          { onConflict: 'captain_id,rider_id' },
        );
    } else {
      await supabase
        .from('captain_favorite_riders')
        .delete()
        .eq('captain_id', resolvedCaptainId)
        .eq('rider_id', riderId);
    }
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[Captain Referral] Remote favorite sync warning:', err);
    }
  }

  return true;
}

/**
 * Adds a rider to the captain's favorite riders list.
 */
export async function addCaptainFavoriteRider(
  riderId: string,
  captainId?: string,
  riderMeta?: { name?: string; phone?: string; serial?: string },
): Promise<boolean> {
  return setCaptainFavoriteRider(riderId, true, riderMeta, captainId);
}

/**
 * Checks if a rider is in the captain's favorite riders list.
 */
export async function isCaptainFavoriteRider(riderId: string, captainId?: string): Promise<boolean> {
  if (!riderId) return false;
  let resolvedCaptainId = captainId;
  if (!resolvedCaptainId) {
    const { data: authData } = await supabase.auth.getUser();
    resolvedCaptainId = authData?.user?.id;
  }
  if (!resolvedCaptainId && typeof window !== 'undefined') {
    try {
      const rawSb = window.localStorage.getItem('sb-auth-token') || window.localStorage.getItem('supabase.auth.token');
      if (rawSb) {
        const parsed = JSON.parse(rawSb);
        if (parsed?.user?.id) resolvedCaptainId = String(parsed.user.id);
      }
    } catch {}
  }

  // 1. Check local cache first
  if (resolvedCaptainId) {
    const local = getLocalFavoriteRiders(resolvedCaptainId);
    if (local.some((r) => r.rider_id === riderId)) {
      return true;
    }
  }

  if (!resolvedCaptainId) return false;

  try {
    const { data, error } = await supabase
      .from('captain_favorite_riders')
      .select('rider_id')
      .eq('captain_id', resolvedCaptainId)
      .eq('rider_id', riderId)
      .maybeSingle();

    if (error) return false;
    return Boolean(data);
  } catch {
    return false;
  }
}
