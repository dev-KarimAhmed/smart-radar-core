'use client';

import React, { useState, useEffect } from 'react';
import { Navigation, MapPinOff, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Metric } from './rider-view-primitives';
import type { RiderLocationStatus } from './rider-map';

const styles = {
  wrapper: "space-y-3.5",
  rtl: "text-right",
  ltr: "text-left",
  header: "space-y-1",
  eyebrow: "text-[11px] font-black text-[#14F5D5]",
  title: "text-xl font-bold text-white",
  subtitle: "text-xs leading-relaxed text-slate-400",
  metrics: "grid grid-cols-2 gap-3 rounded-2xl border border-white/5 bg-white/5 p-4",
  warningBox: "rounded-2xl border border-rose-500/35 bg-rose-500/10 p-3 sm:p-3.5 space-y-1.5 text-start animate-in fade-in duration-200",
  warningHeader: "flex items-center gap-2 text-rose-300 font-black text-xs sm:text-sm",
  warningIcon: "h-4 w-4 shrink-0 text-rose-400",
  warningText: "text-[11px] sm:text-xs leading-relaxed text-slate-200 font-medium",
  requestButton: "min-h-[48px] sm:min-h-[56px] w-full bg-[#14B8A6] text-[#0A0F1D] font-black text-sm sm:text-base py-3 sm:py-3.5 rounded-xl transition-transform active:scale-[0.98] shadow-lg shadow-[#14B8A6]/20 hover:bg-[#2DD4BF] flex items-center justify-center gap-2 cursor-pointer",
  requestButtonIcon: "ml-2 h-4 w-4 sm:h-5 sm:w-5",
  blockedButton: "min-h-[48px] sm:min-h-[56px] w-full bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-black text-sm sm:text-base py-3 sm:py-3.5 rounded-xl transition-transform active:scale-[0.98] shadow-lg shadow-rose-950/50 flex items-center justify-center gap-2 cursor-pointer border border-rose-400/30",
  secondaryExploreLink: "w-full text-center text-[11px] text-slate-400 hover:text-white transition-colors py-1 cursor-pointer block mt-1",
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
  const [isLocationDisabled, setIsLocationDisabled] = useState(
    locationStatus === 'denied' || locationStatus === 'fallback'
  );

  useEffect(() => {
    if (locationStatus === 'denied' || locationStatus === 'fallback') {
      setIsLocationDisabled(true);
    } else if (locationStatus === 'live') {
      setIsLocationDisabled(false);
    }
  }, [locationStatus]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // 1. Check Permissions API
    if (typeof navigator !== 'undefined' && navigator.permissions?.query) {
      navigator.permissions.query({ name: 'geolocation' }).then((res) => {
        if (res.state === 'denied') {
          setIsLocationDisabled(true);
        }
        res.onchange = () => {
          if (res.state === 'denied') {
            setIsLocationDisabled(true);
          }
        };
      }).catch(() => undefined);
    }

    // 2. Active probe to catch OS-level location disabled (e.g. Windows location off)
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        () => {
          setIsLocationDisabled(false);
        },
        () => {
          setIsLocationDisabled(true);
          window.dispatchEvent(new CustomEvent('system-location-denied'));
        },
        { enableHighAccuracy: false, timeout: 2500, maximumAge: 0 }
      );
    }

    const handleDenied = () => setIsLocationDisabled(true);
    const handleGranted = () => setIsLocationDisabled(false);

    window.addEventListener('system-location-denied', handleDenied);
    window.addEventListener('system-location-granted', handleGranted);

    return () => {
      window.removeEventListener('system-location-denied', handleDenied);
      window.removeEventListener('system-location-granted', handleGranted);
    };
  }, []);

  const handleRequestClick = () => {
    if (isLocationDisabled) {
      // Trigger system permission prompt & open permissions guidance modal
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('open-system-permissions-modal'));
        window.dispatchEvent(new CustomEvent('request-live-location'));
        if (typeof navigator !== 'undefined' && navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            () => {
              setIsLocationDisabled(false);
              window.dispatchEvent(new CustomEvent('system-location-granted'));
              window.dispatchEvent(new CustomEvent('request-live-location'));
            },
            () => {
              setIsLocationDisabled(true);
              window.dispatchEvent(new CustomEvent('system-location-denied'));
            },
            { enableHighAccuracy: true, timeout: 5000 }
          );
        }
      }
      return;
    }

    onOpenDestination();
  };

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

        {/* Location Denied Critical Notice */}
        {isLocationDisabled && (
          <div className={styles.warningBox}>
            <div className={styles.warningHeader}>
              <MapPinOff className={styles.warningIcon} />
              <span>{isArabic ? 'إذن الموقع الجغرافي (GPS) مغلق' : 'Location Permission Disabled'}</span>
            </div>
            <p className={styles.warningText}>
              {isArabic
                ? 'لن تتمكن من تحديد منطقتك الحالية أو إرسال طلب رحلة للكباتن دون تفعيل الموقع. يجب تفعيل إذن الموقع إذا أردت المتابعة.'
                : 'You cannot determine your pickup area or request a ride without location access. You must enable location to continue.'}
            </p>
          </div>
        )}

        <div className={styles.metrics}>
          <Metric
            label={t('panel.yourArea')}
            value={
              isLocationDisabled
                ? (isArabic ? 'الموقع متوقف (غير محدد)' : 'Location Disabled')
                : isGeocoding || (!currentAddressName && locationStatus !== 'live')
                ? t('panel.locating')
                : currentAddressName || (locationStatus === 'live' ? t('destination.currentLocation') : t('destination.fallbackLocation'))
            }
          />
          <Metric label={t('panel.yourRating')} value={`${Math.floor(riderRating || 5)} / 5`} />
        </div>

        {isLocationDisabled ? (
          <div>
            <button
              type="button"
              onClick={handleRequestClick}
              className={styles.blockedButton}
            >
              <Lock className={styles.requestButtonIcon} />
              <span>{isArabic ? 'تفعيل إذن الموقع لبدء الطلب' : 'Enable Location to Request'}</span>
            </button>
            <button
              type="button"
              onClick={onOpenDestination}
              className={styles.secondaryExploreLink}
            >
              {isArabic ? 'استكشاف الخريطة فقط دون طلب' : 'Explore map only without ordering'}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleRequestClick}
            className={styles.requestButton}
          >
            <Navigation className={styles.requestButtonIcon} />
            <span>{t('panel.requestRide')}</span>
          </button>
        )}
      </div>
    </motion.div>
  );
}
