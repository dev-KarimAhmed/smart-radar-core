'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, useReducedMotion } from 'motion/react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AdDisplayCard } from './ad-display-card';
import { AdTakeoverModal } from './ad-takeover-modal';
import { AdCardSkeleton } from './ad-card-skeleton';
import { getAdManualScrollDelta, getAdScrollDelta, wrapAdScrollPosition } from '../services/ad-stage-scroll';
import { filterAdsByAudience, readAdAudience, type AdAudience } from '../services/ad-audience';
import {
  firstMediaObject,
  firstString,
  isImageMedia,
  isVideoMedia,
  PLACEHOLDER_BANNER_URL,
} from '../services/ad-media-helpers';
import { useAuth } from '@/hooks/use-auth';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { useAdCampaigns } from '@/hooks/use-ad-campaigns';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase-client';
import { recordRiderActivity } from '@/features/referral/services/captain-referral';
import { CAPTAIN_SECTOR_ADS } from '../config/captain-sector-ads';

const styles = {
  style384_1: "relative",
  style384_2: "m-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#14B8A6]/50 bg-[#0B0F19]",
  style385_3: "mb-4 h-12 w-12 animate-spin rounded-full border-t-2 border-[#14B8A6]",
  style386_4: "px-4 text-center text-sm font-bold tracking-widest text-[#14B8A6]",
  style389_5: "text-xs text-gray-400",
  style398_6: "relative z-[10] flex w-full flex-col justify-center items-center overflow-hidden border-b border-white/5 bg-[#0B0F19] pt-0 pb-2 pointer-events-auto select-none sm:py-2",
  style400_7: "justify-center items-center",
  style400_8: "justify-center items-center",
  style405_9: "sticky top-0 z-[40] mb-2 flex shrink-0 items-center justify-center w-full px-3 py-2 sm:px-6 sm:py-3 border-b border-[#14B8A6]/20 bg-[#0B0F19]/95 backdrop-blur-md lg:hidden",
  style423_10: "group flex min-h-[48px] sm:min-h-[56px] w-full max-w-[260px] sm:max-w-[300px] cursor-pointer items-center justify-center gap-2.5 rounded-full border border-[#14F5D5]/50 bg-gradient-to-r from-[#14B8A6] via-[#14F5D5] to-[#14B8A6] px-5 py-2.5 sm:px-7 sm:py-3.5 text-base sm:text-xl font-black !text-[#040914] shadow-[0_8px_24px_rgba(20,184,166,0.35)] transition-all duration-300 hover:brightness-110 hover:shadow-[0_12px_32px_rgba(20,245,213,0.45)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14F5D5]",
  style429_11: "z-[20] mb-1 flex w-full shrink-0 items-center justify-between px-4 sm:mb-2 sm:px-6",
  style430_12: "flex items-center gap-2",
  style431_13: "relative flex h-2.5 w-2.5",
  style432_14: "absolute inline-flex h-full w-full animate-ping rounded-full bg-[#14B8A6] opacity-75",
  style433_15: "relative inline-flex h-2.5 w-2.5 rounded-full bg-[#14B8A6]",
  style435_16: "text-xs font-black uppercase tracking-widest text-[#14F5D5] md:text-sm",
  style439_17: "font-mono text-[9px] font-bold text-gray-500 md:text-[10px]",
  style446_18: "group/river relative flex min-h-0 w-full flex-1 items-center justify-center pt-0 overflow-hidden",
  style446_19: "py-0 sm:py-0 h-full",
  style457_20: "absolute left-3 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[#0B0F19]/88 text-white shadow-xl shadow-black/35 backdrop-blur-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/45 sm:left-4",
  style459_21: "hover:border-[#14B8A6]/45 hover:bg-[#14B8A6]/15",
  style460_22: "cursor-not-allowed opacity-35",
  style463_23: "h-5 w-5",
  style472_24: "absolute right-3 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[#0B0F19]/88 text-white shadow-xl shadow-black/35 backdrop-blur-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/45 sm:right-4",
  style474_25: "hover:border-[#14B8A6]/45 hover:bg-[#14B8A6]/15",
  style475_26: "cursor-not-allowed opacity-35",
  style478_27: "h-5 w-5",
  style490_28: "no-scrollbar flex min-w-0 flex-1 flex-nowrap gap-6 sm:gap-8 overflow-x-auto items-center h-full",
  style491_29: "justify-center px-6 sm:px-16",
  style491_30: "px-14 lg:justify-center",
  style497_31: "flex-shrink-0 flex-grow-0 my-auto h-full flex items-center justify-center",
  stageFull: "h-full w-full flex-1 justify-center items-center min-h-[calc(100vh-7.5rem)]",
  stageCompact: "h-[280px] w-full sm:h-[320px]",
  cardFull: "!h-[min(540px,calc(100vh-9.5rem))] !min-h-[min(540px,calc(100vh-9.5rem))] !max-h-[min(540px,calc(100vh-9.5rem))] aspect-[904/1280] !w-auto !max-w-[min(382px,85vw)] !flex-shrink-0 !flex-grow-0",
  cardCompact: "h-[216px] w-[270px] sm:h-[250px] sm:w-[280px] md:w-[340px]",
} as const;


