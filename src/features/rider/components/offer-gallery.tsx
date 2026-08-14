'use client';

import React from 'react';
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
import { AdDisplayCard } from '@/features/ads/ad-display/contract';

import { cn } from '@/lib/utils';
const styles = {
  style99_1: "bg-muted/30 border-border transition-all hover:border-primary",
  style99_2: "relative border-primary/40 animate-pulse-slow",
  style100_3: "space-y-3 p-4",
  style101_4: "flex items-center gap-3",
  style102_5: "h-12 w-12 border-2 border-border",
  style106_6: "min-w-0 flex-1",
  style107_7: "flex flex-wrap items-center gap-2",
  style108_8: "font-bold text-white",
  style110_9: "inline-flex items-center gap-1 rounded-full border border-emerald-300/40 bg-emerald-400/12 px-2 py-0.5 text-[10px] font-black text-emerald-300 shadow-[0_0_18px_rgba(52,211,153,0.18)]",
  style111_10: "h-3.5 w-3.5 fill-emerald-300 text-emerald-300",
  style120_11: "rounded-full border border-amber-600/30 bg-amber-900/20 px-2 py-0.5 text-[10px] font-black text-amber-600 backdrop-blur-md",
  style126_12: "animate-pulse rounded-full border border-yellow-400/40 bg-yellow-900/30 px-2 py-0.5 text-[10px] font-black text-yellow-400 backdrop-blur-md",
  style132_13: "animate-bounce-slow rounded-full border border-[#14B8A6]/40 bg-teal-950/40 px-2 py-0.5 text-[10px] font-black tracking-wide text-[#14B8A6] backdrop-blur-md",
  style139_14: "rounded-full border border-slate-400/30 bg-slate-800/20 px-2 py-0.5 text-[10px] font-black text-slate-400 backdrop-blur-md",
  style147_15: "flex flex-wrap items-center gap-2 text-xs text-muted-foreground",
  style148_16: "flex items-center gap-1",
  style149_17: "h-3 w-3 fill-current text-yellow-400",
  style150_18: "font-bold text-white",
  style152_19: "h-3",
  style156_20: "h-3",
  style157_21: "px-2 py-0 text-[10px] font-black",
  style165_22: "text-left",
  style166_23: "text-xs text-muted-foreground",
  style168_24: "bg-yellow-400/10 text-sm text-yellow-300",
  style172_25: "text-xl font-black text-primary",
  style173_26: "text-xs",
  style180_27: "grid grid-cols-2 gap-3 bg-white/5 rounded-xl p-3 border border-white/5",
  style181_28: "flex items-center gap-2",
  style182_29: "h-4 w-4 text-slate-400",
  style183_30: "text-slate-400 text-xs",
  style187_31: "flex items-center gap-2",
  style188_32: "h-4 w-4 text-[#14B8A6] animate-pulse",
  style189_33: "text-[#14B8A6] font-bold text-xs",
  style196_34: "space-y-2",
  style197_35: "rounded-md border border-red-500/20 bg-red-500/10 p-2 text-center text-[11px] font-bold text-red-400",
  style207_36: "h-[230px] rounded-3xl",
  style217_37: "flex items-center justify-between gap-2 rounded-md bg-black/20 p-2 text-xs text-muted-foreground",
  style221_38: "h-auto p-1 text-xs",
  style222_39: "ml-1 h-3 w-3",
  style229_40: "bg-teal-500/10 border border-teal-500/20 rounded-xl p-2.5 flex items-center justify-between",
  style230_41: "text-slate-400 text-xs",
  style231_42: "flex items-center gap-1.5",
  style232_43: "text-white font-bold text-sm",
  style233_44: "h-3.5 w-3.5 text-white",
  style238_45: "h-12 w-full bg-primary font-bold hover:bg-primary/90",
  style239_46: "animate-spin",
  style285_47: "flex min-h-screen animate-in items-center justify-center p-4 fade-in",
  style286_48: "w-full max-w-md border-border bg-card shadow-2xl",
  style287_49: "border-b border-border p-4 text-center",
  style288_50: "flex items-center justify-center gap-2 text-xl font-bold text-white",
  style289_51: "h-6 w-6 text-primary",
  style292_52: "mt-1 text-sm text-muted-foreground",
  style297_53: "h-[60vh]",
  style298_54: "space-y-4 p-4",
  style312_55: "border-t border-border p-4",
  style313_56: "w-full",
  style314_57: "animate-spin",
  style316_58: "ml-2",
} as const;


