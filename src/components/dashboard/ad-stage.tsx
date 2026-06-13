'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Heart, MessageCircle, Phone, X, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { usePromoStream } from '@/hooks/use-promo-stream';

export function AdStage() {
  const { user } = useAuth();
  const liveDistrict = user?.district || 'عمان';
  const { activeAds } = usePromoStream(liveDistrict, user?.governorate || 'عاصمة');

  const [currentIndex, setCurrentIndex] = useState(0);
  const [heartedAdIds, setHeartedAdIds] = useState<string[]>([]);
  const [takeoverAd, setTakeoverAd] = useState<any | null>(null);

  useEffect(() => {
    if (!activeAds || activeAds.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % activeAds.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeAds]);

  useEffect(() => {
    const stored = localStorage.getItem('sovereign_hearted_ads');
    if (stored) {
      try {
        setHeartedAdIds(JSON.parse(stored));
      } catch (e) {}
    }
  }, []);

  const currentAd = activeAds && activeAds.length > 0 ? activeAds[currentIndex] : null;

  const toggleHeart = (e: React.MouseEvent, ad: any) => {
    e.preventDefault();
    e.stopPropagation();

    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([50, 50, 50]);
    }

    const adId = ad.id;
    const alreadyHearted = heartedAdIds.includes(adId);

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
    } catch (e) {}
  };

  const openTakeover = (e: React.MouseEvent, ad: any) => {
    e.preventDefault();
    e.stopPropagation();
    setTakeoverAd(ad);
  };

  if (!currentAd) return <div className="relative w-full h-[300px] bg-[#0B1120] z-0" />;

  return (
    <div className="relative w-full h-[300px] z-[10] bg-[#0B1120] pointer-events-auto select-none" dir="rtl">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentAd.id}
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -100 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          className="absolute inset-0 w-full h-full cursor-pointer"
          onClick={(e) => openTakeover(e, currentAd)}
        >
          <img
            src={currentAd.content?.posterUrl || (currentAd as any).bannerUrl || 'https://via.placeholder.com/800x400'}
            alt={currentAd.title || 'إعلان سيادي'}
            onError={(e) => {
              e.currentTarget.src = 'https://images.unsplash.com/photo-1557821552-17105176677c?q=80&w=1000&auto=format&fit=crop';
            }}
            className="absolute inset-0 w-full h-full object-cover opacity-60"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1120] via-[#0B1120]/40 to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* 1. القلب السيادي: مصغر ومنقول إلى أعلى اليسار مع الخلفية النيلية */}
      <button
        onClick={(e) => toggleHeart(e, currentAd)}
        className="absolute top-6 left-6 z-[60] w-10 h-10 flex items-center justify-center rounded-full bg-[#131C31]/60 border border-white/10 backdrop-blur-md transition-all hover:scale-110 active:scale-90"
        style={{ pointerEvents: 'auto' }}
      >
        <Heart
          className={`w-5 h-5 transition-all duration-300 ${
            heartedAdIds.includes(currentAd.id)
              ? 'fill-[#00ffcc] text-[#00ffcc] drop-shadow-[0_0_8px_#00ffcc]'
              : 'text-white'
          }`}
        />
      </button>

      {/* 2. النصوص والزر الأخضر: مصغر ومتوسط في أسفل الشاشة */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-full px-6 z-[20] pointer-events-none flex flex-col items-center text-center">
        <h2 className="text-lg md:text-xl font-black text-white mb-1 drop-shadow-lg leading-tight">
          {currentAd.content?.title || currentAd.title}
        </h2>
        <p className="text-[11px] text-gray-300 mb-3 line-clamp-2 drop-shadow-md max-w-md">
          {currentAd.content?.description || currentAd.description}
        </p>

        <button
          onClick={(e) => openTakeover(e, currentAd)}
          className="px-6 py-2.5 bg-[#00ffcc] hover:bg-[#00ccaa] text-black text-xs font-black rounded-full pointer-events-auto transition-all active:scale-95 shadow-[0_0_15px_rgba(0,255,204,0.3)] border border-[#00ffcc]/50"
        >
          {currentAd.action?.buttonText || currentAd.buttonText || 'التفاصيل والطلب'}
        </button>
      </div>

      {/* بوابة الاستحواذ المباشر Zero-Click */}
      {takeoverAd && (
        <div 
          className="fixed inset-0 z-[100] flex flex-col justify-end items-center overflow-y-auto pointer-events-auto p-4 bg-black/80 backdrop-blur-sm"
          onClick={(e) => {
            e.stopPropagation();
            setTakeoverAd(null);
          }}
        >
          <div
            className="relative w-full max-w-2xl bg-[#0D1527] border border-[#00ffcc]/30 rounded-3xl p-6 shadow-[0_10px_40px_rgba(0,255,204,0.25)] flex flex-col gap-4 my-auto md:my-8"
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-white/5 pb-3">
              <span className="text-[#00ffcc] font-black text-xs flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> تواصل سيادي مباشر
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setTakeoverAd(null);
                }}
                className="text-red-500 bg-red-500/10 p-1.5 rounded-full hover:bg-red-500/20"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="text-right">
              <h3 className="text-lg font-bold text-white mb-1">
                {takeoverAd.content?.title || takeoverAd.title}
              </h3>
            </div>
            <div className="flex flex-col gap-2.5 mt-1">
              <a
                href={`https://wa.me/${
                  takeoverAd.whatsapp || takeoverAd.advertiserData?.whatsapp || '962790000000'
                }`}
                target="_blank"
                onClick={(e) => e.stopPropagation()}
                className="w-full flex items-center justify-center gap-2 bg-[#00cc66] text-white p-3 rounded-xl text-sm font-bold hover:opacity-90 transition-all"
              >
                <MessageCircle className="w-4 h-4" /> واتساب مباشر
              </a>
              <a
                href={`tel:${takeoverAd.phone || takeoverAd.advertiserData?.phone || '0790000000'}`}
                onClick={(e) => e.stopPropagation()}
                className="w-full flex items-center justify-center gap-2 bg-[#111] border border-[#00ffcc]/30 text-[#00ffcc] p-3 rounded-xl text-sm font-bold hover:bg-[#00ffcc]/10 transition-all"
              >
                <Phone className="w-4 h-4" /> اتصال هاتفي
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
