'use client';

import React, { useMemo, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { handleAdAction } from '@/lib/utils';

export function PromoCarousel() {
  const { user, promoData } = useAuth();
  const autoplayPlugin = useRef(Autoplay({ delay: 5000, stopOnInteraction: true }));
  
  const adList = useMemo(() => {
    if (!promoData || !user) return [];
    const ads = user.role === 'driver' ? promoData.driverAds : promoData.riderAds;
    return Array.isArray(ads) ? ads : [];
  }, [user, promoData]);

  if (adList.length === 0) return null;

  return (
    <Carousel
      opts={{ loop: adList.length > 1 }}
      plugins={[autoplayPlugin.current]}
      onMouseEnter={() => autoplayPlugin.current.stop()}
      onMouseLeave={() => autoplayPlugin.current.play()}
      className="w-full"
    >
      <CarouselContent>
        {adList.map((ad, index) => (
          <CarouselItem key={index}>
            <Card className="w-full bg-gradient-to-br from-[#091B09] to-[#050D05] border border-emerald-500/30 shadow-[0_0_20px_rgba(16,185,129,0.1)] overflow-hidden relative">
              <div className="relative aspect-video">
                <img 
                  src={ad.imageUrl || 'https://picsum.photos/seed/placeholder/800/600'} 
                  alt={ad.title || 'Sovereign Ad'} 
                  className="w-full h-full object-cover absolute inset-0"
                  data-ai-hint={ad.imageHint || "advertisement marketing"}
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"></div>
              </div>
              <CardContent className="p-6 text-center space-y-3">
                <h3 className="text-lg font-black text-[#F3EAC2]">{ad.title}</h3>
                <p className="text-sm text-gray-300 leading-relaxed min-h-[40px]">
                  {ad.description}
                </p>
                <Button 
                  onClick={() => handleAdAction(ad.actionUrl)}
                  disabled={!ad.actionUrl}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-12 rounded-xl shadow-lg mt-2 transition-all disabled:bg-gray-500 disabled:cursor-not-allowed"
                >
                  {ad.buttonText}
                </Button>
              </CardContent>
            </Card>
          </CarouselItem>
        ))}
      </CarouselContent>
      {adList.length > 1 && <>
        <CarouselPrevious className="left-2" />
        <CarouselNext className="right-2" />
      </>}
    </Carousel>
  );
}
