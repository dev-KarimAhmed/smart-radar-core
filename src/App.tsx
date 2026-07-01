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
      <div className="flex select-none flex-col h-screen w-screen items-center justify-center bg-black text-white/90">
        <div className="text-xl font-headline tracking-widest animate-pulse">رادار النبض السيادي</div>
        <div className="text-xs text-white/40 mt-2 font-mono">Loading telemetry feeds...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  // 🛡️ [RAD-CMD-064]: Isolated Route Island for Advertiser Dashboard
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

  // 🛡️ Conditional isolation of operations context providers based on role
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

export default function App() {
  return (
    <AuthProvider>
      <SovereignErrorBoundary>
        <AppOrchestrator />
      </SovereignErrorBoundary>
      <Toaster />
    </AuthProvider>
  );
}
