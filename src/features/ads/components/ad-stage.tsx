'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence } from 'motion/react';
import { useTranslations } from 'next-intl';
import { AdCardSkeleton } from './ad-card-skeleton';
import { AdRiverCarousel } from './ad-river-carousel';
import { AdTakeoverModal } from './ad-takeover-modal';
import { filterAdsByAudience, type AdAudience } from '../services/ad-audience';
import { mapAdCampaignRow } from '../services/ad-campaign-mapper';
import {
  enqueueAdEvent,
  flushAdEventBuffer,
  flushAdEventBufferOnExit,
  shouldTrackAd,
} from '../services/ad-stage-metrics';
import {
  AD_STAGE_COPY,
  type AdStageCopy,
  buildBrandPlaceholderAd,
  filterAdsByLocalContext,
} from '../services/ad-stage-copy';
import { useAuth } from '@/hooks/use-auth';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { useAdCampaigns } from '@/hooks/use-ad-campaigns';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase-client';
import { recordRiderActivity } from '@/features/referral/services/captain-referral';
import { CAPTAIN_SECTOR_ADS } from '../config/captain-sector-ads';
import { RIDER_SECTOR_ADS } from '../config/rider-sector-ads';

function getBadgeText(ad: any, copy: AdStageCopy) {
  if (ad.adType === 'RIDER_BENEFIT') return copy.riderBadge;
  if (ad.adType === 'CAPTAIN_PROFESSIONAL') return copy.captainBadge;
  return copy.nearbyBadge;
}

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
  const copy = AD_STAGE_COPY[language];
  const liveDistrict = user?.district || copy.fallbackDistrict;
  const liveGovernorate = user?.governorate || copy.fallbackGovernorate;

  const { data: adCampaignRows, isLoading: isLoadingAds, isError: hasAdFetchIssue } = useAdCampaigns();
  const serverAds = useMemo(
    () => (Array.isArray(adCampaignRows) ? adCampaignRows.map(mapAdCampaignRow) : []),
    [adCampaignRows],
  );

  const [heartedAdIds, setHeartedAdIds] = useState<string[]>([]);
  const [takeoverAd, setTakeoverAd] = useState<any | null>(null);
  const impressedAdIdsRef = useRef<Set<string>>(new Set());

  const adsToUse = useMemo(() => {
    if (audience === 'captain') {
      const audienceAds = filterAdsByAudience(serverAds, 'captain');
      const filteredServerAds = filterAdsByLocalContext(liveDistrict, liveGovernorate, audienceAds);
      return filteredServerAds.length > 0 ? [...filteredServerAds, ...CAPTAIN_SECTOR_ADS] : CAPTAIN_SECTOR_ADS;
    }

    const audienceAds = filterAdsByAudience(serverAds, audience);
    const filteredAds = filterAdsByLocalContext(liveDistrict, liveGovernorate, audienceAds);
    return filteredAds.length > 0 ? [...filteredAds, ...RIDER_SECTOR_ADS] : RIDER_SECTOR_ADS;
  }, [audience, liveDistrict, liveGovernorate, serverAds]);

  const repeatCount = useMemo(() => {
    if (adsToUse.length <= 1) return 1;
    if (adsToUse.length === 2) return 4;
    if (adsToUse.length < 5) return 3;
    return 2;
  }, [adsToUse.length]);

  const displayAds = useMemo(() => {
    if (repeatCount <= 1) return adsToUse;
    return Array.from({ length: repeatCount }, () => adsToUse).flat();
  }, [adsToUse, repeatCount]);

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
            { profile_id: user.uid, ad_id: String(ad.id), saved_at: new Date().toISOString() },
            { onConflict: 'profile_id,ad_id' },
          );
        } else {
          await supabase.from('ad_favorites').delete().eq('profile_id', user.uid).eq('ad_id', String(ad.id));
        }
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') console.warn('[AdStage] favorite sync skipped:', error);
      }
    },
    [user?.uid],
  );

  const toggleHeart = (event: React.MouseEvent, ad: any) => {
    event.preventDefault();
    event.stopPropagation();
    const adId = ad.id;
    const alreadyHearted = heartedAdIds.includes(adId);
    const nextHearts = alreadyHearted ? heartedAdIds.filter((id) => id !== adId) : [...heartedAdIds, adId];
    setHeartedAdIds(nextHearts);
    localStorage.setItem('sovereign_hearted_ads', JSON.stringify(nextHearts));
    void syncFavoriteAd(ad, !alreadyHearted);
  };

  const openTakeover = (event: React.MouseEvent, ad: any) => {
    event.stopPropagation();
    enqueueAdEvent(ad, 'click');
    setTakeoverAd(ad);
  };

  const heightClass = isFullScreen
    ? 'h-full min-h-0 w-full flex-1 justify-center items-center'
    : 'h-[280px] w-full sm:h-[320px]';
  const cardClassName = isFullScreen
    ? '!h-full !max-h-[700px] aspect-[904/1280] !w-auto max-w-[94vw] sm:max-w-[min(490px,88vw)] !flex-shrink-0 !flex-grow-0'
    : 'h-[216px] w-[270px] sm:h-[250px] sm:w-[280px] md:w-[340px]';

  if (isLoadingAds && serverAds.length === 0) {
    return (
      <div className={cn('flex items-center justify-center p-4', heightClass)}>
        <AdCardSkeleton className={cardClassName} />
      </div>
    );
  }

  return (
    <section
      className={cn(
        'relative z-[10] flex w-full flex-col justify-center items-center overflow-hidden border-b border-white/5 bg-[#0B0F19] pt-0 pb-2 pointer-events-auto select-none sm:py-2',
        heightClass,
        'justify-center items-center',
        isFullScreen && 'py-0 sm:py-0 border-b-0',
      )}
      dir={direction}
    >
      {onRequestRideClick && (
        <div className="sticky top-0 z-[40] mb-2 flex shrink-0 items-center justify-center w-full px-3 py-2 sm:px-6 sm:py-3 border-b border-[#14B8A6]/20 bg-[#0B0F19]/95 backdrop-blur-md lg:hidden">
          <button
            type="button"
            onClick={onRequestRideClick}
            className="group flex min-h-[48px] sm:min-h-[56px] w-full max-w-[260px] sm:max-w-[300px] cursor-pointer items-center justify-center gap-2.5 rounded-full border border-[#14F5D5]/50 bg-gradient-to-r from-[#14B8A6] via-[#14F5D5] to-[#14B8A6] px-5 py-2.5 sm:px-7 sm:py-3.5 text-base sm:text-xl font-black !text-[#040914] shadow-[0_8px_24px_rgba(20,184,166,0.35)] transition-all duration-300 hover:brightness-110 hover:shadow-[0_12px_32px_rgba(20,245,213,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14F5D5]"
          >
            <span>{copy.requestRide || tAuto('key_0a57feee')}</span>
          </button>
        </div>
      )}

      <AdRiverCarousel
        adsToUse={adsToUse}
        displayAds={displayAds}
        repeatCount={repeatCount}
        cardClassName={cardClassName}
        heartedAdIds={heartedAdIds}
        toggleHeart={toggleHeart}
        openTakeover={openTakeover}
        getBadgeText={(ad) => getBadgeText(ad, copy)}
        showNavigationShell={adsToUse.length > 1}
        copy={copy}
        adStageDirection={adStageDirection}
        isFullScreen={isFullScreen}
        isTakeoverOpen={Boolean(takeoverAd)}
      />

      <AnimatePresence>
        {takeoverAd && (
          <AdTakeoverModal
            takeoverAd={takeoverAd}
            onClose={() => setTakeoverAd(null)}
            copy={copy}
            direction={direction}
            language={language}
          />
        )}
      </AnimatePresence>
    </section>
  );
}
