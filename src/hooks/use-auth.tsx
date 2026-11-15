'use client';

import React, { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import type { User as SovereignUser } from '@/core/types';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { clearSupabaseSessionCache } from '@/lib/supabase-auth';
import { DASHBOARD_LANGUAGE_KEY, useDashboardLanguage } from './use-dashboard-language';
import { useToast } from './use-toast';
import {
  type AuthContextType,
  cancelActiveRequestBeforeLogout,
  purgeTransientFrontendCache,
  restorePreservedLanguage,
} from './auth/auth-types-cache';
import { useAuthBootstrap } from './auth/use-auth-bootstrap';
import { useSessionTakeover, useProfileLanguageSync } from './auth/use-session-takeover';

export { purgeTransientFrontendCache } from './auth/auth-types-cache';

const LogoutDialog = dynamic(
  () => import('@/features/auth/components/logout-dialog').then((module) => module.LogoutDialog),
  { ssr: false },
);

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function AuthContent({ children }: { children: ReactNode }) {
  const router = useRouter();
  const t = useTranslations('auth.logout');
  const { toast } = useToast();
  const { direction } = useDashboardLanguage();
  const [user, setUser] = useState<SovereignUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [logoutInProgress, setLogoutInProgress] = useState(false);
  const [promoData] = useState<any>(null);

  // 1. Session bootstrap and background listeners
  useAuthBootstrap(setUser, setLoading);

  // 2. Force kickout handler for foreign session takeover
  const forceKickout = useCallback(async () => {
    const preservedLanguage =
      typeof window !== 'undefined' ? window.localStorage.getItem(DASHBOARD_LANGUAGE_KEY) : null;
    try {
      await cancelActiveRequestBeforeLogout(user);
    } catch {}
    clearSupabaseSessionCache();
    purgeTransientFrontendCache();
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('radar_admin_active_id');
      window.sessionStorage.removeItem('radar_admin_active_id');
      window.localStorage.removeItem('radar_sovereign_mock_user');
      window.sessionStorage.removeItem('radar_sovereign_mock_user');
    }
    restorePreservedLanguage(preservedLanguage);
    setUser(null);
    try {
      const { supabase } = await import('@/lib/supabase-client');
      try {
        supabase.removeAllChannels();
      } catch {}
      await supabase.auth.signOut();
    } catch {
      setUser(null);
    } finally {
      clearSupabaseSessionCache();
      purgeTransientFrontendCache();
      restorePreservedLanguage(preservedLanguage);
      setLoading(false);
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  }, [user]);

  const forceKickoutRef = useRef(forceKickout);
  forceKickoutRef.current = forceKickout;

  // 3. Multi-device takeover broadcast & preferred language profile sync
  useSessionTakeover(user, forceKickoutRef, toast);
  useProfileLanguageSync(user);

  const loginAsMockUser = useCallback((mockUser: SovereignUser) => {
    if (!(process.env.NODE_ENV !== 'production')) return;
    setUser(mockUser);
    setLoading(false);
    if (typeof window !== 'undefined' && mockUser?.uid) {
      window.localStorage.setItem('radar_admin_active_id', mockUser.uid);
      window.localStorage.setItem('radar_sovereign_mock_user', JSON.stringify(mockUser));
    }
  }, []);

  const logout = useCallback(async () => {
    setLogoutDialogOpen(true);
  }, []);

  const confirmLogout = useCallback(async () => {
    setLogoutInProgress(true);
    const preservedLanguage =
      typeof window !== 'undefined' ? window.localStorage.getItem(DASHBOARD_LANGUAGE_KEY) : null;
    await cancelActiveRequestBeforeLogout(user);
    clearSupabaseSessionCache();
    purgeTransientFrontendCache();
    try {
      const { clearNotificationMemoryStore } = await import('@/shared/hooks/use-notifications');
      clearNotificationMemoryStore();
    } catch {}
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('radar_admin_active_id');
      window.sessionStorage.removeItem('radar_admin_active_id');
      window.localStorage.removeItem('radar_sovereign_mock_user');
      window.sessionStorage.removeItem('radar_sovereign_mock_user');
    }
    restorePreservedLanguage(preservedLanguage);
    const logoutUserId = user?.uid;
    const currentDeviceId =
      typeof window !== 'undefined' ? window.localStorage.getItem('radar_device_id') : undefined;
    if (logoutUserId || currentDeviceId) {
      void fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: logoutUserId, deviceId: currentDeviceId }),
      }).catch(() => {});
    }
    setUser(null);
    try {
      const { supabase } = await import('@/lib/supabase-client');
      try {
        supabase.removeAllChannels();
      } catch {}
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

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
