'use client';

import React from 'react';
import { Sparkles, Radio } from 'lucide-react';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';

interface MarqueeItem {
  id: string;
  title: string;
  description: string;
}

interface AdvertiserMarqueeProps {
  items?: MarqueeItem[];
  ads?: any[];
}

const defaultItemsAr: MarqueeItem[] = [
  { id: 'v1', title: 'عروض المطاعم السياحية', description: 'خصومات حصرية لكباتن الرادار في عمان' },
  { id: 'v2', title: 'خدمات الصيانة السريعة', description: 'فحص ميكانيكي وغيار زيت فوري بخصم 25%' },
  { id: 'v3', title: 'بطاقات الوقود الذكية', description: 'توفير فوري على كل تعبئة وقود' },
];

const defaultItemsEn: MarqueeItem[] = [
  { id: 'v1', title: 'Dining & Hospitality Deals', description: 'Exclusive discounts for radar captains in Amman' },
  { id: 'v2', title: 'Express Vehicle Care', description: 'Mechanical checkup & fast oil change at 25% off' },
  { id: 'v3', title: 'Smart Fuel Rewards', description: 'Instant savings on every fuel refill' },
];

export function AdvertiserMarquee({ items, ads }: AdvertiserMarqueeProps) {
  const { isArabic, direction } = useDashboardLanguage();
  const mappedAds: MarqueeItem[] | undefined = ads?.map((ad: any) => ({
    id: String(ad.id),
    title: ad.content?.title || ad.title || (isArabic ? 'إعلان رعاية' : 'Sponsored Ad'),
    description: ad.content?.description || ad.description || '',
  }));
  const displayItems = items && items.length > 0
    ? items
    : mappedAds && mappedAds.length > 0
    ? mappedAds
    : (isArabic ? defaultItemsAr : defaultItemsEn);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-black/60 p-2.5 backdrop-blur-md" dir={direction}>
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1.5 shrink-0 px-2.5 py-1 rounded-xl bg-[#14F5D5]/10 border border-[#14F5D5]/30 text-[#14F5D5] text-xs font-black">
          <Radio className="h-3.5 w-3.5 animate-pulse" />
          <span>{isArabic ? 'بث حي مباشر' : 'Live Radar'}</span>
        </div>

        <div className="flex-1 overflow-hidden relative">
          <div className="flex items-center gap-8 animate-marquee whitespace-nowrap">
            {displayItems.concat(displayItems).map((it, idx) => (
              <div key={`${it.id}-${idx}`} className="inline-flex items-center gap-2 text-xs">
                <span className="font-bold text-white">{it.title}:</span>
                <span className="text-slate-400">{it.description}</span>
                <span className="text-emerald-400 font-mono text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                  {isArabic ? 'رعاية' : 'Sponsored'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
