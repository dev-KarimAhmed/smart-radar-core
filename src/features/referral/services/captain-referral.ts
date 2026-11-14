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

/**
 * Gets the list of favorite riders for the current captain from captain_favorite_riders.
 */
export async function getCaptainFavoriteRiders(): Promise<ReferredRiderInfo[]> {
  const { data, error } = await supabase
    .from('captain_favorite_riders')
    .select('rider_id, created_at')
    .order('created_at', { ascending: false });

  if (error || !data || data.length === 0) return [];

  const riderIds = Array.from(
    new Set(data.map((row: any) => String(row?.rider_id || '')).filter(Boolean))
  );

  const profileMap = new Map<string, any>();
  if (riderIds.length > 0) {
    try {
      const { data: safeProfiles, error: rpcErr } = await supabase.rpc('get_safe_counterpart_profiles', {
        p_user_ids: riderIds,
      });
      if (!rpcErr && Array.isArray(safeProfiles)) {
        for (const prof of safeProfiles) {
          if (prof?.id) profileMap.set(String(prof.id), prof);
        }
      }
    } catch {
      // Safe fallback: return favorite link rows even if profile hydration fails
    }
  }

  return data.map((row: any) => {
    const profile = profileMap.get(String(row.rider_id || ''));
    return {
      rider_id: row.rider_id,
      rider_name: profile?.full_name,
      rider_phone: profile?.phone,
      rider_serial: profile?.serial_id,
      linked_at: row.created_at,
      rating: profile?.rating,
      rating_count: profile?.rating_count,
    };
  });
}
