import re

with open('scratch/history-original.tsx', 'r', encoding='utf-8-sig') as f:
    original = f.read()

hookStartStr = 'export default function HistoryTab({ hideCaptainDiagnostics = false }: HistoryTabProps = {}) {'
hookStart = original.find(hookStartStr)
if hookStart == -1:
    hookStartStr = 'export function HistoryTab({ hideCaptainDiagnostics = false }: HistoryTabProps = {}) {'
    hookStart = original.find(hookStartStr)

if hookStart == -1:
    print("Could not find hook start")
    exit(1)

renderStartStr = "if (language === 'en' && isPassenger) {"
hookEnd = original.find(renderStartStr, hookStart)

if hookEnd == -1:
    print("Could not find render start")
    exit(1)

hookBody = original[hookStart + len(hookStartStr):hookEnd]

hookBody = re.sub(r'const copy = historyLanguageCopy\[language\];', "const t = useTranslations('historyTab');", hookBody)

# Extract everything except renderDetailedReview!
# renderDetailedReview is assigned to a const and returns a JSX block ending with `  };\n`
hookBody = re.sub(r'const renderDetailedReview = \([\s\S]*?^\s*};\n', '', hookBody, flags=re.MULTILINE)

finalHook = f"""import {{ useState, useEffect, useMemo }} from 'react';
import {{ useAuth }} from '@/hooks/use-auth';
import {{ dexieDb, type RiderTripLedgerEntry }} from '@/lib/dexie-db';
import {{ fetchFavoriteCaptainIds, setFavoriteCaptain }} from '../services/favorite-captains';
import {{ supabase }} from '@/lib/supabase-client';
import {{ useToast }} from '@/hooks/use-toast';
import {{ SOVEREIGN_ERR_DICTIONARY }} from '@/core/config/sovereign-errors';
import {{ useDashboardLanguage }} from '@/hooks/use-dashboard-language';
import {{ useTranslations }} from 'next-intl';
import {{
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
}} from './history-shared';

export function useHistoryState() {{
{hookBody}
  return {{
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
  }};
}}
"""

with open('src/features/account/components/history-tab/use-history-state.ts', 'w', encoding='utf-8') as f:
    f.write(finalHook)

print('Hook rewritten cleanly with Python!')
