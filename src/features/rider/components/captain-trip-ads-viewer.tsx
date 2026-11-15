'use client';

import React from 'react';
import { Sparkles, Play, Pause, Heart } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { CaptainAdHeaderMenu } from '@/features/ads/contract';
import { styles } from './trip-ads/trip-ads-styles';
import { useCaptainTripAds } from './trip-ads/use-captain-trip-ads';
import { TripJumpAdCard } from './trip-ads/trip-jump-ad-card';
import { TripRiverAdsTrack } from './trip-ads/trip-river-ads-track';
import { TripAdLightbox } from './trip-ads/trip-ad-lightbox';

export interface CaptainTripAdsViewerProps {
  captainId: string;
  isArabic?: boolean;
  isFavoriteCaptain?: boolean;
}

export function CaptainTripAdsViewer({
  captainId,
  isArabic = true,
  isFavoriteCaptain,
}: CaptainTripAdsViewerProps) {
  const t = useTranslations('captainAds');

  const {
    ads,
    displayMode,
    isPaused,
    activeAdIndex,
    storyProgress,
    isFavorite,
    isHeartLoading,
    mounted,
    lightboxAd,
    setLightboxAd,
    expandedAdIds,
    riverDurationSeconds,
    riverAds,
    handleTogglePlayPause,
    handleToggleFavorite,
    handleNextAd,
    handlePrevAd,
    handleImageError,
  } = useCaptainTripAds(captainId, isFavoriteCaptain);

  if (ads.length === 0) {
    return null;
  }

  const currentAd = ads[activeAdIndex] || ads[0];

  return (
    <div className={styles.container} dir={isArabic ? 'rtl' : 'ltr'}>
      <style>{`
        @keyframes captainAdRiverFlow {
          0% { transform: translateX(0%); }
          100% { transform: translateX(-50%); }
        }
        .captain-river-stream-track {
          animation: captainAdRiverFlow ${riverDurationSeconds}s linear infinite;
          will-change: transform;
        }
        .captain-river-stream-track:hover {
          animation-play-state: paused;
        }
        .captain-river-viewport-mask {
          mask-image: linear-gradient(to right, transparent 0%, black 20px, black calc(100% - 20px), transparent 100%);
          -webkit-mask-image: linear-gradient(to right, transparent 0%, black 20px, black calc(100% - 20px), transparent 100%);
        }
      `}</style>

      {/* Header controls: Play/pause, Favorite heart, settings menu */}
      <div className={styles.topHeaderRow}>
        <div className={styles.titleBox}>
          <div className={styles.titleIconBox}>
            <Sparkles className={styles.titleIcon} />
          </div>
          <div>
            <span className={styles.titleText}>{t('title')}</span>
          </div>
        </div>

        <div className={styles.headerControlsRow}>
          <button
            type="button"
            onClick={handleTogglePlayPause}
            className={styles.playPauseBtn}
            title={isPaused ? t('play') : t('pauseFlow')}
            aria-label={isPaused ? 'Play' : 'Pause'}
          >
            {isPaused ? <Play className={styles.playPauseIcon} /> : <Pause className={styles.playPauseIcon} />}
          </button>

          <button
            type="button"
            onClick={handleToggleFavorite}
            disabled={isHeartLoading}
            className={styles.heartBtn}
            title={isFavorite ? t('removeFromFavorites') : t('addToFavorites')}
            aria-label="Favorite Captain"
          >
            <Heart className={isFavorite ? styles.heartIconFavorited : styles.heartIconNormal} />
          </button>

          <CaptainAdHeaderMenu isArabic={isArabic} />
        </div>
      </div>

      {displayMode !== 'river' && currentAd && (
        <TripJumpAdCard
          currentAd={currentAd}
          ads={ads}
          activeAdIndex={activeAdIndex}
          storyProgress={storyProgress}
          isArabic={isArabic}
          expandedAdIds={expandedAdIds}
          t={t}
          onNextAd={handleNextAd}
          onPrevAd={handlePrevAd}
          onOpenLightbox={setLightboxAd}
          onImageError={handleImageError}
        />
      )}

      {displayMode === 'river' && (
        <TripRiverAdsTrack
          riverAds={riverAds}
          isPaused={isPaused}
          isArabic={isArabic}
          expandedAdIds={expandedAdIds}
          t={t}
          onOpenLightbox={setLightboxAd}
          onImageError={handleImageError}
        />
      )}

      <TripAdLightbox
        lightboxAd={lightboxAd}
        mounted={mounted}
        isArabic={isArabic}
        t={t}
        onClose={() => setLightboxAd(null)}
        onImageError={handleImageError}
      />
    </div>
  );
}
