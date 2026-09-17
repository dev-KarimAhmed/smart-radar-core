'use client';

import React from 'react';
import { CarFront } from 'lucide-react';
import { useTranslations } from 'next-intl';
export type { RiderLocation, RiderLocationStatus, RiderLocationUpdate, RiderMapCaptainPoint } from './rider-map/rider-map-shared';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { RecenterMapButton } from '@/shared/components/map/recenter-map-button';
import { DEFAULT_MAP_CENTER } from '@/shared/services/maplibre-runtime';

import { cn } from '@/lib/utils';
import { styles, RiderMapProps } from './rider-map/rider-map-shared';
import { useRiderMapState } from './rider-map/use-rider-map-state';

export function RiderMap({
  activeTripCaptainId,
  captainLocations = [],
  className,
  destinationFlyToTarget,
  fallbackLocation = DEFAULT_MAP_CENTER,
  showDestinationPin = false,
  onDestinationChange,
  onDestinationMoveStart,
  onLocationChange,
}: RiderMapProps) {
  const t = useTranslations('riderMap');
  const { isArabic } = useDashboardLanguage();
  const containerRef = React.useRef<HTMLDivElement | null>(null);

  const {
    locationStatus,
    activeCaptainCount,
    requestLiveLocation,
    handleRecenter,
  } = useRiderMapState({
    activeTripCaptainId,
    captainLocations,
    destinationFlyToTarget,
    fallbackLocation,
    showDestinationPin,
    onDestinationChange,
    onDestinationMoveStart,
    onLocationChange,
    containerRef,
  });

  return (
    <section className={cn(styles.style423_1, className || '')} dir={isArabic ? 'rtl' : 'ltr'}>
      <style>{`
        .rider-map-surface .maplibregl-ctrl-attrib,
        .rider-map-surface .maplibregl-ctrl-logo {
          display: none !important;
        }
      `}</style>
      <div ref={containerRef} className={styles.style430_2} />
      <div className={styles.style431_3} />
      {showDestinationPin && (
        <div
          data-destination-pin="true"
          className={styles.style435_4}
          aria-hidden="true"
        >
          <div className={styles.style438_5}>
            <div className={styles.style439_6} />
          </div>
          <div className={styles.style441_7} />
          <div className={styles.style442_8}>
            {t('moveMap')}
          </div>
        </div>
      )}

      {!activeTripCaptainId && (
        <div className={styles.style449_9}>
          <span className={styles.style450_10}>
            <CarFront className={styles.style451_11} aria-hidden="true" />
          </span>
          <span className={styles.style453_12}>
            <span className={styles.style454_13}>{t('activeCaptains')}</span>
            <span className={styles.style455_14}>{activeCaptainCount}</span>
          </span>
        </div>
      )}

      {!showDestinationPin && !activeTripCaptainId && captainLocations.length === 0 && (
        <div className={styles.style461_15}>
          {t('offPeak')}
        </div>
      )}
      <RecenterMapButton
        onClick={handleRecenter}
        disabled={locationStatus === 'locating'}
        className={styles.style469_16}
        ariaLabel={t('recenter')}
        title={t('recenter')}
      />
      {locationStatus !== 'live' && (
        <button
          type="button"
          onClick={requestLiveLocation}
          className={styles.style479_18}
        >
          {t('useMyLocation')}
        </button>
      )}
    </section>
  );
}
