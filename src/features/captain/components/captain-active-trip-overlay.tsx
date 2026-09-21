'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Languages, WifiOff } from 'lucide-react';
import type { Trip } from '@/core/types';
import type { CaptainTripStep } from '../state/captain-state-machine';
import { ActiveTripTracker } from './active-trip-tracker';

interface CaptainActiveTripOverlayProps {
  direction: 'rtl' | 'ltr' | string;
  language: 'ar' | 'en';
  isOffline: boolean;
  isReconnecting: boolean;
  activeRequest: Trip;
  acceptedRider: any;
  step: CaptainTripStep;
  currency: string;
  driverLocation: any;
  handshakeAt: any;
  isCompleting: boolean;
  isCancelling: boolean;
  onToggleLanguage: () => void;
  onArrived: () => void | Promise<void>;
  onStartTrip: () => void | Promise<void>;
  onCompleteTrip: () => void | Promise<void>;
  onCancelTrip: () => void | Promise<void>;
}

const styles = {
  tripFocusRoot: "fixed inset-0 z-40 overflow-y-auto bg-[#0B0F19] p-3 text-white sm:p-5",
  tripFocusInner: "mx-auto flex min-h-full w-full max-w-4xl flex-col gap-3",
  tripFocusBar: "flex items-center justify-end gap-2",
  langButton: "inline-flex items-center gap-1.5 rounded-xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 px-2.5 py-2 text-[#14F5D5] transition hover:bg-[#14B8A6]/20 sm:rounded-2xl sm:px-4 sm:py-3",
  langIcon: "h-4 w-4",
  langText: "hidden text-sm font-black sm:inline",
  connectionBanner: "flex flex-wrap items-center gap-3 rounded-3xl border border-slate-600/50 bg-slate-800/40 p-4 text-slate-200",
  connectionBannerIcon: "h-5 w-5 shrink-0 text-slate-300",
  connectionBannerTitle: "text-sm font-black",
  connectionBannerBody: "mt-0.5 text-xs leading-5 text-slate-300/80",
} as const;

export const CaptainActiveTripOverlay = React.memo(function CaptainActiveTripOverlay({
  direction,
  language,
  isOffline,
  isReconnecting,
  activeRequest,
  acceptedRider,
  step,
  currency,
  driverLocation,
  handshakeAt,
  isCompleting,
  isCancelling,
  onToggleLanguage,
  onArrived,
  onStartTrip,
  onCompleteTrip,
  onCancelTrip,
}: CaptainActiveTripOverlayProps) {
  const t = useTranslations('captainDashboard');

  return (
    <div className={styles.tripFocusRoot} dir={direction} data-captain-trip-focus>
      <div className={styles.tripFocusInner}>
        <div className={styles.tripFocusBar}>
          <button
            type="button"
            onClick={onToggleLanguage}
            aria-label={t('switchLanguageAria')}
            title={t('switchLanguageLabel')}
            className={styles.langButton}
          >
            <Languages className={styles.langIcon} />
            <span className={styles.langText}>{t('switchLanguageLabel')}</span>
          </button>
        </div>

        {isOffline || isReconnecting ? (
          <div className={styles.connectionBanner}>
            <WifiOff className={styles.connectionBannerIcon} />
            <div>
              <p className={styles.connectionBannerTitle}>
                {isOffline ? t('offlineBannerTitle') : t('reconnectingTitle')}
              </p>
              <p className={styles.connectionBannerBody}>
                {isOffline ? t('offlineBannerBody') : t('reconnectingBody')}
              </p>
            </div>
          </div>
        ) : null}

        <ActiveTripTracker
          language={language}
          request={activeRequest}
          rider={acceptedRider}
          step={step}
          isCompleting={isCompleting}
          isCancelling={isCancelling}
          currency={currency}
          driverLocation={driverLocation}
          handshakeAt={handshakeAt}
          isFullScreen
          onArrived={onArrived}
          onStartTrip={onStartTrip}
          onCompleteTrip={onCompleteTrip}
          onCancelTrip={onCancelTrip}
        />
      </div>
    </div>
  );
});
