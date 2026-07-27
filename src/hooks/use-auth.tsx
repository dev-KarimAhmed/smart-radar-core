'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import type { User as SovereignUser } from '@/core/types';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import {
  AUTH_SESSION_CREATED_EVENT,
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

    if (!hasStoredSupabaseAuthSession()) {
      setLoading(false);
      const reloadForSession = () => window.location.reload();
      window.addEventListener(AUTH_SESSION_CREATED_EVENT, reloadForSession, { once: true });
      return () => {
        mounted = false;
        window.removeEventListener(AUTH_SESSION_CREATED_EVENT, reloadForSession);
      };
    }

    setLoading(true);
    void import('@/lib/supabase-client').then(({ supabase }) => {
      if (!mounted) return;
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
  }, [router]);

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
