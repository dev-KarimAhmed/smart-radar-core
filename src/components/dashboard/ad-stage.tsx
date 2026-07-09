'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, MapPin, MessageCircle, Phone, ShieldCheck, X } from 'lucide-react';
import { AdDisplayCard, getAdDescription, getAdTitle } from './ad-display-card';
import { useAuth } from '@/hooks/use-auth';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase-client';

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
  const index = Math.max(0, Math.round(track.scrollLeft / (cardWidth + gap))) % ads.length;
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
  const copy = AD_STAGE_COPY[language];
  const liveDistrict = user?.district || copy.fallbackDistrict;
  const liveGovernorate = user?.governorate || copy.fallbackGovernorate;
  const [serverAds, setServerAds] = useState<any[]>([]);
  const [isLoadingAds, setIsLoadingAds] = useState(true);
  const [hasAdFetchIssue, setHasAdFetchIssue] = useState(false);
  const [heartedAdIds, setHeartedAdIds] = useState<string[]>([]);
  const [takeoverAd, setTakeoverAd] = useState<any | null>(null);
  const [isAdStreamPaused, setIsAdStreamPaused] = useState(false);
  const isAdStreamPausedRef = useRef(false);
  const scrollTrackRef = useRef<HTMLDivElement | null>(null);
  const impressedAdIdsRef = useRef<Set<string>>(new Set());
  const lastManualSwipeMetricAtRef = useRef(0);

  useEffect(() => {
    let active = true;

    async function fetchLiveAds() {
      setIsLoadingAds(true);
      setHasAdFetchIssue(false);
      try {
        const { data, error } = await supabase
          .from('ad_campaigns')
          .select('*')
          .eq('status', 'ACTIVE');

        if (error) throw error;
        if (active) setServerAds(Array.isArray(data) ? data.map(mapAdCampaignRow) : []);
      } catch (error) {
        if (!active) return;
        if ((process.env.NODE_ENV !== 'production')) console.warn('[AdStage] showing placeholder because ads could not load:', error);
        setServerAds([]);
        setHasAdFetchIssue(true);
      } finally {
        if (active) setIsLoadingAds(false);
      }
    }

    void fetchLiveAds();

    return () => {
      active = false;
    };
  }, []);

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
      track.scrollLeft += stepSize;

      if (loopPoint > 0 && track.scrollLeft >= loopPoint) {
        track.scrollLeft -= loopPoint;
      }
    }, 40);

    return () => window.clearInterval(intervalId);
  }, [adsToUse.length, isFullScreen, takeoverAd]);

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
      left: scrollDirection === 'next' ? distance : -distance,
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
  };

  const openTakeover = (event: React.MouseEvent, ad: any) => {
    event.preventDefault();
    event.stopPropagation();
    setTakeoverAd(ad);
    enqueueAdEvent(ad, 'click');
  };

  const showNavigationShell = true;
  const canNavigate = adsToUse.length > 1;
  const heightClass = isFullScreen
    ? 'min-h-[520px] w-full lg:min-h-[620px]'
    : 'h-[280px] w-full sm:h-[320px]';
  const cardClassName = isFullScreen
    ? 'h-[360px] w-[min(88vw,520px)] md:h-[420px] md:w-[560px]'
    : 'h-[216px] w-[270px] sm:h-[250px] sm:w-[280px] md:w-[340px]';

  if (isLoadingAds) {
    return (
      <div className={`relative ${heightClass} m-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#14B8A6]/50 bg-[#0B0F19]`}>
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-t-2 border-[#14B8A6]" />
        <p className="px-4 text-center text-sm font-bold tracking-widest text-[#14B8A6]">
          {copy.loadingTitle}
          <br />
          <span className="text-xs text-gray-400">{copy.loadingSubtitle}</span>
        </p>
      </div>
    );
  }

  return (
    <section
      className={cn(
        'relative z-[10] flex w-full flex-col overflow-hidden border-b border-white/5 bg-[#0B0F19] py-4 pointer-events-auto select-none sm:py-6',
        heightClass,
        isFullScreen ? 'justify-start' : 'justify-center'
      )}
      dir={direction}
    >
      {isFullScreen ? (
        <div className="z-[20] mb-3 flex shrink-0 items-center justify-between px-4 sm:px-6 py-2.5 border-b border-white/[0.06] bg-[#0A0F1D]/40 backdrop-blur-sm" dir="rtl">
          {/* Right text: نبض نهر الإعلانات الميداني */}
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#14B8A6] opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#14B8A6]" />
            </span>
            <span className="text-[11px] font-black text-[#14F5D5] tracking-wide">نبض نهر الإعلانات الميداني</span>
          </div>

          {/* Center button: اطلب رحلة */}
          <div className="flex items-center">
            <button
              onClick={onRequestRideClick}
              className="text-xs sm:text-sm font-black text-white hover:text-[#14F5D5] transition-colors cursor-pointer active:scale-95 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 hover:bg-[#14B8A6]/10 hover:border-[#14B8A6]/30 shadow-md"
            >
              اطلب رحلة
            </button>
          </div>

          {/* Left text: LIVE STREAM REGISTRY • 10 CAMPAIGNS */}
          <div className="text-[9px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest font-mono" dir="ltr">
            LIVE STREAM REGISTRY • {adsToUse.length} CAMPAIGNS
          </div>
        </div>
      ) : (
        <div className="z-[20] mb-3 flex shrink-0 items-center justify-between px-4 sm:mb-4 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#14B8A6] opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#14B8A6]" />
            </span>
            <h2 className="text-xs font-black uppercase tracking-widest text-[#14F5D5] md:text-sm">
              {copy.title}
            </h2>
          </div>
          <span className="font-mono text-[9px] font-bold text-gray-500 md:text-[10px]">
            {copy.count(adsToUse.length)}
          </span>
        </div>
      )}

      <div
        className="group/river relative flex min-h-0 w-full flex-1 items-center overflow-hidden"
        dir="ltr"
        onMouseEnter={() => setAdStreamPaused(true)}
        onMouseLeave={() => setAdStreamPaused(false)}
        onFocusCapture={() => setAdStreamPaused(true)}
        onBlurCapture={() => setAdStreamPaused(false)}
        onTouchStart={() => setAdStreamPaused(true)}
      >
        {showNavigationShell && (
          <>
            <button
              type="button"
              aria-label={canNavigate ? copy.previous : copy.noMoreAds}
              disabled={!canNavigate}
              onClick={() => scrollAds('previous')}
              className={cn(
                'absolute left-3 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[#0B0F19]/88 text-white shadow-xl shadow-black/35 backdrop-blur-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/45 sm:left-4',
                canNavigate
                  ? 'hover:border-[#14B8A6]/45 hover:bg-[#14B8A6]/15'
                  : 'cursor-not-allowed opacity-35'
              )}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>

            <button
              type="button"
              aria-label={canNavigate ? copy.next : copy.noMoreAds}
              disabled={!canNavigate}
              onClick={() => scrollAds('next')}
              className={cn(
                'absolute right-3 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[#0B0F19]/88 text-white shadow-xl shadow-black/35 backdrop-blur-md transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/45 sm:right-4',
                canNavigate
                  ? 'hover:border-[#14B8A6]/45 hover:bg-[#14B8A6]/15'
                  : 'cursor-not-allowed opacity-35'
              )}
            >
              <ChevronRight className="h-5 w-5" />
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
            'flex min-w-0 flex-1 flex-nowrap gap-8 overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
            adsToUse.length === 1 ? 'justify-center px-6 sm:px-16' : 'px-14'
          )}
        >
          {(adsToUse.length > 1 ? [...adsToUse, ...adsToUse] : adsToUse).map((ad: any, index: number) => (
            <AdDisplayCard
              key={`${ad.id}-${index}`}
              ad={ad}
              isHearted={heartedAdIds.includes(ad.id)}
              onHeart={toggleHeart}
              onOpen={ad.isPlaceholder ? undefined : openTakeover}
              badgeText={getBadgeText(ad, copy)}
              showHeart={!ad.isPlaceholder}
              className={`flex-shrink-0 ${cardClassName}`}
            />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {takeoverAd && (
          <div
            className="fixed inset-0 z-[100] flex flex-col items-center justify-end bg-black/85 p-0 backdrop-blur-sm md:p-4"
            onClick={() => setTakeoverAd(null)}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative flex w-full max-w-lg flex-col gap-4 rounded-t-[32px] border-t-2 border-[#14B8A6]/40 bg-[#070D19] p-6 shadow-[0_-12px_45px_rgba(20,184,166,0.25)] md:rounded-[32px] md:border-x-2"
              dir={direction}
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mx-auto mb-1 h-1 w-12 rounded-full bg-[#14B8A6]/30" />

              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <span className="flex items-center gap-2 text-xs font-black text-[#14F5D5]">
                  <ShieldCheck className="h-4 w-4 animate-pulse text-[#14F5D5]" />
                  {copy.trustedAd}
                </span>
                <button
                  type="button"
                  onClick={() => setTakeoverAd(null)}
                  className="rounded-full border border-red-500/10 bg-red-950/45 p-1.5 text-red-500 transition hover:bg-red-500/20"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className={`space-y-2 ${isArabic ? 'text-right' : 'text-left'}`}>
                <span className="rounded-full border border-[#14B8A6]/30 bg-[#14B8A6]/10 px-2.5 py-1 text-[10px] font-black text-[#14F5D5]">
                  {getBadgeText(takeoverAd, copy)}
                </span>
                <h3 className="mt-2 text-xl font-black leading-tight text-white">
                  {getAdTitle(takeoverAd, copy.nearbyBadge)}
                </h3>
                <p className="pt-1 text-xs leading-relaxed text-gray-300">
                  {getAdDescription(takeoverAd, copy.emptyDescription)}
                </p>
              </div>

              <div className="mt-1.5 flex flex-col gap-3">
                <a
                  href={`https://wa.me/${takeoverAd.whatsapp || takeoverAd.advertiserData?.whatsapp || '962798888888'}?text=${encodeURIComponent(copy.whatsappMessage(getAdTitle(takeoverAd, copy.nearbyBadge)))}`}
                  target="_blank"
                  onClick={(event) => event.stopPropagation()}
                  className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-[#00cc66]/50 bg-[#00cc66] p-3.5 text-xs font-black text-white shadow-[0_4px_15px_rgba(0,204,102,0.25)] transition hover:bg-[#00e271]"
                >
                  <MessageCircle className="h-4 w-4 text-white" />
                  {copy.whatsapp}
                </a>

                <a
                  href={`tel:${takeoverAd.phone || takeoverAd.advertiserData?.phone || '0798888888'}`}
                  onClick={(event) => event.stopPropagation()}
                  className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-[#14B8A6]/35 bg-[#131C31] p-3.5 text-xs font-black text-[#14F5D5] shadow-[0_4px_10px_rgba(0,0,0,0.3)] transition hover:bg-[#14B8A6]/15"
                >
                  <Phone className="h-4 w-4 text-[#14F5D5]" />
                  {copy.call}
                </a>

                <a
                  href={takeoverAd.geoLoc || 'https://www.openstreetmap.org/'}
                  target="_blank"
                  onClick={(event) => event.stopPropagation()}
                  className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-blue-700/50 bg-blue-700 p-3.5 text-xs font-black text-white shadow-[0_4px_15px_rgba(29,78,216,0.25)] transition hover:bg-blue-600"
                >
                  <MapPin className="h-4 w-4 text-white" />
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

function mapAdCampaignRow(row: Record<string, any>) {
  const title = firstString(row.title, row.title_ar, row.name_ar, row.name, row.content?.title);
  const description = firstString(row.description, row.description_ar, row.content?.description);
  const posterUrl = firstString(row.posterUrl, row.poster_url, row.bannerUrl, row.banner_url, row.media_url, row.image_url, row.imageUrl);
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
    posterUrl,
    bannerUrl: posterUrl,
    whatsapp,
    phone,
    geoLoc,
    targetScale,
    targetLocationName,
    adType: row.adType || row.ad_type,
    buttonText: firstString(row.buttonText, row.button_text, row.cta_text) || 'عرض التفاصيل',
    content: {
      ...(row.content || {}),
      title,
      description,
      posterUrl,
    },
  };
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}
