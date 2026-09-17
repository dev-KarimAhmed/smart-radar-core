const fs = require('fs');

const original = fs.readFileSync('scratch/history-original.tsx', 'utf8');

const hookStartStr = 'export function HistoryTab({ hideCaptainDiagnostics = false }: HistoryTabProps = {}) {';
const hookStart = original.indexOf(hookStartStr);
if (hookStart === -1) {
  console.error("Could not find hook start");
  process.exit(1);
}

const renderStartStr = "if (language === 'en' && isPassenger) {";
const hookEnd = original.indexOf(renderStartStr, hookStart);
if (hookEnd === -1) {
  console.error("Could not find render start");
  process.exit(1);
}

let hookBody = original.substring(hookStart + hookStartStr.length, hookEnd);

hookBody = hookBody.replace(/const copy = historyLanguageCopy\[language\];/, "const t = useTranslations('historyTab');");
hookBody = hookBody.replace(/const renderDetailedReview = \([\s\S]*?\};\n\n/g, '');

const finalHook = `import { useState, useEffect, useMemo } from 'react';
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
${hookBody}
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
    language,
    currencyLabel,
    t,
  };
}
`;

fs.writeFileSync('src/features/account/components/history-tab/use-history-state.ts', finalHook);
console.log('Hook rewritten cleanly.');
