'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { User as SovereignUser } from '@/core/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { buildUserFromSupabaseAuth, cacheSupabaseSession, clearSupabaseSessionCache } from '@/lib/supabase-auth';
import { supabase } from '@/lib/supabase-client';
import { DASHBOARD_LANGUAGE_KEY } from './use-dashboard-language';

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
  const [user, setUser] = useState<SovereignUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [logoutInProgress, setLogoutInProgress] = useState(false);
  const [promoData] = useState<any>(null);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
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

    return () => {
      mounted = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  const loginAsMockUser = useCallback((mockUser: SovereignUser) => {
    if (!import.meta.env.DEV) return;
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
      await supabase.auth.signOut();
    } catch {
      setUser(null);
    } finally {
      clearSupabaseSessionCache();
      purgeTransientFrontendCache();
      restorePreservedLanguage(preservedLanguage);
      setLoading(false);
      if (typeof window !== 'undefined') {
        window.history.replaceState(null, '', '/');
        window.dispatchEvent(new PopStateEvent('popstate'));
      }
      setLogoutDialogOpen(false);
      setLogoutInProgress(false);
    }
  }, []);

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
      <AlertDialog open={logoutDialogOpen} onOpenChange={(open) => !logoutInProgress && setLogoutDialogOpen(open)}>
        <AlertDialogContent className="border-red-500/25 bg-[#0B0F19] text-white shadow-2xl" dir="rtl">
          <AlertDialogHeader className="text-right">
            <AlertDialogTitle className="text-xl font-black text-white">تأكيد تسجيل الخروج</AlertDialogTitle>
            <AlertDialogDescription className="text-right text-sm leading-6 text-[#94A3B8]">
              هل أنت متأكد من تسجيل الخروج؟ سيتم حذف الجلسة الحالية من هذا الجهاز فقط.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:justify-start sm:space-x-0">
            <AlertDialogCancel
              disabled={logoutInProgress}
              className="border-white/10 bg-white/10 font-bold text-white hover:bg-white/15"
            >
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              disabled={logoutInProgress}
              onClick={(event) => {
                event.preventDefault();
                void confirmLogout();
              }}
              className="bg-red-600 font-black text-white hover:bg-red-500"
            >
              {logoutInProgress ? 'جاري الخروج...' : 'نعم، تسجيل الخروج'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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
