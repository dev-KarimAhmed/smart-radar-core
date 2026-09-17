import React from 'react';
import { Heart, Phone, Send, Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { styles, formatDashboardMoney, HistoricalTrip } from './dashboard-shared';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';

interface RecentTripsSectionProps {
  activeArchive: any[];
  currentTime: number;
  currencyLabel: string;
  reportText: string;
  setReportText: (text: string) => void;
  toggleFavorite: (e: React.MouseEvent, trip: HistoricalTrip) => void;
  handleSilentReport: (tripId: string) => void;
  favoriteMatchesTrip: (favorite: any, trip: HistoricalTrip) => boolean;
  favoriteCaptains: any[];
}

export function RecentTripsSection({
  activeArchive,
  currentTime,
  currencyLabel,
  reportText,
  setReportText,
  toggleFavorite,
  handleSilentReport,
  favoriteMatchesTrip,
  favoriteCaptains,
}: RecentTripsSectionProps) {
  const t = useTranslations('riderDashboard');
  const { isArabic } = useDashboardLanguage();

  return (
    <section className={styles.style394_14}>
      <h4 className={styles.style395_15}>{t('recent.recentTrips')}</h4>

      {activeArchive.length === 0 ? (
        <div className={styles.style398_16}>
          <Clock className={styles.style399_17} />
          <p className={styles.style400_18}>{t('recent.noTrips')}</p>
        </div>
      ) : (
        activeArchive.map((trip) => {
          const timeLeftMs = trip.purgeAt - currentTime;
          const hoursLeft = Math.max(0, Math.floor(timeLeftMs / (1000 * 60 * 60)));
          const isHearted = favoriteCaptains.some((fav) => favoriteMatchesTrip(fav, trip));

          return (
            <article key={trip.tripId} className={styles.style411_19}>
              <button
                onClick={(event) => toggleFavorite(event, trip)}
                className={styles.style415_20}
                title={isHearted ? t('toast.removedFavorite') : t('toast.savedFavorite')}
                type="button"
              >
                <Heart className={cn(styles.style420_21, isHearted ? styles.style421_22 : styles.style421_23)} />
              </button>

              <div className={styles.style426_24}>
                <p className={styles.style427_25}>
                  {t('recent.captain')}:{' '}
                  <strong className={styles.style429_26}>
                    {trip.captainName} <span className={styles.style431_27}>[{trip.captainRank}]</span>
                  </strong>
                </p>
                <p className={styles.style434_28}>
                  {t('recent.price')}: {formatDashboardMoney(trip.finalPrice, currencyLabel)}
                </p>
                <p className={styles.style437_29}>
                  {t('recent.vehicle')}: {trip.vehicleInfo}
                </p>
              </div>

              <a href={`tel:${trip.captainPhone}`} className={styles.style444_30} style={{ textDecoration: 'none' }}>
                <Phone className={styles.style447_31} />
                <span>{t('recent.callLostItems')}</span>
              </a>

              <div className={styles.style451_32}>
                <input
                  type="text"
                  value={reportText}
                  placeholder={t('recent.reportPlaceholder')}
                  onChange={(event) => setReportText(event.target.value)}
                  className={cn(styles.style457_33, isArabic ? styles.style457_34 : styles.style457_35)}
                  dir={isArabic ? 'rtl' : 'ltr'}
                />
                <Button onClick={() => handleSilentReport(trip.tripId)} className={styles.style462_36}>
                  <Send className={styles.style464_37} />
                  {t('recent.silentReport')}
                </Button>
              </div>

              <div className={styles.style469_38}>
                <span className={styles.style470_39}>
                  <Clock className={styles.style471_40} />
                  {t('recent.autoDeleteIn')}: {hoursLeft} {t('recent.hours')}
                </span>
                <span className={styles.style474_41}>Trip ID: {trip.tripId.slice(0, 8)}</span>
              </div>
            </article>
          );
        })
      )}
    </section>
  );
}
