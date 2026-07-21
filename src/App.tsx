'use client';

import React, { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from '@/hooks/use-auth';
import { RiderOperationsProvider } from '@/hooks/use-rider-operations';
import { DriverOperationsProvider } from '@/hooks/use-driver-operations';
import { Dashboard } from '@/components/dashboard';
import LoginPage from '@/components/auth/login-page';
import { useSovereignRouteGuard } from '@/app/routes';
import { AdvertiserPortal } from '@/components/dashboard/advertiser-portal';
import { SovereignErrorBoundary } from '@/components/sovereign-error-boundary';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from '@/components/ui/button';



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
      <div className="flex h-dvh w-screen select-none flex-col items-center justify-center bg-[#0B0F19] text-white/90">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 shadow-[0_0_30px_rgba(20,184,166,0.18)]">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#14B8A6]/25 border-t-[#14B8A6]" />
        </div>
        <div className="mt-5 animate-pulse text-xl font-black tracking-normal">الرادار الذكي</div>
        <div className="mt-2 text-xs font-bold text-[#94A3B8]">جاري التحقق من الجلسة...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  // Isolated route island for advertiser dashboard.
  if (currentPath === '/advertiser/dashboard' && user?.role === 'advertiser') {
    return (
      <div className="min-h-screen w-full bg-[#0B1120] text-white p-4 sm:p-8 flex items-center justify-center overflow-y-auto">
        <div className="w-full max-w-4xl">
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
    <div className="fixed bottom-20 left-4 right-4 z-[999] max-w-sm mx-auto p-4 rounded-2xl bg-[#0F172A]/90 border border-[#14B8A6]/20 backdrop-blur-xl shadow-2xl flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-5">
      <div className="flex flex-col gap-1 text-right" dir="rtl">
        <h4 className="text-sm font-black text-white">تحديث جديد متاح 🚀</h4>
        <p className="text-[11px] text-[#94A3B8] font-bold leading-normal">
          تم إطلاق ميزات جديدة، يرجى تحديث التطبيق للحصول على أفضل أداء.
        </p>
      </div>
      <div className="flex justify-end gap-2">
        <Button
          onClick={() => updateServiceWorker(true)}
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
