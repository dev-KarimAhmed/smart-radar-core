import React from 'react';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Trip } from '@/core/types';
import { useTranslations } from 'next-intl';
import { styles } from './radar-map.styles';
import {
  Info,
  formatLocalizedNumber,
  pickupDistanceKm,
} from './radar-map.helpers';
import { estimatePickupMinutes } from '@/shared/services/trip-duration';
import type { RadarCopyType } from './radar-copy';

interface RadarCardDetailsSectionProps {
  request: Trip;
  language: 'ar' | 'en';
  currency: string;
  copy: RadarCopyType;
  driverLocation: { lat: number; lng: number } | null;
  passengersCount: number;
}

export function RadarCardDetailsSection({
  request,
  language,
  currency,
  copy,
  driverLocation,
  passengersCount,
}: RadarCardDetailsSectionProps) {
  const tAuto = useTranslations('auto');
  const t = useTranslations('captainPickup');

  return (
    <>
      <div className="space-y-2 select-none" dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <div className="flex items-center justify-between gap-2 text-[11px] sm:text-sm font-bold">
          <span className="text-slate-300 shrink-0">{copy.riderRatingLabel}</span>
          <span
            dir="ltr"
            className={cn(
              'font-black font-mono truncate text-end min-w-0',
              request.riderRating != null && request.riderRating > 0 ? 'text-amber-400 text-xs sm:text-base' : 'text-slate-400 text-[11px] sm:text-xs font-bold',
            )}
            title={request.riderRating != null && request.riderRating > 0 ? `${request.riderRating}/5` : copy.riderUnrated}
          >
            {request.riderRating != null && request.riderRating > 0
              ? `${formatLocalizedNumber(request.riderRating % 1 === 0 ? request.riderRating.toFixed(0) : request.riderRating.toFixed(1), language)}/${formatLocalizedNumber('5', language)}`
              : copy.riderUnrated}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 text-[11px] sm:text-sm font-bold">
          <span className="text-slate-300 shrink-0">{copy.riderTripsLabel}</span>
          <span dir="ltr" className="font-black text-xs sm:text-base font-mono text-white shrink-0">
            {formatLocalizedNumber(request.riderCompletedTrips != null ? request.riderCompletedTrips : 0, language)}
          </span>
        </div>

        {request.riderFavoritedMe && (
          <div className="flex items-center gap-1.5 text-xs font-black text-emerald-400 pt-1">
            <Heart className="h-3.5 w-3.5 shrink-0 fill-emerald-400 text-emerald-400 animate-pulse" />
            <span>{copy.riderFavoritedYou}</span>
          </div>
        )}
      </div>

      <div className={styles.style227_38} dir={language === 'ar' ? 'rtl' : 'ltr'}>
        <Info
          label={copy.pickupTime}
          value={formatLocalizedNumber(t('minutesValue', { count: estimatePickupMinutes(pickupDistanceKm(driverLocation, request)) }), language)}
        />
        <Info
          label={copy.tripDistance}
          value={request.estimatedDistance != null ? `${formatLocalizedNumber(request.estimatedDistance.toFixed(1), language)} ${language === 'ar' ? tAuto('key_4171dde6') : 'km'}` : t('distanceUnavailable')}
        />
        <Info
          label={copy.marketFare}
          value={request.offerPrice != null ? `${formatLocalizedNumber(request.offerPrice.toFixed(2), language)} ${currency}` : '—'}
        />
        <Info
          label={copy.passengersCount}
          value={`${formatLocalizedNumber(passengersCount, language)} ${language === 'ar' ? (passengersCount === 1 ? 'راكب' : passengersCount === 2 ? 'راكبان' : passengersCount <= 10 ? 'ركاب' : 'راكب') : (passengersCount === 1 ? 'passenger' : 'passengers')}`}
        />
      </div>
    </>
  );
}
