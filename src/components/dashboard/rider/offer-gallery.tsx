'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Star, ShieldCheck, Heart, Info, Loader2, X, Gift } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import type { Offer } from '@/core/types';
import { useAuth } from '@/hooks/use-auth';
import { usePromoStream } from '@/hooks/use-promo-stream';
import { RadarSovereignIntegrationKernel } from '@/core/logic/sovereign-market-kernel';

const getRankBadge = (rank: 'Platinum' | 'Gold' | 'Silver' | 'Bronze') => {
  switch (rank) {
    case 'Platinum':
      return { label: '💎 بلاتيني', className: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' };
    case 'Gold':
      return { label: '🥇 ذهبي', className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' };
    case 'Silver':
      return { label: '🥈 فضي', className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
    case 'Bronze':
    default:
      return { label: '🥉 برونزي', className: 'bg-orange-500/10 text-orange-400 border-orange-500/20' };
  }
};

const OfferCard = ({
  offer,
  isFavorite,
  onSelect,
  onInfo,
  isSelecting,
}: {
  offer: Offer;
  isFavorite: boolean;
  onSelect: (offer: Offer) => void;
  onInfo: (vehicle: any) => void;
  isSelecting: boolean;
}) => {
  const { user } = useAuth();
  const { activeAds } = usePromoStream(user?.district || 'وادي السير', user?.governorate || 'عمان');
  
  // Apply our RadarSovereignIntegrationKernel trigger
  const benefitAd = React.useMemo(() => {
    const isPriceBurned = offer.isDumping || offer.driverRank === 'Silver' || offer.driverRank === 'Bronze';
    if (!isPriceBurned) return null;
    
    // Convert to AdSovereignPass format
    const passAds = activeAds.map(ad => ({
      adId: ad.id,
      targetScale: ad.targetDistrict ? 'District' : 'Governorate' as any,
      targetLocationName: ad.targetDistrict || ad.targetGovernorate || 'وادي السير',
      adType: ad.adType as any,
      bannerUrl: ad.content?.posterUrl || ''
    })).filter(ad => ad.adType === 'RIDER_BENEFIT');
    
    // Fallback if none found
    if (passAds.length === 0) {
      return {
        adId: 'promo-rider-benefit-default',
        title: '🎁 كوبون المنفعة والتعويض للركاب الأحرار',
        description: 'بسبب حرق الأسعار، تفضّل بخصم 50% على غسيل سيارتك أو كوبون مطعم مجاني في اللواء فوراً!',
        actionUrl: 'https://wa.me/962790000000',
        buttonText: 'احصل على الكوبون السيادي'
      };
    }
    
    const matchedPass = RadarSovereignIntegrationKernel.triggerContextualAdStream(
      0.12, // deviation ratio >= 10%
      { role: 'rider', district: user?.district || 'وادي السير', governorate: user?.governorate || 'عمان' },
      passAds as any
    );
    
    if (matchedPass) {
      const realAd = activeAds.find(ad => ad.id === matchedPass.adId);
      return {
        adId: matchedPass.adId,
        title: realAd?.content?.title || '🎁 كوبون المنفعة والتعويض',
        description: realAd?.content?.description || 'كوبون مجاني تقديري للركاب الأحرار للتواصل السريع.',
        actionUrl: realAd?.action?.actionUrl || realAd?.actionUrl || 'https://wa.me/962790000000',
        buttonText: realAd?.action?.buttonText || realAd?.buttonText || 'احصل عليه الآن'
      };
    }
    
    return null;
  }, [offer.isDumping, offer.driverRank, activeAds, user]);

  return (
    <Card className={`bg-muted/30 border-border hover:border-primary transition-all ${offer.isDumping ? 'border-primary/40 relative animate-pulse-slow' : ''}`}>
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-3">
          <Avatar className="w-12 h-12 border-2 border-border">
            <AvatarFallback>{offer.driverName.substring(0, 2)}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-bold text-white">{offer.driverName}</h4>
              {isFavorite && <Heart className="w-4 h-4 text-red-500 fill-current" />}
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-400 fill-current" />
                <span className="font-bold text-white">{offer.driverRating.toFixed(1)}</span>
              </div>
              <Separator orientation="vertical" className="h-3" />
              <span>{offer.driverAffiliation?.name || 'مستقل'}</span>
              {offer.driverRank && (
                <>
                  <Separator orientation="vertical" className="h-3" />
                  <Badge variant="outline" className={`text-[10px] py-0 px-2 font-black ${getRankBadge(offer.driverRank).className}`}>
                    {getRankBadge(offer.driverRank).label}
                  </Badge>
                </>
              )}
            </div>
          </div>
          <div className="text-left">
            <p className="text-xs text-muted-foreground">السعر المعروض</p>
            {offer.price === -1 ? (
                 <Badge variant="secondary" className="text-sm bg-yellow-400/10 text-yellow-300">حسب العداد</Badge>
            ) : (
                <p className="text-xl font-black text-primary">{offer.price.toFixed(2)} <span className="text-xs">د.أ</span></p>
            )}
          </div>
        </div>

        {(offer.isDumping || offer.driverRank === 'Silver' || offer.driverRank === 'Bronze') && (
          <div className="space-y-2">
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-2 rounded-md text-[11px] font-bold text-center">
              ⚠️ السعر المحروق: هذا السعر أقل بكثير من متوسط السوق؛ قد يؤثر ذلك على جودة الخدمة أو حالة المركبة
            </div>
            
            {/* [المادة 3] إعلان المنفعة والتعويض للراكب */}
            {benefitAd && (
              <div className="p-3 bg-emerald-950/45 border border-emerald-500/30 rounded-lg text-right font-sans text-xs space-y-2 shadow-md hover:border-emerald-500/50 transition-all">
                <div className="flex items-center gap-1.5 justify-start text-emerald-400 font-black">
                  <span className="animate-bounce">🎁</span>
                  <span>{benefitAd.title}</span>
                </div>
                <p className="text-gray-300 leading-relaxed font-semibold text-[11px]">
                  {benefitAd.description}
                </p>
                <div className="pt-1">
                  <Button 
                    variant="outline"
                    size="sm" 
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(benefitAd.actionUrl, '_blank');
                    }}
                    className="w-full h-8 bg-emerald-600 hover:bg-emerald-500 hover:text-white border-none text-white text-[10px] font-bold flex items-center justify-center gap-1 select-none"
                  >
                    <Gift className="w-3.5 h-3.5" />
                    <span>{benefitAd.buttonText} ($Zero-Click ROI)</span>
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground bg-black/20 p-2 rounded-md">
            <span>{offer.driverVehicle.make} {offer.driverVehicle.color} - {offer.driverVehicle.year}</span>
            <Button variant="ghost" size="sm" className="h-auto p-1 text-xs" onClick={() => onInfo(offer.driverVehicle)}>
                <Info className="w-3 h-3 ml-1" />
                ملف المركبة
            </Button>
        </div>
        <Button 
            onClick={() => onSelect(offer)} 
            disabled={isSelecting}
            className="w-full h-12 bg-primary hover:bg-primary/90 font-bold"
        >
          {isSelecting ? <Loader2 className="animate-spin" /> : 'اختر هذا العرض واقبل'}
        </Button>
      </CardContent>
    </Card>
  );
};

export function OfferGallery({
  offers,
  favoriteIds,
  onSelect,
  onCancel,
  onInfo,
  isSelecting,
  isCancelling,
}: {
  offers: Offer[];
  favoriteIds: string[];
  onSelect: (offer: Offer) => void;
  onCancel: () => void;
  onInfo: (vehicle: any) => void;
  isSelecting: boolean;
  isCancelling: boolean;
}) {

  const sortedOffers = React.useMemo(() => {
    return [...offers].sort((a, b) => {
      // 1. Favorites priority
      const aIsFav = favoriteIds.includes(a.driverId);
      const bIsFav = favoriteIds.includes(b.driverId);
      if (aIsFav && !bIsFav) return -1;
      if (!aIsFav && bIsFav) return 1;

      // 2. Dumping vs non-dumping priority (basic_9 vs reserve_3)
      const aIsReserve = a.displayTarget === 'reserve_3' || a.isDumping;
      const bIsReserve = b.displayTarget === 'reserve_3' || b.isDumping;
      if (!aIsReserve && bIsReserve) return -1;
      if (aIsReserve && !bIsReserve) return 1;

      // 3. Rank priority (Platinum > Gold > Silver > Bronze)
      const rankPriority: Record<string, number> = { Platinum: 4, Gold: 3, Silver: 2, Bronze: 1 };
      const aPriority = rankPriority[a.driverRank || 'Gold'] || 3;
      const bPriority = rankPriority[b.driverRank || 'Gold'] || 3;
      if (aPriority !== bPriority) return bPriority - aPriority;

      // 4. Official Counter Rate priority placement
      if (a.price === -1) return 1;
      if (b.price === -1) return -1;

      // 5. Default by ascending price
      return a.price - b.price;
    }).slice(0, 9);
  }, [offers, favoriteIds]);

  return (
    <div className="flex items-center justify-center p-4 min-h-screen animate-in fade-in">
      <Card className="w-full max-w-md bg-card border-border shadow-2xl">
        <div className="p-4 border-b border-border text-center">
            <h2 className="text-xl font-bold text-white flex items-center justify-center gap-2">
                <ShieldCheck className="w-6 h-6 text-primary" />
                صالة المزاد الميداني
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
                {offers.length} كباتن في نطاقك قدموا عروضهم.
            </p>
        </div>
        <ScrollArea className="h-[60vh]">
            <div className="p-4 space-y-4">
            {sortedOffers.map((offer) => (
                <OfferCard
                key={offer.driverId}
                offer={offer}
                isFavorite={favoriteIds.includes(offer.driverId)}
                onSelect={onSelect}
                onInfo={onInfo}
                isSelecting={isSelecting}
                />
            ))}
            </div>
        </ScrollArea>
        <div className="p-4 border-t border-border">
          <Button
            variant="destructive"
            className="w-full"
            onClick={onCancel}
            disabled={isCancelling}
          >
            {isCancelling ? <Loader2 className="animate-spin" /> : <><X className="ml-2" /> إلغاء الطلب بالكامل</>}
          </Button>
        </div>
      </Card>
    </div>
  );
}
