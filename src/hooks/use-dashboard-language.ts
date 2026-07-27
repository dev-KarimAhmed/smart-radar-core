import { useCallback } from 'react';

import type { AppLanguage } from '@/lib/i18n/simple-copy';
import { useLocaleContext } from '@/components/providers/locale-provider';

// Storage helpers + the CustomEvent bus live in a React-free module so the
// provider can reuse them without importing this hook (avoids an import cycle).
// Re-exported here to preserve the historical `@/hooks/use-dashboard-language`
// import path used across the app.
export {
  DASHBOARD_LANGUAGE_KEY,
  DASHBOARD_LANGUAGE_EVENT,
  getDeviceDashboardLanguage,
  readStoredDashboardLanguage,
  persistDashboardLanguage,
} from '@/lib/i18n/language-storage';

/**
 * Thin adapter over next-intl. Keeps the original public shape
 * (`{ direction, isArabic, language, setLanguage, toggleLanguage }`) so the
 * many consumers that only use it for RTL / conditional rendering stay unchanged,
 * while the actual locale state is owned by `LocaleProvider` + next-intl.
 */
export function useDashboardLanguage() {
  const { currentLocale, setLocale, toggleLocale } = useLocaleContext();
  const language: AppLanguage = currentLocale === 'en' ? 'en' : 'ar';

  const setLanguage = useCallback((nextLanguage: AppLanguage) => setLocale(nextLanguage), [setLocale]);

  return {
    direction: language === 'ar' ? 'rtl' : 'ltr',
    isArabic: language === 'ar',
    language,
    setLanguage,
    toggleLanguage: toggleLocale,
  };
}
