'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ChevronLeft, ChevronRight, MapPin, MessageCircle, Phone, ShieldCheck, X } from 'lucide-react';
import { AdDisplayCard, getAdDescription, getAdTitle } from './ad-display-card';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase-client';

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

 if (localEvents >= AD_BATCH_WRITE_LIMIT) {
 localStorage.removeItem(cacheKey);
 localStorage.setItem(
 `radar_ad_metrics_pending_${adId}`,
 JSON.stringify({ adId, ...currentMetrics, queuedAt: Date.now() }),
 );
 }
 } catch (error) {
 console.warn('Ad metrics stayed local only:', error);
 }
 },
};

const BRAND_PLACEHOLDER_AD = {
 id: 'brand-empty-state',
 title: 'مرحباً بك في الرادار الذكي - رحلتك القادمة أكثر أماناً وتوفيراً معنا',
 description: 'لا توجد إعلانات نشطة في منطقتك الآن. سنعرض لك العروض فور توفرها.',
 bannerUrl:
 'data:image/svg+xml;utf8,' +
 encodeURIComponent(
 '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#0B0F19"/><stop offset="1" stop-color="#063B3A"/></linearGradient><pattern id="p" width="80" height="80" patternUnits="userSpaceOnUse"><path d="M0 80L80 0M-20 20L20-20M60 100L100 60" stroke="#14B8A6" stroke-opacity=".16" stroke-width="2"/></pattern></defs><rect width="1200" height="800" fill="url(#g)"/><rect width="1200" height="800" fill="url(#p)"/><circle cx="980" cy="130" r="180" fill="#14B8A6" fill-opacity=".10"/><circle cx="180" cy="720" r="240" fill="#14F5D5" fill-opacity=".08"/></svg>',
 ),
 buttonText: 'ابدأ رحلتك',
 content: {
 title: 'مرحباً بك في الرادار الذكي - رحلتك القادمة أكثر أماناً وتوفيراً معنا',
 description: 'لا توجد إعلانات نشطة في منطقتك الآن. سنعرض لك العروض فور توفرها.',
 },
 isPlaceholder: true,
};

const getBadgeText = (ad: any) => {
 if (ad.adType === 'RIDER_BENEFIT') return 'للركاب';
 if (ad.adType === 'CAPTAIN_PROFESSIONAL') return 'للسائقين';
 return 'إعلان قريب';
};

export function AdStage({ isFullScreen = false }: { isFullScreen?: boolean }) {
 const { user } = useAuth();
 const liveDistrict = user?.district || 'عمان';
 const liveGovernorate = user?.governorate || 'العاصمة';
 const [serverAds, setServerAds] = useState<any[]>([]);
 const [isLoadingAds, setIsLoadingAds] = useState(true);
 const [hasAdFetchIssue, setHasAdFetchIssue] = useState(false);
 const [heartedAdIds, setHeartedAdIds] = useState<string[]>([]);
 const [takeoverAd, setTakeoverAd] = useState<any | null>(null);
 const [isAdStreamPaused, setIsAdStreamPaused] = useState(false);
 const isAdStreamPausedRef = useRef(false);
 const scrollTrackRef = useRef<HTMLDivElement | null>(null);

 useEffect(() => {
 let active = true;

 async function fetchLiveAds() {
 setIsLoadingAds(true);
 setHasAdFetchIssue(false);
 try {
 const { data, error } = await supabase
 .from('ad_campaigns')
 .select('*')
 .in('status', ['ACTIVE', 'active']);

 if (error) throw error;
 if (active) setServerAds(Array.isArray(data) ? data.map(mapAdCampaignRow) : []);
 } catch (error) {
 if (!active) return;
 if (import.meta.env.DEV) console.warn('[AdStage] showing placeholder because ads could not load:', error);
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
 const filteredAds = RadarAdMetrics.filterAdsByLocalContext(liveDistrict, liveGovernorate, serverAds);
 if (filteredAds.length > 0) return filteredAds;

 return [
 {
 ...BRAND_PLACEHOLDER_AD,
 description: hasAdFetchIssue
 ? 'لا توجد إعلانات متاحة الآن. سنعرض لك العروض فور توفرها.'
 : BRAND_PLACEHOLDER_AD.description,
 content: {
 ...BRAND_PLACEHOLDER_AD.content,
 description: hasAdFetchIssue
 ? 'لا توجد إعلانات متاحة الآن. سنعرض لك العروض فور توفرها.'
 : BRAND_PLACEHOLDER_AD.content.description,
 },
 },
 ];
 }, [hasAdFetchIssue, liveDistrict, liveGovernorate, serverAds]);

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

 if (isLoadingAds) {
 return (
 <div className={`relative ${heightClass} m-4 flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#14B8A6]/50 bg-[#0B0F19]`}>
 <div className="mb-4 h-12 w-12 animate-spin rounded-full border-t-2 border-[#14B8A6]" />
 <p className="px-4 text-center text-sm font-bold tracking-widest text-[#14B8A6]">
 جاري تحميل الإعلانات
 <br />
 <span className="text-xs text-gray-400">ثوانٍ من فضلك</span>
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
 إعلانات قريبة منك
 </h2>
 </div>
 <span className="font-mono text-[9px] font-bold text-gray-500 md:text-[10px]">
 {adsToUse.length} إعلان
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
 {adsToUse.length > 1 && (
 <>
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
 </>
 )}

 <div
 ref={scrollTrackRef}
 data-ad-carousel-track="true"
 data-paused={isAdStreamPaused ? 'true' : 'false'}
 data-ad-count={adsToUse.length}
 className="flex min-w-0 flex-1 flex-nowrap gap-8 overflow-x-auto px-14 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
 >
 {(adsToUse.length > 1 ? [...adsToUse, ...adsToUse] : adsToUse).map((ad: any, index: number) => (
 <AdDisplayCard
 key={`${ad.id}-${index}`}
 ad={ad}
 isHearted={heartedAdIds.includes(ad.id)}
 onHeart={toggleHeart}
 onOpen={ad.isPlaceholder ? undefined : openTakeover}
 badgeText={getBadgeText(ad)}
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
 }?text=${encodeURIComponent(`مرحبا، شاهدت إعلانكم في التطبيق: ${getAdTitle(takeoverAd)}`)}`}
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

function mapAdCampaignRow(row: Record<string, any>) {
 const title = firstString(row.title, row.title_ar, row.name_ar, row.name, row.content?.title);
 const description = firstString(row.description, row.description_ar, row.content?.description);
 const posterUrl = firstString(row.posterUrl, row.poster_url, row.bannerUrl, row.banner_url, row.image_url, row.imageUrl);
 const whatsapp = firstString(row.whatsapp, row.whatsapp_number, row.contact_whatsapp);
 const phone = firstString(row.phone, row.phone_number, row.contact_phone);
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
