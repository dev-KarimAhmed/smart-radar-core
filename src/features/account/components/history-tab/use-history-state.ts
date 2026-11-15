import { useAuth } from '@/hooks/use-auth';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { useTranslations } from 'next-intl';
import { useCountryConfig } from '@/shared/hooks/use-country-config';
import { getCurrencyLabel } from '@/shared/services/currency-label';
import { useHistoryErrorCatalog } from './hooks/use-history-error-catalog';
import { useHistorySovereignLogs } from './hooks/use-history-sovereign-logs';
import { useHistoryTripsFetcher } from './hooks/use-history-trips-fetcher';
import { useHistoryTripMappers } from './hooks/use-history-trip-mappers';
import { useHistoryFavorites } from './hooks/use-history-favorites';

export * from './hooks/use-history-error-catalog';
export * from './hooks/use-history-sovereign-logs';
export * from './hooks/use-history-trips-fetcher';
export * from './hooks/use-history-trip-mappers';
export * from './hooks/use-history-favorites';

export function useHistoryState() {
  const { user, isCaptain, isPassenger } = useAuth();
  const { isArabic, language } = useDashboardLanguage();
  const t = useTranslations('historyTab');
  const tRef = useTranslations('referral.linkedCaptain');

  const countryConfig = useCountryConfig(user?.countryId);
  const currencyLabel = getCurrencyLabel(countryConfig, user, language) || (isArabic ? 'د.أ' : 'JOD');

  const {
    errorSearch,
    setErrorSearch,
    errorCategory,
    setErrorCategory,
    expandedErrorCode,
    setExpandedErrorCode,
    filteredErrors,
  } = useHistoryErrorCatalog();

  const { sovereignLogs, clearSovereignLogs } = useHistorySovereignLogs({
    user,
    isCaptain,
    t,
  });

  const { realTrips, tripReviews, refreshReviews, loading } = useHistoryTripsFetcher({
    user,
    isCaptain,
    isArabic,
  });

  const { riderHistoricalTrips, captainHistoricalTrips } = useHistoryTripMappers({
    realTrips,
    isArabic,
  });

  const {
    favoriteCaptainIds,
    linkedCaptain,
    favoriteCaptains,
    toggleFavorite,
  } = useHistoryFavorites({
    isPassenger,
    isArabic,
    riderHistoricalTrips,
    tRef,
  });

  return {
    favoriteCaptainIds,
    linkedCaptain,
    sovereignLogs,
    realTrips,
    tripReviews,
    refreshReviews,
    loading,
    errorSearch,
    setErrorSearch,
    errorCategory,
    setErrorCategory,
    expandedErrorCode,
    setExpandedErrorCode,
    filteredErrors,
    riderHistoricalTrips,
    favoriteCaptains,
    captainHistoricalTrips,
    toggleFavorite,
    clearSovereignLogs,
    user,
    isCaptain,
    isPassenger,
    isArabic,
    language,
    currencyLabel,
    t,
  };
}
