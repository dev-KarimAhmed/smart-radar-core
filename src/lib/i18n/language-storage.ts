import type { AppLanguage } from '@/lib/i18n/simple-copy';

export const DASHBOARD_LANGUAGE_KEY = 'radar_dashboard_language';
export const DASHBOARD_LANGUAGE_EVENT = 'radar-dashboard-language-change';

export function getDeviceDashboardLanguage(): AppLanguage {
  if (typeof navigator === 'undefined') return 'ar';
  return navigator.language?.toLowerCase().startsWith('ar') ? 'ar' : 'en';
}

export function readStoredDashboardLanguage(): AppLanguage {
  if (typeof window === 'undefined') return 'ar';
  try {
    const storedLanguage = window.localStorage.getItem(DASHBOARD_LANGUAGE_KEY);
    if (storedLanguage === 'ar' || storedLanguage === 'en') return storedLanguage;
    const cookieMatch = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/);
    if (cookieMatch && (cookieMatch[1] === 'ar' || cookieMatch[1] === 'en')) {
      return cookieMatch[1] as AppLanguage;
    }
  } catch {}
  return 'ar';
}

export function persistDashboardLanguage(language: AppLanguage) {
  if (typeof window === 'undefined') return;
  const normalized: AppLanguage = language === 'en' ? 'en' : 'ar';
  try {
    window.localStorage.setItem(DASHBOARD_LANGUAGE_KEY, normalized);
    document.cookie = `NEXT_LOCALE=${normalized}; path=/; max-age=31536000; SameSite=Lax`;
  } catch {}
}