const AD_BATCH_WRITE_LIMIT = 50;
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type AdEventType = 'impression' | 'swipe' | 'click';

interface AdMetricEvent {
  ad_id: string;
  event_type: AdEventType;
  occurred_at: string;
  source: 'ad_stage';
}

const runtimeEnv = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? process.env;
const supabaseUrl = runtimeEnv.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = runtimeEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const adEventBuffer: AdMetricEvent[] = [];
let isAdEventFlushInFlight = false;

const AD_STAGE_COPY = {
  ar: {
    loadingTitle: 'جاري تحميل الإعلانات',
    loadingSubtitle: 'ثوانٍ من فضلك',
    title: 'إعلانات قريبة منك',
    count: (count: number) => `${count} إعلان`,
    riderBadge: 'للركاب',
    captainBadge: 'للكباتن',
    nearbyBadge: 'إعلان قريب',
    previous: 'الإعلان السابق',
    next: 'الإعلان التالي',
    noMoreAds: 'لا توجد إعلانات أخرى حالياً',
    trustedAd: 'إعلان موثق للتواصل المباشر',
    whatsapp: 'واتساب',
    call: 'اتصال',
    openLocation: 'فتح الموقع',
    whatsappMessage: (title: string) => `مرحباً، شاهدت إعلانكم في التطبيق: ${title}`,
    emptyTitle: 'مرحباً بك في منصة بينكم',
    emptyDescription: 'لا توجد إعلانات نشطة في منطقتك الآن. سنعرض لك العروض فور توفرها.',
    emptyFetchIssue: 'لا توجد إعلانات متاحة الآن. سنعرض لك العروض فور توفرها.',
    emptyButton: 'ابدأ رحلتك',
    emptyButtonRider: 'أعلن هنا',
    fallbackDistrict: 'عمّان',
    fallbackGovernorate: 'العاصمة',
  },
  en: {
    loadingTitle: 'Loading ads',
    loadingSubtitle: 'One moment please',
    title: 'Nearby ads',
    count: (count: number) => `${count} ad${count === 1 ? '' : 's'}`,
    riderBadge: 'For riders',
    captainBadge: 'For drivers',
    nearbyBadge: 'Nearby ad',
    previous: 'Previous ad',
    next: 'Next ad',
    noMoreAds: 'No other ads right now',
    trustedAd: 'Verified ad for direct contact',
    favorite: 'Favorite',
    removeFavorite: 'Remove favorite',
    whatsapp: 'WhatsApp',
    call: 'Call',
    openLocation: 'Open location',
    whatsappMessage: (title: string) => `Hello, I saw your ad in the app: ${title}`,
    emptyTitle: 'Welcome to bynkcom',
    emptyDescription: 'No active ads are available in your area right now. We will show offers as soon as they are available.',
    emptyFetchIssue: 'No ads are available right now. We will show offers as soon as they are available.',
    emptyButton: 'Start your ride',
    emptyButtonRider: 'Advertise here',
    fallbackDistrict: 'Amman',
    fallbackGovernorate: 'Capital',
  },
} as const;

