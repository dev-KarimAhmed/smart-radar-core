'use client';

import React from 'react';
import { AlertCircle, Navigation, RefreshCw } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Metric } from './rider-view-primitives';
import type { RiderLocationStatus } from './rider-map';

const styles = {
  wrapper: "space-y-4",
  rtl: "text-right",
  ltr: "text-left",
  header: "space-y-1",
  eyebrow: "text-[11px] font-black text-[#14F5D5]",
  title: "text-xl font-bold text-white",
  subtitle: "text-xs leading-relaxed text-slate-400",
  metrics: "grid grid-cols-2 gap-3 rounded-2xl border border-white/5 bg-white/5 p-4",
  requestButton: "min-h-[48px] sm:min-h-[56px] w-full bg-[#14B8A6] text-[#0A0F1D] font-black text-sm sm:text-base py-3 sm:py-3.5 rounded-xl transition-transform active:scale-[0.98] shadow-lg shadow-[#14B8A6]/20 hover:bg-[#2DD4BF] flex items-center justify-center gap-2 cursor-pointer",
  requestButtonIcon: "ml-2 h-4 w-4 sm:h-5 sm:w-5",
} as const;

export interface IdleMapScreenProps {
  isArabic: boolean;
  isGeocoding: boolean;
  currentAddressName: string;
  locationStatus: RiderLocationStatus;
  riderRating: number;
  onOpenDestination: () => void;
  onRefreshLocation?: () => void;
}

export function IdleMapScreen({ isArabic, isGeocoding, currentAddressName, locationStatus, riderRating, onOpenDestination, onRefreshLocation }: IdleMapScreenProps) {
  const t = useTranslations('riderView');
  const locationCopy = useTranslations('location');

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className={cn(styles.wrapper, isArabic ? styles.rtl : styles.ltr)} dir={isArabic ? 'rtl' : 'ltr'}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>{t('panel.readyQuestion')}</p>
          <h2 className={styles.title}>{t('panel.whereTo')}</h2>
          <p className={styles.subtitle}>
            {t('panel.homeSubtitle')}
          </p>
        </div>

        <div className={styles.metrics}>
          <Metric
            label={t('panel.yourArea')}
            value={
              isGeocoding || (!currentAddressName && locationStatus !== 'live')
                ? t('panel.locating')
                : currentAddressName || (locationStatus === 'live' ? t('destination.currentLocation') : t('destination.fallbackLocation'))
            }
          />
          <Metric label={t('panel.yourRating')} value={`${Math.floor(riderRating || 5)} / 5`} />
        </div>

        {locationStatus === 'denied' && (
          <div className="flex flex-col gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-start">
            <div className="flex items-center gap-2 text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
              <span className="text-xs font-black">{locationCopy('warn_location_permission_denied_title')}</span>
            </div>
            <p className="text-[11px] leading-relaxed text-rose-200/90">
              {locationCopy('warn_location_permission_denied_body')}
            </p>
            {onRefreshLocation && (
              <button
                type="button"
                onClick={onRefreshLocation}
                className="mt-1 inline-flex w-fit items-center gap-1.5 rounded-lg border border-rose-500/30 bg-rose-500/20 px-3 py-1.5 text-xs font-bold text-rose-200 transition hover:bg-rose-500/30 active:scale-95"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>{locationCopy('btn_retry_location')}</span>
              </button>
            )}
          </div>
        )}

        <button
          onClick={onOpenDestination}
          className={styles.requestButton}
        >
          <Navigation className={styles.requestButtonIcon} />
          {t('panel.requestRide')}
        </button>
      </div>
    </motion.div>
  );
}
