import React from 'react';
import { Route, MapPin, Clock, Timer, Milestone } from 'lucide-react';
import { useTranslations, useLocale } from 'next-intl';
import { preferRoutedMinutes } from '@/shared/services/trip-duration';
import { CaptainOffer, styles, SectionHeader, InfoRow, formatMinutes } from './offer-card-shared';

export function OfferCardTrip({
  offer,
  isOpen,
  onToggle,
}: {
  offer: CaptainOffer;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const t = useTranslations('Rider.CaptainOfferCard');
  const locale = useLocale();
  const language = locale === 'ar' ? 'ar' : 'en';
  
  const tripDistance = offer.trip_distance_km ?? offer.distance_km;
  const durationLabel = formatMinutes(
    preferRoutedMinutes(offer.estimated_duration_minutes, tripDistance),
    language,
  );

  return (
    <div className={styles.sectionWrap}>
      <SectionHeader
        icon={<Route className={styles.sectionHeaderIcon} />}
        title={t('tripDetails')}
        isOpen={isOpen}
        onToggle={onToggle}
      />
      {isOpen ? (
        <div className={styles.collapsibleSectionBody}>
          <div className={styles.tripGrid}>
            <InfoRow
              icon={<MapPin className={styles.tripRowIcon} />}
              label={t('distanceToYou')}
              value={`${offer.distance_km.toFixed(1)} ${t('km')}`}
            />
            <InfoRow
              icon={<Clock className={styles.tripRowIcon} />}
              label={t('arrivesIn')}
              value={`${offer.eta_minutes} ${t('mins')}`}
              highlight
            />
            <InfoRow
              icon={<Timer className={styles.tripRowIcon} />}
              label={t('tripTime')}
              value={durationLabel}
              helper={t('withoutTrafficDelays')}
              highlight
            />
            <InfoRow
              icon={<Milestone className={styles.tripRowIcon} />}
              label={t('tripDistance')}
              value={`${Number(tripDistance || 0).toFixed(1)} ${t('km')}`}
              highlight
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
