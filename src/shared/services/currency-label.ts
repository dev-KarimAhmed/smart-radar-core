import type { AppLanguage } from '@/lib/i18n/simple-copy';
import type { CountryCurrencyConfig } from '../hooks/use-country-config';

const ISO_CURRENCY_LABELS_AR: Record<string, string> = {
  EGP: 'ج.م',
  JOD: 'د.أ',
  SAR: 'ر.س',
  AED: 'د.إ',
  KWD: 'د.ك',
  QAR: 'ر.ق',
  BHD: 'د.ب',
  OMR: 'ر.ع',
  IQD: 'د.ع',
  LBP: 'ل.ل',
  SYP: 'ل.س',
  YER: 'ر.ي',
  MAD: 'د.م',
  TND: 'د.ت',
  DZD: 'د.ج',
  LYD: 'د.ل',
  SDG: 'ج.س',
  USD: 'دولار',
  EUR: 'يورو',
};

/** Maps a live ISO 4217 currency code to the user's active language display label. */
export function localizeLiveCurrencyCode(
  liveCurrencyCode: string | null | undefined,
  countryConfig: CountryCurrencyConfig | null,
  user: { currencyAr?: string; currencyEn?: string } | null | undefined,
  language: AppLanguage = 'ar',
): string {
  const code = String(liveCurrencyCode || '').trim().toUpperCase();
  if (!code) return getCurrencyLabel(countryConfig, user, language);

  if (countryConfig?.currency_code && countryConfig.currency_code.toUpperCase() === code) {
    return getCurrencyLabel(countryConfig, user, language);
  }

  if (language === 'ar') {
    return ISO_CURRENCY_LABELS_AR[code] || code;
  }

  return code;
}

/** Picks the display currency name for the account's country, in the given language. */
export function getCurrencyLabel(
  countryConfig: CountryCurrencyConfig | null,
  user: { currencyAr?: string; currencyEn?: string } | null | undefined,
  language: AppLanguage = 'ar',
) {
  if (language === 'en') {
    return (
      countryConfig?.currency_en ||
      user?.currencyEn ||
      countryConfig?.currency_code ||
      countryConfig?.currency_ar ||
      user?.currencyAr ||
      ''
    );
  }

  return countryConfig?.currency_ar || user?.currencyAr || countryConfig?.currency_en || user?.currencyEn || countryConfig?.currency_code || '';
}
