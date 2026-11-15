import { useEffect } from 'react';
import type { User as SovereignUser } from '@/core/types';
import { DASHBOARD_LANGUAGE_KEY, DASHBOARD_LANGUAGE_EVENT } from '../use-dashboard-language';

export function useProfileLanguageSync(user: SovereignUser | null): void {
  useEffect(() => {
    if (!user?.uid) return;

    const syncLanguageToProfile = async (targetLang: 'ar' | 'en') => {
      try {
        const { supabase } = await import('@/lib/supabase-client');
        await supabase
          .from('profiles')
          .update({ preferred_language: targetLang })
          .eq('id', user.uid);
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[useAuth] Failed to sync preferred_language:', err);
        }
      }
    };

    const stored = typeof window !== 'undefined'
      ? (window.localStorage.getItem(DASHBOARD_LANGUAGE_KEY) as 'ar' | 'en' | null)
      : null;
    if (stored === 'en' || stored === 'ar') {
      void syncLanguageToProfile(stored);
    }

    const handleLangChange = (event: Event) => {
      const detail = (event as CustomEvent<'ar' | 'en'>).detail;
      if (detail === 'en' || detail === 'ar') {
        void syncLanguageToProfile(detail);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(DASHBOARD_LANGUAGE_EVENT, handleLangChange);
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener(DASHBOARD_LANGUAGE_EVENT, handleLangChange);
      }
    };
  }, [user?.uid]);
}
