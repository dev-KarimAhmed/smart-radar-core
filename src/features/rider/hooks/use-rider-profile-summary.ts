import React from 'react';
import { useTranslations } from 'next-intl';
import type { AppLanguage } from '@/lib/i18n/simple-copy';
import type { RiderLocationStatus } from '../components/rider-map';
import { getCurrencyLabel } from '../services/rider-view-format';

interface RiderProfileLike {
  uid?: string;
  rating?: number;
  ratingSum?: number;
  ratingCount?: number;
  governorate?: string;
  district?: string;
  currencyAr?: string;
  currencyEn?: string;
}
interface CountryCurrencyConfig { currency_ar?: string | null; currency_en?: string | null; currency_code?: string | null; }

/** Formats the rider's profile card, the map's local system messages, and the account's currency label. */
export function useRiderProfileSummary(
  user: RiderProfileLike | null | undefined,
  language: AppLanguage,
  countryConfig: CountryCurrencyConfig | null,
  locationStatus: RiderLocationStatus,
) {
  const t = useTranslations('riderView');

  const currencyLabel = getCurrencyLabel(countryConfig, user, language);

  const riderProfile = React.useMemo(() => {
    const ratingValue =
      user?.rating !== undefined
        ? user.rating
        : user?.ratingSum && user?.ratingCount
          ? user.ratingSum / user.ratingCount
          : 4.8;

    return {
      id: user?.uid || 'local-rider',
      rating: ratingValue,
      governorate: user?.governorate || t('profileFallback.governorate'),
      district: user?.district || t('profileFallback.district'),
    };
  }, [t, user]);

  const systemMessages = React.useMemo(
    () => [
      t('systemMessages.freeMapNotice'),
      t('systemMessages.currentAreaLabel', {
        area: locationStatus === 'live' ? t('systemMessages.liveLocationArea') : t('systemMessages.fallbackAreaLabel'),
      }),
    ],
    [locationStatus, t],
  );

  return { riderProfile, systemMessages, currencyLabel };
}
