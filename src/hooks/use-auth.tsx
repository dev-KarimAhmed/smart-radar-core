'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import type { User as SovereignUser } from '@/core/types';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  buildUserFromSupabaseAuth,
  cacheSupabaseSession,
  clearSupabaseSessionCache,
} from '@/lib/supabase-auth';
import { hasStoredSupabaseAuthSession } from '@/features/auth/services/supabase-auth-storage';
import { DASHBOARD_LANGUAGE_KEY, useDashboardLanguage } from './use-dashboard-language';

const LogoutDialog = dynamic(
  () => import('@/features/auth/components/logout-dialog').then((module) => module.LogoutDialog),
  { ssr: false },
);

const styles = { root: 'contents' } as const;


interface AuthContextType {
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function AuthContent({ children }: { children: ReactNode }) {
  const router = useRouter();
  const t = useTranslations('auth.logout');
  const { direction } = useDashboardLanguage();
  const [user, setUser] = useState<SovereignUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [logoutInProgress, setLogoutInProgress] = useState(false);
  const [promoData] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    let unsubscribe = () => {};

    // Always subscribe to onAuthStateChange, even with no stored session at
    // mount (e.g. sitting on the login page logged out) — that's exactly the
    // moment a sign-in is about to happen, and this subscription is what
    // picks it up. A prior version skipped the subscription in that case and
    // relied on a same-tab custom event to trigger a hard `location.reload()`
    // instead; that reload raced the sign-in call's own (synchronous, but not
    // guaranteed to already be flushed) session persistence, so a reload
    // could land back on a state that looks like "no session" and bounce the
    // user straight back to the login page right after a successful login.
    const hadStoredSession = hasStoredSupabaseAuthSession();
    setLoading(hadStoredSession);

    void import('@/lib/supabase-client').then(({ supabase }) => {
      if (!mounted) return;

      if (hadStoredSession) {
        void supabase.auth.getSession().then(({ data }) => {
          if (!mounted) return;
          cacheSupabaseSession(data.session);
          setUser(data.session?.user ? (buildUserFromSupabaseAuth(data.session.user) as SovereignUser) : null);
          setLoading(false);
        }).catch(() => {
          if (!mounted) return;
          clearSupabaseSessionCache();
          setUser(null);
          setLoading(false);
        });
      }

      const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!mounted) return;
        cacheSupabaseSession(session);
        setUser(session?.user ? (buildUserFromSupabaseAuth(session.user) as SovereignUser) : null);
        setLoading(false);
      });
      unsubscribe = () => subscription.subscription.unsubscribe();
    });

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  const loginAsMockUser = useCallback((mockUser: SovereignUser) => {
    if (!(process.env.NODE_ENV !== 'production')) return;
    setUser(mockUser);
    setLoading(false);
  }, []);

  const logout = useCallback(async () => {
    setLogoutDialogOpen(true);
  }, []);

  const confirmLogout = useCallback(async () => {
    setLogoutInProgress(true);
    const preservedLanguage =
      typeof window !== 'undefined' ? window.localStorage.getItem(DASHBOARD_LANGUAGE_KEY) : null;
    // Must run before signOut/cache-clear below — it needs the still-active
    // session (RLS relies on auth.uid()) to find and cancel the user's own
    // in-flight request, if any, instead of leaving it orphaned.
    await cancelActiveRequestBeforeLogout(user);
    clearSupabaseSessionCache();
    purgeTransientFrontendCache();
    restorePreservedLanguage(preservedLanguage);
    setUser(null);
    try {
      const { supabase } = await import('@/lib/supabase-client');
      await supabase.auth.signOut();
    } catch {
      setUser(null);
    } finally {
      clearSupabaseSessionCache();
      purgeTransientFrontendCache();
      restorePreservedLanguage(preservedLanguage);
      setLoading(false);
      router.replace('/');
      setLogoutDialogOpen(false);
      setLogoutInProgress(false);
    }
  }, [router, user]);

  const suspendUserDocListener = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('sovereign_write_lock', 'true');
    }
  }, []);

  const resumeUserDocListener = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('sovereign_write_lock');
    }
  }, []);

  const isSovereign = useMemo(() => user?.role === 'admin', [user]);
  const isCaptain = useMemo(() => user?.role === 'driver', [user]);
  const isPassenger = useMemo(() => user?.role === 'rider', [user]);
  const isDelegate = useMemo(() => user?.role === 'delegate', [user]);

  const value = useMemo(() => ({
    user,
    loading,
    promoData,
    logout,
    loginAsMockUser,
    isSovereign,
    isCaptain,
    isPassenger,
    isDelegate,
    suspendUserDocListener,
    resumeUserDocListener,
  }), [
    user,
    loading,
    promoData,
    logout,
    loginAsMockUser,
    isSovereign,
    isCaptain,
    isPassenger,
    isDelegate,
    suspendUserDocListener,
    resumeUserDocListener,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
      {logoutDialogOpen ? (
        <LogoutDialog
          cancelLabel={t('cancel')}
          confirmLabel={t('confirm')}
          description={t('description')}
          direction={direction}
          inProgressLabel={t('inProgress')}
          isInProgress={logoutInProgress}
          onConfirm={() => void confirmLogout()}
          onOpenChange={(open) => !logoutInProgress && setLogoutDialogOpen(open)}
          open={logoutDialogOpen}
          title={t('title')}
        />
      ) : null}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  return <AuthContent>{children}</AuthContent>;
}

// A request still "in flight" — anything before the trip is over — must be
// cancelled server-side on logout instead of left orphaned for the other
// side (rider or captain) to keep waiting on. Re-derives this from the DB by
// id/role rather than any client-side dashboard state, since that state may
// not be mounted at all from wherever the logout button was pressed.
// Must exactly match the live `ride_request_status` Postgres enum members —
// any value here that isn't a real enum label makes PostgREST fail the whole
// `.in()` filter with a 400 (bad enum cast), silently skipping the cancel.
const NON_TERMINAL_REQUEST_STATUSES = [
  'PENDING', 'RECEIVING_OFFERS', 'ACCEPTED', 'EN_ROUTE', 'ARRIVED', 'TRIP_ACTIVE',
];

async function cancelActiveRequestBeforeLogout(user: SovereignUser | null) {
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
    if ((process.env.NODE_ENV !== 'production')) console.warn('[Logout active-request cleanup]', error);
  }
}

function purgeTransientFrontendCache() {
  if (typeof window === 'undefined') return;

  const sessionKeys = [
    'sovereign_write_lock',
    'sovereign_trip_status',
    'sovereign_driver_status',
    'sovereign_rejected_trips_v1',
  ];

  const localKeys = [
    'sovereign_gps_local_buffer',
    'radar_rider_local_reports',
  ];

  for (const key of sessionKeys) {
    window.sessionStorage.removeItem(key);
  }

  for (const key of localKeys) {
    window.localStorage.removeItem(key);
  }
}

function restorePreservedLanguage(language: string | null) {
  if (typeof window === 'undefined' || (language !== 'ar' && language !== 'en')) return;
  window.localStorage.setItem(DASHBOARD_LANGUAGE_KEY, language);
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
