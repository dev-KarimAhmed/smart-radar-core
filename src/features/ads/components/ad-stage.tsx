'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { ChevronLeft, ChevronRight, Heart, MapPin, MessageCircle, Phone, Plus, ShieldCheck, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { AdDisplayCard, getAdDescription, getAdImage, getAdTitle } from './ad-display-card';
import { getAdManualScrollDelta, getAdScrollDelta, wrapAdScrollPosition } from '../services/ad-stage-scroll';
import { useAuth } from '@/hooks/use-auth';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { useAdCampaigns } from '@/hooks/use-ad-campaigns';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase-client';

const styles = {
  style384_1: "relative",
  style384_2: "m-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#14B8A6]/50 bg-[#0B0F19]",
  style385_3: "mb-4 h-12 w-12 animate-spin rounded-full border-t-2 border-[#14B8A6]",
  style386_4: "px-4 text-center text-sm font-bold tracking-widest text-[#14B8A6]",
  style389_5: "text-xs text-gray-400",
  style398_6: "relative z-[10] flex w-full flex-col overflow-hidden border-b border-white/5 bg-[#0B0F19] py-4 pointer-events-auto select-none sm:py-6",
  style400_7: "justify-start",
  style400_8: "justify-center",
  style405_9: "z-[20] mb-3 flex shrink-0 items-center justify-center w-full px-4 sm:px-6 py-3 border-b border-white/[0.06] bg-[#0A0F1D]/40 backdrop-blur-sm lg:hidden",
  style423_10: "group flex min-h-[64px] w-full max-w-[280px] cursor-pointer items-center justify-center gap-3 rounded-full border border-[#14F5D5]/45 bg-[#14B8A6] px-7 py-4 text-xl font-black !text-[#07111F] shadow-[0_12px_30px_rgba(20,184,166,0.28)] transition-all duration-300 hover:bg-[#2DD4BF] hover:shadow-[0_16px_36px_rgba(20,245,213,0.32)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14F5D5] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0A0F1D]",
  style429_11: "z-[20] mb-3 flex shrink-0 items-center justify-between px-4 sm:mb-4 sm:px-6",
  style430_12: "flex items-center gap-2",
  style431_13: "relative flex h-2.5 w-2.5",
  style432_14: "absolute inline-flex h-full w-full animate-ping rounded-full bg-[#14B8A6] opacity-75",
  style433_15: "relative inline-flex h-2.5 w-2.5 rounded-full bg-[#14B8A6]",
  style435_16: "text-xs font-black uppercase tracking-widest text-[#14F5D5] md:text-sm",
  style439_17: "font-mono text-[9px] font-bold text-gray-500 md:text-[10px]",
  style446_18: "group/river relative flex min-h-0 w-full flex-1 items-center overflow-hidden",
  style446_19: "pb-12",
  style457_20: "absolute left-3 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[#0B0F19]/88 text-white shadow-xl shadow-black/35 backdrop-blur-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/45 sm:left-4",
  style459_21: "hover:border-[#14B8A6]/45 hover:bg-[#14B8A6]/15",
  style460_22: "cursor-not-allowed opacity-35",
  style463_23: "h-5 w-5",
  style472_24: "absolute right-3 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[#0B0F19]/88 text-white shadow-xl shadow-black/35 backdrop-blur-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/45 sm:right-4",
  style474_25: "hover:border-[#14B8A6]/45 hover:bg-[#14B8A6]/15",
  style475_26: "cursor-not-allowed opacity-35",
  style478_27: "h-5 w-5",
  style490_28: "no-scrollbar flex min-w-0 flex-1 flex-nowrap gap-8 overflow-x-auto",
  style491_29: "justify-center px-6 sm:px-16",
  style491_30: "px-14",
  style497_31: "flex-shrink-0",
  style518_32: "fixed inset-0 z-[100] flex flex-col items-center justify-end bg-black/85 p-0 backdrop-blur-sm md:p-4",
  style526_33: "relative flex max-h-[92vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-t-[32px] border-t-2 border-[#14B8A6]/40 bg-[#070D19] px-6 pt-6 pb-28 shadow-[0_-12px_45px_rgba(20,184,166,0.25)] md:rounded-[32px] md:border-x-2 md:p-6",
  style534_34: "absolute right-4 top-4 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-[#0B0F19]/90 text-white shadow-xl shadow-black/35 backdrop-blur-md transition hover:border-red-400/40 hover:bg-red-950/70",
  style536_35: "h-5 w-5",
  style539_36: "mx-auto mb-1 h-1 w-12 rounded-full bg-[#14B8A6]/30",
  style541_37: "flex items-center justify-between border-b border-white/5 pb-3 pe-12",
  style542_38: "flex items-center gap-2 text-xs font-black text-[#14F5D5]",
  style543_39: "h-4 w-4 animate-pulse text-[#14F5D5]",
  style551_40: "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-[11px] font-black transition-all duration-300",
  style553_41: "border-rose-400/40 bg-rose-500/15 text-rose-200 shadow-[0_0_18px_rgba(244,63,94,0.22)]",
  style554_42: "border-[#14B8A6]/25 bg-[#14B8A6]/10 text-[#14F5D5] hover:bg-[#14B8A6]/15",
  style560_43: "h-4 w-4 transition-transform duration-300",
  style561_44: "scale-110 fill-rose-300 text-rose-300",
  style573_45: "space-y-2",
  style573_46: "text-right",
  style573_47: "text-left",
  style574_48: "rounded-full border border-[#14B8A6]/30 bg-[#14B8A6]/10 px-2.5 py-1 text-[10px] font-black text-[#14F5D5]",
  style577_49: "mt-2 text-xl font-black leading-tight text-white",
  style580_50: "pt-1 text-xs leading-relaxed text-gray-300",
  style585_51: "mt-1.5 flex flex-col gap-3",
  style590_52: "flex w-full items-center justify-center gap-2.5 rounded-2xl border border-[#00cc66]/50 bg-[#00cc66] p-3.5 text-xs font-black text-white shadow-[0_4px_15px_rgba(0,204,102,0.25)] transition hover:bg-[#00e271]",
  style592_53: "h-4 w-4 text-white",
  style599_54: "flex w-full items-center justify-center gap-2.5 rounded-2xl border border-[#14B8A6]/35 bg-[#131C31] p-3.5 text-xs font-black text-[#14F5D5] shadow-[0_4px_10px_rgba(0,0,0,0.3)] transition hover:bg-[#14B8A6]/15",
  style601_55: "h-4 w-4 text-[#14F5D5]",
  style609_56: "flex w-full items-center justify-center gap-2.5 rounded-2xl border border-blue-700/50 bg-blue-700 p-3.5 text-xs font-black text-white shadow-[0_4px_15px_rgba(29,78,216,0.25)] transition hover:bg-blue-600",
  style611_57: "h-4 w-4 text-white",
  style629_58: "relative overflow-hidden rounded-3xl border border-white/10 bg-[#0B0F19] shadow-[0_18px_40px_rgba(0,0,0,0.35)]",
  style632_59: "aspect-video w-full bg-black object-cover",
  style644_60: "aspect-video w-full bg-[#07101F] object-cover",
  stageFull: "h-full flex-1",
  stageCompact: "h-[280px] w-full sm:h-[320px]",
  cardFull: "h-[calc(100vh-270px)] min-h-[360px] max-h-[480px] w-[290px] sm:w-[330px] md:max-h-[520px] md:w-[350px]",
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
    emptyTitle: 'مرحباً بك في رادار الذكي',
    emptyDescription: 'لا توجد إعلانات نشطة في منطقتك الآن. سنعرض لك العروض فور توفرها.',
    emptyFetchIssue: 'لا توجد إعلانات متاحة الآن. سنعرض لك العروض فور توفرها.',
    emptyButton: 'ابدأ رحلتك',
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
    emptyTitle: 'Welcome to Smart Radar',
    emptyDescription: 'No active ads are available in your area right now. We will show offers as soon as they are available.',
    emptyFetchIssue: 'No ads are available right now. We will show offers as soon as they are available.',
    emptyButton: 'Start your ride',
    fallbackDistrict: 'Amman',
    fallbackGovernorate: 'Capital',
  },
} as const;

