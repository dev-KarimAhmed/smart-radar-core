'use client';

import React from 'react';
import { AlertTriangle, WifiOff } from 'lucide-react';
import { useTranslations } from 'next-intl';

const styles = {
  activeTripBanner: 'flex items-center justify-between rounded-2xl border border-emerald-500/40 bg-emerald-950/90 p-3.5 shadow-lg backdrop-blur-md',
  activeTripText: 'flex items-center gap-2 text-xs font-bold text-emerald-300',
  pulseContainer: 'relative flex h-2.5 w-2.5',
  pulsePing: 'absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75',
  pulseCore: 'relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400',
  returnTripBtn: 'rounded-xl border border-emerald-400/40 bg-emerald-500/20 px-3 py-1.5 text-xs font-black text-emerald-200 transition hover:bg-emerald-500/30 cursor-pointer',
  dormancyBanner: 'flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-amber-500/40 bg-amber-500/10 p-4 text-amber-100 animate-pulse',
  dormancyContent: 'flex items-center gap-2',
  dormancyIcon: 'h-5 w-5 shrink-0 text-amber-300',
  dormancyTitle: 'text-sm font-black',
  dormancyBody: 'mt-0.5 text-xs leading-5 text-amber-200/80',
  dormancyBtn: 'shrink-0 rounded-xl border border-amber-400/40 bg-amber-500/15 px-4 py-2 text-xs font-black text-amber-100 hover:bg-amber-500/25',
  connectionBanner: 'flex flex-wrap items-center gap-3 rounded-3xl border border-slate-600/50 bg-slate-800/40 p-4 text-slate-200',
  connectionIcon: 'h-5 w-5 shrink-0 text-slate-300',
  connectionTitle: 'text-sm font-black',
  connectionBody: 'mt-0.5 text-xs leading-5 text-slate-300/80',
} as const;

export interface CaptainBannersProps {
  direction: string;
  hasActiveRequest: boolean;
  screen: string;
  isDormancyWarningVisible: boolean;
  isOffline: boolean;
  isReconnecting: boolean;
  onReturnToTrip: () => void;
  onResetDormancy: () => void;
}

export function CaptainBanners({
  direction,
  hasActiveRequest,
  screen,
  isDormancyWarningVisible,
  isOffline,
  isReconnecting,
  onReturnToTrip,
  onResetDormancy,
}: CaptainBannersProps) {
  const t = useTranslations('captainDashboard');

  return (
    <>
      {hasActiveRequest && screen !== 'ACTIVE_TRIP' ? (
        <div className={styles.activeTripBanner}>
          <div className={styles.activeTripText}>
            <span className={styles.pulseContainer}>
              <span className={styles.pulsePing} />
              <span className={styles.pulseCore} />
            </span>
            <span>{direction === 'rtl' ? 'لديك رحلة نشطة جارية الآن' : 'Active trip in progress'}</span>
          </div>
          <button
            type="button"
            onClick={onReturnToTrip}
            className={styles.returnTripBtn}
          >
            {direction === 'rtl' ? 'العودة للرحلة' : 'Return to trip'}
          </button>
        </div>
      ) : null}

      {isDormancyWarningVisible ? (
        <div className={styles.dormancyBanner}>
          <div className={styles.dormancyContent}>
            <AlertTriangle className={styles.dormancyIcon} />
            <div>
              <p className={styles.dormancyTitle}>{t('dormancyWarningTitle')}</p>
              <p className={styles.dormancyBody}>{t('dormancyWarningBody')}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onResetDormancy}
            className={styles.dormancyBtn}
          >
            {t('dormancyWarningButton')}
          </button>
        </div>
      ) : null}

      {isOffline || isReconnecting ? (
        <div className={styles.connectionBanner}>
          <WifiOff className={styles.connectionIcon} />
          <div>
            <p className={styles.connectionTitle}>
              {isOffline ? t('offlineBannerTitle') : t('reconnectingTitle')}
            </p>
            <p className={styles.connectionBody}>
              {isOffline ? t('offlineBannerBody') : t('reconnectingBody')}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
