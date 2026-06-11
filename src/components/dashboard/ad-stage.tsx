'use client';

import React, { useContext, useMemo, useState, useEffect } from 'react';
import { usePromoStream } from '@/hooks/use-promo-stream';
import { useMarketPulse } from '@/hooks/use-market-pulse';
import { getDistrictFromCoords } from '@/lib/geospatial'; 
import { Button } from '../ui/button';
import { handleAdAction } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { DriverOperationsContext } from '@/hooks/use-driver-operations';
import { RiderOperationsContext } from '@/hooks/use-rider-operations';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, Sparkles, Phone, MessageCircle, MapPin, X } from 'lucide-react';
import { recordLocalImpression, recordLocalClick } from '@/lib/ad-cache-sentry';

export function AdStage() {
  const { user } = useAuth();
  const driverOps = useContext(DriverOperationsContext) as any;
  const riderOps = useContext(RiderOperationsContext) as any;
  const [takeoverAd, setTakeoverAd] = useState<any | null>(null);

  const isOverspeeding = useMemo(() => {
    if (driverOps && driverOps.driverStatus === 'active') {
      return driverOps.driverSpeed > 40;
    }
    return false;
  }, [driverOps]);

  const liveLocation = useMemo(() => {
    if (driverOps && (driverOps.driverStatus === 'active' || driverOps.driverStatus === 'busy') && driverOps.driverLocation) {
      return getDistrictFromCoords(driverOps.driverLocation.lat, driverOps.driverLocation.lng);
    }
    if (riderOps && riderOps.tripStatus !== 'idle' && riderOps.trip?.pickupCoords) {
      return getDistrictFromCoords(riderOps.trip.pickupCoords.lat, riderOps.trip.pickupCoords.lng);
    }
    return { district: user?.district, governorate: user?.governorate };
  }, [driverOps, riderOps, user]);

  const { activeAds, registerClick } = usePromoStream(liveLocation.district, liveLocation.governorate);
  const { pulseData } = useMarketPulse(true);

  const activeDistrictPulse = useMemo(() => {
    const d = liveLocation.district;
    if (!d || !pulseData) return null;
    return pulseData.find(p => p.id === d) || null;
  }, [liveLocation.district, pulseData]);

  const [currentIndex, setCurrentIndex] = useState(0);

  // Auto-advance ads every 5 seconds as dictated by Section 55 Constitution
  useEffect(() => {
    if (!activeAds || activeAds.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeAds.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeAds]);

  // Handle index out of bounds on data changes
  useEffect(() => {
    if (activeAds && currentIndex >= activeAds.length) {
      setCurrentIndex(0);
    }
  }, [activeAds, currentIndex]);

  const currentAd = activeAds ? activeAds[currentIndex] : null;

  // Record local impression (silent, edge cache to avoid Firebase chattering)
  useEffect(() => {
    if (currentAd && currentAd.id) {
      recordLocalImpression(currentAd.id);
      console.log(`[بروتوكول صفر كلفة] تم تسجيل ظهور محلي صامت للإعلان: ${currentAd.id}`);
    }
  }, [currentAd]);

  if (isOverspeeding || !activeAds || activeAds.length === 0 || !currentAd) {
    return (
      <div className="absolute inset-0 z-0 bg-black">
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/50" />
      </div>
    );
  }

  const handleTakeoverOpen = (e: React.MouseEvent, ad: any) => {
    e.stopPropagation();
    registerClick(ad.id, liveLocation.district || 'unknown');
    setTakeoverAd(ad);
  };

  const handleZeroClickAction = (actionType: 'call' | 'whatsapp' | 'maps', urlStr: string, adId: string) => {
    recordLocalClick(adId);
    console.log(`[بروتوكول صفر كلفة] تم تسجيل نقرة الـ Zero-Click الذرية: ${actionType}`);
    window.open(urlStr, '_blank');
  };

  return (
    <div className="absolute inset-0 z-0 overflow-hidden bg-black pointer-events-auto select-none" dir="rtl">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentAd.id}
          initial={{ x: '100%', opacity: 0.8 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '-100%', opacity: 0.8 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 w-full h-full flex flex-col justify-end cursor-pointer"
          onClick={(e) => handleTakeoverOpen(e, currentAd)}
        >
          {/* Ad Poster */}
          <img
            src={currentAd.content?.posterUrl || ''}
            alt={currentAd.content?.title || ''}
            className="absolute inset-0 w-full h-full object-cover opacity-65"
            referrerPolicy="no-referrer"
          />

          {/* Deep atmospheric shadows conforming to theater motif */}
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-black via-black/40 to-transparent" />
          <div className="absolute inset-0 z-10 bg-gradient-to-l from-black/50 via-transparent to-black/50" />

          {/* Ad Content Block */}
          <div className="absolute inset-x-0 bottom-0 z-20 p-8 pb-32 sm:pb-36 flex flex-col items-start gap-4">
            
            {/* Geo-Grid and AI Sentry certified badges */}
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full backdrop-blur-md">
                <ShieldCheck className="w-3.5 h-3.5" />
                تحصيل آمن (AI Sentry Verified)
              </span>
              {currentAd.targetDistrict && (
                <span className="flex items-center gap-1 bg-blue-950/80 border border-blue-500/30 text-blue-400 text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full backdrop-blur-md">
                  <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                  لواء: {currentAd.targetDistrict}
                </span>
              )}
              {activeDistrictPulse?.emergencyAdCapacityActive && (
                <span className="flex items-center gap-1 bg-red-950/90 border border-amber-500/50 text-amber-300 text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full backdrop-blur-md shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                  حزمة طارئة نشطة: انتباه مكثف [v5.5]
                </span>
              )}
            </div>

            <div className="max-w-2xl w-full space-y-3">
              <h2 className="text-3xl sm:text-4xl font-black text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)] tracking-tight">
                {currentAd.content?.title}
              </h2>
              <p className="text-lg text-gray-200 drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)] leading-relaxed">
                {currentAd.content?.description}
              </p>
              
              {currentAd.action?.actionUrl && (
                <Button 
                  onClick={(e) => handleTakeoverOpen(e, currentAd)}
                  className="h-14 px-10 text-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold rounded-xl shadow-lg shadow-emerald-900/40 hover:scale-[1.02] active:scale-95 transition-all duration-300 border border-emerald-500/30"
                >
                  {currentAd.action?.buttonText}
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Slide Indicators for theatrical premium styling */}
      {activeAds.length > 1 && (
        <div className="absolute right-8 top-24 z-20 flex gap-2">
          {activeAds.map((_, idx) => (
            <button
              key={idx}
              onClick={(e) => {
                e.stopPropagation();
                setCurrentIndex(idx);
              }}
              className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentIndex ? 'w-8 bg-emerald-500' : 'w-2 bg-white/30'}`}
            />
          ))}
        </div>
      )}

      {/* 🛡️ [بطاقة الاستحواذ الكامل فوق النهر الإعلاني - Deep Linking Engine] */}
      <AnimatePresence>
        {takeoverAd && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="absolute inset-x-0 bottom-0 top-[15vh] z-50 bg-[#040C04]/98 border-t-2 border-emerald-500/30 rounded-t-[2.5rem] shadow-[0_-20px_50px_rgba(16,185,129,0.25)] flex flex-col p-6 overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with dismiss option */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
              <span className="text-[10px] uppercase font-black tracking-widest text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                بوابة الاستحواذ المباشر
              </span>
              <button 
                onClick={() => setTakeoverAd(null)}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all border border-white/10"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Campaign Visuals inside takeover */}
            <div className="flex-1 space-y-6">
              <div className="relative aspect-video w-full rounded-2xl overflow-hidden border border-emerald-500/20 shadow-inner">
                <img 
                  src={takeoverAd.content?.posterUrl} 
                  alt={takeoverAd.content?.title} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
              </div>

              <div className="space-y-2 text-right">
                <h3 className="text-2xl font-black text-white">{takeoverAd.content?.title}</h3>
                <p className="text-sm text-gray-300 leading-relaxed font-sans">{takeoverAd.content?.description}</p>
              </div>

              {/* Geo Grid Target Info */}
              <div className="bg-emerald-950/20 border border-emerald-500/10 p-4 rounded-2xl flex items-center justify-between text-xs text-gray-400">
                <span className="font-mono text-[10px] uppercase font-bold text-emerald-500">Geo-Grid Certified</span>
                <span className="font-bold flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-500" />
                  {takeoverAd.targetDistrict ? `لواء ${takeoverAd.targetDistrict} • ` : ''} عمان
                </span>
              </div>

              {/* Zero-Click الذرية Buttons Core (المادة 9) */}
              <div className="space-y-3 pt-2">
                <p className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wide text-right mb-1">نقرة واحدة للتجاوب الفوري دون مغادرة التطبيق</p>
                
                {/* 1. WhatsApp Button */}
                <button
                  onClick={() => handleZeroClickAction(
                    'whatsapp',
                    `https://wa.me/${takeoverAd.whatsapp || '962790000000'}?text=${encodeURIComponent(`مرحباً، شاهدت إعلانكم "${takeoverAd.content?.title}" على الرادار الذكي وأود الاستفسار عن تفاصيل العرض السيادي.`)}`,
                    takeoverAd.id
                  )}
                  className="w-full h-14 bg-emerald-600/90 hover:bg-emerald-600 text-white rounded-xl font-bold flex items-center justify-between px-6 border border-emerald-500/30 transition-all active:scale-98 shadow-md"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>تواصل مجاني عبر الواتساب</span>
                </button>

                {/* 2. Direct Call Button */}
                <button
                  onClick={() => handleZeroClickAction(
                    'call',
                    `tel:${takeoverAd.phone || '0790000000'}`,
                    takeoverAd.id
                  )}
                  className="w-full h-14 bg-indigo-950/50 hover:bg-indigo-900/50 text-indigo-200 border border-indigo-500/30 rounded-xl font-bold flex items-center justify-between px-6 transition-all active:scale-98"
                >
                  <Phone className="w-5 h-5" />
                  <span>اتصال هاتفي مباشر</span>
                </button>

                {/* 3. Maps Location Button */}
                <button
                  onClick={() => handleZeroClickAction(
                    'maps',
                    `https://maps.google.com/?q=${encodeURIComponent(takeoverAd.content?.title || 'Jordan')}`,
                    takeoverAd.id
                  )}
                  className="w-full h-14 bg-slate-900 border border-white/10 hover:bg-slate-800 text-gray-200 rounded-xl font-bold flex items-center justify-between px-6 transition-all active:scale-98"
                >
                  <MapPin className="w-5 h-5 text-red-500" />
                  <span>عرض الموقع التوجيهي على الخريطة</span>
                </button>
              </div>
            </div>

            {/* Slogan footnote */}
            <div className="border-t border-white/5 pt-4 text-center">
              <span className="text-[9px] text-gray-500 font-bold block">
                🛡️ نظام النبض السيادي: تواصل مباشر صفر-نقاط-بيع لتوفير التكاليف.
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
