'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/toaster';
import { PwaInstallPrompt } from '@/components/pwa-install-prompt';

const styles = {
  update: 'fixed bottom-20 left-4 right-4 z-[999] mx-auto flex max-w-sm animate-in flex-col gap-3 rounded-2xl border border-[#14B8A6]/20 bg-[#0F172A]/90 p-4 shadow-2xl backdrop-blur-xl fade-in slide-in-from-bottom-5',
  copy: 'flex flex-col gap-1 text-right',
  title: 'text-sm font-black text-white',
  description: 'text-[11px] font-bold leading-normal text-[#94A3B8]',
  actions: 'flex justify-end gap-2',
  updateButton: 'h-8 cursor-pointer rounded-lg bg-[#14B8A6] px-4 text-[11px] font-extrabold text-[#031315] hover:bg-[#2DD4BF]',
  laterButton: 'h-8 rounded-lg px-3 text-[11px] text-gray-400 hover:text-white',
} as const;

function PwaUpdater() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let removeVisibilityListener: (() => void) | undefined;
    void navigator.serviceWorker.register('/sw.js').then((nextRegistration) => {
      setRegistration(nextRegistration);
      void nextRegistration.update().catch(() => undefined);

      const refreshServiceWorkerCheck = () => {
        if (document.visibilityState === 'visible') {
          void nextRegistration.update().catch(() => undefined);
        }
      };

      document.addEventListener('visibilitychange', refreshServiceWorkerCheck);
      removeVisibilityListener = () => document.removeEventListener('visibilitychange', refreshServiceWorkerCheck);
      nextRegistration.addEventListener('updatefound', () => {
        const newWorker = nextRegistration.installing;
        newWorker?.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            setNeedRefresh(true);
          }
        });
      });
    }).catch((error) => {
      console.error('SW registration failed:', error);
    });

    return () => removeVisibilityListener?.();
  }, []);

  const updateServiceWorker = () => {
    if (!registration?.waiting) return;
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    window.location.reload();
  };

  if (!needRefresh) return null;

  return (
    <div className={styles.update}>
      <div className={styles.copy} dir="rtl">
        <h4 className={styles.title}>تحديث جديد متاح 🚀</h4>
        <p className={styles.description}>تم إطلاق ميزات جديدة، يرجى تحديث التطبيق للحصول على أفضل أداء.</p>
      </div>
      <div className={styles.actions}>
        <Button onClick={updateServiceWorker} className={styles.updateButton}>تحديث الآن</Button>
        <Button onClick={() => setNeedRefresh(false)} variant="ghost" className={styles.laterButton}>لاحقاً</Button>
      </div>
    </div>
  );
}

export function DeferredClientTools() {
  return (
    <>
      <Toaster />
      <PwaUpdater />
      <PwaInstallPrompt />
    </>
  );
}
