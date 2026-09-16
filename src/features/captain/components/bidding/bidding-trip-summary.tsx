import React from 'react';
import { useTranslations } from 'next-intl';
import { MapPin, ExternalLink } from 'lucide-react';
import type { Trip } from '@/core/types';

const styles = {
  container: "mt-5 rounded-2xl border border-slate-800 bg-black/45 p-4",
  destinationLabel: "text-xs text-slate-400",
  destinationValue: "mt-1 text-xl font-black",
  grid: "mt-4 grid grid-cols-2 gap-2",
  infoCard: "rounded-xl border border-white/10 bg-white/[0.03] p-3",
  infoLabel: "text-xs text-slate-500",
  infoValue: "mt-1 font-black text-white",
  pickupCard: "mt-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/[0.06] p-4",
  pickupCardRow: "flex items-start justify-between gap-3",
  pickupCardInfo: "min-w-0",
  pickupCardLabel: "flex items-center gap-1.5 text-xs font-black text-cyan-200",
  pickupCardIcon: "h-4 w-4",
  pickupCardValue: "mt-1 truncate text-sm font-black text-white",
  pickupCardHint: "mt-1 text-xs text-slate-400",
  pickupCardLink: "inline-flex shrink-0 items-center gap-1.5 rounded-xl border border-cyan-400/25 px-3 py-2 text-xs font-black text-cyan-200 transition hover:border-cyan-300 hover:text-white",
  pickupCardLinkIcon: "h-3.5 w-3.5",
} as const;

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.infoCard}>
      <p className={styles.infoLabel}>{label}</p>
      <p className={styles.infoValue}>{value}</p>
    </div>
  );
}

export interface BiddingTripSummaryProps {
  request: Trip;
  language: 'ar' | 'en';
  pickupEtaMinutes: number | null;
}

export function BiddingTripSummary({ request, language, pickupEtaMinutes }: BiddingTripSummaryProps) {
  const t = useTranslations('captainBidding');
  const pickupT = useTranslations('captainPickup');

  return (
    <>
      <div className={styles.container}>
        <p className={styles.destinationLabel}>{t('destination')}</p>
        <h2 className={styles.destinationValue}>{request.dropoff || t('unknownDestination')}</h2>

        <div className={styles.grid}>
          <Info
            label={t('passengerRatingLabel')}
            value={`${request.riderRating != null ? request.riderRating.toFixed(1) : '5.0'} ⭐️`}
          />
          <Info
            label={t('requestTimeLabel')}
            value={request.createdAt ? new Date(request.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '--:--'}
          />
          <Info
            label={t('tripsCountLabel')}
            value={String(request.riderCompletedTrips || 0)}
          />
          <Info
            label={request.estimatedDistance != null && request.estimatedDistance < 2 ? t('distanceMinimum', { distance: '2.0' }) : t('distanceLabel', { distance: request.estimatedDistance?.toFixed(1) || '0.0' })}
            value={request.estimatedDistance != null ? `${request.estimatedDistance.toFixed(1)} ${t('distanceUnitKm')}` : pickupT('distanceUnavailable')}
          />
          <Info label={t('pickupTimeLabel', { minutes: pickupEtaMinutes || 0 })} value={pickupT('minutesValue', { count: pickupEtaMinutes || 0 })} />
          <Info
            label={t('tripTime')}
            value={request.estimatedTime != null ? pickupT('minutesValue', { count: Math.round(request.estimatedTime) }) : pickupT('distanceUnavailable')}
          />
          <Info
            label={t('pricingPreference')}
            value={
              request.pricingPreference === 'APP' ? t('pricingModeApp') :
              request.pricingPreference === 'TAXI' ? t('pricingModeTaxi') :
              request.pricingPreference === 'FREE' ? t('pricingModeFree') :
              t('pricingModeNone')
            }
          />
        </div>
      </div>

      <div className={styles.pickupCard}>
        <div className={styles.pickupCardRow}>
          <div className={styles.pickupCardInfo}>
            <p className={styles.pickupCardLabel}>
              <MapPin className={styles.pickupCardIcon} aria-hidden="true" />
              {pickupT('pickupLocation')}
            </p>
            <p className={styles.pickupCardValue}>
              {request.pickupLabel || pickupT('pickupLocation')}
            </p>
            <p className={styles.pickupCardHint}>
              {request.pickupLocationIsApproximate ? pickupT('pickupApproximate') : pickupT('pickupExact')}
            </p>
          </div>
          {request.pickupGoogleMapsUrl ? (
            <a
              href={request.pickupGoogleMapsUrl}
              target="_blank"
              rel="noreferrer"
              className={styles.pickupCardLink}
            >
              <ExternalLink className={styles.pickupCardLinkIcon} aria-hidden="true" />
              {pickupT('openPickupMap')}
            </a>
          ) : null}
        </div>
      </div>
    </>
  );
}
