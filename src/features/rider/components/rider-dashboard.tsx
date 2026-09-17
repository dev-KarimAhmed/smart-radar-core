'use client';

import React from 'react';
import { History, Briefcase } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { HistoricalTrip } from './dashboard/dashboard-shared';
import { styles } from './dashboard/dashboard-shared';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { useRiderDashboardState } from '../hooks/use-rider-dashboard-state';

import { RecentTripsSection } from './dashboard/recent-trips-section';
import { SavedCaptainsSection } from './dashboard/saved-captains-section';
import { PortfolioModal } from './dashboard/portfolio-modal';

interface RiderDashboardProps {
  riderProfile: {
    id: string;
    rating: number;
    governorate: string;
    district: string;
  };
  tripsWithin72Hours?: HistoricalTrip[];
  systemMessages?: any[];
  currencyLabel?: string;
}

export function RiderDashboard({ riderProfile, tripsWithin72Hours = [], systemMessages = [], currencyLabel = '' }: RiderDashboardProps) {
  const t = useTranslations('riderDashboard');
  const { isArabic } = useDashboardLanguage();

  const {
    reportText,
    setReportText,
    favoriteCaptains,
    isPortfolioOpen,
    setIsPortfolioOpen,
    currentTime,
    activeArchive,
    uniqueFavoriteCaptains,
    removeFavorite,
    toggleFavorite,
    updateCaptainType,
    handleSilentReport,
    favoriteMatchesTrip,
  } = useRiderDashboardState(riderProfile, tripsWithin72Hours);

  return (
    <div className={cn(styles.style358_1, isArabic ? styles.style358_2 : styles.style358_3)} dir={isArabic ? 'rtl' : 'ltr'}>
      <div className={styles.style361_4}>
        <h3 className={styles.style362_5}>{t('recent.title')}</h3>
        <div className={styles.style363_6}>
          <div className={styles.style364_7}>
            {t('recent.myCaptains')}:{' '}
            <span className={styles.style366_8}>
              {uniqueFavoriteCaptains.length}
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPortfolioOpen(true)}
            className="flex items-center gap-1.5 border-[#14B8A6]/20 bg-[#14B8A6]/10 text-xs font-bold text-white hover:bg-[#14B8A6]/20 hover:text-white"
          >
            <Briefcase className="h-4 w-4 text-[#14B8A6]" />
            {t('recent.openPortfolio')}
          </Button>
        </div>
        <p className={styles.style377_9}>
          <History className={styles.style378_10} />
          <span>
            <strong className={styles.style379_11}>{t('recent.autoDelete')}</strong> {t('recent.autoDeleteDesc')}
          </span>
        </p>
      </div>

      <button
        onClick={() => setIsPortfolioOpen(true)}
        className={styles.style386_12}
        type="button"
      >
        <Briefcase className={styles.style388_13} />
        {t('recent.managePortfolioBtn')}
      </button>

      <RecentTripsSection
        activeArchive={activeArchive}
        currentTime={currentTime}
        currencyLabel={currencyLabel}
        reportText={reportText}
        setReportText={setReportText}
        toggleFavorite={toggleFavorite}
        handleSilentReport={handleSilentReport}
        favoriteMatchesTrip={favoriteMatchesTrip}
        favoriteCaptains={favoriteCaptains}
      />

      <SavedCaptainsSection
        uniqueFavoriteCaptains={uniqueFavoriteCaptains}
        removeFavorite={removeFavorite}
      />

      <PortfolioModal
        isPortfolioOpen={isPortfolioOpen}
        setIsPortfolioOpen={setIsPortfolioOpen}
        uniqueFavoriteCaptains={uniqueFavoriteCaptains}
        currencyLabel={currencyLabel}
        updateCaptainType={updateCaptainType}
        deleteFavoriteCard={removeFavorite}
      />
    </div>
  );
}
