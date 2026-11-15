import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { AdDisplayCard } from '@/features/ads/ad-display/contract';
import { cn } from '@/lib/utils';
import { styles } from './pricing-card-styles';

interface BlockedAdViewProps {
  isArabic: boolean;
  tAuto: (key: string) => string;
  professionalAd: {
    adId: string;
    title: string;
    description: string;
    actionUrl: string;
    buttonText: string;
    bannerUrl: string;
  } | null;
  onResetDefaults: () => void;
  onCancel: () => void;
}

export function PricingCardBlockedAdView({
  isArabic,
  tAuto,
  professionalAd,
  onResetDefaults,
  onCancel
}: BlockedAdViewProps) {
  return (
    <div
      className={cn(styles.style245_8, isArabic ? styles.style245_9 : styles.style245_10)}
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      <div className={styles.style246_11}>
        <div className={styles.style247_12}>
          <AlertCircle className={styles.style248_13} />
          <div>
            <h4 className={styles.style250_14}>
              {isArabic ? tAuto('key_ec8882fc') : '🚫 Input Error: Value is operationally illogical'}
            </h4>
            <p className={styles.style251_15}>
              {isArabic
                ? tAuto('key_9ed950c9')
                : 'The entered price is too far from the appropriate market price. The offer has been paused until you adjust it.'}
            </p>
          </div>
        </div>

        {professionalAd && (
          <AdDisplayCard
            ad={professionalAd}
            showHeart={false}
            badgeText={isArabic ? tAuto('key_747ae6ec') : 'Driver Support'}
            ctaText={professionalAd.buttonText}
            className={styles.style263_16}
            onOpen={(event: React.MouseEvent) => {
              event.stopPropagation();
              window.open(professionalAd.actionUrl, '_blank', 'noopener,noreferrer');
            }}
          />
        )}
      </div>

      <div className={styles.style300_25}>
        <p className={styles.style301_26}>{tAuto('key_6745363d')}</p>

        <div className={styles.style305_27}>
          <Button onClick={onResetDefaults} className={styles.style315_28}>
            <span>{tAuto('key_02a19696')}</span>
          </Button>

          <Button onClick={onCancel} variant="outline" className={styles.style323_29}>
            {tAuto('key_c7ae9d1f')}
          </Button>
        </div>
      </div>
    </div>
  );
}
