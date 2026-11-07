'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Sparkles, Play, Pause, Heart } from 'lucide-react';
import { useTranslations } from 'next-intl';
import {
  CAPTAIN_ADS_CONFIG,
  type AdDisplayMode,
  type RiverSpeed,
  type CaptainAdItem,
  fetchCaptainAds,
  getCaptainAds,
} from '@/features/captain/contract';
import { CaptainAdHeaderMenu } from '@/features/ads/contract';
import {
  fetchFavoriteCaptainIds,
  setFavoriteCaptain,
} from '@/features/account/contract';
import { captainTripAdsStyles as styles } from './captain-trip-ads-styles';
import { CaptainTripAdsLightbox } from './captain-trip-ads-lightbox';
import { CaptainTripAdsRiver } from './captain-trip-ads-river';
import { CaptainTripAdsCard } from './captain-trip-ads-card';

export { captainTripAdsStyles } from './captain-trip-ads-styles';
export { CaptainTripAdsLightbox } from './captain-trip-ads-lightbox';
export { CaptainTripAdsRiver } from './captain-trip-ads-river';
export { CaptainTripAdsCard } from './captain-trip-ads-card';

export interface CaptainTripAdsViewerProps {
  captainId: string;
  isArabic?: boolean;
}

export function CaptainTripAdsViewer({ captainId, isArabic = true }: CaptainTripAdsViewerProps) {
  const t = useTranslations('captainAds');
  const [ads, setAds] = useState<CaptainAdItem[]>(() => {
    if (typeof window !== 'undefined' && captainId) {
      const cached = getCaptainAds(captainId);
      const active = cached.filter((a) => a.status === 'ACTIVE');
      return active.length > 0 ? active : cached;
    }
    return [];
  });
  const [displayMode, setDisplayMode] = useState<AdDisplayMode>(CAPTAIN_ADS_CONFIG.DEFAULT_DISPLAY_MODE);
  const [speed, setSpeed] = useState<RiverSpeed>(CAPTAIN_ADS_CONFIG.DEFAULT_SPEED);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [activeAdIndex, setActiveAdIndex] = useState<number>(0);
  const [storyProgress, setStoryProgress] = useState<number>(0);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);
  const [isHeartLoading, setIsHeartLoading] = useState<boolean>(false);
  const [lightboxAd, setLightboxAd] = useState<CaptainAdItem | null>(null);
  const [expandedAdIds] = useState<Set<string>>(new Set());

  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const storyProgressRef = useRef<number>(0);
  const [cycleCount, setCycleCount] = useState<number>(0);
  const storyDurationMs = CAPTAIN_ADS_CONFIG.STORY_DURATION_SECONDS * 1000;
  const tickIntervalMs = 50;

  const loadAds = useCallback(async () => {
    const list = await fetchCaptainAds(captainId);
    if (list && list.length > 0) {
      const activeAds = list.filter((a) => a.status === 'ACTIVE');
      setAds(activeAds.length > 0 ? activeAds : list);
    }
  }, [captainId]);

  const checkFavoriteStatus = useCallback(async () => {
    try {
      const favIds = await fetchFavoriteCaptainIds();
      setIsFavorite(favIds.has(captainId));
    } catch {
      // Ignored
    }
  }, [captainId]);

  useEffect(() => {
    if (ads.length > 0) {
      ads.forEach((ad) => {
        if (ad.imageUrl) {
          const img = new Image();
          img.src = ad.imageUrl;
        }
      });
    }
  }, [ads]);

  useEffect(() => {
    void loadAds();
    void checkFavoriteStatus();

    try {
      const savedMode = localStorage.getItem(CAPTAIN_ADS_CONFIG.STORAGE_KEYS.DISPLAY_MODE) as AdDisplayMode;
      if (savedMode === 'jump' || savedMode === 'river') setDisplayMode(savedMode);

      const savedSpeed = localStorage.getItem(CAPTAIN_ADS_CONFIG.STORAGE_KEYS.STREAM_SPEED) as RiverSpeed;
      if (savedSpeed && (savedSpeed === 'slow' || savedSpeed === 'normal' || savedSpeed === 'fast')) {
        setSpeed(savedSpeed);
      }

      const savedPaused = localStorage.getItem(CAPTAIN_ADS_CONFIG.STORAGE_KEYS.IS_PAUSED);
      if (savedPaused !== null) setIsPaused(savedPaused === 'true');
    } catch {
      // Ignored
    }

    const onMode = () => {
      const mode = (localStorage.getItem(CAPTAIN_ADS_CONFIG.STORAGE_KEYS.DISPLAY_MODE) as AdDisplayMode) || 'jump';
      setDisplayMode(mode);
    };

    const onSpeed = () => {
      const sp = (localStorage.getItem(CAPTAIN_ADS_CONFIG.STORAGE_KEYS.STREAM_SPEED) as RiverSpeed) || 'normal';
      setSpeed(sp);
    };

    const onPause = (e: any) => {
      if (e?.detail?.isPaused !== undefined) {
        setIsPaused(Boolean(e.detail.isPaused));
      }
    };

    const onAdsUpdated = (e: any) => {
      if (!e?.detail?.captainId || e.detail.captainId === captainId) {
        void loadAds();
      }
    };

    const onFavUpdated = (e: any) => {
      if (!e?.detail?.captainId || e.detail.captainId === captainId) {
        if (typeof e.detail?.isFavorite === 'boolean') {
          setIsFavorite(e.detail.isFavorite);
        } else {
          void checkFavoriteStatus();
        }
      }
    };

    window.addEventListener(CAPTAIN_ADS_CONFIG.CUSTOM_EVENTS.DISPLAY_MODE_CHANGED, onMode);
    window.addEventListener(CAPTAIN_ADS_CONFIG.CUSTOM_EVENTS.STREAM_SPEED_CHANGED, onSpeed);
    window.addEventListener(CAPTAIN_ADS_CONFIG.CUSTOM_EVENTS.PAUSE_CHANGED, onPause);
    window.addEventListener(CAPTAIN_ADS_CONFIG.CUSTOM_EVENTS.ADS_UPDATED, onAdsUpdated);
    window.addEventListener('rider-favorites-updated', onFavUpdated);

    return () => {
      window.removeEventListener(CAPTAIN_ADS_CONFIG.CUSTOM_EVENTS.DISPLAY_MODE_CHANGED, onMode);
      window.removeEventListener(CAPTAIN_ADS_CONFIG.CUSTOM_EVENTS.STREAM_SPEED_CHANGED, onSpeed);
      window.removeEventListener(CAPTAIN_ADS_CONFIG.CUSTOM_EVENTS.PAUSE_CHANGED, onPause);
      window.removeEventListener(CAPTAIN_ADS_CONFIG.CUSTOM_EVENTS.ADS_UPDATED, onAdsUpdated);
      window.removeEventListener('rider-favorites-updated', onFavUpdated);
    };
  }, [captainId, loadAds, checkFavoriteStatus]);

  useEffect(() => {
    if (ads.length === 0 || isPaused) {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
      return;
    }

    const durationMs = storyDurationMs;
    const initialProgress = storyProgressRef.current;
    const remainingRatio = Math.max(0, 1 - initialProgress / 100);
    const startTimestamp = Date.now();
    const durationRemainingMs = durationMs * remainingRatio;

    if (durationRemainingMs <= 0) {
      storyProgressRef.current = 0;
      setStoryProgress(0);
      setActiveAdIndex((prev) => (prev + 1) % ads.length);
      setCycleCount((c) => c + 1);
      return;
    }

    progressTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimestamp;
      const addedProgress = (elapsed / durationMs) * 100;
      const current = Math.min(100, initialProgress + addedProgress);

      if (current >= 100 || elapsed >= durationRemainingMs) {
        if (progressTimerRef.current) {
          clearInterval(progressTimerRef.current);
          progressTimerRef.current = null;
        }
        storyProgressRef.current = 0;
        setStoryProgress(0);
        setActiveAdIndex((prev) => (prev + 1) % ads.length);
        setCycleCount((c) => c + 1);
      } else {
        storyProgressRef.current = current;
        setStoryProgress(current);
      }
    }, tickIntervalMs);

    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
        progressTimerRef.current = null;
      }
    };
  }, [ads.length, activeAdIndex, cycleCount, isPaused, storyDurationMs, tickIntervalMs]);

  const handleTogglePlayPause = () => {
    const nextPaused = !isPaused;
    setIsPaused(nextPaused);
    try {
      localStorage.setItem(CAPTAIN_ADS_CONFIG.STORAGE_KEYS.IS_PAUSED, String(nextPaused));
      window.dispatchEvent(
        new CustomEvent(CAPTAIN_ADS_CONFIG.CUSTOM_EVENTS.PAUSE_CHANGED, {
          detail: { isPaused: nextPaused },
        })
      );
    } catch {
      // Ignored
    }
  };

  const handleToggleFavorite = async () => {
    if (isHeartLoading) return;
    const nextFavorite = !isFavorite;
    setIsFavorite(nextFavorite);
    setIsHeartLoading(true);

    try {
      await setFavoriteCaptain(captainId, nextFavorite);
    } catch {
      setIsFavorite(!nextFavorite);
    } finally {
      setIsHeartLoading(false);
    }
  };

  const handleNextAd = () => {
    if (ads.length <= 1) return;
    storyProgressRef.current = 0;
    setStoryProgress(0);
    setActiveAdIndex((prev) => (prev + 1) % ads.length);
    setCycleCount((c) => c + 1);
  };

  const handlePrevAd = () => {
    if (ads.length <= 1) return;
    storyProgressRef.current = 0;
    setStoryProgress(0);
    setActiveAdIndex((prev) => (prev - 1 + ads.length) % ads.length);
    setCycleCount((c) => c + 1);
  };

  const riverDurationSeconds = CAPTAIN_ADS_CONFIG.SPEED_DURATIONS[speed] || CAPTAIN_ADS_CONFIG.SPEED_DURATIONS.normal;

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget;
    const src = target.src || '';
    if (src.includes('/storage/v1/object/public/captain-documents/')) {
      const path = src.split('/storage/v1/object/public/captain-documents/')[1]?.replace(/^\/+/, '');
      if (path) {
        target.src = `/api/captain/ads/image?bucket=captain-documents&path=${encodeURIComponent(path)}`;
        return;
      }
    }
    target.style.opacity = '0';
  };

  const riverAds = useMemo(() => {
    if (ads.length === 0) return [];
    const targetSetSize = 10;
    const repeatCount = Math.max(1, Math.ceil(targetSetSize / ads.length));
    const setA: CaptainAdItem[] = [];
    for (let r = 0; r < repeatCount; r++) {
      setA.push(...ads);
    }
    return [...setA, ...setA];
  }, [ads]);

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

      {/* Header controls */}
      <div className={styles.topHeaderRow}>
        <div className={styles.titleBox}>
          <div className={styles.titleIconBox}>
            <Sparkles className={styles.titleIcon} />
          </div>
          <div>
            <span className={styles.titleText}>
              {t('title')}
            </span>
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
            {isPaused ? (
              <Play className={styles.playPauseIcon} />
            ) : (
              <Pause className={styles.playPauseIcon} />
            )}
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

      {/* Main card or River display */}
      {displayMode !== 'river' && currentAd ? (
        <CaptainTripAdsCard
          currentAd={currentAd}
          ads={ads}
          activeAdIndex={activeAdIndex}
          storyProgress={storyProgress}
          isArabic={isArabic}
          expandedAdIds={expandedAdIds}
          onNextAd={handleNextAd}
          onPrevAd={handlePrevAd}
          onSelectLightboxAd={(ad) => setLightboxAd(ad)}
          onImageError={handleImageError}
        />
      ) : null}

      {displayMode === 'river' ? (
        <CaptainTripAdsRiver
          riverAds={riverAds}
          isPaused={isPaused}
          isArabic={isArabic}
          expandedAdIds={expandedAdIds}
          onSelectLightboxAd={(ad) => setLightboxAd(ad)}
          onImageError={handleImageError}
        />
      ) : null}

      {lightboxAd ? (
        <CaptainTripAdsLightbox
          ad={lightboxAd}
          isArabic={isArabic}
          onClose={() => setLightboxAd(null)}
          onImageError={handleImageError}
        />
      ) : null}
    </div>
  );
}
