import type { AppLanguage } from '@/lib/i18n/simple-copy';
import type { CountryCurrencyConfig } from '../hooks/use-country-config';

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

/** Resolves the display currency symbol for a user according to country/phone and language. */
export function resolveUserCurrency(
  user: { countryId?: number; phone?: string; currencyAr?: string; currencyEn?: string } | null | undefined,
  language: 'ar' | 'en' = 'ar',
): string {
  const isEgypt = user?.countryId === 2 || (typeof user?.phone === 'string' && user.phone.startsWith('+20'));
  const fallback = isEgypt ? (language === 'ar' ? 'ج.م' : 'EGP') : (language === 'ar' ? 'د.أ' : 'JOD');
  return (language === 'ar' ? user?.currencyAr : user?.currencyEn) || user?.currencyAr || user?.currencyEn || fallback;
}