type AdStageCopy = (typeof AD_STAGE_COPY)['ar' | 'en'];

function filterAdsByLocalContext(userDistrict: string, userGovernorate: string, allAds: any[]) {
  return allAds.filter((ad) => {
    if (!ad || !ad.targetScale) return true;
    if (ad.targetScale === 'Governorate') return ad.targetLocationName === userGovernorate;
    if (ad.targetScale === 'District') return ad.targetLocationName === userDistrict;
    return true;
  });
}

function buildBrandPlaceholderAd(
  copy: AdStageCopy,
  description: string = copy.emptyDescription,
  audience?: AdAudience,
) {
  const isRider = audience === 'rider';
  return {
    id: 'brand-empty-state',
    title: copy.emptyTitle,
    description,
    bannerUrl: PLACEHOLDER_BANNER_URL,
    buttonText: isRider ? copy.emptyButtonRider : copy.emptyButton,
    content: {
      title: copy.emptyTitle,
      description,
    },
    isPlaceholder: true,
  };
}

function shouldTrackAd(ad: any) {
  return !!ad?.id && !ad.isPlaceholder && uuidPattern.test(String(ad.id));
}

function enqueueAdEvent(ad: any, eventType: AdEventType) {
  if (!shouldTrackAd(ad)) return;

  adEventBuffer.push({
    ad_id: String(ad.id),
    event_type: eventType,
    occurred_at: new Date().toISOString(),
    source: 'ad_stage',
  });

  if (adEventBuffer.length >= AD_BATCH_WRITE_LIMIT) {
    void flushAdEventBuffer();
  }
}

async function flushAdEventBuffer() {
  if (isAdEventFlushInFlight || adEventBuffer.length === 0) return;

  isAdEventFlushInFlight = true;
  const batch = adEventBuffer.splice(0, adEventBuffer.length);

  try {
    const { error } = await supabase.rpc('flush_ad_campaign_metrics', {
      p_events: batch,
    });
    if (error) throw error;
  } catch (error) {
    adEventBuffer.unshift(...batch);
    if ((process.env.NODE_ENV !== 'production')) console.warn('[AdStage] ad metrics stayed queued:', error);
  } finally {
    isAdEventFlushInFlight = false;
  }
}

