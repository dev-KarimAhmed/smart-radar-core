'use client';

import React, { Suspense, useRef } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { ShieldAlert } from 'lucide-react';
import { useMaplibreInstance } from '@/shared/hooks/use-maplibre-instance';
import { getSafeLandingPageUrl } from '@/shared/services/supabase-auth-headers';
import { styles, DEFAULT_AMMAN_CENTER } from './track-styles';
import { useTrackSession } from './use-track-session';
import { TrackErrorView } from './track-error-view';
import { TrackDetailsSidebar } from './track-details-sidebar';

function TrackContent() {
  const searchParams = useSearchParams();
  const langParam = searchParams.get('lang') || 'ar';
  const isArabic = langParam !== 'en';
  const requestId = (searchParams.get('id') || searchParams.get('trip') || '').trim();
  const token = (searchParams.get('t') || searchParams.get('token') || '').trim();

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const { mapRef, isMapReady } = useMaplibreInstance({
    containerRef: mapContainerRef,
    center: DEFAULT_AMMAN_CENTER,
    zoom: 15,
  });

  const {
    isInitialLoading,
    errorState,
    coords,
    shortId,
    captainName,
    plate,
    vehicle,
    destination,
    captainPhone,
    lastUpdated,
    tripStatus,
  } = useTrackSession({
    requestId,
    token,
    isArabic,
    mapRef,
    isMapReady,
  });

  if (isInitialLoading) {
    return (
      <div className={styles.loadingRoot}>
        <div className={styles.loadingSpinner} />
        <p className={styles.loadingText}>
          {isArabic ? 'جاري التحقق من رابط التتبع المباشر...' : 'Verifying secure live tracking link...'}
        </p>
      </div>
    );
  }

  if (errorState) {
    return <TrackErrorView errorState={errorState} isArabic={isArabic} />;
  }

  return (
    <div className={styles.root} dir={isArabic ? 'rtl' : 'ltr'}>
      <header className={styles.header}>
        <div className={styles.headerBrand}>
          <a href={getSafeLandingPageUrl()} className={styles.headerLink}>
            <Image src="/icons/logo-header.png" alt="Radar" width={585} height={152} priority className={styles.headerLogo} />
          </a>
        </div>
        <div className={styles.livePill}>
          <span className={styles.liveDot} />
          <span>{isArabic ? 'تتبع مباشر للرحلة' : 'Live Trip Tracking'}</span>
        </div>
      </header>

      <div className={styles.bannerAlert}>
        <div className={styles.bannerIconText}>
          <ShieldAlert className={styles.iconAmber} />
          <span>{isArabic ? 'مشاركة مسار الرحلة الحية - يتحدث موقع المركبة على الخريطة بشكل فوري' : 'Live trip tracking share - Vehicle location updates in real-time'}</span>
        </div>
        <span className={styles.bannerId}>#{shortId}</span>
      </div>

      <main className={styles.mainGrid}>
        <div ref={mapContainerRef} className={styles.mapContainer} />

        <TrackDetailsSidebar
          isArabic={isArabic}
          tripStatus={tripStatus}
          captainName={captainName}
          vehicle={vehicle}
          plate={plate}
          destination={destination}
          lastUpdated={lastUpdated}
          coords={coords}
          captainPhone={captainPhone}
        />
      </main>
    </div>
  );
}

function TrackFallback() {
  const isArabic = typeof document !== 'undefined' ? document.documentElement.lang !== 'en' : true;
  return (
    <div className={styles.loadingRoot}>
      <div className={styles.loadingSpinner} />
      <p className={styles.loadingText}>
        {isArabic ? 'جاري تحميل خريطة التتبع المباشر...' : 'Loading live tracking map...'}
      </p>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<TrackFallback />}>
      <TrackContent />
    </Suspense>
  );
}
