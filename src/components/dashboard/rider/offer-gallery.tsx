'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Star, ShieldCheck, Heart, Info, Loader2, X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import type { Offer } from '@/core/types';

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
  return (
    <Card className={`bg-muted/30 border-border hover:border-primary transition-all ${offer.isDumping ? 'border-red-900/40 relative' : ''}`}>
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
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-2 rounded-md text-xs font-bold text-center animate-pulse">
            ⚠️ السعر المحروق: هذا السعر أقل بكثير من متوسط السوق؛ قد يؤثر ذلك على جودة الخدمة أو حالة المركبة
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
