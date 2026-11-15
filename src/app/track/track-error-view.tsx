import React from 'react';
import Image from 'next/image';
import { Lock, ShieldAlert, ShieldCheck } from 'lucide-react';
import { getSafeLandingPageUrl } from '@/shared/services/supabase-auth-headers';
import { styles } from './track-styles';
import type { TrackErrorState } from './track-types';

interface TrackErrorViewProps {
  errorState: Exclude<TrackErrorState, null>;
  isArabic: boolean;
}

export function TrackErrorView({ errorState, isArabic }: TrackErrorViewProps) {
  const isEnded = errorState === 'ended';

  return (
    <div className={styles.root} dir={isArabic ? 'rtl' : 'ltr'}>
      <header className={styles.header}>
        <div className={styles.headerBrand}>
          <a href={getSafeLandingPageUrl()} className={styles.headerLink}>
            <Image src="/icons/logo-header.png" alt="Radar" width={585} height={152} priority className={styles.headerLogo} />
          </a>
        </div>
        <div className={styles.endedPill}>
          <Lock className={styles.iconSm} />
          <span>{isEnded ? (isArabic ? 'تتبع منتهٍ' : 'Tracking Ended') : (isArabic ? 'رابط غير صالح' : 'Invalid Link')}</span>
        </div>
      </header>

      <main className={styles.endedRoot}>
        <div className={styles.endedCard}>
          <div className={styles.endedIconBox}>
            {isEnded ? <ShieldCheck className={styles.endedIcon} /> : <ShieldAlert className={styles.endedIcon} />}
          </div>
          <h1 className={styles.endedTitle}>
            {isEnded
              ? (isArabic ? 'انتهت الرحلة وأُغلق التتبع المباشر' : 'Trip Ended — Live Tracking Closed')
              : (isArabic ? 'رابط التتبع غير صالح أو منتهي الصلاحية' : 'Invalid or Expired Tracking Link')}
          </h1>
          <p className={styles.endedDesc}>
            {isEnded
              ? (isArabic
                  ? 'تم إيقاف مشاركة الموقع الجغرافي وإزالة بيانات السائق فوراً مع إغلاق الرحلة التزاماً بمعيار الخصوصية (الخدمة 11).'
                  : 'Live GPS sharing and captain details were permanently stopped upon trip completion in compliance with Service 11 privacy rules.')
              : (isArabic
                  ? 'يتطلب هذا المسار رابط تتبع موثقاً ومفعّلاً من الراكب أثناء رحلة نشطة.'
                  : 'A valid HMAC-signed tracking link generated during an active trip is required to view live location.')}
          </p>
          <a href={getSafeLandingPageUrl()} className={styles.endedHomeBtn}>
            <span>{isArabic ? 'العودة إلى منصة بينكم' : 'Return to Bynkcom'}</span>
          </a>
        </div>
      </main>
    </div>
  );
}
