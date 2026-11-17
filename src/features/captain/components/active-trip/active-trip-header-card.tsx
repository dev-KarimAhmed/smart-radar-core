'use client';

import React from 'react';
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Lock,
  MapPin,
  Navigation,
  Phone,
  ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Trip, User } from '@/core/types';
import type { CaptainTripStep } from '../../state/captain-state-machine';
import { activeTripStyles as styles } from './active-trip-styles';

interface ActiveTripHeaderCardProps {
  language: 'ar' | 'en';
  request: Trip;
  rider: User | null;
  step: CaptainTripStep;
  destinationGoogleMapsUrl: string | null | undefined;
  pickupGoogleMapsUrl: string | null | undefined;
  pickupT: any;
  riderTrackingActive: boolean;
  currency: string;
  pickupIsZero: boolean;
  pickupIsArrived: boolean;
  pickupDisplay: string;
  tripDisplay: string;
  tripDurationMinutes: number;
  t: any;
}

export function ActiveTripHeaderCard({
  language,
  request,
  rider,
  step,
  destinationGoogleMapsUrl,
  pickupGoogleMapsUrl,
  pickupT,
  riderTrackingActive,
  currency,
  pickupIsZero,
  pickupIsArrived,
  pickupDisplay,
  tripDisplay,
  tripDurationMinutes,
  t,
}: ActiveTripHeaderCardProps) {
  const riderPhone = rider?.phone || request.riderPhone || (request as any).riderPhoneNumber;
  const hasRiderCallCard = step === 'ACCEPTED' && Boolean(riderPhone);

  return (
    <>
      <div className={styles.style33_2}>
        <div>
          <p className={styles.style35_3}>{t('badge')}</p>
          <h1 className={styles.style36_4}>{t('title')}</h1>
          <p className={styles.style37_5}>
            {step === 'ACCEPTED'
              ? (language === 'ar' ? 'توجه إلى موقع الالتقاء بالراكب، ثم اضغط على زر تأكيد الوصول فور بلوغك النقطة.' : 'Navigate to the rendezvous point and confirm your arrival.')
              : step === 'ARRIVED'
                ? (language === 'ar' ? 'أنت الآن في نقطة الالتقاء. بانتظار صعود الراكب بالمركبة للبدء.' : 'You have arrived. Waiting for the rider to board, then start the trip.')
                : (language === 'ar' ? 'الرحلة جارية نحو الوجهة. انطلق بأمان وفق مسار الخريطة المعتمد.' : 'Trip is in progress. Drive safely to destination.')}
          </p>
        </div>
        <span className={styles.style39_6}>{t(`steps.${step}`)}</span>
      </div>

      <div className={cn(styles.style44_7, !hasRiderCallCard && 'md:grid-cols-1')}>
        <div className={styles.style45_8}>
          <div className="flex items-center justify-between gap-2">
            <p className={styles.style46_9}>{t('destination')}</p>
            {destinationGoogleMapsUrl && (step === 'STARTED' || step === 'ARRIVED') && (
              <a
                href={destinationGoogleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-cyan-400 hover:text-cyan-300 transition"
              >
                <ExternalLink className="h-3 w-3" />
                <span>{language === 'ar' ? 'فتح مسار الخريطة' : 'Open in Maps'}</span>
              </a>
            )}
          </div>
          <h2 className={styles.style47_10}>{request.dropoff || t('unknownDestination')}</h2>
        </div>

        {hasRiderCallCard ? (
          <div className={styles.style51_12}>
            <p className={styles.style52_13}>{language === 'ar' ? 'الاتصال بالراكب' : 'Call Rider'}</p>
            <a href={`tel:${riderPhone}`} className={styles.style55_15}>
              <Phone className={styles.style56_16} />
              <span>{t('callRider')}</span>
            </a>
          </div>
        ) : null}
      </div>

      {riderTrackingActive && (
        <div className={styles.trackingNotice}>
          <div className={styles.trackingNoticeIconWrap}>
            <ShieldAlert className={styles.trackingNoticeIcon} />
          </div>
          <div className={styles.trackingNoticeContent}>
            <p className={styles.trackingNoticeTitle}>
              {language === 'ar' ? 'مشاركة مسير الرحلة مع الأقارب' : 'Trip Journey Tracking Active'}
            </p>
            <p className={styles.trackingNoticeBody}>
              {language === 'ar'
                ? 'المستخدم فعل زر تتبع هاتفه مع الأقارب، ويتوقف مع انتهاء الخدمة.'
                : 'The passenger has activated live tracking with relatives, which stops when the service ends.'}
            </p>
          </div>
        </div>
      )}

      {step === 'ACCEPTED' && (
        <div className={styles.pickupCard}>
          <div className={styles.pickupCardRow}>
            <div className={styles.pickupCardInfo}>
              <p className={styles.pickupCardLabel}>
                <MapPin className={styles.pickupCardIcon} aria-hidden="true" />
                {pickupT('pickupLocation')}
              </p>
              <p className={styles.pickupCardValue}>{request.pickupLabel || pickupT('pickupLocation')}</p>
              <p className={styles.pickupCardHint}>
                {request.pickupLocationIsApproximate ? pickupT('pickupApproximate') : pickupT('pickupExact')}
              </p>
            </div>
            {pickupGoogleMapsUrl ? (
              <a href={pickupGoogleMapsUrl} target="_blank" rel="noopener noreferrer" className={styles.pickupCardLink}>
                <ExternalLink className={styles.pickupCardLinkIcon} aria-hidden="true" />
                {pickupT('openPickupMap')}
              </a>
            ) : null}
          </div>
        </div>
      )}

      <div className={cn('mt-4 grid gap-4', step === 'STARTED' ? 'md:grid-cols-3' : 'md:grid-cols-2')}>
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
            <p className="mt-1 text-sm sm:text-base font-black text-white">{t('arrivedStatus')}</p>
          </div>
        )}

        {step === 'STARTED' && (
          <>
            <div className={styles.style100_1}>
              <p className={styles.style101_1}>
                <Clock className={styles.style102_1} />
                {t('tripElapsed')}
              </p>
              <p className={styles.style103_1}>{tripDisplay}</p>
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
