'use client';

import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { NetworkIndicator } from '@/components/layout/network-indicator';
import { PwaInstallPrompt } from '@/components/layout/pwa-install-prompt';
import { AuthProvider } from '@/hooks/use-auth';
import { RiderOperationsProvider } from '@/hooks/use-rider-operations';
import { DriverOperationsProvider } from '@/hooks/use-driver-operations';
import { AdStatsProvider } from '@/hooks/use-ad-stats.tsx';

/**
 * 🏛️ [SCR-CMD-FIX-ARCH-FINAL] The Sovereign Steel Umbrella
 * All providers are now unconditionally nested to ensure that any component
 * anywhere in the app can access its required context without causing a crash.
 * The hooks themselves are designed to be idle if the user's role doesn't match,
 * preventing any additional resource consumption. This definitively solves the
 * recurring context isolation error.
 */
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <DriverOperationsProvider>
        <RiderOperationsProvider>
          <AdStatsProvider>
            <NetworkIndicator />
            {children}
            <PwaInstallPrompt />
            <Toaster />
          </AdStatsProvider>
        </RiderOperationsProvider>
      </DriverOperationsProvider>
    </AuthProvider>
  );
}
