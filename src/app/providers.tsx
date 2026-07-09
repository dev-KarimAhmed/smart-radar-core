'use client';

import React, { useEffect, useState } from 'react';
import { AuthProvider } from '@/hooks/use-auth';
import { SovereignErrorBoundary } from '@/components/sovereign-error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { Button } from '@/components/ui/button';
import { PwaInstallPrompt } from '@/components/pwa-install-prompt';

function PwaUpdater() {
  const [needRefresh, setNeedRefresh] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    navigator.serviceWorker.register('/sw.js').then((reg) => {
      setRegistration(reg);
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              setNeedRefresh(true);
            }
          });
        }
      });
    }).catch(err => {
      console.error('SW registration failed:', err);
    });
  }, []);

  const updateServiceWorker = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  };

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-[999] max-w-sm mx-auto p-4 rounded-2xl bg-[#0F172A]/90 border border-[#14B8A6]/20 backdrop-blur-xl shadow-2xl flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-5">
      <div className="flex flex-col gap-1 text-right" dir="rtl">
        <h4 className="text-sm font-black text-white">تحديث جديد متاح 🚀</h4>
        <p className="text-[11px] text-[#94A3B8] font-bold leading-normal">
          تم إطلاق ميزات جديدة، يرجى تحديث التطبيق للحصول على أفضل أداء.
        </p>
      </div>
      <div className="flex justify-end gap-2">
        <Button
          onClick={updateServiceWorker}
          className="h-8 rounded-lg bg-[#14B8A6] text-[#031315] font-extrabold text-[11px] hover:bg-[#2DD4BF] px-4 cursor-pointer"
        >
          تحديث الآن
        </Button>
        <Button
          onClick={() => setNeedRefresh(false)}
          variant="ghost"
          className="h-8 rounded-lg text-gray-400 hover:text-white text-[11px] px-3"
        >
          لاحقاً
        </Button>
      </div>
    </div>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SovereignErrorBoundary>
        {children}
      </SovereignErrorBoundary>
      <Toaster />
      <PwaUpdater />
      <PwaInstallPrompt />
    </AuthProvider>
  );
}
