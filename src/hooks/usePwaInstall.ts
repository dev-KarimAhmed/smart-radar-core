'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  detectPlatform,
  getPwaGuidance,
  PlatformEnvironment,
  PwaGuidanceDetails,
} from '@/lib/pwaGuidance';

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const STORAGE_DISMISS_KEY = 'sovereign_pwa_dismissed_until';
const DEFAULT_DISMISS_DAYS = 7;

export function usePwaInstall() {
  const [platformEnv, setPlatformEnv] = useState<PlatformEnvironment>(() => detectPlatform());
  const [guidance, setGuidance] = useState<PwaGuidanceDetails>(() => getPwaGuidance());
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isDismissed, setIsDismissed] = useState<boolean>(true); // default true until client mounts
  const [wakeLockActive, setWakeLockActive] = useState<boolean>(false);
  const wakeLockRef = useRef<any>(null);

  // Initialize and check local storage
  useEffect(() => {
    const env = detectPlatform();
    setPlatformEnv(env);
    setGuidance(getPwaGuidance(env));

    if (env.isStandalone) {
      setIsDismissed(true);
      return;
    }

    try {
      const dismissedUntil = localStorage.getItem(STORAGE_DISMISS_KEY);
      if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
        setIsDismissed(true);
      } else {
        setIsDismissed(false);
      }
    } catch {
      setIsDismissed(false);
    }
  }, []);

  // Listen to beforeinstallprompt event (Android / Chromium)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsDismissed(true);
      setPlatformEnv(prev => ({ ...prev, isStandalone: true }));
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Sovereign WakeLock Protocol with visibilitychange Auto-Recovery
  const acquireWakeLock = useCallback(async () => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;
    if (!('wakeLock' in navigator)) return;

    try {
      if (wakeLockRef.current !== null && !wakeLockRef.current.released) {
        return;
      }
      const lock = await (navigator as any).wakeLock.request('screen');
      wakeLockRef.current = lock;
      setWakeLockActive(true);

      lock.addEventListener('release', () => {
        wakeLockRef.current = null;
        setWakeLockActive(false);
      });
    } catch (err) {
      // In non-supported or restricted environments, silent fallback
      setWakeLockActive(false);
    }
  }, []);

  useEffect(() => {
    // Acquire initial lock
    void acquireWakeLock();

    // Auto-Recovery on visibilitychange (e.g. returning from phone call or navigation app)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void acquireWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (wakeLockRef.current) {
        try {
          void wakeLockRef.current.release();
        } catch {
          // silent cleanup
        }
      }
    };
  }, [acquireWakeLock]);

  const triggerNativeInstall = useCallback(async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsDismissed(true);
        return true;
      }
    } catch (err) {
      console.warn('[PWA Install Error]', err);
    }
    return false;
  }, [deferredPrompt]);

  const dismissBanner = useCallback((days: number = DEFAULT_DISMISS_DAYS) => {
    const expireTime = Date.now() + days * 24 * 60 * 60 * 1000;
    try {
      localStorage.setItem(STORAGE_DISMISS_KEY, String(expireTime));
    } catch {
      // silent
    }
    setIsDismissed(true);
  }, []);

  const resetDismissal = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_DISMISS_KEY);
    } catch {
      // silent
    }
    setIsDismissed(false);
  }, []);

  return {
    isStandalone: platformEnv.isStandalone,
    canPromptNative: Boolean(deferredPrompt),
    isDismissed,
    guidance,
    platformEnv,
    wakeLockActive,
    triggerNativeInstall,
    dismissBanner,
    resetDismissal,
  };
}
