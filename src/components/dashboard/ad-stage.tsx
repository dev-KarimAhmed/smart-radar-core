'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, MapPin, MessageCircle, Phone, ShieldCheck, X } from 'lucide-react';
import { doc, increment, serverTimestamp, setDoc } from 'firebase/firestore';
import { AdDisplayCard, getAdDescription, getAdTitle } from './ad-display-card';
import { useAuth } from '@/hooks/use-auth';
import { usePromoStream } from '@/hooks/use-promo-stream';
import { db } from '@/lib/firebase';

const AD_BATCH_WRITE_LIMIT = 50;

const RadarAdMetrics = {
  filterAdsByLocalContext(userDistrict: string, userGovernorate: string, allAds: any[]) {
    return allAds.filter((ad) => {
      if (!ad || !ad.targetScale) return true;
      if (ad.targetScale === 'Governorate') return ad.targetLocationName === userGovernorate;
      if (ad.targetScale === 'District') return ad.targetLocationName === userDistrict;
      return true;
    });
  },

  async logLocally(adId: string, type: 'view' | 'click') {
    try {
      const cacheKey = `radar_ad_metrics_${adId}`;
      const cached = localStorage.getItem(cacheKey);
      let currentMetrics = { views: 0, clicks: 0 };

      if (cached) {
        try {
          currentMetrics = JSON.parse(cached);
        } catch (error) {
          console.error('Failed to parse cached ad metrics:', error);
        }
      }

      if (type === 'view') currentMetrics.views += 1;
      if (type === 'click') currentMetrics.clicks += 1;

      localStorage.setItem(cacheKey, JSON.stringify(currentMetrics));

      const localEvents = currentMetrics.views + currentMetrics.clicks;
      const isDemoAd = adId.startsWith('virt-') || adId.startsWith('promo-');

      if (localEvents >= AD_BATCH_WRITE_LIMIT && !isDemoAd) {
        localStorage.removeItem(cacheKey);
        await setDoc(
          doc(db, 'sovereign_ad_metrics_rollup', adId),
          {
            adId,
            views: increment(currentMetrics.views),
            clicks: increment(currentMetrics.clicks),
            lastFlush: serverTimestamp(),
          },
          { merge: true }
        );
      }
    } catch (error) {
      console.warn('Ad metrics stayed local only:', error);
    }
  },
};

const VIRTUAL_ADS = [
  {
    id: 'virt-1',
    title: 'مركز أعمال وادي السير الحرفي المطور',
    description: 'تمويل سريع للمشاريع الحرة الصغيرة بفوائد واضحة ومعاملة بسيطة.',
    bannerUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1200',
    posterUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&q=80&w=1200',
    phone: '0798888888',
    whatsapp: '962798888888',
    geoLoc: 'https://www.openstreetmap.org/?mlat=31.9522&mlon=35.8333#map=14/31.9522/35.8333',
    buttonText: 'تقديم طلب التمويل',
    content: {
      title: 'مركز أعمال وادي السير الحرفي المطور',
      description: 'تمويل سريع للمشاريع الحرة الصغيرة بفوائد واضحة ومعاملة بسيطة.',
    },
  },
  {
    id: 'virt-2',
    title: 'مجمعات تقنية عمان للشحن اللوجستي',
    description: 'حلول نقل وشحن آمنة للشركات الصغيرة والمتاجر المحلية.',
    bannerUrl: 'https://images.unsplash.com/photo-1586880244406-556ebe35f282?auto=format&fit=crop&q=80&w=1200',
    posterUrl: 'https://images.unsplash.com/photo-1586880244406-556ebe35f282?auto=format&fit=crop&q=80&w=1200',
    phone: '0799999999',
    whatsapp: '962799999999',
    geoLoc: 'https://www.openstreetmap.org/?mlat=31.9631&mlon=35.9303#map=14/31.9631/35.9303',
    buttonText: 'عرض خريطة الشحن',
    content: {
      title: 'مجمعات تقنية عمان للشحن اللوجستي',
      description: 'حلول نقل وشحن آمنة للشركات الصغيرة والمتاجر المحلية.',
    },
  },
  {
    id: 'virt-3',
    title: 'بوابة نبض بغداد الكرخ الكبرى',
    description: 'مبادرة نقل تعاوني لخدمة الجامعات والقطاعات المحلية المطلوبة.',
    bannerUrl: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=1200',
    posterUrl: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=1200',
    phone: '0797777777',
    whatsapp: '962797777777',
    geoLoc: 'https://www.openstreetmap.org/?mlat=31.9515&mlon=35.8450#map=14/31.9515/35.8450',
    buttonText: 'تفاصيل الخدمة',
    content: {
      title: 'بوابة نبض بغداد الكرخ الكبرى',
      description: 'مبادرة نقل تعاوني لخدمة الجامعات والقطاعات المحلية المطلوبة.',
    },
  },
  {
    id: 'virt-4',
    title: 'الربط الميداني لمنظومة الرادار الذكي',
    description: 'حل تأمين ومتابعة للسيارات مع حماية شاملة وخدمة مباشرة.',
    bannerUrl: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=1200',
    posterUrl: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&q=80&w=1200',
    phone: '0796666666',
    whatsapp: '962796666666',
    geoLoc: 'https://www.openstreetmap.org/?mlat=31.9566&mlon=35.9457#map=14/31.9566/35.9457',
    buttonText: 'تسجيل ناقل جديد',
    content: {
      title: 'الربط الميداني لمنظومة الرادار الذكي',
      description: 'حل تأمين ومتابعة للسيارات مع حماية شاملة وخدمة مباشرة.',
    },
  },
];

