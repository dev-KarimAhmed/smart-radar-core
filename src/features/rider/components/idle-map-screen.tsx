'use client';

import React from 'react';
import { Navigation } from 'lucide-react';
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
  requestButton: "h-14 w-full bg-[#14B8A6] text-[#0A0F1D] font-bold text-base py-3.5 rounded-xl transition-transform active:scale-[0.98] shadow-lg shadow-[#14B8A6]/20 hover:bg-[#2DD4BF] flex items-center justify-center gap-2 cursor-pointer",
  requestButtonIcon: "ml-2 h-5 w-5",
} as const;

export interface IdleMapScreenProps {
  isArabic: boolean;
  isGeocoding: boolean;
  currentAddressName: string;
  locationStatus: RiderLocationStatus;
  riderRating: number;
  onOpenDestination: () => void;
}

export function IdleMapScreen({ isArabic, isGeocoding, currentAddressName, locationStatus, riderRating, onOpenDestination }: IdleMapScreenProps) {
  const t = useTranslations('riderView');

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
              isGeocoding
                ? t('panel.locating')
                : currentAddressName || (locationStatus === 'live' ? t('destination.currentLocation') : t('destination.fallbackLocation'))
            }
          />
          <Metric label={t('panel.yourRating')} value={`${Math.floor(riderRating || 5)} / 5`} />
        </div>

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
