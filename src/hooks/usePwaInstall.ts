'use client';

import { useState, useEffect, useCallback } from 'react';
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
const STORAGE_INSTALLED_KEY = 'sovereign_pwa_installed';
const DEFAULT_DISMISS_DAYS = 1;

let sharedDeferredPrompt: BeforeInstallPromptEvent | null = null;

export function usePwaInstall(role: 'rider' | 'captain' = 'rider') {
  const [platformEnv, setPlatformEnv] = useState<PlatformEnvironment>(() => detectPlatform());
  const [guidance, setGuidance] = useState<PwaGuidanceDetails>(() => getPwaGuidance(undefined, role));
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(() => sharedDeferredPrompt);
  const [isDismissed, setIsDismissed] = useState<boolean>(true); // default true until client mounts
  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(false);

  const roleInstalledKey = `${STORAGE_INSTALLED_KEY}_${role}`;
  const roleDismissKey = `${STORAGE_DISMISS_KEY}_${role}`;

  // Initialize and check local storage & installed related apps
  useEffect(() => {
    const env = detectPlatform();
    setPlatformEnv(env);
    setGuidance(getPwaGuidance(env, role));

    if (env.isStandalone) {
      setIsDismissed(true);
      setIsAppInstalled(true);
      return;
    }

    try {
      const storedGlobal = localStorage.getItem(STORAGE_INSTALLED_KEY);
      const storedRole = localStorage.getItem(roleInstalledKey);
      if ((storedGlobal === 'true' || storedRole === 'true') && !env.isIOS) {
        setIsAppInstalled(true);
      }
    } catch {
      // silent
    }

    if (typeof navigator !== 'undefined' && 'getInstalledRelatedApps' in navigator) {
      (navigator as unknown as { getInstalledRelatedApps: () => Promise<unknown[]> })
        .getInstalledRelatedApps()
        .then((relatedApps) => {
          if (Array.isArray(relatedApps) && relatedApps.length > 0) {
            setIsAppInstalled(true);
            try {
              localStorage.setItem(roleInstalledKey, 'true');
              localStorage.setItem(STORAGE_INSTALLED_KEY, 'true');
            } catch {
              // silent
            }
          }
        })
        .catch(() => {});
    }

    try {
      const dismissedUntil = localStorage.getItem(roleDismissKey);
      if (dismissedUntil && Number(dismissedUntil) > Date.now()) {
        setIsDismissed(true);
      } else {
        setIsDismissed(false);
      }
    } catch {
      setIsDismissed(false);
    }
  }, [role, roleDismissKey, roleInstalledKey]);

  // Update guidance whenever platformEnv or role changes
  useEffect(() => {
    setGuidance(getPwaGuidance(platformEnv, role));
  }, [platformEnv, role]);

  // Listen to beforeinstallprompt event (Android / Chromium)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (sharedDeferredPrompt) {
      setDeferredPrompt(sharedDeferredPrompt);
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      sharedDeferredPrompt = e as BeforeInstallPromptEvent;
      setDeferredPrompt(sharedDeferredPrompt);
    };

    const handleAppInstalled = () => {
      sharedDeferredPrompt = null;
      setDeferredPrompt(null);
      setIsDismissed(true);
      setIsAppInstalled(true);
      try {
        localStorage.setItem(roleInstalledKey, 'true');
        localStorage.setItem(STORAGE_INSTALLED_KEY, 'true');
      } catch {
        // silent
      }
      setPlatformEnv(prev => ({ ...prev, isStandalone: true }));
    };

    const handleExternalDismiss = () => setIsDismissed(true);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('sovereign-pwa-dismissed', handleExternalDismiss);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('sovereign-pwa-dismissed', handleExternalDismiss);
    };
  }, [roleInstalledKey]);

  const triggerNativeInstall = useCallback(async (): Promise<boolean> => {
    const promptEvent = deferredPrompt || sharedDeferredPrompt;
    if (!promptEvent) return false;
    try {
      await promptEvent.prompt();
      const choice = await promptEvent.userChoice;
      if (choice.outcome === 'accepted') {
        sharedDeferredPrompt = null;
        setDeferredPrompt(null);
        setIsDismissed(true);
        setIsAppInstalled(true);
        try {
          localStorage.setItem(roleInstalledKey, 'true');
          localStorage.setItem(STORAGE_INSTALLED_KEY, 'true');
        } catch {
          // silent
        }
        return true;
      }
    } catch (err) {
      console.warn('[PWA Install Error]', err);
    }
    return false;
  }, [deferredPrompt, roleInstalledKey]);

  const dismissBanner = useCallback((days: number = DEFAULT_DISMISS_DAYS) => {
    const expireTime = Date.now() + days * 24 * 60 * 60 * 1000;
    try {
      localStorage.setItem(roleDismissKey, String(expireTime));
    } catch {
      // silent
    }
    setIsDismissed(true);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('sovereign-pwa-dismissed'));
    }
  }, [roleDismissKey]);

  const resetDismissal = useCallback(() => {
    try {
      localStorage.removeItem(roleDismissKey);
      localStorage.removeItem(STORAGE_DISMISS_KEY);
    } catch {
      // silent
    }
    setIsDismissed(false);
  }, [roleDismissKey]);

  const canPromptNative = Boolean(deferredPrompt);
  // On iOS, standalone mode is the true indicator; on desktop/android, check standalone or recorded/native install
  const isInstalled = platformEnv.isStandalone || (!platformEnv.isIOS && isAppInstalled);
  // Hide install button if already installed, or if native prompt is unavailable on Chromium (which occurs when already installed)
  const canShowInstallButton = !isInstalled && (platformEnv.isIOS || canPromptNative);

  return {
    isStandalone: platformEnv.isStandalone,
    isInstalled,
    canShowInstallButton,
    canPromptNative,
    isDismissed,
    guidance,
    platformEnv,
    wakeLockActive: false,
    triggerNativeInstall,
    dismissBanner,
    resetDismissal,
  };
}
