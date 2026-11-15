'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { styles } from './history-shared';
import type { useHistoryState } from './use-history-state';
import { HistoryFilterBar, type HistoryCategoryKey } from './history-filter-bar';
import { HistoryCaptainTrips } from './history-captain-trips';
import { HistoryTripNotifications } from './history-trip-notifications';
import { HistoryLegalDeclarations } from './history-legal-declarations';
import { HistoryFinancialReceipts } from './history-financial-receipts';
import { HistoryRanksPoints } from './history-ranks-points';
import { HistorySovereignLogs } from './history-sovereign-logs';
import { HistoryErrorExplorer } from './history-error-explorer';
import { HistoryFavoriteRiders } from '@/features/referral/components/history-favorite-riders';
import { BlockedRidersSection } from '@/features/captain/components/profile/blocked-riders-section';

export interface HistoryCaptainViewProps {
  state: ReturnType<typeof useHistoryState>;
  activeCategory: HistoryCategoryKey;
  onSelectCategory: (cat: HistoryCategoryKey) => void;
  hideCaptainDiagnostics?: boolean;
}

export function HistoryCaptainView({
  state,
  activeCategory,
  onSelectCategory,
  hideCaptainDiagnostics = false,
}: HistoryCaptainViewProps) {
  const {
    sovereignLogs,
    loading,
    errorSearch,
    setErrorSearch,
    errorCategory,
    setErrorCategory,
    expandedErrorCode,
    setExpandedErrorCode,
    filteredErrors,
    captainHistoricalTrips,
    clearSovereignLogs,
    isCaptain,
    isArabic,
    currencyLabel,
    t,
    tripReviews,
    refreshReviews,
    user,
  } = state;

  const now = Date.now();

  return (
    <div className={cn(styles.style985_56, !isArabic && 'font-sans')} dir={isArabic ? 'rtl' : 'ltr'}>
      {/* 1. Header Card */}
      <Card className="relative overflow-hidden rounded-3xl border border-[#14B8A6]/20 bg-[#0B0F19]/90 shadow-2xl backdrop-blur-xl text-white">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-[#14F5D5]/60 to-transparent" />
        <CardContent className="p-4 sm:p-5">
          <div className="space-y-1">
            <h2 className="text-lg font-black text-white flex items-center gap-2.5">
              <History className="h-5 w-5 text-[#14F5D5]" />
              {t('title')}
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed font-sans">{t('subtitle')}</p>
          </div>
        </CardContent>
      </Card>

      {/* 2. Filter Navigation Bar */}
      <HistoryFilterBar
        activeCategory={activeCategory}
        onSelectCategory={onSelectCategory}
        isPassenger={false}
        isArabic={isArabic}
      />

      {/* 3. Categorized Content Sections */}
      {isCaptain && (
        <div className={styles.style1158_112}>
          {/* Section 1: Financial Log */}
          {(activeCategory === 'all' || activeCategory === 'financial') && (
            <HistoryFinancialReceipts isArabic={isArabic} />
          )}

          {/* Section 2: Legal Log */}
          {(activeCategory === 'all' || activeCategory === 'legal') && (
            <HistoryLegalDeclarations isArabic={isArabic} />
          )}

          {/* Section 3: Activity Log */}
          {(activeCategory === 'all' || activeCategory === 'activity') && (
            <div className="space-y-4">
              <HistoryCaptainTrips
                captainHistoricalTrips={captainHistoricalTrips}
                loading={loading}
                currencyLabel={currencyLabel}
                isArabic={isArabic}
                now={now}
                tripReviews={tripReviews}
                currentUserId={user?.uid}
                onRatingSuccess={refreshReviews}
                t={t}
              />
              <HistoryTripNotifications isArabic={isArabic} t={t} />
            </div>
          )}

          {/* Section 4: Customers Log */}
          {(activeCategory === 'all' || activeCategory === 'customers') && (
            <div className="space-y-4">
              <HistoryFavoriteRiders user={user} isArabic={isArabic} />
              <BlockedRidersSection isArabic={isArabic} />
            </div>
          )}

          {/* Section 5: Ranks and Points Log */}
          {(activeCategory === 'all' || activeCategory === 'ranks') && (
            <div className="space-y-4">
              <HistoryRanksPoints isArabic={isArabic} />

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
      )}
    </div>
  );
}
