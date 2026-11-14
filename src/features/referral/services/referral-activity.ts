import { supabase } from '@/lib/supabase-client';

const LAST_ACTIVITY_SYNC_KEY = 'radar_rider_last_activity_sync';
const ACTIVITY_SYNC_INTERVAL_MS = 60 * 60 * 1000; // 1 hour throttle (SC55 edge zero cost)

/**
 * Records rider active interaction (e.g. watching ads or active app engagement).
 * Throttled on the client to avoid redundant network calls.
 */
export async function recordRiderActivity(activityType: string = 'ad_view'): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const lastSync = localStorage.getItem(LAST_ACTIVITY_SYNC_KEY);
    const now = Date.now();
    if (lastSync && now - Number(lastSync) < ACTIVITY_SYNC_INTERVAL_MS) {
      return;
    }

    const { error } = await supabase.rpc('record_rider_activity', {
      p_activity_type: activityType,
    });
    if (!error) {
      localStorage.setItem(LAST_ACTIVITY_SYNC_KEY, String(now));
    }
  } catch {
    // offline-first silent fallback
  }
}

/**
 * Checks for inactive referred riders and triggers captain notifications.
 */
export async function checkCaptainInactiveRiders(): Promise<{
  success: boolean;
  notifications_dispatched?: number;
  error?: string;
}> {
  try {
    const { data, error } = await supabase.rpc('check_captain_inactive_riders');
    if (error) return { success: false, error: error.message };
    return (data as any) || { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'failed' };
  }
}

/**
 * Simulates referral inactivity for a specific rider by shifting last_interacted_at
 * back by `daysAgo` (e.g. 10 or 15 days) and clearing last_inactivity_notified_at.
 */
export async function simulateReferralInactivity(
  riderId: string,
  daysAgo: number = 11,
): Promise<{ success: boolean; simulated_days_ago?: number; error?: string }> {
  try {
    const { data, error } = await supabase.rpc('simulate_referral_inactivity', {
      p_rider_id: riderId,
      p_days_ago: daysAgo,
    });
    if (error) return { success: false, error: error.message };
    return (data as any) || { success: true };
  } catch (err: any) {
    return { success: false, error: err?.message || 'failed' };
  }
}
