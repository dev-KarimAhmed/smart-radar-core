import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { History, ArrowRight, ArrowLeft } from 'lucide-react';
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
    return (
      <div className={cn(styles.style857_16, !isArabic && "font-sans")} dir={isArabic ? 'rtl' : 'ltr'}>
        <Card className="relative overflow-hidden rounded-3xl border border-[#14B8A6]/20 bg-[#0B0F19]/90 shadow-2xl backdrop-blur-xl text-white">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#14F5D5]/60 to-transparent" />
          <CardContent className="p-5 sm:p-6 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-black text-white flex items-center gap-2.5">
                <History className="h-5 w-5 text-[#14F5D5]" />
                {t('title')}
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed font-sans">
                {t('subtitle')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => { window.location.hash = '#'; }}
              className="shrink-0 flex items-center gap-2 text-xs font-bold text-[#14F5D5] bg-[#14B8A6]/10 px-3 py-2 rounded-xl border border-[#14B8A6]/30 hover:bg-[#14B8A6]/20 transition-all cursor-pointer"
            >
              {isArabic ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
              {isArabic ? 'الرادار' : 'Radar'}
            </button>
          </CardContent>
        </Card>

        <HistoryRiderTrips
          riderHistoricalTrips={riderHistoricalTrips}
          loading={loading}
          favoriteCaptainIds={favoriteCaptainIds}
          toggleFavorite={toggleFavorite}
          currencyLabel={currencyLabel}
          isArabic={isArabic}
          now={now}
          tripReviews={tripReviews}
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
        <CardContent className="p-5 sm:p-6 flex items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-lg font-black text-white flex items-center gap-2.5">
              <History className="h-5 w-5 text-[#14F5D5]" />
              {t('title')}
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">
              {t('subtitle')}
            </p>
          </div>
          <button
            type="button"
            onClick={() => { window.location.hash = '#'; }}
            className="shrink-0 flex items-center gap-2 text-xs font-bold text-[#14F5D5] bg-[#14B8A6]/10 px-3 py-2 rounded-xl border border-[#14B8A6]/30 hover:bg-[#14B8A6]/20 transition-all cursor-pointer"
          >
            {isArabic ? <ArrowRight className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
            {isArabic ? 'الرادار' : 'Radar'}
          </button>
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
