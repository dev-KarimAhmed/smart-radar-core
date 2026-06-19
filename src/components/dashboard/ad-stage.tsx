'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, MessageCircle, Phone, X, ShieldCheck, MapPin } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { usePromoStream } from '@/hooks/use-promo-stream';
import { db } from '@/lib/firebase';
import { doc, setDoc, increment, serverTimestamp } from 'firebase/firestore';

const RadarSovereignAdKernel = {
  SETTINGS: Object.freeze({
    ROTATION_SPEED_MS: 5000,
    BATCH_WRITE_LIMIT: 50,
  }),

  // 1. تصفية النهر الإعلاني محلياً بناءً على رمز اللواء والمحافظة (ميثاق الجغرافيا الحرة)
  filterAdsByH3Context: function(userDistrict: string, userGov: string, allAds: any[]): any[] {
    return allAds.filter(ad => {
      if (!ad || !ad.targetScale) return true;
      if (ad.targetScale === 'Governorate') return ad.targetLocationName === userGov;
      if (ad.targetScale === 'District') return ad.targetLocationName === userDistrict;
      return false;
    });
  },

  // 2. محرك العدادات المحلي المجمع (Batching Engine) لضمان الصفر كلفة في Firebase
  logImpressionLocally: async function(adId: string, type: 'view' | 'click'): Promise<void> {
    try {
      const cacheKey = `radar_ad_metrics_${adId}`;
      const cached = localStorage.getItem(cacheKey);
      let currentMetrics = { views: 0, clicks: 0 };
      if (cached) {
        try { currentMetrics = JSON.parse(cached); } catch (e) {
          console.error("Failed to parse cached metrics:", e);
        }
      }

      if (type === 'view') currentMetrics.views += 1;
      if (type === 'click') currentMetrics.clicks += 1;

      localStorage.setItem(cacheKey, JSON.stringify(currentMetrics));

      const totalLocalEvents = currentMetrics.views + currentMetrics.clicks;
      if (totalLocalEvents >= this.SETTINGS.BATCH_WRITE_LIMIT) {
        localStorage.removeItem(cacheKey);
        const rollupRef = doc(db, 'sovereign_ad_metrics_rollup', adId);
        await setDoc(rollupRef, {
          adId,
          views: increment(currentMetrics.views),
          clicks: increment(currentMetrics.clicks),
          lastFlush: serverTimestamp()
        }, { merge: true });
        console.log(`📡 [بروتوكول 88: وحيد النبضة] تم دمج النبضات الإعلانية وتصعيد دفعة واحدة سحابياً للإعلان: ${adId}`);
      }
    } catch (e) {
      console.warn('Silent local metrics storage bypass:', e);
    }
  },

  // 3. محرك الروابط المباشرة وعائد الـ Zero-Click
  executeDeepLink: function(type: 'whatsapp' | 'phone' | 'geoloc', linkData: string, adTitle?: string) {
    console.log(`🔓 تم تفعيل بروتوكول الاستحواذ المباشر: فتح تطبيق ${type} فوراً عند الحافة.`);
    if (type === 'whatsapp') {
      const text = `مرحباً، شاهدت إعلانكم [${adTitle || ''}] على الرادار الذكي بخصوص منفعة الراكب`;
      window.open(`https://wa.me/${linkData}?text=${encodeURIComponent(text)}`, '_blank');
    }
    if (type === 'phone') {
      window.location.href = `tel:${linkData}`;
    }
    if (type === 'geoloc') {
      window.open(linkData, '_blank');
    }
  }
};

try {
  Object.freeze(RadarSovereignAdKernel);
} catch (e) {
  console.warn("Could not freeze RadarSovereignAdKernel (non-breaking):", e);
}

