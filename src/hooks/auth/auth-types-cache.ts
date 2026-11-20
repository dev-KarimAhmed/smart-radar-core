import type { User as SovereignUser } from '@/core/types';
import {
  buildUserFromSupabaseAuth,
  clearSupabaseSessionCache,
} from '@/lib/supabase-auth';
import { SUPABASE_AUTH_STORAGE_KEY, shouldRememberSupabaseSession } from '@/features/auth/services/supabase-auth-storage';
import { DASHBOARD_LANGUAGE_KEY } from '../use-dashboard-language';

export interface AuthContextType {
  user: SovereignUser | null;
  loading: boolean;
  promoData: any;
  logout: () => Promise<void>;
  loginAsMockUser: (user: SovereignUser) => void;
  isSovereign: boolean;
  isCaptain: boolean;
  isPassenger: boolean;
  isDelegate: boolean;
  suspendUserDocListener: () => void;
  resumeUserDocListener: () => void;
}

export function getInitialUserFromCache(): SovereignUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const rawMock =
      window.sessionStorage.getItem('radar_sovereign_mock_user') ||
      (shouldRememberSupabaseSession() ? window.localStorage.getItem('radar_sovereign_mock_user') : null);
    if (process.env.NODE_ENV !== 'production' && rawMock) {
      const parsedMock = JSON.parse(rawMock);
      if (parsedMock && (parsedMock.role === 'admin' || parsedMock.adminRank === 'GENERAL_ADMIN')) {
        return parsedMock as SovereignUser;
      }
    }
    const raw =
      window.sessionStorage.getItem(SUPABASE_AUTH_STORAGE_KEY) ||
      (shouldRememberSupabaseSession() ? window.localStorage.getItem(SUPABASE_AUTH_STORAGE_KEY) : null);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.user && typeof parsed.user === 'object') {
      return buildUserFromSupabaseAuth(parsed.user) as SovereignUser;
    }
  } catch {
    // Ignore cache parse errors
  }
  return null;
}

// A request still "in flight" — anything before the trip is over — must be
// cancelled server-side on logout instead of left orphaned for the other
// side (rider or captain) to keep waiting on. Re-derives this from the DB by
// id/role rather than any client-side dashboard state, since that state may
// not be mounted at all from wherever the logout button was pressed.
// Must exactly match the live `ride_request_status` Postgres enum members —
// any value here that isn't a real enum label makes PostgREST fail the whole
// `.in()` filter with a 400 (bad enum cast), silently skipping the cancel.
export const NON_TERMINAL_REQUEST_STATUSES = [
  'PENDING', 'RECEIVING_OFFERS', 'ACCEPTED', 'EN_ROUTE', 'ARRIVED', 'TRIP_ACTIVE',
];

export async function cancelActiveRequestBeforeLogout(user: SovereignUser | null): Promise<void> {
  if (!user?.uid) return;

  try {
    const { supabase } = await import('@/lib/supabase-client');

    if (user.role === 'rider') {
      const { data } = await supabase
        .from('ride_requests')
        .select('id')
        .eq('rider_id', user.uid)
        .in('status', NON_TERMINAL_REQUEST_STATUSES)
        .limit(1)
        .maybeSingle();
      if (data?.id) {
        await supabase.rpc('cancel_ride_request', { p_request_id: data.id });
      }
    } else if (user.role === 'driver') {
      // If the captain submitted offers in the auction, withdraw/cancel and delete them on logout
      try {
        await supabase
          .from('ride_offers')
          .update({ status: 'CANCELLED' })
          .eq('captain_id', user.uid)
          .neq('status', 'ACCEPTED');
        await supabase
          .from('ride_offers')
          .delete()
          .eq('captain_id', user.uid)
          .neq('status', 'ACCEPTED');
        try {
          await supabase.rpc('set_captain_status', { p_status: 'IDLE' });
        } catch {
          // Ignore status reset error
        }
      } catch (offerErr) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[Logout captain offers cleanup failed]', offerErr);
        }
      }

      const { data } = await supabase
        .from('ride_requests')
        .select('id')
        .eq('accepted_captain_id', user.uid)
        .in('status', NON_TERMINAL_REQUEST_STATUSES)
        .limit(1)
        .maybeSingle();
      if (data?.id) {
        await supabase.rpc('captain_cancel_active_trip', { p_request_id: data.id });
      }
    }
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') console.warn('[Logout active-request cleanup]', error);
  }
}

export function purgeTransientFrontendCache(): void {
  if (typeof window === 'undefined') return;

  const sessionKeys = [
    'sovereign_write_lock',
    'sovereign_trip_status',
    'sovereign_driver_status',
    'sovereign_rejected_trips_v1',
    'radar_driver_rejected_requests_v1',
  ];

  const localKeys = [
    'sovereign_gps_local_buffer',
    'radar_rider_local_reports',
    'radar_user_notifications_v1',
  ];

  for (const key of sessionKeys) {
    window.sessionStorage.removeItem(key);
  }

  for (const key of localKeys) {
    window.localStorage.removeItem(key);
  }

  try {
    for (let i = window.localStorage.length - 1; i >= 0; i--) {
      const key = window.localStorage.key(i);
      if (key && (key.startsWith('radar_user_notifications_') || key === 'radar_user_notifications_v1')) {
        window.localStorage.removeItem(key);
      }
    }
  } catch {}

  try {
    void import('@/shared/hooks/use-notifications').then(({ clearNotificationMemoryStore }) => {
      clearNotificationMemoryStore();
    }).catch(() => {});
  } catch {}
}

export function restorePreservedLanguage(language: string | null): void {
  if (typeof window === 'undefined' || (language !== 'ar' && language !== 'en')) return;
  window.localStorage.setItem(DASHBOARD_LANGUAGE_KEY, language);
}
