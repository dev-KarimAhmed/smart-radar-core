'use client';

import React from 'react';
import { Loader2, ShieldCheck, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Offer } from '@/core/types';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';

import { styles } from './offer-gallery/offer-gallery-shared';
import { OfferCard } from './offer-gallery/offer-card';

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
  const { isArabic } = useDashboardLanguage();

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
    <div className={styles.style285_47} dir={isArabic ? 'rtl' : 'ltr'}>
      <Card className={styles.style286_48}>
        <div className={styles.style287_49}>
          <h2 className={styles.style288_50}>
            <ShieldCheck className={styles.style289_51} />
            {t('captainsOffers')}
          </h2>
          <p className={styles.style292_52}>
            {t('offersCountText', { count: offers.length })}
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
                {t('cancelRequest')}
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
