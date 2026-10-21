'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import type { AppLanguage } from '@/lib/i18n/simple-copy';
import {
  DASHBOARD_LANGUAGE_EVENT,
  persistDashboardLanguage,
  readStoredDashboardLanguage,
} from '@/lib/i18n/language-storage';
import arMessages from '@/messages/ar.json';
import enMessages from '@/messages/en.json';

const styles = {
  root: "",
} as const;


const MESSAGES: Record<AppLanguage, typeof arMessages> = {
  ar: arMessages,
  en: enMessages,
};

type LocaleContextValue = {
  currentLocale: AppLanguage;
  setLocale: (language: AppLanguage) => void;
  toggleLocale: () => void;
};

const LocaleContext = createContext<LocaleContextValue | null>(null);

export function useLocaleContext(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocaleContext must be used within a LocaleProvider');
  }
  return context;
}

function applyDocumentLanguage(language: AppLanguage) {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = language;
  document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  // Start from the SSR default ('ar') so the server render and first client
  // render match, then sync to the stored/device preference after mount.
  const [locale, setLocaleState] = useState<AppLanguage>('ar');

  const applyLocale = useCallback((language: AppLanguage) => {
    const normalized: AppLanguage = language === 'en' ? 'en' : 'ar';
    setLocaleState(normalized);
    persistDashboardLanguage(normalized);
    applyDocumentLanguage(normalized);
  }, []);

  // Post-mount sync to the persisted/device locale (no reload).
  useEffect(() => {
    const stored = readStoredDashboardLanguage();
    setLocaleState(stored);
    applyDocumentLanguage(stored);
  }, []);

  // Keep in sync with language changes dispatched elsewhere via the shared CustomEvent bus.
  useEffect(() => {
    const handleLanguageChange = (event: Event) => {
      const detail = (event as CustomEvent<AppLanguage>).detail;
      const next: AppLanguage = detail === 'en' ? 'en' : 'ar';
      setLocaleState((current) => {
        if (current === next) return current;
        applyDocumentLanguage(next);
        persistDashboardLanguage(next);
        return next;
      });
    };
    window.addEventListener(DASHBOARD_LANGUAGE_EVENT, handleLanguageChange);
    return () => window.removeEventListener(DASHBOARD_LANGUAGE_EVENT, handleLanguageChange);
  }, []);

  const setLocale = useCallback(
    (language: AppLanguage) => {
      const normalized: AppLanguage = language === 'en' ? 'en' : 'ar';
      applyLocale(normalized);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent(DASHBOARD_LANGUAGE_EVENT, { detail: normalized }));
      }
    },
    [applyLocale],
  );

  const toggleLocale = useCallback(() => {
    const next: AppLanguage = locale === 'ar' ? 'en' : 'ar';
    applyLocale(next);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(DASHBOARD_LANGUAGE_EVENT, { detail: next }));
    }
  }, [locale, applyLocale]);

  const contextValue = useMemo<LocaleContextValue>(
    () => ({
      currentLocale: locale,
      setLocale,
      toggleLocale,
    }),
    [setLocale, toggleLocale, locale],
  );

  return (
    <LocaleContext.Provider value={contextValue}>
      <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]} timeZone="Asia/Amman">
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  );
}
