'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
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
import { useToast } from './use-toast';
import { syncServerTime } from '@/lib/server-time';
import {
  getInitialUserFromCache,
  cancelActiveRequestBeforeLogout,
  purgeTransientFrontendCache,
  restorePreservedLanguage,
} from './auth-session-cleanup';
import { useSessionTakeoverListener, usePreferredLanguageSync } from './use-auth-session-sync';

export { purgeTransientFrontendCache };

const LogoutDialog = dynamic(
  () => import('@/features/auth/components/logout-dialog').then((module) => module.LogoutDialog),
  { ssr: false },
);

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
  const { toast } = useToast();
  const { direction } = useDashboardLanguage();
  const [user, setUser] = useState<SovereignUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [logoutInProgress, setLogoutInProgress] = useState(false);
  const [promoData] = useState<any>(null);

  useEffect(() => {
    let mounted = true;
    let unsubscribe = () => {};
    let bootstrapCompleted = false;

    syncServerTime();

    const cachedUser = getInitialUserFromCache();
    if (cachedUser) {
      setUser(cachedUser);
      setLoading(false);
    }

    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/reset-password')) {
      const hash = window.location.hash || '';
      const search = window.location.search || '';
      const isRecoveryIntent =
        hash.includes('type=recovery') ||
        hash.includes('access_token=') ||
        (hash.includes('error=') && (hash.includes('recovery') || hash.includes('otp'))) ||
        search.includes('type=recovery') ||
        (search.includes('error=') && search.includes('recovery'));

      if (isRecoveryIntent) {
        window.location.replace('/reset-password' + search + hash);
        return;
      }
    }

    const finishBootstrap = () => {
      if (bootstrapCompleted || !mounted) return;
      bootstrapCompleted = true;
      setLoading(false);
    };

    const hadStoredSession = hasStoredSupabaseAuthSession();
    if (!hadStoredSession && !cachedUser) {
      finishBootstrap();
    }

    const bootstrapTimeout = window.setTimeout(() => {
      if (!mounted || bootstrapCompleted) return;
      if (!cachedUser && !getInitialUserFromCache()) {
        clearSupabaseSessionCache();
        setUser(null);
      }
      finishBootstrap();
    }, 5_000);

    void import('@/lib/supabase-client').then(({ supabase }) => {
      if (!mounted) return;

      if (hadStoredSession) {
        void supabase.auth.getSession().then(({ data: sessionData }) => {
          if (!mounted) return;
          const session = sessionData.session;
          if (session?.user) {
            cacheSupabaseSession(session);
            setUser(buildUserFromSupabaseAuth(session.user) as SovereignUser);

            void supabase.auth.getUser().then(({ data: userData, error: userError }) => {
              if (!mounted) return;
              if (userError || !userData?.user) {
                clearSupabaseSessionCache();
                purgeTransientFrontendCache();
                if (typeof window !== 'undefined') {
                  window.localStorage.removeItem('radar_sovereign_mock_user');
                  window.sessionStorage.removeItem('radar_sovereign_mock_user');
                }
                setUser(null);
                void supabase.auth.signOut().catch(() => {});
              }
            }).catch(() => {});
          } else if (!cachedUser) {
            setUser(null);
          }
          finishBootstrap();
        }).catch(() => {
          if (!mounted) return;
          if (!cachedUser && !getInitialUserFromCache()) {
            clearSupabaseSessionCache();
            setUser(null);
          }
          finishBootstrap();
        });
      } else {
        finishBootstrap();
      }

      const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
        if (!mounted) return;
        cacheSupabaseSession(session);
        supabase.realtime.setAuth(session?.access_token ?? null);
        if (_event === 'PASSWORD_RECOVERY') {
          if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/reset-password')) {
            window.location.replace('/reset-password' + window.location.search + window.location.hash);
            return;
          }
        }
        if (session?.user) {
          setUser(buildUserFromSupabaseAuth(session.user) as SovereignUser);
        } else if (_event === 'SIGNED_OUT') {
          const hasStored = hasStoredSupabaseAuthSession();
          const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
          if (hasStored || isOffline) {
            void supabase.auth.getSession().then(({ data }) => {
              if (data?.session?.user && mounted) {
                cacheSupabaseSession(data.session);
                setUser(buildUserFromSupabaseAuth(data.session.user) as SovereignUser);
              }
            }).catch(() => {});
            return;
          }
          setUser(null);
          void import('@/shared/hooks/use-notifications').then(({ clearNotificationMemoryStore }) => {
            clearNotificationMemoryStore();
          }).catch(() => {});
        }
        finishBootstrap();
      });

      const handleWakeOrOnline = () => {
        if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
        if (hasStoredSupabaseAuthSession()) {
          void supabase.auth.getSession().then(({ data }) => {
            if (data?.session?.user && mounted) {
              cacheSupabaseSession(data.session);
              setUser(buildUserFromSupabaseAuth(data.session.user) as SovereignUser);
            }
          }).catch(() => {});
        }
      };

      if (typeof window !== 'undefined') {
        window.addEventListener('online', handleWakeOrOnline);
      }
      if (typeof document !== 'undefined') {
        document.addEventListener('visibilitychange', handleWakeOrOnline);
      }

      unsubscribe = () => {
        subscription.subscription.unsubscribe();
        if (typeof window !== 'undefined') {
          window.removeEventListener('online', handleWakeOrOnline);
        }
        if (typeof document !== 'undefined') {
          document.removeEventListener('visibilitychange', handleWakeOrOnline);
        }
      };
    }).catch(() => {
      if (!mounted) return;
      if (!user && !getInitialUserFromCache()) {
        clearSupabaseSessionCache();
        setUser(null);
      }
      finishBootstrap();
    });

    return () => {
      mounted = false;
      window.clearTimeout(bootstrapTimeout);
      unsubscribe();
    };
  }, []);

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
  useEffect(() => {
    forceKickoutRef.current = forceKickout;
  });

  useSessionTakeoverListener({ user, forceKickoutRef, toast });
  usePreferredLanguageSync(user?.uid);

  const loginAsMockUser = useCallback((mockUser: SovereignUser) => {
    if (process.env.NODE_ENV === 'production') return;
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

  const value = useMemo(
    () => ({
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
    }),
    [
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
    ]
  );

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

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