const VIRTUAL_ADS = [
  {
    id: 'virt-1',
    title: 'الملكة لتأجير السيارات الفاخرة 🚗',
    description: 'رحلاتك الرئاسية الميدانية تبدأ معنا. أحدث موديلات المرسيدس، بي إم دبليو، ورنج روفر الفاخرة بأفضل الأسعار وبخدمة سائقين محترفين على مدار الساعة.',
    bannerUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=1200&auto=format&fit=crop',
    posterUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?q=80&w=1200&auto=format&fit=crop',
    phone: '0798888888',
    whatsapp: '962798888888',
    geoLoc: 'https://maps.google.com/?q=31.9522,35.8333',
    buttonText: 'احجز سيارتك الفخمة الآن 👑',
    content: {
      title: 'الملكة لتأجير السيارات الفاخرة 🚗',
      description: 'رحلاتك الرئاسية الميدانية تبدأ معنا. أحدث موديلات المرسيدس، بي إم دبليو، ورنج روفر الفاخرة بأفضل الأسعار وبخدمة سائقين محترفين على مدار الساعة.'
    }
  },
  {
    id: 'virt-2',
    title: 'مذاق الطيب للمأكولات الأردنية 🥘',
    description: 'أشهى وجبات المنسف الأردني بنكهة جميد كركي بلدي أصيل وسمن بلقاوي حامض، لحم طازج بلدي 100%. تصلك ساخنة أينما كنت فوراً.',
    bannerUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop',
    posterUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop',
    phone: '0799999999',
    whatsapp: '962799999999',
    geoLoc: 'https://maps.google.com/?q=31.9631,35.9303',
    buttonText: 'اطلب منسفك البلدي الفاخر 🍗',
    content: {
      title: 'مذاق الطيب للمأكولات الأردنية 🥘',
      description: 'أشهى وجبات المنسف الأردني بنكهة جميد كركي بلدي أصيل وسمن بلقاوي حامض، لحم طازج بلدي 100%. تصلك ساخنة أينما كنت فوراً.'
    }
  },
  {
    id: 'virt-3',
    title: 'فندق تلال عمان وبانوراما العاصمة 🏨',
    description: 'إطلالة ساحرة 360 درجة على جبال عمان السبعة التاريخية. غرف وأجنحة ملكية فخمة، ومطاعم معلقة بأشهى المذاقات العالمية ليلة لا تُنسى.',
    bannerUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200&auto=format&fit=crop',
    posterUrl: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=1200&auto=format&fit=crop',
    phone: '0797777777',
    whatsapp: '962797777777',
    geoLoc: 'https://maps.google.com/?q=31.9515,35.8450',
    buttonText: 'احجز جناحك البانورامي الفاخر 🗝️',
    content: {
      title: 'فندق تلال عمان وبانوراما العاصمة 🏨',
      description: 'إطلالة ساحرة 360 درجة على جبال عمان السبعة التاريخية. غرف وأجنحة ملكية فخمة، ومطاعم معلقة بأشهى المذاقات العالمية ليلة لا تُنسى.'
    }
  }
];