const getBadgeText = (ad: any) => {
  if (ad.adType === 'RIDER_BENEFIT') return 'منفعة راكب';
  if (ad.adType === 'CAPTAIN_PROFESSIONAL') return 'دعم كابتن';
  return 'نبض ميداني';
};

export function AdStage({ isFullScreen = false }: { isFullScreen?: boolean }) {
  const { user } = useAuth();
  const liveDistrict = user?.district || 'عمان';
  const liveGovernorate = user?.governorate || 'العاصمة';
  const { activeAds } = usePromoStream(liveDistrict, liveGovernorate);
  const [heartedAdIds, setHeartedAdIds] = useState<string[]>([]);
  const [takeoverAd, setTakeoverAd] = useState<any | null>(null);
  const [isAdStreamPaused, setIsAdStreamPaused] = useState(false);
  const isAdStreamPausedRef = useRef(false);
  const scrollTrackRef = useRef<HTMLDivElement | null>(null);

  const adsToUse = useMemo(() => {
    const combinedAds = activeAds && activeAds.length > 0 ? [...activeAds, ...VIRTUAL_ADS] : VIRTUAL_ADS;
    return RadarAdMetrics.filterAdsByLocalContext(liveDistrict, liveGovernorate, combinedAds);
  }, [activeAds, liveDistrict, liveGovernorate]);

  useEffect(() => {
    adsToUse.forEach((ad: any) => {
      if (ad?.id) {
        RadarAdMetrics.logLocally(ad.id, 'view');
      }
    });
  }, [adsToUse]);

  useEffect(() => {
    const stored = localStorage.getItem('sovereign_hearted_ads');
    if (stored) {
      try {
        setHeartedAdIds(JSON.parse(stored));
      } catch (error) {
        console.error('Failed to parse stored hearted ads:', error);
      }
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

  const scrollAds = useCallback((direction: 'previous' | 'next') => {
    const track = scrollTrackRef.current;
    if (!track) return;

    setAdStreamPaused(true);
    const distance = Math.max(240, Math.min(track.clientWidth * 0.82, 460));
    track.scrollBy({
      left: direction === 'next' ? distance : -distance,
      behavior: 'smooth',
    });
  }, [setAdStreamPaused]);

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
      console.error('Failed to update ad vault cache:', error);
    }
  };

  const openTakeover = (event: React.MouseEvent, ad: any) => {
    event.preventDefault();
    event.stopPropagation();
    setTakeoverAd(ad);

    if (ad?.id) {
      RadarAdMetrics.logLocally(ad.id, 'click');
    }
  };

  const heightClass = isFullScreen ? 'flex-1 h-full min-h-[65vh] w-full' : 'h-[280px] w-full sm:h-[320px]';
  const cardClassName = isFullScreen
    ? 'h-[360px] w-[340px] md:h-[448px] md:w-[448px]'
    : 'h-[216px] w-[270px] sm:h-[250px] sm:w-[280px] md:w-[340px]';

  if (!adsToUse || adsToUse.length === 0) {
    return (
      <div className={`relative ${heightClass} m-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#14B8A6]/50 bg-[#0B0F19]`}>
        <div className="mb-4 h-12 w-12 animate-spin rounded-full border-t-2 border-[#14B8A6]" />
        <p className="px-4 text-center text-sm font-bold tracking-widest text-[#14B8A6]">
          نهر الإعلانات جاهز
          <br />
          <span className="text-xs text-gray-400">لا توجد حملات نشطة في منطقتك حالياً</span>
        </p>
      </div>
    );
  }

  return (
    <div
      className={`relative z-[10] flex w-full flex-col justify-center overflow-hidden border-b border-white/5 bg-[#0B0F19] py-4 sm:py-6 ${heightClass} pointer-events-auto select-none`}
      dir="rtl"
    >
      <div className="z-[20] mb-3 flex shrink-0 items-center justify-between px-4 sm:mb-4 sm:px-6">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#14B8A6] opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#14B8A6]" />
          </span>
          <h2 className="text-xs font-black uppercase tracking-widest text-[#14F5D5] md:text-sm">
            نهر الإعلانات الميداني
          </h2>
        </div>
        <span className="font-mono text-[9px] font-bold text-gray-500 md:text-[10px]">
          LIVE STREAM REGISTRY • {adsToUse.length} CAMPAIGNS
        </span>
      </div>

      <div
        className="group/river relative flex w-full flex-1 items-center overflow-hidden"
        dir="ltr"
        onMouseEnter={() => setAdStreamPaused(true)}
        onMouseLeave={() => setAdStreamPaused(false)}
        onFocusCapture={() => setAdStreamPaused(true)}
        onBlurCapture={() => setAdStreamPaused(false)}
        onTouchStart={() => setAdStreamPaused(true)}
      >
        <button
          type="button"
          aria-label="الإعلان السابق"
          onClick={() => scrollAds('previous')}
          className="absolute left-3 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[#0B0F19]/88 text-white shadow-xl shadow-black/35 backdrop-blur-md transition hover:border-[#14B8A6]/45 hover:bg-[#14B8A6]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/45 sm:left-4"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <button
          type="button"
          aria-label="الإعلان التالي"
          onClick={() => scrollAds('next')}
          className="absolute right-3 top-1/2 z-30 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/10 bg-[#0B0F19]/88 text-white shadow-xl shadow-black/35 backdrop-blur-md transition hover:border-[#14B8A6]/45 hover:bg-[#14B8A6]/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#14B8A6]/45 sm:right-4"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <div
          ref={scrollTrackRef}
          data-ad-carousel-track="true"
          data-paused={isAdStreamPaused ? 'true' : 'false'}
          data-ad-count={adsToUse.length}
          className="flex min-w-0 flex-1 flex-nowrap gap-8 overflow-x-auto px-14 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {[...adsToUse, ...adsToUse].map((ad: any, index: number) => (
            <AdDisplayCard
              key={`${ad.id}-${index}`}
              ad={ad}
              isHearted={heartedAdIds.includes(ad.id)}
              onHeart={toggleHeart}
              onOpen={openTakeover}
              badgeText={getBadgeText(ad)}
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
              dir="rtl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="mx-auto mb-1 h-1 w-12 rounded-full bg-[#14B8A6]/30" />

              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <span className="flex items-center gap-2 text-xs font-black text-[#14F5D5]">
                  <ShieldCheck className="h-4 w-4 animate-pulse text-[#14F5D5]" />
                  إعلان موثق للتواصل المباشر
                </span>
                <button
                  type="button"
                  onClick={() => setTakeoverAd(null)}
                  className="rounded-full border border-red-500/10 bg-red-950/45 p-1.5 text-red-500 transition hover:bg-red-500/20"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-2 text-right">
                <span className="rounded-full border border-[#14B8A6]/30 bg-[#14B8A6]/10 px-2.5 py-1 text-[10px] font-black text-[#14F5D5]">
                  {getBadgeText(takeoverAd)}
                </span>
                <h3 className="mt-2 text-xl font-black leading-tight text-white">
                  {getAdTitle(takeoverAd)}
                </h3>
                <p className="pt-1 text-xs leading-relaxed text-gray-300">
                  {getAdDescription(takeoverAd)}
                </p>
              </div>

              <div className="mt-1.5 flex flex-col gap-3">
                <a
                  href={`https://wa.me/${
                    takeoverAd.whatsapp || takeoverAd.advertiserData?.whatsapp || '962798888888'
                  }?text=${encodeURIComponent(`مرحباً، شاهدت إعلانكم على تطبيق الرادار: ${getAdTitle(takeoverAd)}`)}`}
                  target="_blank"
                  onClick={(event) => event.stopPropagation()}
                  className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-[#00cc66]/50 bg-[#00cc66] p-3.5 text-xs font-black text-white shadow-[0_4px_15px_rgba(0,204,102,0.25)] transition hover:bg-[#00e271]"
                >
                  <MessageCircle className="h-4 w-4 text-white" />
                  واتساب مباشر
                </a>

                <a
                  href={`tel:${takeoverAd.phone || takeoverAd.advertiserData?.phone || '0798888888'}`}
                  onClick={(event) => event.stopPropagation()}
                  className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-[#14B8A6]/35 bg-[#131C31] p-3.5 text-xs font-black text-[#14F5D5] shadow-[0_4px_10px_rgba(0,0,0,0.3)] transition hover:bg-[#14B8A6]/15"
                >
                  <Phone className="h-4 w-4 text-[#14F5D5]" />
                  اتصال مباشر
                </a>

                <a
                  href={takeoverAd.geoLoc || 'https://www.openstreetmap.org/'}
                  target="_blank"
                  onClick={(event) => event.stopPropagation()}
                  className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-blue-700/50 bg-blue-700 p-3.5 text-xs font-black text-white shadow-[0_4px_15px_rgba(29,78,216,0.25)] transition hover:bg-blue-600"
                >
                  <MapPin className="h-4 w-4 text-white" />
                  فتح الموقع
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
