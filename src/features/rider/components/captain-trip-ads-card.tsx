'use client';

import React from 'react';
import { Clock, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CAPTAIN_ADS_CONFIG, type CaptainAdItem } from '@/features/captain/contract';
import { captainTripAdsStyles as styles } from './captain-trip-ads-styles';

interface CaptainTripAdsCardProps {
  currentAd: CaptainAdItem;
  ads: CaptainAdItem[];
  activeAdIndex: number;
  storyProgress: number;
  isArabic: boolean;
  expandedAdIds: Set<string>;
  onNextAd: () => void;
  onPrevAd: () => void;
  onSelectLightboxAd: (ad: CaptainAdItem) => void;
  onImageError: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

export function CaptainTripAdsCard({
  currentAd,
  ads,
  activeAdIndex,
  storyProgress,
  isArabic,
  expandedAdIds,
  onNextAd,
  onPrevAd,
  onSelectLightboxAd,
  onImageError,
}: CaptainTripAdsCardProps) {
  const t = useTranslations('captainAds');

  const isExpanded = expandedAdIds.has(currentAd.id);
  const caption = currentAd?.caption || '';
  const shouldTruncate = caption.length > CAPTAIN_ADS_CONFIG.RIDER_CAPTION_PREVIEW_LIMIT;
  const displayText = isExpanded || !shouldTruncate
    ? caption
    : `${caption.slice(0, CAPTAIN_ADS_CONFIG.RIDER_CAPTION_PREVIEW_LIMIT)}...`;

  return (
    <div className={styles.mainAdCard}>
      {/* Story progress bar */}
      <div className={styles.storyProgressContainer}>
        <div className={styles.storyTracksWrapper}>
          <div
            key={`ad-progress-${currentAd.id}-${activeAdIndex}`}
            className={styles.storyProgressTrack}
            onClick={onNextAd}
            role="progressbar"
            aria-valuenow={Math.round(storyProgress)}
            aria-valuemin={0}
            aria-valuemax={100}
            title={isArabic ? 'اضغط للانتقال للإعلان التالي' : 'Click for next ad'}
          >
            <div
              className={styles.storyProgressBar}
              style={{
                width: `${storyProgress}%`,
                transition: storyProgress === 0 ? 'none' : 'width 50ms linear',
              }}
            />
          </div>
        </div>
        <span className={styles.storyDurationBadge}>
          <Clock className={styles.durationClockIcon} />
          <span>{t('storyDuration')}</span>
        </span>
      </div>

      <div className="flex items-center justify-between w-full mb-2.5">
        <span className={styles.seatBadge}>
          {t('promotionalAd')}
        </span>
      </div>

      <div className={styles.imageWrapper}>
        <div
          className={styles.imageClickArea}
          onClick={() => onSelectLightboxAd(currentAd)}
          role="button"
          tabIndex={0}
          title={t('clickToEnlarge')}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentAd.imageUrl}
            alt={caption || 'Ad Image'}
            className={styles.adImage}
            onError={onImageError}
          />
          <div className={styles.zoomOverlay}>
            <Maximize2 className={styles.zoomIcon} />
          </div>
        </div>
      </div>

      {caption ? (
        <div className={styles.captionBlock}>
          <p className={styles.captionText}>{displayText}</p>
          <button
            type="button"
            onClick={() => onSelectLightboxAd(currentAd)}
            className={styles.seeMoreBtn}
          >
            {t('viewMore')}
          </button>
        </div>
      ) : null}

      {ads.length > 1 && (
        <div className="flex items-center justify-between w-full pt-3 mt-2 border-t border-white/10 select-none">
          <button
            type="button"
            onClick={onPrevAd}
            className={styles.navPrevBtn}
            title={t('prevAd')}
            aria-label="Previous Ad"
          >
            <ChevronRight className={styles.navIcon} />
          </button>

          <div className="flex items-center gap-1.5">
            {ads.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === activeAdIndex ? 'w-5 bg-[#00ffcc]' : 'w-1.5 bg-white/20'
                }`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={onNextAd}
            className={styles.navNextBtn}
            title={t('nextAd')}
            aria-label="Next Ad"
          >
            <ChevronLeft className={styles.navIcon} />
          </button>
        </div>
      )}
    </div>
  );
}