export function AdStage({ isFullScreen = false }: { isFullScreen?: boolean }) {
  const { user } = useAuth();
  const liveDistrict = user?.district || 'عمان';
  const { activeAds } = usePromoStream(liveDistrict, user?.governorate || 'عاصمة');

  const [heartedAdIds, setHeartedAdIds] = useState<string[]>([]);
  const [takeoverAd, setTakeoverAd] = useState<any | null>(null);

  // Combine database ads and high-quality virtual backup ads so the banner is NEVER empty and always flows beautifully
  const combinedAds = activeAds && activeAds.length > 0 ? [...activeAds, ...VIRTUAL_ADS] : VIRTUAL_ADS;
  const adsToUse = RadarSovereignAdKernel.filterAdsByH3Context(liveDistrict, user?.governorate || 'عاصمة', combinedAds);

  useEffect(() => {
    if (adsToUse && adsToUse.length > 0) {
      adsToUse.forEach((ad: any) => {
        if (ad && ad.id) {
          RadarSovereignAdKernel.logImpressionLocally(ad.id, 'view');
        }
      });
    }
  }, [adsToUse]);

  useEffect(() => {
    const stored = localStorage.getItem('sovereign_hearted_ads');
    if (stored) {
      try {
        setHeartedAdIds(JSON.parse(stored));
      } catch (e) {
        console.error("Failed to parse stored hearted ads:", e);
      }
    }
  }, []);

  const toggleHeart = (e: React.MouseEvent, ad: any) => {
    e.preventDefault();
    e.stopPropagation();

    // [SCR-AD-VAULT-130] Check if regular transient package
    const isRegular = ad.packageId === 'basic-pulse' || ad.isPremiumRetentionPaid === false;
    const adId = ad.id;
    const alreadyHearted = heartedAdIds.includes(adId);

    if (!alreadyHearted && isRegular) {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([100, 50, 100]);
      }
      alert("⚠️ عذراً، هذا الإعلان يتبع الباقة العادية (نبض عابر) ومحمي من النقل أو التخليد في الخزنة. ميزة الحفظ متاحة فقط للإعلانات الفاخرة ذات الأثر المخلد.");
      return;
    }

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([50, 50, 50]);
    }

    let newHearts;
    if (alreadyHearted) {
      newHearts = heartedAdIds.filter((id) => id !== adId);
    } else {
      newHearts = [...heartedAdIds, adId];
      setTakeoverAd(ad);
    }

    setHeartedAdIds(newHearts);
    localStorage.setItem('sovereign_hearted_ads', JSON.stringify(newHearts));

    try {
      const dict = JSON.parse(localStorage.getItem('sovereign_ad_vault_details') || '{}');
      if (!alreadyHearted) {
        dict[adId] = { ...ad, savedAtTimestamp: Date.now() };
      } else {
        delete dict[adId];
      }
      localStorage.setItem('sovereign_ad_vault_details', JSON.stringify(dict));
    } catch (e) {
      console.error("Failed to update sovereign_ad_vault_details cache:", e);
    }
  };

  const openTakeover = (e: React.MouseEvent, ad: any) => {
    e.preventDefault();
    e.stopPropagation();
    setTakeoverAd(ad);
    if (ad && ad.id) {
      RadarSovereignAdKernel.logImpressionLocally(ad.id, 'click');
    }
  };

  const heightClass = isFullScreen ? 'flex-1 h-full min-h-[65vh] w-full' : 'h-[300px] w-full';

  if (!adsToUse || adsToUse.length === 0) return (
    <div className={`relative ${heightClass} bg-[#131C31] flex flex-col items-center justify-center border border-dashed border-[#00ffcc]/50 m-4 rounded-xl`}>
      <div className="w-12 h-12 rounded-full border-t-2 border-[#00ffcc] animate-spin mb-4"></div>
      <p className="text-[#00ffcc] font-bold text-sm tracking-widest text-center px-4">
        نهر الإعلانات الميداني متصل 📡<br/>
        <span className="text-gray-400 text-xs">لا توجد حملات نشطة في منطقتك حالياً</span>
      </p>
    </div>
  );

  return (
    <div className={`relative w-full ${heightClass} z-[10] bg-[#0B1120] pointer-events-auto select-none overflow-hidden flex flex-col justify-center py-6 border-b border-white/5`} dir="rtl">
      
      {/* 👑 Sovereign Top Heading Indicator */}
      <div className="px-6 mb-4 flex items-center justify-between z-[20] shrink-0">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ffcc] opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#00ffcc]"></span>
          </span>
          <h2 className="text-xs md:text-sm font-black tracking-widest text-[#00ffcc] uppercase">
            نبض نهر الإعلانات الميداني 📡🌊
          </h2>
        </div>
        <span className="text-[9px] md:text-[10px] text-gray-500 font-bold font-mono">
          LIVE STREAM REGISTRY • {adsToUse.length} CAMPAIGNS
        </span>
      </div>

      {/* Marquee Infinite Scrolling Container with forced LTR to guarantee mathematically-perfect infinite right-to-left scrolling */}
      <div className="w-full relative flex-1 flex items-center overflow-hidden" dir="ltr">
        <motion.div
          className="flex flex-nowrap min-w-max gap-6"
          animate={{ x: ["0%", "-50%"] }}
          transition={{
            ease: "linear",
            duration: 35, // Extremely smooth, elegant scrolling
            repeat: Infinity,
          }}
        >
          {/* We repeat the ads twice inside this container to get a mathematically perfect seamless scroll loop */}
          {[...adsToUse, ...adsToUse].map((ad: any, index: number) => {
            const isHearted = heartedAdIds.includes(ad.id);
            const cardHeight = isFullScreen ? 'h-[320px] md:h-[380px]' : 'h-[200px] md:h-[220px]';
            const cardWidth = isFullScreen ? 'w-[260px] md:w-[360px]' : 'w-[220px] md:w-[280px]';

            return (
              <div
                key={`${ad.id}-${index}`}
                onClick={(e) => openTakeover(e, ad)}
                className={`flex-shrink-0 ${cardWidth} ${cardHeight} relative rounded-3xl overflow-hidden border border-[#00ffcc]/10 bg-[#0D1527] shadow-[0_15px_40px_rgba(0,0,0,0.45)] group cursor-pointer transition-all duration-300 hover:border-[#00ffcc]/50 hover:shadow-[0_0_30px_rgba(0,255,204,0.25)] flex flex-col justify-end p-5`}
                dir="rtl"
              >
                {/* Background poster image with automatic high-res fallback */}
                <img
                  src={ad.content?.posterUrl || ad.bannerUrl || 'https://images.unsplash.com/photo-1557821552-17105176677c?q=80&w=1000&auto=format&fit=crop'}
                  alt={ad.content?.title || ad.title}
                  onError={(e) => {
                    e.currentTarget.src = 'https://images.unsplash.com/photo-1557821552-17105176677c?q=80&w=1000&auto=format&fit=crop';
                  }}
                  className="absolute inset-0 w-full h-full object-cover opacity-50 group-hover:opacity-75 transition-all duration-700 group-hover:scale-105"
                  referrerPolicy="no-referrer"
                />
                
                {/* Modern Dark Scrim Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#070D19] via-[#070D19]/65 to-transparent z-[1]" />

                {/* Sovereign Top Badge */}
                <div className="absolute top-4 right-4 z-[10]">
                  <span className="text-[8px] md:text-[9px] bg-black/60 backdrop-blur-md text-[#00ffcc] border border-[#00ffcc]/20 px-2 md:px-2.5 py-0.5 md:py-1 rounded-full font-black">
                    {ad.adType === 'RIDER_BENEFIT' ? 'منفعة راكب 🎁' : ad.adType === 'CAPTAIN_PROFESSIONAL' ? 'دعم كابتن 🛠️' : 'نبض سيادي ⚡'}
                  </span>
                </div>

                {/* Individual Heart Save Button */}
                <button
                  onClick={(e) => toggleHeart(e, ad)}
                  className="absolute top-4 left-4 z-[10] w-8 h-8 md:w-9 md:h-9 flex items-center justify-center rounded-full bg-[#131C31]/80 border border-white/10 backdrop-blur-md transition-all hover:scale-110 active:scale-90"
                >
                  <Heart
                    className={`w-4 h-4 transition-all duration-300 ${
                      isHearted
                        ? 'fill-[#00ffcc] text-[#00ffcc] drop-shadow-[0_0_6px_#00ffcc]'
                        : 'text-white'
                    }`}
                  />
                </button>

                {/* Text overlay & Zero-Click Direct Button */}
                <div className="relative z-[2] space-y-1.5 md:space-y-2 text-right">
                  <h3 className="text-xs md:text-sm font-black text-white group-hover:text-[#00ffcc] transition-colors line-clamp-1 leading-tight">
                    {ad.content?.title || ad.title}
                  </h3>
                  <p className="text-[9px] md:text-[10px] text-gray-300 line-clamp-2 leading-relaxed font-sans mt-1">
                    {ad.content?.description || ad.description}
                  </p>
                  <div className="pt-1.5 select-none">
                    <span className="inline-flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 bg-[#00ffcc] text-black text-[9px] md:text-[10px] font-black rounded-xl transition-all shadow-[0_0_10px_rgba(0,255,204,0.35)] group-hover:bg-[#00ffcc] group-hover:shadow-[0_0_18px_rgba(0,255,204,0.6)]">
                      <span>{ad.action?.buttonText || ad.buttonText || 'التفاصيل والاستحواذ 👑'}</span>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>

      {/* بوابة الاستحواذ المباشر الـ Bottom Sheet السيادي الفاخر */}
      <AnimatePresence>
        {takeoverAd && (
          <div 
            className="fixed inset-0 z-[100] flex flex-col justify-end items-center bg-black/85 backdrop-blur-sm p-0 md:p-4"
            onClick={() => setTakeoverAd(null)}
          >
            <motion.div
              initial={{ y: '100%', opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="relative w-full max-w-lg bg-[#070D19] border-t-2 border-x-0 md:border-x-2 border-[#00ffcc]/40 rounded-t-[32px] md:rounded-[32px] p-6 shadow-[0_-12px_45px_rgba(0,255,204,0.35)] flex flex-col gap-4"
              dir="rtl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Sovereign Top Drag Indicator Header */}
              <div className="w-12 h-1 bg-[#00ffcc]/30 rounded-full mx-auto mb-1" />

              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <span className="text-[#00ffcc] font-black text-xs flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#00ffcc] animate-pulse" />
                  <span>بوابة النبض السيادي والاستحواذ المباشر ✓</span>
                </span>
                <button
                  onClick={() => setTakeoverAd(null)}
                  className="text-red-500 bg-red-950/45 p-1.5 rounded-full hover:bg-red-500/20 border border-red-500/10 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="text-right space-y-1">
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full font-black border border-emerald-500/30">
                  إعلان سيادي مخلد 🟢
                </span>
                <h3 className="text-xl font-black text-white mt-2 leading-tight">
                  {takeoverAd.content?.title || takeoverAd.title}
                </h3>
                <p className="text-xs text-gray-300 leading-relaxed pt-1 font-sans">
                  {takeoverAd.content?.description || takeoverAd.description}
                </p>
              </div>

              <div className="flex flex-col gap-3 mt-1.5">
                {/* 1. "واتساب السيادي" لإرسال رسالة آلية بمحتوى الإعلان */}
                <a
                  href={`https://wa.me/${
                    takeoverAd.whatsapp || takeoverAd.advertiserData?.whatsapp || '962798888888'
                  }?text=${encodeURIComponent(
                    `السلام عليكم، أنا متصل من تطبيق رادار الركاب بخصوص إعلانكم: ${
                      takeoverAd.content?.title || takeoverAd.title
                    }`
                  )}`}
                  target="_blank"
                  onClick={(e) => e.stopPropagation()}
                  className="w-full flex items-center justify-center gap-2.5 bg-[#00cc66] hover:bg-[#00e271] text-white p-3.5 rounded-2xl text-xs font-black transition-all shadow-[0_4px_15px_rgba(0,204,102,0.25)] border border-[#00cc66]/50"
                >
                  <MessageCircle className="w-4 h-4 text-white" />
                  <span>واتساب مباشر (محادثة تلقائية)</span>
                </a>

                {/* 2. "اتصال مباشر" لربط الراكب فوراً برقم المعلن */}
                <a
                  href={`tel:${takeoverAd.phone || takeoverAd.advertiserData?.phone || '0798888888'}`}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full flex items-center justify-center gap-2.5 bg-[#131C31] border border-[#00ffcc]/35 text-[#00ffcc] p-3.5 rounded-2xl text-xs font-black hover:bg-[#00ffcc]/15 transition-all shadow-[0_4px_10px_rgba(0,0,0,0.3)]"
                >
                  <Phone className="w-4 h-4 text-[#00ffcc]" />
                  <span>اتصال هاتفي مباشر</span>
                </a>

                {/* 3. "خرائط جوجل" لربط الراكب بعنوان الموقع الجغرافي للمعلّم بنظام التوجيه */}
                <a
                  href={
                    takeoverAd.geoLoc ||
                    `https://maps.google.com/?q=${encodeURIComponent(
                      takeoverAd.content?.title || takeoverAd.title || 'الأردن'
                    )}`
                  }
                  target="_blank"
                  onClick={(e) => e.stopPropagation()}
                  className="w-full flex items-center justify-center gap-2.5 bg-[#1e40af] hover:bg-[#1d4ed8] text-white p-3.5 rounded-2xl text-xs font-black transition-all shadow-[0_4px_15px_rgba(30,64,175,0.25)] border border-[#1e40af]/50"
                >
                  <MapPin className="w-4 h-4 text-white animate-bounce-slow" />
                  <span>خرائط جوجل والمسار الجغرافي الميداني</span>
                </a>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
