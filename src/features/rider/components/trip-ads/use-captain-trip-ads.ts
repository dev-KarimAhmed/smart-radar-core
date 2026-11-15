import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  CAPTAIN_ADS_CONFIG,
  type CaptainAdItem,
  fetchCaptainAds,
  getCaptainAds,
} from '@/features/captain/contract';
import {
  fetchFavoriteCaptainIds,
  setFavoriteCaptain,
} from '@/features/account/contract';
import { useTripAdsPreferences } from './use-trip-ads-preferences';

export function useCaptainTripAds(captainId: string, initialIsFavorite?: boolean) {
  const [ads, setAds] = useState<CaptainAdItem[]>(() => {
    if (typeof window !== 'undefined' && captainId) {
      const cached = getCaptainAds(captainId);
      const active = cached.filter((a) => a.status === 'ACTIVE');
      return active.length > 0 ? active : cached;
    }
    return [];
  });
  const [activeAdIndex, setActiveAdIndex] = useState<number>(0);
  const [storyProgress, setStoryProgress] = useState<number>(0);
  const [isFavorite, setIsFavorite] = useState<boolean>(() => {
    if (initialIsFavorite !== undefined) return initialIsFavorite;
    if (typeof window !== 'undefined' && captainId) {
      try {
        if (window.localStorage.getItem(`radar_preferred_captain_${captainId}`)) return true;
      } catch {}
    }
    return false;
  });
  const [isHeartLoading, setIsHeartLoading] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const [lightboxAd, setLightboxAd] = useState<CaptainAdItem | null>(null);
  const [expandedAdIds, setExpandedAdIds] = useState<Set<string>>(new Set());

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
    } catch {}
  }, [captainId]);

  const { displayMode, speed, isPaused, setIsPaused } = useTripAdsPreferences(
    captainId,
    loadAds,
    checkFavoriteStatus,
  );

  useEffect(() => {
    setMounted(true);
    if (initialIsFavorite !== undefined) setIsFavorite(initialIsFavorite);
    void loadAds();
    void checkFavoriteStatus();
  }, [loadAds, checkFavoriteStatus, initialIsFavorite]);

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
        }),
      );
    } catch {}
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

  const toggleExpandCaption = (adId: string) => {
    setExpandedAdIds((prev) => {
      const next = new Set(prev);
      if (next.has(adId)) next.delete(adId);
      else next.add(adId);
      return next;
    });
  };

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

  const riverDurationSeconds = CAPTAIN_ADS_CONFIG.SPEED_DURATIONS[speed] || CAPTAIN_ADS_CONFIG.SPEED_DURATIONS.normal;

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

  return {
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
    toggleExpandCaption,
    handleImageError,
  };
}
