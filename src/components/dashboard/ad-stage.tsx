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
import { ShieldCheck, Sparkles, Phone, MessageCircle, MapPin, X, Heart, Trash2 } from 'lucide-react';
import { recordLocalImpression, recordLocalClick } from '@/lib/ad-cache-sentry';

export function AdStage() {
  const { user } = useAuth();
  const driverOps = useContext(DriverOperationsContext) as any;
  const riderOps = useContext(RiderOperationsContext) as any;
  const [takeoverAd, setTakeoverAd] = useState<any | null>(null);
  
  // [SCR-AD-HEART-125] Private Ad Vault State & Persistence
  const [heartedAdIds, setHeartedAdIds] = useState<string[]>([]);
  const [isVaultOpen, setIsVaultOpen] = useState(false);
  
  // [SCR-AD-PREMIUM-130] Premium warning banners
  const [premiumWarningAdTitle, setPremiumWarningAdTitle] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('sovereign_hearted_ads');
      const cachedDetails = localStorage.getItem('sovereign_ad_vault_details');
      const now = Date.now();
      
      if (stored && cachedDetails) {
        const heartedIds: string[] = JSON.parse(stored);
        const detailsDict = JSON.parse(cachedDetails);
        let changed = false;
        
        // [SCR-AD-VAULT-128] Mummification Purge Gate: Auto-purge expired vault ads (> 30 days old)
        const activeHeartedIds = heartedIds.filter(id => {
          const adDetails = detailsDict[id];
          if (adDetails) {
            const savedTime = adDetails.savedAtTimestamp || now;
            const isExpired = (now - savedTime) > (30 * 24 * 60 * 60 * 1000);
            if (isExpired) {
              delete detailsDict[id];
              changed = true;
              console.log(`[سقوط الأجل] تم بموجب المادة (4) تنظيف وحذف الإعلان منتهي الصلاحية مسبقاً: ${id}`);
              return false;
            }
          }
          return true;
        });

        if (changed) {
          localStorage.setItem('sovereign_hearted_ads', JSON.stringify(activeHeartedIds));
          localStorage.setItem('sovereign_ad_vault_details', JSON.stringify(detailsDict));
          setHeartedAdIds(activeHeartedIds);
        } else {
          setHeartedAdIds(heartedIds);
        }
      } else if (stored) {
        setHeartedAdIds(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to run sovereign automated purge on mount:', e);
    }
  }, []);

  const toggleHeart = (e: React.MouseEvent, ad: any) => {
    e.stopPropagation();
    
    // Physical haptic signature on mobile devices
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(35);
    }
    
    const adId = ad.id;
    let becameHearted = false;

    // [SCR-AD-PREMIUM-130] Check if the advertiser had paid for Premium Retention package
    // Default to true for legacy ads (or missing values) to preserve backward compatibility.
    const isPremiumAd = ad.isPremiumRetentionPaid !== false;

    if (!isPremiumAd) {
      setPremiumWarningAdTitle(ad.content?.title || ad.title || "هذا العرض");
      // Physical haptic error warning buzz
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
      return;
    }

    setHeartedAdIds((prev) => {
      let next;
      const alreadyHearted = prev.includes(adId);
      if (alreadyHearted) {
        next = prev.filter(id => id !== adId);
        // Clear from local cache dictionary
        try {
          const dictRaw = localStorage.getItem('sovereign_ad_vault_details') || '{}';
          const dict = JSON.parse(dictRaw);
          delete dict[adId];
          localStorage.setItem('sovereign_ad_vault_details', JSON.stringify(dict));
        } catch (err) {
          console.error(err);
        }
        console.log(`[بروتوكول القلب النابض] تم إلغاء الإستحواذ وحذف الإعلان: ${adId}`);
      } else {
        next = [...prev, adId];
        becameHearted = true;
        // Cache full details for cross-geography direct connectivity
        try {
          const dictRaw = localStorage.getItem('sovereign_ad_vault_details') || '{}';
          const dict = JSON.parse(dictRaw);
          dict[adId] = {
            ...ad,
            savedAtTimestamp: Date.now() // Record save timestamp for 30-day purge math
          };
          localStorage.setItem('sovereign_ad_vault_details', JSON.stringify(dict));
        } catch (err) {
          console.error(err);
        }
        // Increment Click KPI Ledger for Advertiser ROI metrics
        recordLocalClick(adId);
        console.log(`[بروتوكول القلب النابض] تم تفضيل وحفظ الإعلان في الخزنة الاستحواذية: ${adId}`);
      }
      localStorage.setItem('sovereign_hearted_ads', JSON.stringify(next));
      if (becameHearted) {
        setTimeout(() => setTakeoverAd(ad), 100);
      }
      return next;
    });
  };

  const extendVaultStorage = (e: React.MouseEvent, adId: string) => {
    e.stopPropagation();
    try {
      const dictRaw = localStorage.getItem('sovereign_ad_vault_details') || '{}';
      const dict = JSON.parse(dictRaw);
      if (dict[adId]) {
        dict[adId].savedAtTimestamp = Date.now(); // Reset expiration clock to now
        localStorage.setItem('sovereign_ad_vault_details', JSON.stringify(dict));
        
        // Force state update to refresh UI
        setHeartedAdIds((prev) => [...prev]);
        
        // Physical haptic double vibration
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          navigator.vibrate([40, 30, 40]);
        }
        console.log(`[تمديد الحفظ] تم تمديد صلاحية الحفظ للإعلان: ${adId} لثلاثين يوماً إضافية.`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const savedAdsDetails = useMemo(() => {
    try {
      const cached = localStorage.getItem('sovereign_ad_vault_details');
      if (cached) {
        const parsed = JSON.parse(cached);
        // ReverseheartedAdIds to preserve latest-first order ("مرتبة حسب تاريخ الحفظ")
        return [...heartedAdIds].reverse().map(id => parsed[id]).filter(Boolean);
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  }, [heartedAdIds]);

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
          className="absolute inset-0 w-full h-full flex flex-col justify-end cursor-pointer ad-stage-clicktarget"
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

      {/* 🛡️ [بروتوكول القبضة الخضراء والنبض المستدام - SCR-AD-HEART-125] */}
      {/* Floating Hollow/Green Heart Toggle Button (ZERO pixel footprint) */}
      <button
        onClick={(e) => toggleHeart(e, currentAd)}
        className="absolute right-8 top-24 z-30 w-11 h-11 rounded-full bg-black/45 border border-white/10 flex items-center justify-center backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg hover:border-[#00ffcc]/30"
        title="حفظ الإعلان في الخزنة"
      >
        <Heart 
          className={`w-5.5 h-5.5 transition-all duration-300 ${
            heartedAdIds.includes(currentAd.id) 
              ? 'fill-[#00ffcc] text-[#00ffcc] scale-110 drop-shadow-[0_0_8px_rgba(0,255,204,0.75)]' 
              : 'text-white/80 hover:text-white'
          }`}
        />
      </button>

      {/* 📥 [خزنة عروض الميدان السيادية - Locker Floating Icon with zero-pixel footprint] */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsVaultOpen(true);
        }}
        className="absolute left-8 top-32 z-30 w-11 h-11 rounded-full bg-neutral-950/95 border border-emerald-500/40 flex items-center justify-center backdrop-blur-md transition-all duration-300 hover:scale-110 active:scale-95 shadow-lg shadow-emerald-950/60 group hover:border-[#00ffcc]"
        title="خزنة عروض الميدان المخلدة"
      >
        <span className="text-lg group-hover:drop-shadow-[0_0_8px_#00ffcc]">📥</span>
        {heartedAdIds.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-[#00ffcc] text-neutral-950 text-[9px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-black animate-pulse font-mono">
            {heartedAdIds.length}
          </span>
        )}
      </button>

      {/* Slide Indicators for theatrical premium styling (Balanced on Left Margin) */}
      {activeAds.length > 1 && (
        <div className="absolute left-8 top-24 z-20 flex gap-1.5">
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

      {/* 🛡️ [خزنة النبضات المحفوظة - Sovereign Private Ad Vault - SCR-AD-HEART-125] */}
      <AnimatePresence>
        {isVaultOpen && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="absolute inset-x-0 bottom-0 top-[15vh] z-50 bg-[#020502]/98 border-t-2 border-emerald-500/30 rounded-t-[2.5rem] shadow-[0_-20px_50px_rgba(16,185,129,0.35)] flex flex-col p-6 overflow-y-auto font-sans"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header with dismiss option */}
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
              <span className="text-[10px] uppercase font-black tracking-widest text-[#00ffcc] bg-emerald-950/50 border border-emerald-500/30 px-3 py-1 rounded-full flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 fill-[#00ffcc] text-[#00ffcc]" />
                خزنة الاستحواذ والنبضات المحفوظة الخاصة
              </span>
              <button 
                onClick={() => setIsVaultOpen(false)}
                className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-all border border-white/10"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* List of saved ads */}
            <div className="flex-1 space-y-4">
              {savedAdsDetails.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
                  <Heart className="w-10 h-10 text-gray-650 animate-pulse" />
                  <p className="text-xs text-gray-400 font-sans max-w-xs leading-relaxed">
                    الخزنة فارغة حالياً. اضغط على أزرار "القلب" المفرغة أعلى الإعلانات لحفظ عروض الأباطرة للمستقبل والوصول إليهم بصفر تشتيت ملاحي.
                  </p>
                </div>
              ) : (
                <div className="space-y-4 text-right">
                  <p className="text-[11px] text-gray-400 leading-normal">
                    العروض المحفوظة من خلايا الرادار الجغرافية لتمكين الاتصال المباشر والطلب اليدوي في أي وقت:
                  </p>
                  
                  {savedAdsDetails.map((ad: any) => {
                    const savedTime = ad.savedAtTimestamp || Date.now();
                    const daysLeft = Math.ceil((savedTime + (30 * 24 * 60 * 60 * 1000) - Date.now()) / (24 * 60 * 60 * 1000));
                    
                    return (
                      <div key={ad.id} className="bg-neutral-900/60 p-4 rounded-2xl border border-white/5 space-y-3 relative overflow-hidden text-right">
                        <div className="flex items-start gap-4">
                          <div className="w-16 h-16 rounded-xl overflow-hidden bg-black shrink-0 border border-white/10">
                            <img src={ad.content?.posterUrl} alt={ad.content?.title} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 space-y-1">
                            <h4 className="text-sm font-black text-white">{ad.content?.title}</h4>
                            <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">{ad.content?.description}</p>
                            <span className="inline-block bg-emerald-950 text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded-full">
                              لواء: {ad.targetDistrict || 'عمان'}
                            </span>
                          </div>
                          
                          {/* Remove button */}
                          <button
                            onClick={(e) => toggleHeart(e, ad)}
                            className="p-2 text-rose-400 hover:text-rose-300 transition-all shrink-0"
                            title="حذف من الخزنة"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* [SCR-AD-VAULT-128] Expiration timer & Extend Storage (+30 Days) */}
                        <div className="flex items-center justify-between bg-black/45 p-2.5 rounded-xl border border-white/5 text-[9px] sm:text-[10px]">
                          <span className="text-gray-450 font-sans">
                            📟 دورة التخليد: <strong className={daysLeft > 7 ? "text-emerald-400 font-extrabold" : "text-amber-400 font-black animate-pulse"}>{daysLeft > 0 ? `متبقي ${daysLeft} يوم` : 'منتهية اليوم'}</strong>
                          </span>
                          
                          <button
                            onClick={(e) => extendVaultStorage(e, ad.id)}
                            className="bg-neutral-950 hover:bg-neutral-910 hover:border-emerald-500/30 border border-[#00ffcc]/20 px-2.5 py-1 rounded-lg text-[9px] font-black text-[#00ffcc] transition-all flex items-center gap-1 active:scale-95"
                            title="تمديد الحفظ لثلاثين يوماً إضافية"
                          >
                            <span>تمديد الحفظ (+30 يوم)</span>
                            <span>⏳</span>
                          </button>
                        </div>

                        {/* AI Retention Alert check */}
                        {(!activeAds.some(a => a.id === ad.id)) && (
                          <div className="bg-amber-950/40 border border-amber-500/20 rounded-xl p-3 text-right">
                            <p className="text-[10px] text-amber-300 leading-normal font-sans">
                              📥 هذا العرض انتهى تشغيله في الميدان، ولكنه محفوظ في خزنتك السيادية الخاصة للوصول الدائم.
                            </p>
                          </div>
                        )}

                        {/* Direct action buttons inside vault card */}
                        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5">
                          <button
                            onClick={() => handleZeroClickAction(
                              'whatsapp',
                              `https://wa.me/${ad.whatsapp || '962790000000'}?text=${encodeURIComponent(`مرحباً، شاهدت إعلانكم "${ad.content?.title}" الذي قمت بحفظه في خزنة الرادار الخاصة بـ "بروتوكول القبضة الخضراء" وأود الاستفسار عن تفاصيل العرض.`)}`,
                              ad.id
                            )}
                            className="h-10 bg-emerald-600/90 hover:bg-emerald-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 border border-emerald-500/20"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>واتساب مباشر</span>
                          </button>

                          <button
                            onClick={() => handleZeroClickAction(
                              'call',
                              `tel:${ad.phone || '0790000000'}`,
                              ad.id
                            )}
                            className="h-10 bg-indigo-950/50 hover:bg-indigo-900/50 text-indigo-200 border border-indigo-500/20 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5"
                          >
                            <Phone className="w-4 h-4" />
                            <span>اتصال هاتفي</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footnote */}
            <div className="border-t border-white/5 pt-4 text-center mt-6">
              <span className="text-[9px] text-gray-500 font-bold block">
                🛡️ قمرة الاستحواذ المشتركة: بياناتك محفوظة محلياً بالكامل بصفر استهلاك سحابي.
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* [SCR-AD-PREMIUM-130] Premium Retention Restriction Warning Popup */}
      <AnimatePresence>
        {premiumWarningAdTitle && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-neutral-950 border-2 border-amber-500 text-white z-50 p-4 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.25)]"
            dir="rtl"
          >
            <div className="flex gap-3 items-start">
              <span className="text-xl">⚠️</span>
              <div className="space-y-1 text-right flex-1">
                <h4 className="text-xs font-black text-amber-500">سياسة رادار النبض [المحو السيادي]</h4>
                <p className="text-[10px] text-gray-300 leading-normal font-sans">
                  نأسف! المعلن لم يشترك في <strong className="text-[#00ffcc] font-black">باقة التخليد النسيجي الفاخرة</strong> لـ <strong>({premiumWarningAdTitle})</strong>.
                  هذا يعني أن الإعلان عابر وسيمحى تلقائياً ولا يسمح النظام بحفظه أو نقله للخزنة.
                </p>
              </div>
              <button 
                onClick={() => setPremiumWarningAdTitle(null)} 
                className="text-gray-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface AdCardProps {
  adId: string;
  bannerUrl: string;
  advertiserInfo: {
    phone: string;
    whatsapp: string;
    name: string;
  };
  onHeartPressedServerMetric: (adId: string) => void; // دالة إرسال النبضة للمعلن
}

export const RadarSovereignAdCard: React.FC<AdCardProps> = ({ adId, bannerUrl, advertiserInfo, onHeartPressedServerMetric }) => {
  const [isFollowed, setIsFollowed] = useState<boolean>(false);
  const [showDrawer, setShowDrawer] = useState<boolean>(false);

  const handleHeartClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // منع تشتت النهر الإعلاني دائم الدوران
    
    const newState = !isFollowed;
    setIsFollowed(newState);
    
    if (newState) {
      // إطلاق الاهتزاز الميكانيكي في هاتف المستخدم لإنفاذ النبض البصري
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(15);
      
      // فتح بطاقة الاستحواذ الصامتة فوراً للمستخدم
      setShowDrawer(true);
      
      // إرسال النبضة الرقمية مسبقة الدفع للوحة تحكم المعلن
      onHeartPressedServerMetric(adId);
    } else {
      setShowDrawer(false);
    }
  };

  return (
    <div className="ad-card-wrapper" style={{ position: 'relative', width: '100%', overflow: 'hidden', borderRadius: '8px' }}>
      
      {/* بنية المادة الإعلانية الممتدة على مسرح الشاشة بالكامل */}
      <img src={bannerUrl} alt="Radar Ad" style={{ width: '100%', display: 'block', objectFit: 'cover' }} referrerPolicy="no-referrer" />

      {/* المادة (1): زر القلب العائم المحصن - يستهلك صفر بكسل من مساحة النظام */}
      <button 
        onClick={handleHeartClick}
        style={{
          position: 'absolute', top: '12px', right: '12px',
          background: 'rgba(0, 0, 0, 0.4)', border: 'none', borderRadius: '50%',
          width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', transition: 'all 0.2s ease', backdropFilter: 'blur(4px)'
        }}
      >
        {/* تصيير حالة القلب برمجياً: مفرغ بنحافة أو مشع أخضر سيادي */}
        <span style={{ 
          fontSize: '22px', 
          color: isFollowed ? '#00ffcc' : '#ffffff',
          filter: isFollowed ? 'drop-shadow(0 0 5px #00ffcc)' : 'none'
        }}>
          {isFollowed ? '💚' : '🤍'}
        </span>
      </button>

      {/* بوابة العبور الفوري للبيانات - تنبثق محلياً كـ Drawer خفيف جداً عند الحافة */}
      {showDrawer && (
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          backgroundColor: 'rgba(5, 5, 5, 0.95)', borderTop: '2px solid #00ffcc',
          padding: '12px', borderBottomLeftRadius: '8px', borderBottomRightRadius: '8px',
          fontFamily: 'monospace', color: '#fff', fontSize: '12px', zIndex: 10
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span>📞 جهة اتصال معلن: <strong>{advertiserInfo.name}</strong></span>
            <button onClick={() => setShowDrawer(false)} style={{ background: 'none', border: 'none', color: '#ff3366', cursor: 'pointer' }}>[إغلاق]</button>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <a href={`tel:${advertiserInfo.phone}`} style={{ flex: 1, backgroundColor: '#111', color: '#00ffcc', textAlign: 'center', padding: '6px', borderRadius: '4px', textDecoration: 'none', border: '1px solid #00ffcc', fontWeight: 'bold' }}>
              📞 اتصال هاتفي
            </a>
            <a href={`https://wa.me/${advertiserInfo.whatsapp}`} target="_blank" rel="noreferrer" style={{ flex: 1, backgroundColor: '#00cc66', color: '#fff', textAlign: 'center', padding: '6px', borderRadius: '4px', textDecoration: 'none', fontWeight: 'bold' }}>
              💬 واتساب مباشر
            </a>
          </div>
        </div>
      )}

    </div>
  );
};

Object.freeze(RadarSovereignAdCard);

export interface RadarAdNode {
  adId: string;
  bannerUrl: string;
  expirationTimestamp: number; // تاريخ انتهاء الإعلان
  isSovereignStopped: boolean; // هل أوقفه المعلن؟
  advertiserData: { name: string; phone: string; whatsapp: string; };
}

export const RadarAdVaultKernel = {
  /**
   * بروتوكول التطهير والمحو الذاتي: يُستدعى محلياً لتنظيف ذاكرة الهاتف
   * @param localAdsList قائمة الإعلانات المخزنة في هاتف المستخدم حالياً
   * @param savedHeartIds مصفوفة المعرفات التي وضع المستخدم عليها قلباً أخضر
   */
  enforceSovereignPurge: function(
    localAdsList: RadarAdNode[], 
    savedHeartIds: string[]
  ): { activeRiverAds: RadarAdNode[], mummifiedVaultAds: RadarAdNode[] } {
    
    const now = Date.now();

    // 1. فرز وتطهير إعلانات النهر العام (المحو التلقائي إذا انتهت المدة أو حُذف الإعلان)
    const activeRiverAds = localAdsList.filter(ad => {
      const isExpired = now > ad.expirationTimestamp;
      // إذا لم يوضع عليه قلب وانتهت صلاحيته أو ألغاه المعلن -> يُحذف فوراً من هاتف المستخدم
      if (isExpired || ad.isSovereignStopped) {
        return savedHeartIds.includes(ad.adId || (ad as any).id); // ينجو فقط إذا كان في الخزنة (القلب الأخضر)
      }
      return true; // الإعلان لا زال نشطاً في الميدان
    });

    // 2. تخليد الإعلانات المحفوظة بالقلب الأخضر (Sovereign Ad Vault)
    const mummifiedVaultAds = localAdsList.filter(ad => savedHeartIds.includes(ad.adId || (ad as any).id));

    return {
      activeRiverAds,    // يغذي النهر الإعلاني دائم الدوران
      mummifiedVaultAds  // يغذي خزنة أرشيف المستخدم
    };
  }
};

Object.freeze(RadarAdVaultKernel);