function flushAdEventBufferOnExit() {
  if (adEventBuffer.length === 0) return;

  const batch = adEventBuffer.splice(0, adEventBuffer.length);

  if (!supabaseUrl || !supabaseAnonKey) {
    adEventBuffer.unshift(...batch);
    return;
  }

  try {
    void fetch(`${supabaseUrl}/rest/v1/rpc/flush_ad_campaign_metrics`, {
      method: 'POST',
      keepalive: true,
      headers: {
        apikey: supabaseAnonKey,
        authorization: `Bearer ${supabaseAnonKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ p_events: batch }),
    });
  } catch {
    adEventBuffer.unshift(...batch);
  }
}

function getVisibleAdForMetric(track: HTMLDivElement, ads: any[]) {
  const firstCard = Array.from(track.children)[0] as HTMLElement | undefined;
  if (!firstCard || ads.length === 0) return null;

  const cardWidth = firstCard.offsetWidth || 1;
  const gap = 32;
  const index = Math.round(Math.abs(track.scrollLeft) / (cardWidth + gap)) % ads.length;
  return ads[index] || null;
}

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
  const t = useTranslations('adStage');
  const prefersReducedMotion = useReducedMotion();
  const copy = AD_STAGE_COPY[language];
  const liveDistrict = user?.district || copy.fallbackDistrict;
  const liveGovernorate = user?.governorate || copy.fallbackGovernorate;
  // Ads now come from the shared 10-minute React Query cache (single API path).
  const { data: adCampaignRows, isLoading: isLoadingAds, isError: hasAdFetchIssue } = useAdCampaigns();
  const serverAds = useMemo(
    () => (Array.isArray(adCampaignRows) ? adCampaignRows.map(mapAdCampaignRow) : []),
    [adCampaignRows],
  );
  const [heartedAdIds, setHeartedAdIds] = useState<string[]>([]);
  const [takeoverAd, setTakeoverAd] = useState<any | null>(null);
  const [isAdStreamPaused, setIsAdStreamPaused] = useState(false);
  const isAdStreamPausedRef = useRef(false);
  const scrollTrackRef = useRef<HTMLDivElement | null>(null);
  const impressedAdIdsRef = useRef<Set<string>>(new Set());
  const lastManualSwipeMetricAtRef = useRef(0);

  const touchResumeTimerRef = useRef<NodeJS.Timeout | null>(null);

  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const adsToUse = useMemo(() => {
    if (audience === 'captain') {
      const audienceAds = filterAdsByAudience(serverAds, 'captain');
      const filteredServerAds = filterAdsByLocalContext(liveDistrict, liveGovernorate, audienceAds);
      if (filteredServerAds.length > 0) {
        return [...filteredServerAds, ...CAPTAIN_SECTOR_ADS];
      }
      return CAPTAIN_SECTOR_ADS;
    }

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

  useEffect(() => {
    adsToUse.forEach((ad: any) => {
      if (shouldTrackAd(ad) && !impressedAdIdsRef.current.has(String(ad.id))) {
        impressedAdIdsRef.current.add(String(ad.id));
        enqueueAdEvent(ad, 'impression');
      }
    });
  }, [adsToUse]);

  useEffect(() => {
    // Rider active ad engagement:
    // If rider stays on AdStage for >= 10 seconds, record active interaction!
    // (If they open and immediately close/leave within < 10 seconds, timer is cancelled).
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
      if ((process.env.NODE_ENV !== 'production')) console.warn('[AdStage] failed to parse saved ads:', error);
    }
  }, []);

  const updateScrollButtons = useCallback(() => {
    const track = scrollTrackRef.current;
    if (!track) return;

    const tolerance = 2;
    const maxScroll = track.scrollWidth - track.clientWidth;

    if (maxScroll <= 0) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    if (adStageDirection === 'rtl') {
      const isAtRightEdge = track.scrollLeft >= -tolerance;
      const isAtLeftEdge = track.scrollLeft <= -(maxScroll - tolerance);

      setCanScrollRight(!isAtRightEdge);
      setCanScrollLeft(!isAtLeftEdge);
    } else {
      const isAtLeftEdge = track.scrollLeft <= tolerance;
      const isAtRightEdge = track.scrollLeft >= maxScroll - tolerance;

      setCanScrollLeft(!isAtLeftEdge);
      setCanScrollRight(!isAtRightEdge);
    }
  }, [adStageDirection]);

  useEffect(() => {
    updateScrollButtons();
    window.addEventListener('resize', updateScrollButtons);
    return () => window.removeEventListener('resize', updateScrollButtons);
  }, [updateScrollButtons, adsToUse.length]);

  const setAdStreamPaused = useCallback((paused: boolean) => {
    isAdStreamPausedRef.current = paused;
    setIsAdStreamPaused(paused);
  }, []);

  const handleTouchStart = useCallback(() => {
    if (touchResumeTimerRef.current) {
      clearTimeout(touchResumeTimerRef.current);
    }
    setAdStreamPaused(true);
    // Auto-resume after 2s as a failsafe for mobile browsers where touchEnd might not fire during page scroll
    touchResumeTimerRef.current = setTimeout(() => {
      setAdStreamPaused(false);
    }, 2000);
  }, [setAdStreamPaused]);

  const handleTouchEnd = useCallback(() => {
    if (touchResumeTimerRef.current) {
      clearTimeout(touchResumeTimerRef.current);
    }
    touchResumeTimerRef.current = setTimeout(() => {
      setAdStreamPaused(false);
    }, 600);
  }, [setAdStreamPaused]);

  const handleMouseEnter = useCallback(() => {
    if (touchResumeTimerRef.current) {
      clearTimeout(touchResumeTimerRef.current);
      touchResumeTimerRef.current = null;
    }
    setAdStreamPaused(true);
  }, [setAdStreamPaused]);

  const handleMouseLeave = useCallback(() => {
    if (touchResumeTimerRef.current) {
      clearTimeout(touchResumeTimerRef.current);
      touchResumeTimerRef.current = null;
    }
    setAdStreamPaused(false);
  }, [setAdStreamPaused]);

  useEffect(() => {
    return () => {
      if (touchResumeTimerRef.current) {
        clearTimeout(touchResumeTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (adsToUse.length <= 1 || prefersReducedMotion) return;

    let animFrameId: number;
    let lastTimestamp = performance.now();

    const animateScroll = (currentTimestamp: number) => {
      const deltaSeconds = Math.min((currentTimestamp - lastTimestamp) / 1000, 0.1);
      lastTimestamp = currentTimestamp;

      const track = scrollTrackRef.current;
      if (
        track &&
        !isAdStreamPausedRef.current &&
        !takeoverAd &&
        document.visibilityState === 'visible'
      ) {
        const speed = 25;
        const deltaPixels = speed * deltaSeconds;
        const maxScroll = track.scrollWidth - track.clientWidth;

        if (maxScroll > 0) {
          const repeatMultiplier = adsToUse.length < 4 ? 3 : 2;
          const singleSetWidth = track.scrollWidth / repeatMultiplier;

          if (adStageDirection === 'rtl') {
            const currentScroll = track.scrollLeft;
            const currentAbs = Math.abs(currentScroll);

            if (currentAbs >= singleSetWidth - 1 && singleSetWidth > 0) {
              if (currentScroll < 0) {
                track.scrollLeft += singleSetWidth;
              } else {
                track.scrollLeft -= singleSetWidth;
              }
            } else {
              if (currentScroll < 0) {
                track.scrollLeft -= deltaPixels;
              } else if (currentScroll > 0) {
                track.scrollLeft += deltaPixels;
              } else {
                const prev = track.scrollLeft;
                track.scrollLeft -= deltaPixels;
                if (track.scrollLeft === prev) {
                  track.scrollLeft += deltaPixels;
                }
              }
            }
          } else {
            if (track.scrollLeft >= singleSetWidth - 1 && singleSetWidth > 0) {
              track.scrollLeft -= singleSetWidth;
            } else {
              track.scrollLeft += deltaPixels;
            }
          }
        }
      }

      animFrameId = requestAnimationFrame(animateScroll);
    };

    animFrameId = requestAnimationFrame(animateScroll);

    return () => {
      cancelAnimationFrame(animFrameId);
    };
  }, [adsToUse.length, adStageDirection, prefersReducedMotion, takeoverAd]);

  const scrollAds = useCallback((scrollDirection: 'left' | 'right') => {
    const track = scrollTrackRef.current;
    if (!track || adsToUse.length <= 1) return;

    setAdStreamPaused(true);
    if (touchResumeTimerRef.current) {
      clearTimeout(touchResumeTimerRef.current);
    }
    touchResumeTimerRef.current = setTimeout(() => {
      setAdStreamPaused(false);
    }, 400);

    lastManualSwipeMetricAtRef.current = Date.now();
    enqueueAdEvent(getVisibleAdForMetric(track, adsToUse), 'swipe');

    const distance = Math.max(240, Math.min(track.clientWidth * 0.82, 520));
    const delta = scrollDirection === 'left' ? -distance : distance;
    track.scrollBy({
      left: delta,
      behavior: 'smooth',
    });
  }, [adsToUse, setAdStreamPaused]);

  const registerManualTrackScroll = useCallback(() => {
    const track = scrollTrackRef.current;
    if (!track || !isAdStreamPausedRef.current || adsToUse.length <= 1) return;

    const now = Date.now();
    if (now - lastManualSwipeMetricAtRef.current < 1200) return;

    lastManualSwipeMetricAtRef.current = now;
    enqueueAdEvent(getVisibleAdForMetric(track, adsToUse), 'swipe');
  }, [adsToUse]);

  const syncFavoriteAd = useCallback(async (ad: any, shouldFavorite: boolean) => {
    if (!user?.uid || !shouldTrackAd(ad)) return;

    try {
      if (shouldFavorite) {
        await supabase.from('ad_favorites').upsert(
          {
            profile_id: user.uid,
            ad_id: String(ad.id),
            saved_at: new Date().toISOString(),
          },
          { onConflict: 'profile_id,ad_id' },
        );
      } else {
        await supabase
          .from('ad_favorites')
          .delete()
          .eq('profile_id', user.uid)
          .eq('ad_id', String(ad.id));
      }
    } catch (error) {
      if ((process.env.NODE_ENV !== 'production')) console.warn('[AdStage] favorite sync skipped:', error);
    }
  }, [user?.uid]);

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
      if ((process.env.NODE_ENV !== 'production')) console.warn('[AdStage] failed to update saved ads:', error);
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
  const canNavigate = adsToUse.length > 1;
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
            {/* Adjacent card preview on right (for RTL) */}
            <div className={cn(styles.style497_31, 'hidden md:block opacity-25')}>
              <AdCardSkeleton className={cardClassName} />
            </div>
            {/* Center prominent card */}
            <div className={styles.style497_31}>
              <AdCardSkeleton className={cardClassName} />
            </div>
            {/* Adjacent card preview on left (for RTL) */}
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
      {/* <div className={styles.style429_11}>
        <div className={styles.style430_12}>
          <span className={styles.style431_13}>
            <span className={styles.style432_14} />
            <span className={styles.style433_15} />
          </span>
          <h2 className={styles.style435_16}>
            {copy.title}
          </h2>
        </div>
        <span className={styles.style439_17}>
          {copy.count(adsToUse.length)}
        </span>
      </div> */}

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
                canScrollLeft
                  ? styles.style459_21
                  : styles.style460_22
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
                canScrollRight
                  ? styles.style474_25
                  : styles.style475_26
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
                onOpen={ad.isPlaceholder ? undefined : openTakeover}
                badgeText={getBadgeText(ad, copy)}
                showHeart={!ad.isPlaceholder}
                className={cardClassName}
              />
            </div>
          ))}
        </div>
      </div>

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

function mapAdCampaignRow(row: Record<string, any>) {
  const title = firstString(row.title, row.title_ar, row.name_ar, row.name, row.content?.title);
  const description = firstString(row.description, row.description_ar, row.content?.description);
  const primaryMedia = firstMediaObject(row.media, row.asset, row.creative, row.content?.media, row.content?.asset, row.content?.creative, row.assets, row.content?.assets);
  const mediaType = firstString(
    row.mediaType,
    row.media_type,
    row.contentType,
    row.content_type,
    row.mimeType,
    row.mime_type,
    row.adFormat,
    row.ad_format,
    row.format,
    row.type,
    row.kind,
    primaryMedia?.mediaType,
    primaryMedia?.media_type,
    primaryMedia?.contentType,
    primaryMedia?.content_type,
    primaryMedia?.mimeType,
    primaryMedia?.mime_type,
    primaryMedia?.format,
    primaryMedia?.type,
    primaryMedia?.kind,
    row.content?.mediaType,
    row.content?.media_type,
    row.content?.contentType,
    row.content?.content_type,
    row.content?.mimeType,
    row.content?.mime_type,
    row.content?.adFormat,
    row.content?.ad_format,
    row.content?.format,
    row.content?.type,
  );
  const mediaUrl = firstString(
    row.mediaUrl,
    row.media_url,
    row.fileUrl,
    row.file_url,
    row.assetUrl,
    row.asset_url,
    row.creativeUrl,
    row.creative_url,
    primaryMedia?.url,
    primaryMedia?.src,
    primaryMedia?.href,
    primaryMedia?.mediaUrl,
    primaryMedia?.media_url,
    primaryMedia?.fileUrl,
    primaryMedia?.file_url,
    primaryMedia?.assetUrl,
    primaryMedia?.asset_url,
    primaryMedia?.creativeUrl,
    primaryMedia?.creative_url,
    row.content?.mediaUrl,
    row.content?.media_url,
    row.content?.fileUrl,
    row.content?.file_url,
    row.content?.assetUrl,
    row.content?.asset_url,
    row.content?.creativeUrl,
    row.content?.creative_url,
  );
  const videoUrl = firstString(
    row.videoUrl,
    row.video_url,
    row.video,
    row.videoSrc,
    row.video_src,
    primaryMedia?.videoUrl,
    primaryMedia?.video_url,
    primaryMedia?.video,
    primaryMedia?.videoSrc,
    primaryMedia?.video_src,
    row.content?.videoUrl,
    row.content?.video_url,
    row.content?.video,
    row.content?.videoSrc,
    row.content?.video_src,
  )
    || (isVideoMedia(mediaUrl, mediaType) ? mediaUrl : undefined);
  const posterUrl = firstString(
    row.posterUrl,
    row.poster_url,
    row.bannerUrl,
    row.banner_url,
    row.image_url,
    row.imageUrl,
    row.image,
    row.adImage,
    row.ad_image,
    row.thumbnailUrl,
    row.thumbnail_url,
    row.coverUrl,
    row.cover_url,
    primaryMedia?.posterUrl,
    primaryMedia?.poster_url,
    primaryMedia?.bannerUrl,
    primaryMedia?.banner_url,
    primaryMedia?.imageUrl,
    primaryMedia?.image_url,
    primaryMedia?.image,
    primaryMedia?.thumbnailUrl,
    primaryMedia?.thumbnail_url,
    primaryMedia?.coverUrl,
    primaryMedia?.cover_url,
    row.content?.posterUrl,
    row.content?.poster_url,
    row.content?.bannerUrl,
    row.content?.banner_url,
    row.content?.imageUrl,
    row.content?.image_url,
    row.content?.image,
    row.content?.adImage,
    row.content?.ad_image,
    row.content?.thumbnailUrl,
    row.content?.thumbnail_url,
    row.content?.coverUrl,
    row.content?.cover_url,
    isImageMedia(mediaUrl, mediaType) ? mediaUrl : undefined,
  );
  const whatsapp = firstString(row.whatsapp, row.whatsapp_link, row.whatsapp_number, row.contact_whatsapp);
  const phone = firstString(row.phone, row.phone_link, row.phone_number, row.contact_phone);
  const geoLoc = firstString(row.geoLoc, row.geo_url, row.map_url, row.location_url);
  const targetScale = firstString(row.targetScale, row.target_scale);
  const targetLocationName = firstString(row.targetLocationName, row.target_location_name, row.target_district, row.target_governorate);

  return {
    ...row,
    id: String(row.id),
    title,
    description,
    mediaType,
    mediaUrl,
    videoUrl,
    posterUrl,
    bannerUrl: posterUrl,
    whatsapp,
    phone,
    geoLoc,
    targetScale,
    targetLocationName,
    adType: row.adType || row.ad_type,
    forDriver: readAdAudience(row) === 'captain',
    buttonText: firstString(row.buttonText, row.button_text, row.cta_text),
    content: {
      ...(row.content || {}),
      title,
      description,
      mediaType,
      mediaUrl,
      videoUrl,
      posterUrl,
    },
  };
}