const PLACEHOLDER_BANNER_URL =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#0B0F19"/><stop offset="1" stop-color="#074C49"/></linearGradient><pattern id="p" width="72" height="72" patternUnits="userSpaceOnUse"><path d="M0 72L72 0M-18 18L18-18M54 90L90 54" stroke="#14F5D5" stroke-opacity=".22" stroke-width="2"/></pattern></defs><rect width="1200" height="800" fill="url(#g)"/><rect width="1200" height="800" fill="url(#p)"/><circle cx="965" cy="145" r="190" fill="#14F5D5" fill-opacity=".16"/><circle cx="210" cy="710" r="250" fill="#14B8A6" fill-opacity=".14"/></svg>',
  );

type AdStageCopy = (typeof AD_STAGE_COPY)['ar' | 'en'];

function filterAdsByLocalContext(userDistrict: string, userGovernorate: string, allAds: any[]) {
  return allAds.filter((ad) => {
    if (!ad || !ad.targetScale) return true;
    if (ad.targetScale === 'Governorate') return ad.targetLocationName === userGovernorate;
    if (ad.targetScale === 'District') return ad.targetLocationName === userDistrict;
    return true;
  });
}

function buildBrandPlaceholderAd(copy: AdStageCopy, description: string = copy.emptyDescription) {
  return {
    id: 'brand-empty-state',
    title: copy.emptyTitle,
    description,
    bannerUrl: PLACEHOLDER_BANNER_URL,
    buttonText: copy.emptyButton,
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
  isFullScreen = false,
  onRequestRideClick,
}: {
  isFullScreen?: boolean;
  onRequestRideClick?: () => void;
}) {
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

  const adsToUse = useMemo(() => {
    const filteredAds = filterAdsByLocalContext(liveDistrict, liveGovernorate, serverAds);
    if (filteredAds.length > 0) return filteredAds;

    return [
      buildBrandPlaceholderAd(copy, hasAdFetchIssue ? copy.emptyFetchIssue : copy.emptyDescription),
    ];
  }, [copy, hasAdFetchIssue, liveDistrict, liveGovernorate, serverAds]);

  useEffect(() => {
    adsToUse.forEach((ad: any) => {
      if (shouldTrackAd(ad) && !impressedAdIdsRef.current.has(String(ad.id))) {
        impressedAdIdsRef.current.add(String(ad.id));
        enqueueAdEvent(ad, 'impression');
      }
    });
  }, [adsToUse]);

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

  useEffect(() => {
    const track = scrollTrackRef.current;
    if (!track || takeoverAd || adsToUse.length <= 1) return;

    const stepSize = isFullScreen ? 3 : 2;
    const intervalId = window.setInterval(() => {
      if (isAdStreamPausedRef.current) return;

      const loopPoint = track.scrollWidth / 2;
      const nextPosition = track.scrollLeft + getAdScrollDelta(adStageDirection, stepSize);
      track.scrollLeft = wrapAdScrollPosition(adStageDirection, nextPosition, loopPoint);
    }, 40);

    return () => window.clearInterval(intervalId);
  }, [adStageDirection, adsToUse.length, isFullScreen, takeoverAd]);

  const setAdStreamPaused = useCallback((paused: boolean) => {
    isAdStreamPausedRef.current = paused;
    setIsAdStreamPaused(paused);
  }, []);

  const scrollAds = useCallback((scrollDirection: 'previous' | 'next') => {
    const track = scrollTrackRef.current;
    if (!track || adsToUse.length <= 1) return;

    setAdStreamPaused(true);
    lastManualSwipeMetricAtRef.current = Date.now();
    enqueueAdEvent(getVisibleAdForMetric(track, adsToUse), 'swipe');

    const distance = Math.max(240, Math.min(track.clientWidth * 0.82, 520));
    track.scrollBy({
      left: getAdManualScrollDelta(adStageDirection, scrollDirection, distance),
      behavior: 'smooth',
    });
  }, [adStageDirection, adsToUse, setAdStreamPaused]);

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
  };

  const showNavigationShell = true;
  const canNavigate = adsToUse.length > 1;
  const heightClass = isFullScreen ? styles.stageFull : styles.stageCompact;
  const cardClassName = isFullScreen ? styles.cardFull : styles.cardCompact;

  if (isLoadingAds) {
    return (
      <div className={cn(styles.style384_1, heightClass, styles.style384_2)}>
        <div className={styles.style385_3} />
        <p className={styles.style386_4}>
          {copy.loadingTitle}
          <br />
          <span className={styles.style389_5}>{copy.loadingSubtitle}</span>
        </p>
      </div>
    );
  }

  return (
    <section
      className={cn(
        styles.style398_6,
        heightClass,
        isFullScreen ? styles.style400_7 : styles.style400_8
      )}
      dir={direction}
    >
      {isFullScreen ? (
        <div className={styles.style405_9}>
          <motion.button
            type="button"
            onClick={onRequestRideClick}
            animate={prefersReducedMotion ? undefined : {
              scale: [1, 1.035, 1],
              boxShadow: [
                '0 10px 28px rgba(20,184,166,0.18)',
                '0 14px 38px rgba(20,245,213,0.34)',
                '0 10px 28px rgba(20,184,166,0.18)',
              ],
            }}
            transition={prefersReducedMotion ? undefined : {
              duration: 2.4,
              ease: 'easeInOut',
              repeat: Infinity,
            }}
            whileTap={{ scale: 0.96 }}
            className={styles.style423_10}
          >
            <span>{t('requestRide')}</span>
          </motion.button>
        </div>
      ) : (
        <div className={styles.style429_11}>
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
        </div>
      )}

      <div
        className={cn(styles.style446_18, isFullScreen && styles.style446_19)}
        dir={adStageDirection}
      >
        {showNavigationShell && (
          <>
            <button
              type="button"
              aria-label={canNavigate ? copy.previous : copy.noMoreAds}
              disabled={!canNavigate}
              onClick={() => scrollAds('previous')}
              className={cn(
                styles.style457_20,
                canNavigate
                  ? styles.style459_21
                  : styles.style460_22
              )}
            >
              <ChevronLeft className={styles.style463_23} />
            </button>

            <button
              type="button"
              aria-label={canNavigate ? copy.next : copy.noMoreAds}
              disabled={!canNavigate}
              onClick={() => scrollAds('next')}
              className={cn(
                styles.style472_24,
                canNavigate
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
          onScroll={registerManualTrackScroll}
          className={cn(
            styles.style490_28,
            adsToUse.length === 1 ? styles.style491_29 : styles.style491_30
          )}
        >
          {(adsToUse.length > 1 ? [...adsToUse, ...adsToUse] : adsToUse).map((ad: any, index: number) => (
            <div
              key={`${ad.id}-${index}`}
              className={styles.style497_31}
              onMouseEnter={() => setAdStreamPaused(true)}
              onMouseLeave={() => setAdStreamPaused(false)}
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
          <div
            className={styles.style518_32}
            onClick={() => setTakeoverAd(null)}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className={styles.style526_33}
              dir={direction}
              onClick={(event) => event.stopPropagation()}
            >
              <button
                type="button"
                aria-label="Close ad"
                onClick={() => setTakeoverAd(null)}
                className={styles.style534_34}
              >
                <X className={styles.style536_35} />
              </button>

              <div className={styles.style539_36} />

              <div className={styles.style541_37}>
                <span className={styles.style542_38}>
                  <ShieldCheck className={styles.style543_39} />
                  {copy.trustedAd}
                </span>
                {!takeoverAd.isPlaceholder ? (
                  <button
                    type="button"
                    onClick={(event) => toggleHeart(event, takeoverAd)}
                    className={cn(
                      styles.style551_40,
                      heartedAdIds.includes(takeoverAd.id)
                        ? styles.style553_41
                        : styles.style554_42,
                    )}
                    aria-pressed={heartedAdIds.includes(takeoverAd.id)}
                  >
                    <Heart
                      className={cn(
                        styles.style560_43,
                        heartedAdIds.includes(takeoverAd.id) && styles.style561_44,
                      )}
                    />
                    {heartedAdIds.includes(takeoverAd.id)
                      ? ((copy as unknown as Record<string, string>).removeFavorite || (isArabic ? 'إزالة من الخزنة' : 'Remove favorite'))
                      : ((copy as unknown as Record<string, string>).favorite || (isArabic ? 'إضافة للخزنة' : 'Favorite'))}
                  </button>
                ) : null}
              </div>

              <AdTakeoverMedia ad={takeoverAd} />

              <div className={cn(styles.style573_45, isArabic ? styles.style573_46 : styles.style573_47)}>
                <span className={styles.style574_48}>
                  {getBadgeText(takeoverAd, copy)}
                </span>
                <h3 className={styles.style577_49}>
                  {getAdTitle(takeoverAd, copy.nearbyBadge)}
                </h3>
                <p className={styles.style580_50}>
                  {getAdDescription(takeoverAd, copy.emptyDescription)}
                </p>
              </div>

              <div className={styles.style585_51}>
                <a
                  href={`https://wa.me/${takeoverAd.whatsapp || takeoverAd.advertiserData?.whatsapp || '962798888888'}?text=${encodeURIComponent(copy.whatsappMessage(getAdTitle(takeoverAd, copy.nearbyBadge)))}`}
                  target="_blank"
                  onClick={(event) => event.stopPropagation()}
                  className={styles.style590_52}
                >
                  <MessageCircle className={styles.style592_53} />
                  {copy.whatsapp}
                </a>

                <a
                  href={`tel:${takeoverAd.phone || takeoverAd.advertiserData?.phone || '0798888888'}`}
                  onClick={(event) => event.stopPropagation()}
                  className={styles.style599_54}
                >
                  <Phone className={styles.style601_55} />
                  {copy.call}
                </a>

                <a
                  href={takeoverAd.geoLoc || 'https://www.openstreetmap.org/'}
                  target="_blank"
                  onClick={(event) => event.stopPropagation()}
                  className={styles.style609_56}
                >
                  <MapPin className={styles.style611_57} />
                  {copy.openLocation}
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
}

function AdTakeoverMedia({ ad }: { ad: any }) {
  const media = getAdMedia(ad);
  const title = getAdTitle(ad, 'Ad media');
  const fallbackImage = getAdImage(ad) || PLACEHOLDER_BANNER_URL;

  return (
    <div className={styles.style629_58}>
      {media.kind === 'video' && media.url ? (
        <video
          className={styles.style632_59}
          src={media.url}
          poster={media.posterUrl || fallbackImage}
          controls
          playsInline
          preload="metadata"
          onClick={(event) => event.stopPropagation()}
        />
      ) : (
        <img
          src={media.url || fallbackImage}
          alt={title}
          className={styles.style644_60}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(event) => {
            event.currentTarget.src = PLACEHOLDER_BANNER_URL;
          }}
        />
      )}
    </div>
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
    buttonText: firstString(row.buttonText, row.button_text, row.cta_text) ,
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

function getAdMedia(ad: any): { kind: 'image' | 'video'; url?: string; posterUrl?: string } {
  const primaryMedia = firstMediaObject(ad?.media, ad?.asset, ad?.creative, ad?.content?.media, ad?.content?.asset, ad?.content?.creative, ad?.assets, ad?.content?.assets);
  const mediaType = firstString(
    ad?.mediaType,
    ad?.media_type,
    ad?.contentType,
    ad?.content_type,
    ad?.mimeType,
    ad?.mime_type,
    ad?.adFormat,
    ad?.ad_format,
    ad?.format,
    ad?.type,
    ad?.kind,
    primaryMedia?.mediaType,
    primaryMedia?.media_type,
    primaryMedia?.contentType,
    primaryMedia?.content_type,
    primaryMedia?.mimeType,
    primaryMedia?.mime_type,
    primaryMedia?.format,
    primaryMedia?.type,
    primaryMedia?.kind,
    ad?.content?.mediaType,
    ad?.content?.media_type,
    ad?.content?.contentType,
    ad?.content?.content_type,
    ad?.content?.mimeType,
    ad?.content?.mime_type,
    ad?.content?.adFormat,
    ad?.content?.ad_format,
    ad?.content?.format,
    ad?.content?.type,
  );
  const videoUrl = firstString(
    ad?.videoUrl,
    ad?.video_url,
    ad?.video,
    ad?.videoSrc,
    ad?.video_src,
    primaryMedia?.videoUrl,
    primaryMedia?.video_url,
    primaryMedia?.video,
    primaryMedia?.videoSrc,
    primaryMedia?.video_src,
    ad?.content?.videoUrl,
    ad?.content?.video_url,
    ad?.content?.video,
    ad?.content?.videoSrc,
    ad?.content?.video_src,
  );
  const mediaUrl = firstString(
    ad?.mediaUrl,
    ad?.media_url,
    ad?.fileUrl,
    ad?.file_url,
    ad?.assetUrl,
    ad?.asset_url,
    ad?.creativeUrl,
    ad?.creative_url,
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
    ad?.content?.mediaUrl,
    ad?.content?.media_url,
    ad?.content?.fileUrl,
    ad?.content?.file_url,
    ad?.content?.assetUrl,
    ad?.content?.asset_url,
    ad?.content?.creativeUrl,
    ad?.content?.creative_url,
  );
  const posterUrl = firstString(
    ad?.posterUrl,
    ad?.poster_url,
    ad?.bannerUrl,
    ad?.banner_url,
    primaryMedia?.posterUrl,
    primaryMedia?.poster_url,
    primaryMedia?.bannerUrl,
    primaryMedia?.banner_url,
    ad?.content?.posterUrl,
    ad?.content?.poster_url,
    ad?.content?.bannerUrl,
    ad?.content?.banner_url,
  );
  const imageUrl = firstString(
    ad?.imageUrl,
    ad?.image_url,
    ad?.image,
    ad?.adImage,
    ad?.ad_image,
    ad?.thumbnailUrl,
    ad?.thumbnail_url,
    ad?.coverUrl,
    ad?.cover_url,
    primaryMedia?.imageUrl,
    primaryMedia?.image_url,
    primaryMedia?.image,
    primaryMedia?.thumbnailUrl,
    primaryMedia?.thumbnail_url,
    primaryMedia?.coverUrl,
    primaryMedia?.cover_url,
    ad?.content?.imageUrl,
    ad?.content?.image_url,
    ad?.content?.image,
    ad?.content?.adImage,
    ad?.content?.ad_image,
    ad?.content?.thumbnailUrl,
    ad?.content?.thumbnail_url,
    ad?.content?.coverUrl,
    ad?.content?.cover_url,
    posterUrl,
    getAdImage(ad),
  );

  if (videoUrl) return { kind: 'video', url: videoUrl, posterUrl: imageUrl || posterUrl };
  if (isVideoMedia(mediaUrl, mediaType)) return { kind: 'video', url: mediaUrl, posterUrl: imageUrl || posterUrl };
  if (imageUrl) return { kind: 'image', url: imageUrl };
  if (isImageMedia(mediaUrl, mediaType)) return { kind: 'image', url: mediaUrl };

  return { kind: 'image', url: getAdImage(ad) || PLACEHOLDER_BANNER_URL };
}

function isVideoMedia(url: string | undefined, mediaType: string | undefined) {
  return Boolean(url) && (isVideoType(mediaType) || isVideoUrl(url));
}

function isVideoType(mediaType: string | undefined) {
  const type = String(mediaType || '').toLowerCase();
  return type.includes('video')
    || type.includes('mp4')
    || type.includes('webm')
    || type.includes('ogg')
    || type.includes('mov')
    || type.includes('m4v');
}

function isVideoUrl(url: string | undefined) {
  const value = String(url || '').toLowerCase().split('?')[0];
  return /\.(mp4|webm|ogg|mov|m4v)$/i.test(value)
    || value.includes('/video/')
    || value.includes('/videos/')
    || value.includes('video_')
    || value.includes('video-')
    || value.includes('ad-videos');
}

function isImageMedia(url: string | undefined, mediaType: string | undefined) {
  const type = String(mediaType || '').toLowerCase();
  const value = String(url || '').toLowerCase().split('?')[0];
  return type.includes('image')
    || /\.(jpg|jpeg|png|webp|gif|avif|svg)$/i.test(value)
    || value.startsWith('data:image/')
    || (!isVideoMedia(url, mediaType) && Boolean(url));
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}

function firstMediaObject(...values: unknown[]): Record<string, any> | undefined {
  for (const value of values) {
    if (Array.isArray(value)) {
      const found = value.find((item) => item && typeof item === 'object' && !Array.isArray(item));
      if (found) return found as Record<string, any>;
    }

    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value as Record<string, any>;
    }
  }

  return undefined;
}
