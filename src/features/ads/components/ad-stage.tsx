'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AdDisplayCard } from './ad-display-card';
import { AdCardSkeleton } from './ad-card-skeleton';
import { filterAdsByAudience, type AdAudience } from '../services/ad-audience';
import { useAuth } from '@/hooks/use-auth';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { useAdCampaigns } from '@/hooks/use-ad-campaigns';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase-client';
import { recordRiderActivity } from '@/features/referral/services/captain-referral';
import {
  styles,
  AD_STAGE_COPY,
  filterAdsByLocalContext,
  buildBrandPlaceholderAd,
  getBadgeText,
} from './ad-stage-styles';
import {
  mapAdCampaignRow,
  getAdMedia,
  PLACEHOLDER_BANNER_URL,
} from '../services/ad-stage-media';
import {
  shouldTrackAd,
  enqueueAdEvent,
  flushAdEventBuffer,
  flushAdEventBufferOnExit,
  getVisibleAdForMetric,
} from '../services/ad-stage-telemetry';
import { AdTakeoverModal, AdTakeoverMedia } from './ad-takeover-modal';
import { useAdStageScrollStream } from '../hooks/use-ad-stage-scroll-stream';

export {
  styles,
  AD_STAGE_COPY,
  filterAdsByLocalContext,
  buildBrandPlaceholderAd,
  getBadgeText,
  mapAdCampaignRow,
  getAdMedia,
  PLACEHOLDER_BANNER_URL,
  shouldTrackAd,
  enqueueAdEvent,
  flushAdEventBuffer,
  flushAdEventBufferOnExit,
  getVisibleAdForMetric,
  AdTakeoverModal,
  AdTakeoverMedia,
};