const getRankBadge = (rank: 'Platinum' | 'Gold' | 'Silver' | 'Bronze') => {
  switch (rank) {
    case 'Platinum':
      return { label: 'بلاتيني', className: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' };
    case 'Gold':
      return { label: 'ذهبي', className: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' };
    case 'Silver':
      return { label: 'فضي', className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' };
    case 'Bronze':
    default:
      return { label: 'برونزي', className: 'bg-orange-500/10 text-orange-400 border-orange-500/20' };
  }
};

const getBenefitAdImage = 'https://images.unsplash.com/photo-1556741533-6e6a62bd8b49?auto=format&fit=crop&q=80&w=1200';

const OfferCard = ({
  offer,
  isFavorite,
  onSelect,
  onInfo,
  isSelecting,
  referencePrice,
}: {
  offer: Offer;
  isFavorite: boolean;
  onSelect: (offer: Offer) => void;
  onInfo: (vehicle: any) => void;
  isSelecting: boolean;
  referencePrice: number;
}) => {
  const { user } = useAuth();
  const { activeAds } = usePromoStream(user?.district || 'وادي السير', user?.governorate || 'عمان');

  // Real per-offer deviation against the average of all offers received for
  // this request — replaces the old `offer.isDumping` flag, which was never
  // actually computed anywhere and always undefined.
  const deviationRatio = referencePrice > 0 && offer.price > 0
    ? Math.max(0, (referencePrice - offer.price) / referencePrice)
    : 0;
  const isPriceBurned = deviationRatio >= 0.10;

  const benefitAd = React.useMemo(() => {
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
        title: 'عرض منفعة للراكب',
        description: 'عرض محلي بسيط يساعدك بعد اختيار عرض منخفض السعر.',
        actionUrl: 'https://wa.me/962790000000',
        buttonText: 'احصل على العرض',
        bannerUrl: getBenefitAdImage,
        posterUrl: getBenefitAdImage,
      };
    }

    const matchedPass = RadarSovereignIntegrationKernel.triggerContextualAdStream(
      deviationRatio,
      { role: 'rider', district: user?.district || 'وادي السير', governorate: user?.governorate || 'عمان' },
      passAds as any
    );

    if (!matchedPass) return null;

    const realAd = activeAds.find((ad) => ad.id === matchedPass.adId);
    const image = realAd?.content?.posterUrl || realAd?.posterUrl || (realAd as any)?.bannerUrl || getBenefitAdImage;

    return {
      adId: matchedPass.adId,
      id: matchedPass.adId,
      title: realAd?.content?.title || 'عرض منفعة للراكب',
      description: realAd?.content?.description || 'عرض محلي سريع للتواصل المباشر.',
      actionUrl: realAd?.action?.actionUrl || realAd?.actionUrl || 'https://wa.me/962790000000',
      buttonText: realAd?.action?.buttonText || realAd?.buttonText || 'احصل على العرض',
      bannerUrl: image,
      posterUrl: image,
    };
  }, [isPriceBurned, deviationRatio, activeAds, user]);

  return (
    <Card className={cn(styles.style99_1, isPriceBurned ? styles.style99_2 : '')}>
      <CardContent className={styles.style100_3}>
        <div className={styles.style101_4}>
          <Avatar className={styles.style102_5}>
            <AvatarFallback>{offer.driverName.substring(0, 2)}</AvatarFallback>
          </Avatar>

          <div className={styles.style106_6}>
            <div className={styles.style107_7}>
              <h4 className={styles.style108_8}>{offer.driverName}</h4>
              {isFavorite && (
                <span className={styles.style110_9}>
                  <Heart className={styles.style111_10} />
                  Preferred Captain
                </span>
              )}
              {(() => {
                const tier = (offer.tier || 'SILVER').toUpperCase();
                switch (tier) {
                  case 'BRONZE':
                    return (
                      <span className={styles.style120_11}>
                        برونزي
                      </span>
                    );
                  case 'GOLD':
                    return (
                      <span className={styles.style126_12}>
                        ذهبي
                      </span>
                    );
                  case 'PLATINUM':
                    return (
                      <span className={styles.style132_13}>
                        بلاتينيوم
                      </span>
                    );
                  case 'SILVER':
                  default:
                    return (
                      <span className={styles.style139_14}>
                        فضي
                      </span>
                    );
                }
              })()}
            </div>

            <div className={styles.style147_15}>
              <div className={styles.style148_16}>
                <Star className={styles.style149_17} />
                <span className={styles.style150_18}>{offer.driverRating.toFixed(1)}</span>
              </div>
              <Separator orientation="vertical" className={styles.style152_19} />
              <span>{offer.driverAffiliation?.name || 'مستقل'}</span>
              {offer.driverRank && (
                <>
                  <Separator orientation="vertical" className={styles.style156_20} />
                  <Badge variant="outline" className={cn(styles.style157_21, getRankBadge(offer.driverRank).className)}>
                    {getRankBadge(offer.driverRank).label}
                  </Badge>
                </>
              )}
            </div>
          </div>

          <div className={styles.style165_22}>
            <p className={styles.style166_23}>السعر المعروض</p>
            {offer.price === -1 ? (
              <Badge variant="secondary" className={styles.style168_24}>
                حسب العداد
              </Badge>
            ) : (
              <p className={styles.style172_25}>
                {offer.price.toFixed(2)} <span className={styles.style173_26}>د.أ</span>
              </p>
            )}
          </div>
        </div>

        {/* TASK 1: Distance and Pickup ETA */}
        <div className={styles.style180_27}>
          <div className={styles.style181_28}>
            <MapPin className={styles.style182_29} />
            <span className={styles.style183_30}>
              البعد عنك: {offer.distance_to_rider ? offer.distance_to_rider.toFixed(1) : '---'} كم
            </span>
          </div>
          <div className={styles.style187_31}>
            <Clock className={styles.style188_32} />
            <span className={styles.style189_33}>
              يصلك خلال: {offer.pickup_eta_minutes ?? Math.max(3, Math.round((offer.distance_to_rider || 1) * 3))} دقائق
            </span>
          </div>
        </div>

        {isPriceBurned && (
          <div className={styles.style196_34}>
            <div className={styles.style197_35}>
              هذا السعر أقل من متوسط السوق. تأكد من جودة الخدمة وحالة المركبة قبل القبول.
            </div>

            {benefitAd && (
              <AdDisplayCard
                ad={benefitAd}
                showHeart={false}
                badgeText="منفعة راكب"
                ctaText={benefitAd.buttonText}
                className={styles.style207_36}
                onOpen={(event) => {
                  event.stopPropagation();
                  window.open(benefitAd.actionUrl, '_blank');
                }}
              />
            )}
          </div>
        )}

        <div className={styles.style217_37}>
          <span>
            {offer.driverVehicle.make} {offer.driverVehicle.color} - {offer.driverVehicle.year}
          </span>
          <Button variant="ghost" size="sm" className={styles.style221_38} onClick={() => onInfo(offer.driverVehicle)}>
            <Info className={styles.style222_39} />
            ملف المركبة
          </Button>
        </div>

        {/* TASK 2: Estimated Trip Duration */}
        {offer.estimated_duration_minutes && (
          <div className={styles.style229_40}>
            <span className={styles.style230_41}>مدة الرحلة المتوقعة</span>
            <div className={styles.style231_42}>
              <span className={styles.style232_43}>{offer.estimated_duration_minutes} دقيقة</span>
              <Navigation className={styles.style233_44} />
            </div>
          </div>
        )}

        <Button onClick={() => onSelect(offer)} disabled={isSelecting} className={styles.style238_45}>
          {isSelecting ? <Loader2 className={styles.style239_46} /> : 'اختر هذا العرض'}
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
  // Reference price for this batch of offers: the average of all real (non
  // meter-billed) prices received for this request, used to flag any single
  // offer that undercuts the group by enough to count as dumping.
  const referencePrice = React.useMemo(() => {
    const realPrices = offers.map((offer) => offer.price).filter((price) => Number.isFinite(price) && price > 0);
    if (!realPrices.length) return 0;
    return realPrices.reduce((sum, price) => sum + price, 0) / realPrices.length;
  }, [offers]);

  const sortedOffers = React.useMemo(() => {
    return [...offers]
      .sort((a, b) => {
        const aIsFav = favoriteIds.includes(a.driverId);
        const bIsFav = favoriteIds.includes(b.driverId);
        if (aIsFav && !bIsFav) return -1;
        if (!aIsFav && bIsFav) return 1;

        const rankPriority: Record<string, number> = { PLATINUM: 4, GOLD: 3, SILVER: 2, BRONZE: 1 };
        const aPriority = rankPriority[String(a.driverRank || a.tier || 'SILVER').toUpperCase()] || 2;
        const bPriority = rankPriority[String(b.driverRank || b.tier || 'SILVER').toUpperCase()] || 2;
        if (aPriority !== bPriority) return bPriority - aPriority;

        if (a.price === -1) return 1;
        if (b.price === -1) return -1;

        return a.price - b.price;
      })
      .slice(0, 9);
  }, [offers, favoriteIds]);

  return (
    <div className={styles.style285_47}>
      <Card className={styles.style286_48}>
        <div className={styles.style287_49}>
          <h2 className={styles.style288_50}>
            <ShieldCheck className={styles.style289_51} />
            عروض السائقون
          </h2>
          <p className={styles.style292_52}>
            {offers.length} سائق قريب أرسل لك عرضاً.
          </p>
        </div>

        <ScrollArea className={styles.style297_53}>
          <div className={styles.style298_54}>
            {sortedOffers.map((offer) => (
              <OfferCard
                key={offer.driverId}
                offer={offer}
                isFavorite={favoriteIds.includes(offer.driverId)}
                onSelect={onSelect}
                onInfo={onInfo}
                isSelecting={isSelecting}
                referencePrice={referencePrice}
              />
            ))}
          </div>
        </ScrollArea>

        <div className={styles.style312_55}>
          <Button variant="destructive" className={styles.style313_56} onClick={onCancel} disabled={isCancelling}>
            {isCancelling ? <Loader2 className={styles.style314_57} /> : (
              <>
                <X className={styles.style316_58} />
                إلغاء الطلب
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
