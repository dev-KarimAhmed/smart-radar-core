import { useEffect, type Dispatch, type SetStateAction } from 'react';
import type { User as SovereignUser } from '@/core/types';
import {
  buildUserFromSupabaseAuth,
  cacheSupabaseSession,
  clearSupabaseSessionCache,
} from '@/lib/supabase-auth';
import { hasStoredSupabaseAuthSession } from '@/features/auth/services/supabase-auth-storage';
import { syncServerTime } from '@/lib/server-time';
import { getInitialUserFromCache, purgeTransientFrontendCache } from './auth-types-cache';

export function useAuthBootstrap(
  setUser: Dispatch<SetStateAction<SovereignUser | null>>,
  setLoading: Dispatch<SetStateAction<boolean>>,
): void {
  useEffect(() => {
    let mounted = true;
    let unsubscribe = () => {};
    let bootstrapCompleted = false;

    // Sync server time as early as possible
    syncServerTime();

    // Fast-restore cached session on client mount without hydration mismatch
    const cachedUser = getInitialUserFromCache();
    if (cachedUser) {
      setUser(cachedUser);
      setLoading(false);
    }

    // Intercept recovery links landing on root or dashboard before auth redirects kick in
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
      // Do not wipe session if we already restored a valid cached user
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

            // Verify with server to immediately detect deleted/purged accounts
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
          // If the phone just woke up from sleep or is temporarily offline, token auto-refresh
          // can transiently fail before LTE/Wi-Fi reassociates. Check if durable storage still has a session.
          const hasStored = hasStoredSupabaseAuthSession();
          const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
          if (hasStored || isOffline) {
            // Keep current user state intact and attempt a quiet background session refresh
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

      // Silently re-check session when device wakes up or network recovers
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
      if (!getInitialUserFromCache()) {
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
  }, [setUser, setLoading]);
}
