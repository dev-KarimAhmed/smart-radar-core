'use client';

import React from 'react';
import { motion } from 'motion/react';

interface AdvertiserMarqueeProps {
  ads: any[];
}

export function AdvertiserMarquee({ ads }: AdvertiserMarqueeProps) {
  const stream = ads.length > 0 ? ads : [
    { id: 'v1', title: 'عروض المطاعم السياحية', description: 'خصومات حصرية لكباتن الرادار في عمان' },
    { id: 'v2', title: 'خدمات الصيانة السريعة', description: 'فحص ميكانيكي وغيار زيت فوري بخصم 25%' },
    { id: 'v3', title: 'بطاقات الوقود الذكية', description: 'توفير فوري على كل تعبئة وقود' },
  ];

  return (
    <div className="w-full overflow-hidden py-3 bg-black/60 rounded-2xl border border-white/5 relative" dir="ltr">
      <div className="absolute top-2.5 right-3.5 z-10 flex items-center gap-1.5 pointer-events-none" dir="rtl">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest font-mono">
          بث حي مباشر
        </span>
      </div>

      <div className="w-full flex items-center overflow-hidden pt-4">
        <motion.div
          className="flex gap-3 pl-4"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ repeat: Infinity, duration: 25, ease: 'linear' }}
        >
          {[...stream, ...stream].map((ad, idx) => {
            const title = ad.title || ad.content?.title || '';
            const description = ad.description || ad.desc || ad.content?.description || '';

            return (
              <div
                key={`${ad.id}-${idx}`}
                className="w-60 shrink-0 h-24 rounded-xl border border-white/10 p-3 flex flex-col justify-end bg-gradient-to-br from-emerald-950/40 to-black relative shadow-lg"
                dir="rtl"
              >
                <div className="absolute top-2 right-2">
                  <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full uppercase bg-emerald-950/80 text-[#14F5D5] border border-emerald-500/30">
                    رعاية
                  </span>
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-white font-black text-xs leading-tight line-clamp-1">{title}</h4>
                  <p className="text-slate-400 text-[10px] leading-snug line-clamp-2">{description}</p>
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
