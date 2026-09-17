const fs = require('fs');

const content = fs.readFileSync('src/features/account/components/history-tab.tsx', 'utf8');

const startStr = 'export function HistoryTab({ hideCaptainDiagnostics = false }: HistoryTabProps = {}) {';
const startIdx = content.indexOf(startStr);
const endIdx = content.indexOf('return (', startIdx);

const body = content.substring(startIdx + startStr.length, endIdx);

const hookContent = `import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { dexieDb, type RiderTripLedgerEntry } from '@/lib/dexie-db';
import { fetchFavoriteCaptainIds, setFavoriteCaptain } from '../services/favorite-captains';
import { supabase } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';
import { SOVEREIGN_ERR_DICTIONARY } from '@/core/config/sovereign-errors';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
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
  };
}
`;

fs.writeFileSync('src/features/account/components/history-tab/use-history-state.ts', hookContent);
console.log('Hook generated.');
