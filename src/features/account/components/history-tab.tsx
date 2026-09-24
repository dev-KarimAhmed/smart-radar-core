import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { History } from 'lucide-react';
import { cn } from '@/lib/utils';
import { styles } from './history-tab/history-shared';
import { useHistoryState } from './history-tab/use-history-state';
import { HistoryRiderTrips } from './history-tab/history-rider-trips';
import { HistoryCaptainTrips } from './history-tab/history-captain-trips';
import { HistoryFavoriteCaptains } from './history-tab/history-favorite-captains';
import { HistorySovereignLogs } from './history-tab/history-sovereign-logs';
import { HistoryErrorExplorer } from './history-tab/history-error-explorer';
import { BlockedCaptainsSection } from './profile-tab/blocked-captains-section';
import { useBlockedCaptains } from '../hooks/use-blocked-captains';

export interface HistoryTabProps {
  hideCaptainDiagnostics?: boolean;
}

export function HistoryTab({ hideCaptainDiagnostics = false }: HistoryTabProps = {}) {
  const state = useHistoryState();
  const blockedState = useBlockedCaptains();

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


      <BlockedCaptainsSection
        isArabic={isArabic}
        t={blockedState.t}
        isLoadingBlocks={blockedState.isLoadingBlocks}
        blockedCaptains={blockedState.blockedCaptains}
        confirmingUnblockId={blockedState.confirmingUnblockId}
        setConfirmingUnblockId={blockedState.setConfirmingUnblockId}
        handleUnblockCaptain={blockedState.handleUnblockCaptain}
      />
    </div>
  );

  if (state.language === 'en' && isPassenger) {
    return (
      <div className={cn(styles.style857_16, !isArabic && "font-sans")} dir={isArabic ? 'rtl' : 'ltr'}>
        <Card className={styles.style858_17}>
          <div className={styles.style859_18} />
          <CardContent className={styles.style860_19}>
            <h2 className={styles.style861_20}>
              <History className={styles.style862_21} />
              {t('title')}
            </h2>
            <p className={styles.style865_22}>
              {t('subtitle')}
            </p>
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
      <Card className={styles.style987_57}>
        <div className={styles.style988_58} />
        <CardContent className={styles.style989_59}>
          <h2 className={styles.style990_60}>
            <History className={styles.style991_61} />
            {t('title')}
          </h2>
          <p className={styles.style994_62}>
            {t('subtitle')}
          </p>
        </CardContent>
      </Card>

      {/* 2. Primary Listing */}
      {isPassenger && (
        <div className={styles.style1002_63}>
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
      )}

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
