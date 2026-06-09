'use client';

import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider, useAuth } from '@/hooks/use-auth';
import { RiderOperationsProvider } from '@/hooks/use-rider-operations';
import { DriverOperationsProvider } from '@/hooks/use-driver-operations';
import { AdStatsProvider } from '@/hooks/use-ad-stats';
import { Dashboard } from '@/components/dashboard';
import LoginPage from '@/components/auth/login-page';

function AppOrchestrator() {
  const { user, loading } = useAuth();

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

  return <Dashboard />;
}

export default function App() {
  return (
    <AuthProvider>
      <DriverOperationsProvider>
        <RiderOperationsProvider>
          <AdStatsProvider>
            <AppOrchestrator />
            <Toaster />
          </AdStatsProvider>
        </RiderOperationsProvider>
      </DriverOperationsProvider>
    </AuthProvider>
  );
}
