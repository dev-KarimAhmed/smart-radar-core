import type { AppLanguage } from '@/lib/i18n/simple-copy';

export const DASHBOARD_LANGUAGE_KEY = 'radar_dashboard_language';
export const DASHBOARD_LANGUAGE_EVENT = 'radar-dashboard-language-change';

export function getDeviceDashboardLanguage(): AppLanguage {
  if (typeof navigator === 'undefined') return 'ar';
  return navigator.language?.toLowerCase().startsWith('ar') ? 'ar' : 'en';
}

export function readStoredDashboardLanguage(): AppLanguage {
  if (typeof window === 'undefined') return 'ar';
  const storedLanguage = window.localStorage.getItem(DASHBOARD_LANGUAGE_KEY);
  if (storedLanguage === 'ar' || storedLanguage === 'en') return storedLanguage;
  return getDeviceDashboardLanguage();
}

export function persistDashboardLanguage(language: AppLanguage) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(DASHBOARD_LANGUAGE_KEY, language === 'en' ? 'en' : 'ar');
}
