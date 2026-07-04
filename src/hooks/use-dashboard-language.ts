import { useCallback, useEffect, useState } from 'react';
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

function applyDocumentLanguage(language: AppLanguage) {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = language;
  document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
}

export function useDashboardLanguage() {
  const [language, setLanguageState] = useState<AppLanguage>(() => readStoredDashboardLanguage());

  useEffect(() => {
    applyDocumentLanguage(language);
  }, [language]);

  useEffect(() => {
    const handleLanguageChange = (event: Event) => {
      const nextLanguage = (event as CustomEvent<AppLanguage>).detail === 'en' ? 'en' : 'ar';
      setLanguageState(nextLanguage);
    };

    window.addEventListener(DASHBOARD_LANGUAGE_EVENT, handleLanguageChange);
    return () => window.removeEventListener(DASHBOARD_LANGUAGE_EVENT, handleLanguageChange);
  }, []);

  const setLanguage = useCallback((nextLanguage: AppLanguage) => {
    const normalizedLanguage = nextLanguage === 'en' ? 'en' : 'ar';
    persistDashboardLanguage(normalizedLanguage);
    setLanguageState(normalizedLanguage);
    applyDocumentLanguage(normalizedLanguage);
    window.dispatchEvent(new CustomEvent(DASHBOARD_LANGUAGE_EVENT, { detail: normalizedLanguage }));
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  }, [language, setLanguage]);

  return {
    direction: language === 'ar' ? 'rtl' : 'ltr',
    isArabic: language === 'ar',
    language,
    setLanguage,
    toggleLanguage,
  };
}
