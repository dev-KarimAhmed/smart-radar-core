// Localization now lives in next-intl message catalogs (`src/messages/{ar,en}.json`)
// consumed via `useTranslations`. This module only retains the shared language
// types, which are still imported across the app (and by the LocaleProvider).

export type AppLanguage = 'ar' | 'en';

export type LocalizedText = {
  ar: string;
  en: string;
};
