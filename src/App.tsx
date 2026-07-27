'use client';

import React, { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from '@/hooks/use-auth';
import { RiderOperationsProvider } from '@/hooks/use-rider-operations';
import { DriverOperationsProvider } from '@/hooks/use-driver-operations';
import { Dashboard } from '@/components/dashboard';
import LoginPage from '@/features/auth/components/login-page';
import { useSovereignRouteGuard } from '@/app/routes';
import { AdvertiserPortal } from '@/components/dashboard/advertiser-portal';
import { SovereignErrorBoundary } from '@/components/sovereign-error-boundary';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from '@/components/ui/button';

const styles = {
  style35_1: "flex h-dvh w-screen select-none flex-col items-center justify-center bg-[#0B0F19] text-white/90",
  style36_2: "flex h-14 w-14 items-center justify-center rounded-2xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 shadow-[0_0_30px_rgba(20,184,166,0.18)]",
  style37_3: "h-5 w-5 animate-spin rounded-full border-2 border-[#14B8A6]/25 border-t-[#14B8A6]",
  style39_4: "mt-5 animate-pulse text-xl font-black tracking-normal",
  style40_5: "mt-2 text-xs font-bold text-[#94A3B8]",
  style52_6: "min-h-screen w-full bg-[#0B1120] text-white p-4 sm:p-8 flex items-center justify-center overflow-y-auto",
  style53_7: "w-full max-w-4xl",
  style99_8: "fixed bottom-20 left-4 right-4 z-[999] max-w-sm mx-auto p-4 rounded-2xl bg-[#0F172A]/90 border border-[#14B8A6]/20 backdrop-blur-xl shadow-2xl flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-5",
  style100_9: "flex flex-col gap-1 text-right",
  style101_10: "text-sm font-black text-white",
  style102_11: "text-[11px] text-[#94A3B8] font-bold leading-normal",
  style106_12: "flex justify-end gap-2",
  style109_13: "h-8 rounded-lg bg-[#14B8A6] text-[#031315] font-extrabold text-[11px] hover:bg-[#2DD4BF] px-4 cursor-pointer",
  style116_14: "h-8 rounded-lg text-gray-400 hover:text-white text-[11px] px-3",
} as const;




function AppOrchestrator() {
  const { user, loading } = useAuth();
  const [currentPath, setCurrentPath] = useState(typeof window !== 'undefined' ? window.location.pathname : '/');

  // Activate the security guard middleware
  useSovereignRouteGuard(user);

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };
    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  if (loading) {
    return (
      <div className={styles.style35_1}>
        <div className={styles.style36_2}>
          <div className={styles.style37_3} />
        </div>
        <div className={styles.style39_4}>الرادار الذكي</div>
        <div className={styles.style40_5}>جاري التحقق من الجلسة...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  // Isolated route island for advertiser dashboard.
  if (currentPath === '/advertiser/dashboard' && user?.role === 'advertiser') {
    return (
      <div className={styles.style52_6}>
        <div className={styles.style53_7}>
          <AdvertiserPortal onClose={() => {
            window.history.pushState(null, '', '/');
            window.dispatchEvent(new PopStateEvent('popstate'));
          }} />
        </div>
      </div>
    );
  }

  // Route each role through its active operations provider.
  if (user.role === 'driver') {
    return (
      <DriverOperationsProvider>
        <Dashboard />
      </DriverOperationsProvider>
    );
  }

  if (user.role === 'rider') {
    return (
      <RiderOperationsProvider>
        <Dashboard />
      </RiderOperationsProvider>
    );
  }

  return <Dashboard />;
}

function PwaUpdater() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered:', r);
    },
    onRegisterError(error) {
      console.error('SW Registration Error:', error);
    },
  });

  if (!needRefresh) return null;

  return (
    <div className={styles.style99_8}>
      <div className={styles.style100_9} dir="rtl">
        <h4 className={styles.style101_10}>تحديث جديد متاح 🚀</h4>
        <p className={styles.style102_11}>
          تم إطلاق ميزات جديدة، يرجى تحديث التطبيق للحصول على أفضل أداء.
        </p>
      </div>
      <div className={styles.style106_12}>
        <Button
          onClick={() => updateServiceWorker(true)}
          className={styles.style109_13}
        >
          تحديث الآن
        </Button>
        <Button
          onClick={() => setNeedRefresh(false)}
          variant="ghost"
          className={styles.style116_14}
        >
          لاحقاً
        </Button>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SovereignErrorBoundary>
        <AppOrchestrator />
      </SovereignErrorBoundary>
      <Toaster />
      <PwaUpdater />
    </AuthProvider>
  );
}
