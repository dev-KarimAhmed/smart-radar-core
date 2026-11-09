'use client';

import React from 'react';
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Lock,
  MapPin,
  Navigation,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Trip } from '@/core/types';
import type { CaptainTripStep } from '../../state/captain-state-machine';
import { styles } from './active-trip-tracker-styles';

interface ActiveTripPickupCardProps {
  step: CaptainTripStep;
  request: Trip;
  pickupT: (key: string) => string;
  t: (key: string) => string;
  pickupGoogleMapsUrl?: string | null;
  currency: string;
  pickupIsZero: boolean;
  pickupIsArrived: boolean;
  pickupDisplay: string;
  language: 'ar' | 'en';
  tripDisplay: string;
  tripDurationMinutes: number;
}

export function ActiveTripPickupCard({
  step,
  request,
  pickupT,
  t,
  pickupGoogleMapsUrl,
  currency,
  pickupIsZero,
  pickupIsArrived,
  pickupDisplay,
  language,
  tripDisplay,
  tripDurationMinutes,
}: ActiveTripPickupCardProps) {
  return (
    <>
      {step === 'ACCEPTED' && (
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
            {pickupGoogleMapsUrl ? (
              <a
                href={pickupGoogleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.pickupCardLink}
              >
                <ExternalLink className={styles.pickupCardLinkIcon} aria-hidden="true" />
                {pickupT('openPickupMap')}
              </a>
            ) : null}
          </div>
        </div>
      )}

      {/* Stats Row */}
      <div className={cn("mt-4 grid gap-4", step === 'STARTED' ? "md:grid-cols-3" : "md:grid-cols-2")}>
        <div className={styles.style96_1}>
          <p className={styles.style97_1}>
            <Lock className={styles.style98_1} />
            {t('frozenPrice')}
          </p>
          <p className={styles.style99_1}>{Number(request.offerPrice || 0).toFixed(2)} {currency}</p>
        </div>

        {step === 'ACCEPTED' && (
          <div className={cn(styles.style100_1, pickupIsZero && !pickupIsArrived && 'border-amber-500/50 bg-amber-500/10')}>
            <p className={cn(styles.style101_1, pickupIsZero && !pickupIsArrived && 'text-amber-300')}>
              <Clock className={styles.style102_1} />
              {t('pickupEta')}
            </p>
            <p className={cn(styles.style103_1, pickupIsZero && !pickupIsArrived && 'text-amber-300 animate-pulse')}>
              {pickupDisplay}
            </p>
          </div>
        )}

        {step === 'ARRIVED' && (
          <div className={cn(styles.style100_1, 'border-emerald-500/30 bg-emerald-500/10')}>
            <p className="flex items-center gap-1.5 text-xs text-emerald-300 font-bold">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
              {language === 'ar' ? 'حالة التواجد' : 'Status'}
            </p>
            <p className="mt-1 text-sm sm:text-base font-black text-white">
              {t('arrivedStatus')}
            </p>
          </div>
        )}

        {step === 'STARTED' && (
          <>
            <div className={styles.style100_1}>
              <p className={styles.style101_1}>
                <Clock className={styles.style102_1} />
                {t('tripElapsed')}
              </p>
              <p className={styles.style103_1}>
                {tripDisplay}
              </p>
            </div>
            <div className={styles.style100_1}>
              <p className={styles.style101_1}>
                <Navigation className={styles.style102_1} />
                {language === 'ar' ? 'المدة التقديرية' : 'Estimated Time'}
              </p>
              <p className={styles.style103_1}>
                {tripDurationMinutes} {language === 'ar' ? 'دقيقة' : 'min'}
              </p>
            </div>
          </>
        )}
      </div>
    </>
  );
}
