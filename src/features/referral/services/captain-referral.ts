import { supabase } from '@/lib/supabase-client';
import { dexieDb } from '@/lib/dexie-db';

export interface LinkedCaptainInfo {
  is_linked: boolean;
  captain_id?: string;
  captain_name?: string;
  captain_phone?: string;
  captain_serial?: string;
  linked_at?: string;
  rating?: number;
  rating_count?: number;
}

export interface ReferredRiderInfo {
  rider_id: string;
  rider_name?: string;
  rider_phone?: string;
  rider_serial?: string;
  linked_at: string;
  rating?: number;
  rating_count?: number;
}

export interface ClaimReferralResult {
  success: boolean;
  status?: 'newly_linked' | 'already_linked_to_this_captain';
  error?: 'captain_not_found' | 'cannot_refer_self' | 'already_linked_to_other_captain' | 'authentication_required' | 'missing_referral_ref' | string;
  captain_id?: string;
  captain_name?: string;
  captain_serial?: string;
  captain_phone?: string;
  existing_captain_id?: string;
  existing_captain_name?: string;
  existing_captain_serial?: string;
}

const PENDING_REF_KEY = 'radar_pending_captain_ref';

/**
 * Stores a pending captain referral code from a link (e.g., ?ref=C-1002).
 */
export function storePendingCaptainReferral(ref: string): void {
  if (typeof window === 'undefined' && typeof localStorage === 'undefined') return;
  const clean = ref.trim();
  if (clean) {
    try {
      localStorage.setItem(PENDING_REF_KEY, clean);
    } catch {
      // ignore
    }
  }
}

/**
 * Gets any pending captain referral code stored in localStorage.
 */
export function getPendingCaptainReferral(): string | null {
  if (typeof window === 'undefined' && typeof localStorage === 'undefined') return null;
  try {
    return localStorage.getItem(PENDING_REF_KEY);
  } catch {
    return null;
  }
}

/**
 * Clears the pending captain referral code.
 */
export function clearPendingCaptainReferral(): void {
  if (typeof window === 'undefined' && typeof localStorage === 'undefined') return;
  try {
    localStorage.removeItem(PENDING_REF_KEY);
  } catch {
    // ignore
  }
}

/**
 * Removes referral query parameters (?ref=... or ?captain=...) from the current URL
 * without triggering a page reload.
 */
export function removeReferralParamFromUrl(): void {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    let changed = false;
    if (url.searchParams.has('ref')) {
      url.searchParams.delete('ref');
      changed = true;
    }
    if (url.searchParams.has('captain')) {
      url.searchParams.delete('captain');
      changed = true;
    }
    if (changed) {
      const search = url.searchParams.toString();
      const newUrl = url.pathname + (search ? `?${search}` : '') + url.hash;
      window.history.replaceState(window.history.state, '', newUrl);
    }
  } catch {
    // ignore
  }
}

/**
 * Builds the sharable referral URL for a captain to register a new rider.
 */
export function buildCaptainReferralLink(captainIdentifier: string): string {
  const path = `/register/rider?ref=${encodeURIComponent(captainIdentifier)}`;
  if (typeof window === 'undefined') {
    return path;
  }
  const origin = window.location.origin;
  return `${origin}${path}`;
}

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
    .select('rider_id, created_at, profiles:rider_id(id, full_name, phone, serial_id, rating, rating_count)')
    .order('created_at', { ascending: false });

  if (error || !data) return [];
  return data.map((row: any) => ({
    rider_id: row.rider_id,
    rider_name: row.profiles?.full_name,
    rider_phone: row.profiles?.phone,
    rider_serial: row.profiles?.serial_id,
    linked_at: row.created_at,
    rating: row.profiles?.rating,
    rating_count: row.profiles?.rating_count,
  }));
}

