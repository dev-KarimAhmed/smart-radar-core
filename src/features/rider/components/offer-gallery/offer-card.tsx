import React from 'react';
import { Heart, Info, Loader2, Star, Clock, Navigation, MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { RadarSovereignIntegrationKernel } from '@/core/logic/sovereign-market-kernel';
import type { Offer } from '@/core/types';
import { useAuth } from '@/hooks/use-auth';
import { usePromoStream } from '@/hooks/use-promo-stream';
import { AdDisplayCard } from '@/features/ads/ad-display/contract';
import { resolveColorDisplayName } from '@/shared/services/color-name';
import { estimatePickupMinutes } from '@/shared/services/trip-duration';
import { useLocaleContext } from '@/components/providers/locale-provider';
import { cn } from '@/lib/utils';
import { styles, getRankBadge, getBenefitAdImage } from './offer-gallery-shared';

interface OfferCardProps {
  offer: Offer;
  isFavorite: boolean;
  onSelect: (offer: Offer) => void;
  onInfo: (vehicle: any) => void;
  isSelecting: boolean;
  referencePrice: number;
}

export function OfferCard({
  offer,
  isFavorite,
  onSelect,
  onInfo,
  isSelecting,
  referencePrice,
}: OfferCardProps) {
  const { user } = useAuth();
  const { activeAds } = usePromoStream(user?.district || 'وادي السير', user?.governorate || 'عمان', 'rider');
  const t = useTranslations('offerGallery');
  const { currentLocale } = useLocaleContext();

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
        title: t('adTitle'),
        description: t('adDesc'),
        actionUrl: 'https://wa.me/962790000000',
        buttonText: t('adBtn'),
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
      title: realAd?.content?.title || t('adTitle'),
      description: realAd?.content?.description || t('adDesc2'),
      actionUrl: realAd?.action?.actionUrl || realAd?.actionUrl || 'https://wa.me/962790000000',
      buttonText: realAd?.action?.buttonText || realAd?.buttonText || t('adBtn'),
      bannerUrl: image,
      posterUrl: image,
    };
  }, [isPriceBurned, deviationRatio, activeAds, user, t]);

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
                  {t('preferredCaptain')}
                </span>
              )}
              {(() => {
                const tier = (offer.tier || 'SILVER').toUpperCase();
                switch (tier) {
                  case 'BRONZE':
                    return <span className={styles.style120_11}>{t('rankBronze')}</span>;
                  case 'GOLD':
                    return <span className={styles.style126_12}>{t('rankGold')}</span>;
                  case 'PLATINUM':
                    return <span className={styles.style132_13}>{t('rankPlatinum')}</span>;
                  case 'SILVER':
                  default:
                    return <span className={styles.style139_14}>{t('rankSilver')}</span>;
                }
              })()}
            </div>

            <div className={styles.style147_15}>
              <div className={styles.style148_16}>
                <Star className={styles.style149_17} />
                <span className={styles.style150_18}>{offer.driverRating.toFixed(1)}</span>
              </div>
              <Separator orientation="vertical" className={styles.style152_19} />
              <span>{offer.driverAffiliation?.name || t('independent')}</span>
              {offer.driverRank && (
                <>
                  <Separator orientation="vertical" className={styles.style156_20} />
                  <Badge variant="outline" className={cn(styles.style157_21, getRankBadge(offer.driverRank, t).className)}>
                    {getRankBadge(offer.driverRank, t).label}
                  </Badge>
                </>
              )}
            </div>
          </div>

          <div className={styles.style165_22}>
            <p className={styles.style166_23}>{t('offeredPrice')}</p>
            {offer.price === -1 ? (
              <Badge variant="secondary" className={styles.style168_24}>
                {t('byMeter')}
              </Badge>
            ) : (
              <p className={styles.style172_25}>
                {offer.price.toFixed(2)} <span className={styles.style173_26}>{t('currency')}</span>
              </p>
            )}
          </div>
        </div>

        <div className={styles.style180_27}>
          <div className={styles.style181_28}>
            <MapPin className={styles.style182_29} />
            <span className={styles.style183_30}>
              {t('distanceFromYou')} {offer.distance_to_rider ? offer.distance_to_rider.toFixed(1) : '---'} {t('km')}
            </span>
          </div>
          <div className={styles.style187_31}>
            <Clock className={styles.style188_32} />
            <span className={styles.style189_33}>
              {t('arrivesIn')} {offer.pickup_eta_minutes ?? estimatePickupMinutes(offer.distance_to_rider)} {t('minutes')}
            </span>
          </div>
        </div>

        {isPriceBurned && (
          <div className={styles.style196_34}>
            <div className={styles.style197_35}>
              {t('priceBurnedWarning')}
            </div>

            {benefitAd && (
              <AdDisplayCard
                ad={benefitAd}
                showHeart={false}
                badgeText={t('riderBenefit')}
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
            {offer.driverVehicle.make} {resolveColorDisplayName(offer.driverVehicle.color, currentLocale as any)} - {offer.driverVehicle.year}
          </span>
          <Button variant="ghost" size="sm" className={styles.style221_38} onClick={() => onInfo(offer.driverVehicle)}>
            <Info className={styles.style222_39} />
            {t('vehicleFile')}
          </Button>
        </div>

        {offer.estimated_duration_minutes && (
          <div className={styles.style229_40}>
            <span className={styles.style230_41}>{t('estimatedDuration')}</span>
            <div className={styles.style231_42}>
              <span className={styles.style232_43}>{offer.estimated_duration_minutes} {t('minute')}</span>
              <Navigation className={styles.style233_44} />
            </div>
          </div>
        )}

        <Button onClick={() => onSelect(offer)} disabled={isSelecting} className={styles.style238_45}>
          {isSelecting ? <Loader2 className={styles.style239_46} /> : t('selectOffer')}
        </Button>
      </CardContent>
    </Card>
  );
}
