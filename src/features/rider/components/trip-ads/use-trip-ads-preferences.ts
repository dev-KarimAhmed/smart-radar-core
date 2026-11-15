import { useState, useEffect } from 'react';
import {
  CAPTAIN_ADS_CONFIG,
  type AdDisplayMode,
  type RiverSpeed,
} from '@/features/captain/contract';

export function useTripAdsPreferences(captainId: string, onReloadAds: () => void, onReloadFavorites: () => void) {
  const [displayMode, setDisplayMode] = useState<AdDisplayMode>(CAPTAIN_ADS_CONFIG.DEFAULT_DISPLAY_MODE);
  const [speed, setSpeed] = useState<RiverSpeed>(CAPTAIN_ADS_CONFIG.DEFAULT_SPEED);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  useEffect(() => {
    try {
      const savedMode = localStorage.getItem(CAPTAIN_ADS_CONFIG.STORAGE_KEYS.DISPLAY_MODE) as AdDisplayMode;
      if (savedMode === 'jump' || savedMode === 'river') setDisplayMode(savedMode);

      const savedSpeed = localStorage.getItem(CAPTAIN_ADS_CONFIG.STORAGE_KEYS.STREAM_SPEED) as RiverSpeed;
      if (savedSpeed && (savedSpeed === 'slow' || savedSpeed === 'normal' || savedSpeed === 'fast')) {
        setSpeed(savedSpeed);
      }

      const savedPaused = localStorage.getItem(CAPTAIN_ADS_CONFIG.STORAGE_KEYS.IS_PAUSED);
      if (savedPaused !== null) setIsPaused(savedPaused === 'true');
    } catch {}

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
        onReloadAds();
      }
    };

    const onFavUpdated = (e: any) => {
      if (!e?.detail?.captainId || e.detail.captainId === captainId) {
        onReloadFavorites();
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
  }, [captainId, onReloadAds, onReloadFavorites]);

  return {
    displayMode,
    speed,
    isPaused,
    setIsPaused,
  };
}