export function AdStage({
  audience,
  isFullScreen = false,
  onRequestRideClick,
}: {
  audience?: AdAudience;
  isFullScreen?: boolean;
  onRequestRideClick?: () => void;
}) {
  const tAuto = useTranslations('auto');
  const { user } = useAuth();
  const { direction, isArabic, language } = useDashboardLanguage();
  const adStageDirection = isArabic ? 'rtl' : 'ltr';
  const prefersReducedMotion = useReducedMotion();
  const copy = AD_STAGE_COPY[language];
  const liveDistrict = user?.district || copy.fallbackDistrict;
  const liveGovernorate = user?.governorate || copy.fallbackGovernorate;

  const { data: adCampaignRows, isLoading: isLoadingAds, isError: hasAdFetchIssue } = useAdCampaigns();
  const serverAds = useMemo(
    () => (Array.isArray(adCampaignRows) ? adCampaignRows.map(mapAdCampaignRow) : []),
    [adCampaignRows]
  );
  const [heartedAdIds, setHeartedAdIds] = useState<string[]>([]);
  const [takeoverAd, setTakeoverAd] = useState<any | null>(null);
  const impressedAdIdsRef = useRef<Set<string>>(new Set());

  const adsToUse = useMemo(() => {
    const audienceAds = filterAdsByAudience(serverAds, audience);
    const filteredAds = filterAdsByLocalContext(liveDistrict, liveGovernorate, audienceAds);
    if (filteredAds.length > 0) return filteredAds;

    return [
      buildBrandPlaceholderAd(copy, hasAdFetchIssue ? copy.emptyFetchIssue : copy.emptyDescription, audience),
    ];
  }, [audience, copy, hasAdFetchIssue, liveDistrict, liveGovernorate, serverAds]);

  const displayAds = useMemo(() => {
    if (adsToUse.length <= 1) return adsToUse;
    if (adsToUse.length < 4) {
      return [...adsToUse, ...adsToUse, ...adsToUse];
    }
    return [...adsToUse, ...adsToUse];
  }, [adsToUse]);

  const {
    scrollTrackRef,
    isAdStreamPaused,
    canScrollLeft,
    canScrollRight,
    updateScrollButtons,
    handleTouchStart,
    handleTouchEnd,
    handleMouseEnter,
    handleMouseLeave,
    scrollAds,
    registerManualTrackScroll,
  } = useAdStageScrollStream({
    adsCount: adsToUse.length,
    adStageDirection,
    prefersReducedMotion,
    takeoverAd,
    adsToUse,
  });

  useEffect(() => {
    adsToUse.forEach((ad: any) => {
      if (shouldTrackAd(ad) && !impressedAdIdsRef.current.has(String(ad.id))) {
        impressedAdIdsRef.current.add(String(ad.id));
        enqueueAdEvent(ad, 'impression');
      }
    });
  }, [adsToUse]);

  useEffect(() => {
    if (audience === 'rider' || !audience) {
      const timer = setTimeout(() => {
        void recordRiderActivity('ad_watch');
      }, 10000);

      return () => clearTimeout(timer);
    }
  }, [audience]);

  useEffect(() => {
    const flushOnExit = () => flushAdEventBufferOnExit();
    window.addEventListener('beforeunload', flushOnExit);
    window.addEventListener('pagehide', flushOnExit);

    return () => {
      window.removeEventListener('beforeunload', flushOnExit);
      window.removeEventListener('pagehide', flushOnExit);
      void flushAdEventBuffer();
    };
  }, []);

  useEffect(() => {
    const stored = localStorage.getItem('sovereign_hearted_ads');
    if (!stored) return;
    try {
      setHeartedAdIds(JSON.parse(stored));
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.warn('[AdStage] failed to parse saved ads:', error);
    }
  }, []);

  const syncFavoriteAd = useCallback(
    async (ad: any, shouldFavorite: boolean) => {
      if (!user?.uid || !shouldTrackAd(ad)) return;

      try {
        if (shouldFavorite) {
          await supabase.from('ad_favorites').upsert(
            {
              profile_id: user.uid,
              ad_id: String(ad.id),
              saved_at: new Date().toISOString(),
            },
            { onConflict: 'profile_id,ad_id' }
          );
        } else {
          await supabase
            .from('ad_favorites')
            .delete()
            .eq('profile_id', user.uid)
            .eq('ad_id', String(ad.id));
        }
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') console.warn('[AdStage] favorite sync skipped:', error);
      }
    },
    [user?.uid]
  );

  const toggleHeart = (event: React.MouseEvent, ad: any) => {
    event.preventDefault();
    event.stopPropagation();

    const adId = ad.id;
    const alreadyHearted = heartedAdIds.includes(adId);
    const nextHearts = alreadyHearted
      ? heartedAdIds.filter((id) => id !== adId)
      : [...heartedAdIds, adId];

    setHeartedAdIds(nextHearts);
    localStorage.setItem('sovereign_hearted_ads', JSON.stringify(nextHearts));

    try {
      const vault = JSON.parse(localStorage.getItem('sovereign_ad_vault_details') || '{}');
      if (alreadyHearted) {
        delete vault[adId];
      } else {
        vault[adId] = { ...ad, savedAtTimestamp: Date.now() };
        setTakeoverAd(ad);
      }
      localStorage.setItem('sovereign_ad_vault_details', JSON.stringify(vault));
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.warn('[AdStage] failed to update saved ads:', error);
    }

    void syncFavoriteAd(ad, !alreadyHearted);
  };

  const openTakeover = (event: React.MouseEvent, ad: any) => {
    event.preventDefault();
    event.stopPropagation();
    setTakeoverAd(ad);
    enqueueAdEvent(ad, 'click');
    void recordRiderActivity('ad_click');
  };

  const showNavigationShell = true;
  const heightClass = isFullScreen ? styles.stageFull : styles.stageCompact;
  const cardClassName = isFullScreen ? styles.cardFull : styles.cardCompact;

  if (isLoadingAds) {
    return (
      <section
        className={cn(
          styles.style398_6,
          heightClass,
          isFullScreen ? styles.style400_7 : styles.style400_8,
          isFullScreen && "py-0 sm:py-0 border-b-0"
        )}
        dir={direction}
        aria-busy="true"
        aria-label={copy.loadingTitle}
      >
        <div
          className={cn(styles.style446_18, isFullScreen && styles.style446_19)}
          dir={adStageDirection}
        >
          {showNavigationShell && (
            <>
              <div
                className={cn(styles.style457_20, 'opacity-20 pointer-events-none')}
                aria-hidden="true"
              >
                <ChevronLeft className={styles.style463_23} />
              </div>
              <div
                className={cn(styles.style472_24, 'opacity-20 pointer-events-none')}
                aria-hidden="true"
              >
                <ChevronRight className={styles.style478_27} />
              </div>
            </>
          )}

          <div
            className={cn(
              styles.style490_28,
              'justify-center px-6 sm:px-16 pointer-events-none'
            )}
          >
            <div className={cn(styles.style497_31, 'hidden md:block opacity-25')}>
              <AdCardSkeleton className={cardClassName} />
            </div>
            <div className={styles.style497_31}>
              <AdCardSkeleton className={cardClassName} />
            </div>
            <div className={cn(styles.style497_31, 'hidden sm:block opacity-35')}>
              <AdCardSkeleton className={cardClassName} />
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section
      className={cn(
        styles.style398_6,
        heightClass,
        isFullScreen ? styles.style400_7 : styles.style400_8,
        isFullScreen && "py-0 sm:py-0 border-b-0"
      )}
      dir={direction}
    >
      <div
        className={cn(styles.style446_18, isFullScreen && styles.style446_19)}
        dir={adStageDirection}
      >
        {showNavigationShell && (
          <>
            <button
              type="button"
              aria-label={copy.previous}
              disabled={!canScrollLeft}
              onClick={() => scrollAds('left')}
              className={cn(
                styles.style457_20,
                canScrollLeft ? styles.style459_21 : styles.style460_22
              )}
            >
              <ChevronLeft className={styles.style463_23} />
            </button>

            <button
              type="button"
              aria-label={copy.next}
              disabled={!canScrollRight}
              onClick={() => scrollAds('right')}
              className={cn(
                styles.style472_24,
                canScrollRight ? styles.style474_25 : styles.style475_26
              )}
            >
              <ChevronRight className={styles.style478_27} />
            </button>
          </>
        )}

        <div
          ref={scrollTrackRef}
          data-ad-carousel-track="true"
          data-paused={isAdStreamPaused ? 'true' : 'false'}
          data-ad-count={adsToUse.length}
          onScroll={() => {
            updateScrollButtons();
            registerManualTrackScroll();
          }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          onTouchCancel={handleTouchEnd}
          onPointerDown={(e) => {
            if (e.pointerType === 'touch') handleTouchStart();
          }}
          onPointerUp={(e) => {
            if (e.pointerType === 'touch') handleTouchEnd();
          }}
          style={{ WebkitOverflowScrolling: 'touch', touchAction: 'pan-x' }}
          className={cn(
            styles.style490_28,
            adsToUse.length === 1 ? styles.style491_29 : styles.style491_30
          )}
        >
          {displayAds.map((ad: any, index: number) => (
            <div
              key={`${ad.id}-${index}`}
              className={styles.style497_31}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
            >
              <AdDisplayCard
                ad={ad}
                isHearted={heartedAdIds.includes(ad.id)}
                onHeart={toggleHeart}
                onOpen={
                  ad.isPlaceholder
                    ? audience === 'rider'
                      ? () => {
                          if (typeof window !== 'undefined') {
                            window.location.href = '/register/advertiser';
                          }
                        }
                      : undefined
                    : openTakeover
                }
                badgeText={getBadgeText(ad, copy)}
                showHeart={!ad.isPlaceholder}
                className={cardClassName}
              />
            </div>
          ))}
        </div>
      </div>

      <AdTakeoverModal
        takeoverAd={takeoverAd}
        onClose={() => setTakeoverAd(null)}
        isHearted={takeoverAd ? heartedAdIds.includes(takeoverAd.id) : false}
        onToggleHeart={toggleHeart}
        copy={copy}
        direction={direction}
        isArabic={isArabic}
        tAuto={tAuto}
      />
    </section>
  );
}
