'use client';

import React from 'react';
import { Maximize2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CAPTAIN_ADS_CONFIG, type CaptainAdItem } from '@/features/captain/contract';
import { captainTripAdsStyles as styles } from './captain-trip-ads-styles';

interface CaptainTripAdsRiverProps {
  riverAds: CaptainAdItem[];
  isPaused: boolean;
  isArabic: boolean;
  expandedAdIds: Set<string>;
  onSelectLightboxAd: (ad: CaptainAdItem) => void;
  onImageError: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

export function CaptainTripAdsRiver({
  riverAds,
  isPaused,
  isArabic,
  expandedAdIds,
  onSelectLightboxAd,
  onImageError,
}: CaptainTripAdsRiverProps) {
  const t = useTranslations('captainAds');

  return (
    <div className={styles.riverViewport} dir="ltr">
      <div
        className={styles.riverTrackAnimated}
        style={{
          animationPlayState: isPaused ? 'paused' : 'running',
        }}
      >
        {riverAds.map((ad, idx) => {
          const uniqueKey = `${ad.id}-${idx}`;
          const isAdExpanded = expandedAdIds.has(ad.id);
          const adCaption = ad.caption || '';
          const isTruncated = adCaption.length > CAPTAIN_ADS_CONFIG.RIDER_CAPTION_PREVIEW_LIMIT;
          const adDisplayText = isAdExpanded || !isTruncated
            ? adCaption
            : `${adCaption.slice(0, CAPTAIN_ADS_CONFIG.RIDER_CAPTION_PREVIEW_LIMIT)}...`;

          return (
            <div key={uniqueKey} className={styles.cardContainerRiver} dir={isArabic ? 'rtl' : 'ltr'}>
              <div className="flex items-center justify-end w-full mb-1">
                <span className={styles.activeDot}>
                  <span className={styles.activeDotPing} />
                  <span className={styles.activeDotCore} />
                </span>
              </div>

              <div className="w-full flex-1 flex flex-col items-center justify-center my-auto">
                <div
                  className={styles.imageWrapper}
                  onClick={() => onSelectLightboxAd(ad)}
                  role="button"
                  tabIndex={0}
                  title={t('clickToEnlarge')}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={ad.imageUrl}
                    alt={adCaption || 'Ad'}
                    className={styles.adImage}
                    onError={onImageError}
                  />
                  <div className={styles.zoomOverlay}>
                    <Maximize2 className={styles.zoomIcon} />
                  </div>
                </div>
              </div>

              {adCaption ? (
                <div className={styles.captionBlock}>
                  <p className={styles.captionText}>{adDisplayText}</p>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectLightboxAd(ad);
                    }}
                    className={styles.seeMoreBtn}
                  >
                    {t('viewMore')}
                  </button>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
