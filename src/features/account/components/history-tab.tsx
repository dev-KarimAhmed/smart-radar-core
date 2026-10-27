import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { History } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { styles } from './history-tab/history-shared';
import { useHistoryState } from './history-tab/use-history-state';
import { HistoryRiderTrips } from './history-tab/history-rider-trips';
import { HistoryCaptainTrips } from './history-tab/history-captain-trips';
import { HistoryFavoriteCaptains } from './history-tab/history-favorite-captains';
import { HistorySovereignLogs } from './history-tab/history-sovereign-logs';
import { HistoryErrorExplorer } from './history-tab/history-error-explorer';
import { BlockedCaptainsSection } from './profile-tab/blocked-captains-section';
import { BlockedRidersSection } from '@/features/captain/components/profile/blocked-riders-section';
import { HistoryFavoriteRiders } from '@/features/referral/components/history-favorite-riders';


export interface HistoryTabProps {
  hideCaptainDiagnostics?: boolean;
}

export function HistoryTab({ hideCaptainDiagnostics = false }: HistoryTabProps = {}) {
  const state = useHistoryState();


  const {
    favoriteCaptainIds,
    sovereignLogs,
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
    isCaptain,
    isPassenger,
    isArabic,
    currencyLabel,
    t,
    tripReviews,
    refreshReviews,
    user,
  } = state;

  const now = Date.now();

  const renderCaptainsWithDivider = () => (
    <div className="space-y-4">
      <HistoryFavoriteCaptains
        favoriteCaptains={favoriteCaptains}
        toggleFavorite={toggleFavorite}
        isArabic={isArabic}
        t={t}
      />

      <BlockedCaptainsSection isArabic={isArabic} />
    </div>
  );

  if (isPassenger) {
    const hasTrips = Boolean(riderHistoricalTrips && riderHistoricalTrips.length > 0);

    return (
      <div className={cn(styles.style857_16, !isArabic && "font-sans")} dir={isArabic ? 'rtl' : 'ltr'}>
        {/* Step 2: Screen Title & 72-Hour Purge Rule */}
        <Card className="relative overflow-hidden rounded-3xl border border-[#14B8A6]/20 bg-[#0B0F19]/90 shadow-2xl backdrop-blur-xl text-white">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#14F5D5]/60 to-transparent" />
          <CardContent className="p-4 sm:p-5">
            <div className="space-y-1">
              <h2 className="text-lg font-black text-white flex items-center gap-2.5">
                <History className="h-5 w-5 text-[#14F5D5]" />
                {isArabic ? 'سجلي مع إعلانات الكباتين:' : t('title')}
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                {isArabic
                  ? 'يتم حذف السجل في تتابع الأقدم كل 72 ساعة.'
                  : t('subtitle')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Step 2: "بينكم تشكرك" Card - HIDE WHEN NO TRIPS, SHOW WHEN TRIPS EXIST */}
        {hasTrips && (
          <div className="rounded-2xl border border-[#14B8A6]/30 bg-gradient-to-r from-[#14B8A6]/10 via-[#0B0F19] to-[#14B8A6]/10 p-4 text-center shadow-lg shadow-black/20 animate-in fade-in duration-200">
            <p className="text-sm font-black text-white">
              <span className="text-[#14F5D5] font-black drop-shadow-[0_0_8px_rgba(20,245,213,0.4)]">بينكم</span>{' '}
              {isArabic
                ? 'تشكرك على تكملة نشاطك مع المعلنين'
                : 'thanks you for completing your activity with advertisers'}
            </p>
          </div>
        )}

        <HistoryRiderTrips
          riderHistoricalTrips={riderHistoricalTrips}
          loading={loading}
          favoriteCaptainIds={favoriteCaptainIds}
          toggleFavorite={toggleFavorite}
          currencyLabel={currencyLabel}
          isArabic={isArabic}
          now={now}
          tripReviews={tripReviews}
          currentUserId={user?.uid}
          onRatingSuccess={refreshReviews}
          t={t}
        />

        {renderCaptainsWithDivider()}
      </div>
    );
  }

  return (
    <div className={cn(styles.style985_56, !isArabic && "font-sans")} dir={isArabic ? 'rtl' : 'ltr'}>
      {/* 1. Header Card */}
      <Card className="relative overflow-hidden rounded-3xl border border-[#14B8A6]/20 bg-[#0B0F19]/90 shadow-2xl backdrop-blur-xl text-white">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#14F5D5]/60 to-transparent" />
        <CardContent className="p-4 sm:p-5">
          <div className="space-y-1">
            <h2 className="text-lg font-black text-white flex items-center gap-2.5">
              <History className="h-5 w-5 text-[#14F5D5]" />
              {t('title')}
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              {t('subtitle')}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 2. Captain / Admin Listing */}
      {isCaptain && (
        <div className={styles.style1158_112}>
          <HistoryCaptainTrips
            captainHistoricalTrips={captainHistoricalTrips}
            loading={loading}
            currencyLabel={currencyLabel}
            isArabic={isArabic}
            now={now}
            t={t}
          />

          <HistoryFavoriteRiders user={user} isArabic={isArabic} />

          <BlockedRidersSection isArabic={isArabic} />

          <HistorySovereignLogs
            sovereignLogs={sovereignLogs}
            loading={loading}
            clearSovereignLogs={clearSovereignLogs}
            hideCaptainDiagnostics={hideCaptainDiagnostics}
            t={t}
          />

          {state.user?.role === 'admin' && !hideCaptainDiagnostics && (
            <HistoryErrorExplorer
              errorSearch={errorSearch}
              setErrorSearch={setErrorSearch}
              errorCategory={errorCategory}
              setErrorCategory={setErrorCategory}
              expandedErrorCode={expandedErrorCode}
              setExpandedErrorCode={setExpandedErrorCode}
              filteredErrors={filteredErrors}
            />
          )}
        </div>
      )}
    </div>
  );
}
