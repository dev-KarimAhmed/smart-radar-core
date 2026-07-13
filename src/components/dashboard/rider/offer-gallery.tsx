'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Heart, Info, Loader2, ShieldCheck, Star, X, Clock, Navigation, MapPin } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { RadarSovereignIntegrationKernel } from '@/core/logic/sovereign-market-kernel';
import type { Offer } from '@/core/types';
import { useAuth } from '@/hooks/use-auth';
import { usePromoStream } from '@/hooks/use-promo-stream';
import { AdDisplayCard } from '../ad-display-card';

const getRankBadge = (rank: 'Platinum' | 'Gold' | 'Silver' | 'Bronze') => {
  switch (rank) {
    case 'Platinum':
      return { labelKey: 'rankPlatinum', className: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' };
    case 'Gold':
      return { labelKey: 'rankGold', className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' };
    case 'Silver':
      return { labelKey: 'rankSilver', className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
    case 'Bronze':
    default:
      return { labelKey: 'rankBronze', className: 'bg-orange-500/10 text-orange-400 border-orange-500/20' };
  }
};

const getBenefitAdImage = 'https://images.unsplash.com/photo-1556741533-6e6a62bd8b49?auto=format&fit=crop&q=80&w=1200';

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
  const t = useTranslations('offerGallery');
  const { activeAds } = usePromoStream(user?.district || 'وادي السير', user?.governorate || 'عمان');

  const benefitAd = React.useMemo(() => {
    const isPriceBurned = offer.isDumping || offer.driverRank === 'Silver' || offer.driverRank === 'Bronze';
    if (!isPriceBurned) return null;

    const passAds = activeAds
      .map((ad) => ({
        adId: ad.id,
        targetScale: ad.targetDistrict ? 'District' : ('Governorate' as any),
        targetLocationName: ad.targetDistrict || ad.targetGovernorate || 'وادي السير',
        adType: ad.adType as any,
        bannerUrl: ad.content?.posterUrl || ad.posterUrl || (ad as any).bannerUrl || '',
      }))
      .filter((ad) => ad.adType === 'RIDER_BENEFIT');

    if (passAds.length === 0) {
      return {
        adId: 'promo-rider-benefit-default',
        title: t('benefitDefaultTitle'),
        description: t('benefitDefaultDescription'),
        actionUrl: 'https://wa.me/962790000000',
        buttonText: t('benefitCta'),
        bannerUrl: getBenefitAdImage,
        posterUrl: getBenefitAdImage,
      };
    }

    const matchedPass = RadarSovereignIntegrationKernel.triggerContextualAdStream(
      0.12,
      { role: 'rider', district: user?.district || 'وادي السير', governorate: user?.governorate || 'عمان' },
      passAds as any
    );

    if (!matchedPass) return null;

    const realAd = activeAds.find((ad) => ad.id === matchedPass.adId);
    const image = realAd?.content?.posterUrl || realAd?.posterUrl || (realAd as any)?.bannerUrl || getBenefitAdImage;

    return {
      adId: matchedPass.adId,
      id: matchedPass.adId,
      title: realAd?.content?.title || t('benefitDefaultTitle'),
      description: realAd?.content?.description || t('benefitDefaultDescriptionShort'),
      actionUrl: realAd?.action?.actionUrl || realAd?.actionUrl || 'https://wa.me/962790000000',
      buttonText: realAd?.action?.buttonText || realAd?.buttonText || t('benefitCta'),
      bannerUrl: image,
      posterUrl: image,
    };
  }, [offer.isDumping, offer.driverRank, activeAds, user, t]);

  return (
    <Card className={`bg-muted/30 border-border transition-all hover:border-primary ${offer.isDumping ? 'relative border-primary/40 animate-pulse-slow' : ''}`}>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border-2 border-border">
            <AvatarFallback>{offer.driverName.substring(0, 2)}</AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-bold text-white">{offer.driverName}</h4>
              {isFavorite && <Heart className="h-4 w-4 fill-current text-red-500" />}
              {(() => {
                const tier = (offer.tier || 'SILVER').toUpperCase();
                switch (tier) {
                  case 'BRONZE':
                    return (
                      <span className="rounded-full border border-amber-600/30 bg-amber-900/20 px-2 py-0.5 text-[10px] font-black text-amber-600 backdrop-blur-md">
                        {t('rankBronze')}
                      </span>
                    );
                  case 'GOLD':
                    return (
                      <span className="animate-pulse rounded-full border border-yellow-400/40 bg-yellow-900/30 px-2 py-0.5 text-[10px] font-black text-yellow-400 backdrop-blur-md">
                        {t('rankGold')}
                      </span>
                    );
                  case 'PLATINUM':
                    return (
                      <span className="animate-bounce-slow rounded-full border border-radar-teal/40 bg-teal-950/40 px-2 py-0.5 text-[10px] font-black tracking-wide text-radar-teal backdrop-blur-md">
                        {t('rankPlatinumBadge')}
                      </span>
                    );
                  case 'SILVER':
                  default:
                    return (
                      <span className="rounded-full border border-slate-400/30 bg-slate-800/20 px-2 py-0.5 text-[10px] font-black text-slate-400 backdrop-blur-md">
                        {t('rankSilver')}
                      </span>
                    );
                }
              })()}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-current text-yellow-400" />
                <span className="font-bold text-white">{offer.driverRating.toFixed(1)}</span>
              </div>
              <Separator orientation="vertical" className="h-3" />
              <span>{offer.driverAffiliation?.name || t('independent')}</span>
              {offer.driverRank && (
                <>
                  <Separator orientation="vertical" className="h-3" />
                  <Badge variant="outline" className={`px-2 py-0 text-[10px] font-black ${getRankBadge(offer.driverRank).className}`}>
                    {t(getRankBadge(offer.driverRank).labelKey)}
                  </Badge>
                </>
              )}
            </div>
          </div>

          <div className="text-left">
            <p className="text-xs text-muted-foreground">{t('offeredPrice')}</p>
            {offer.price === -1 ? (
              <Badge variant="secondary" className="bg-yellow-400/10 text-sm text-yellow-300">
                {t('byMeter')}
              </Badge>
            ) : (
              <p className="text-xl font-black text-primary">
                {offer.price.toFixed(2)} <span className="text-xs">{t('currency')}</span>
              </p>
            )}
          </div>
        </div>

        {/* TASK 1: Distance and Pickup ETA */}
        <div className="grid grid-cols-2 gap-3 bg-white/5 rounded-xl p-3 border border-white/5">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-slate-400" />
            <span className="text-slate-400 text-xs">
              {t('distanceFromYou', { km: offer.distance_to_rider ? offer.distance_to_rider.toFixed(1) : '---' })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-radar-teal animate-pulse" />
            <span className="text-radar-teal font-bold text-xs">
              {t('arrivesIn', { minutes: offer.pickup_eta_minutes ?? Math.max(3, Math.round((offer.distance_to_rider || 1) * 3)) })}
            </span>
          </div>
        </div>

        {(offer.isDumping || offer.driverRank === 'Silver' || offer.driverRank === 'Bronze') && (
          <div className="space-y-2">
            <div className="rounded-md border border-red-500/20 bg-red-500/10 p-2 text-center text-[11px] font-bold text-red-400">
              {t('lowPriceWarning')}
            </div>

            {benefitAd && (
              <AdDisplayCard
                ad={benefitAd}
                showHeart={false}
                badgeText={t('benefitBadge')}
                ctaText={benefitAd.buttonText}
                className="h-[230px] rounded-3xl"
                onOpen={(event) => {
                  event.stopPropagation();
                  window.open(benefitAd.actionUrl, '_blank');
                }}
              />
            )}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 rounded-md bg-black/20 p-2 text-xs text-muted-foreground">
          <span>
            {offer.driverVehicle.make} {offer.driverVehicle.color} - {offer.driverVehicle.year}
          </span>
          <Button variant="ghost" size="sm" className="h-auto p-1 text-xs" onClick={() => onInfo(offer.driverVehicle)}>
            <Info className="ml-1 h-3 w-3" />
            {t('vehicleProfile')}
          </Button>
        </div>

        {/* TASK 2: Estimated Trip Duration */}
        {offer.estimated_duration_minutes && (
          <div className="bg-teal-500/10 border border-teal-500/20 rounded-xl p-2.5 flex items-center justify-between">
            <span className="text-slate-400 text-xs">{t('estimatedDuration')}</span>
            <div className="flex items-center gap-1.5">
              <span className="text-white font-bold text-sm">{t('durationMinutes', { minutes: offer.estimated_duration_minutes })}</span>
              <Navigation className="h-3.5 w-3.5 text-white" />
            </div>
          </div>
        )}

        <Button onClick={() => onSelect(offer)} disabled={isSelecting} className="h-12 w-full bg-primary font-bold hover:bg-primary/90">
          {isSelecting ? <Loader2 className="animate-spin" /> : t('selectOffer')}
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
  const t = useTranslations('offerGallery');
  const sortedOffers = React.useMemo(() => {
    return [...offers]
      .sort((a, b) => {
        const aIsFav = favoriteIds.includes(a.driverId);
        const bIsFav = favoriteIds.includes(b.driverId);
        if (aIsFav && !bIsFav) return -1;
        if (!aIsFav && bIsFav) return 1;

        const aIsReserve = a.displayTarget === 'reserve_3' || a.isDumping;
        const bIsReserve = b.displayTarget === 'reserve_3' || b.isDumping;
        if (!aIsReserve && bIsReserve) return -1;
        if (aIsReserve && !bIsReserve) return 1;

        const rankPriority: Record<string, number> = { Platinum: 4, Gold: 3, Silver: 2, Bronze: 1 };
        const aPriority = rankPriority[a.driverRank || 'Gold'] || 3;
        const bPriority = rankPriority[b.driverRank || 'Gold'] || 3;
        if (aPriority !== bPriority) return bPriority - aPriority;

        if (a.price === -1) return 1;
        if (b.price === -1) return -1;

        return a.price - b.price;
      })
      .slice(0, 9);
  }, [offers, favoriteIds]);

  return (
    <div className="flex min-h-screen animate-in items-center justify-center p-4 fade-in">
      <Card className="w-full max-w-md border-border bg-card shadow-2xl">
        <div className="border-b border-border p-4 text-center">
          <h2 className="flex items-center justify-center gap-2 text-xl font-bold text-white">
            <ShieldCheck className="h-6 w-6 text-primary" />
            {t('title')}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t('subtitle', { count: offers.length })}
          </p>
        </div>

        <ScrollArea className="h-[60vh]">
          <div className="space-y-4 p-4">
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

        <div className="border-t border-border p-4">
          <Button variant="destructive" className="w-full" onClick={onCancel} disabled={isCancelling}>
            {isCancelling ? <Loader2 className="animate-spin" /> : (
              <>
                <X className="ml-2" />
                {t('cancelRequest')}
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
