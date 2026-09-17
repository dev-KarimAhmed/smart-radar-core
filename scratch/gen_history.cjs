const fs = require('fs');

const body = fs.readFileSync('scratch/history-hook.txt', 'utf8')
  .replace(/export function HistoryTab[^\{]*\{/, '')
  .replace(/const copy = historyLanguageCopy\[language\];/, "const t = useTranslations('historyTab');");

const content = `import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { dexieDb, type RiderTripLedgerEntry } from '@/lib/dexie-db';
import { fetchFavoriteCaptainIds, setFavoriteCaptain } from '../services/favorite-captains';
import { supabase } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';
import { SOVEREIGN_ERR_DICTIONARY } from '@/core/config/sovereign-errors';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { useTranslations } from 'next-intl';
import {
  HISTORY_TTL_MS,
  type HistoricalTrip,
  getCaptainIdFromTrip,
  getHistoryCaptainName,
  getHistoryCaptainRank,
  getHistoryCaptainPhone,
  getHistoryVehicleInfo,
  parseTripTimestamp,
  fetchRowsByIds,
  enrichCaptainDetails,
  getTripHistoryId,
  appendUniqueTrips,
  mapLedgerRowToTripShape,
  tripShapeToRiderLedgerEntry
} from './history-shared';

export function useHistoryState() {
${body}
  return {
    favoriteCaptainIds,
    sovereignLogs,
    realTrips,
    tripReviews,
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
    currencyLabel,
    t,
  };
}
`;

fs.writeFileSync('src/features/account/components/history-tab/use-history-state.ts', content);
console.log('Done generating use-history-state.ts');
