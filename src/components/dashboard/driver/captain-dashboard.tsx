'use client';

import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { useDriverOperations } from '@/hooks/use-driver-operations';
import { useSovereignWallet } from '@/hooks/use-sovereign-wallet';
import dynamic from 'next/dynamic';
const RadarMapView = dynamic(() => import('./radar-map-view').then(m => m.RadarMapView), { ssr: false });

interface CaptainDashboardProps {
  captainProfile?: {
    walletHours?: number;
    bonusHours?: number;
  };
}

export const RadarCaptainDashboard: React.FC<CaptainDashboardProps> = ({ captainProfile }) => {
  const { user } = useAuth();
  const { language } = useDashboardLanguage();
  const driverOps = useDriverOperations();
  const wallet = useSovereignWallet(user);

  if (!driverOps) {
    return (
      <section className="rounded-3xl border border-emerald-500/20 bg-[#05080f] p-6 text-center text-slate-400">
        {language === 'ar' ? 'جاري تحميل لوحة الكابتن...' : 'Loading captain dashboard...'}
      </section>
    );
  }

  return (
    <RadarMapView
      language={language}
      isActive={driverOps.driverStatus === 'active' || driverOps.driverStatus === 'busy'}
      driverLocation={driverOps.driverLocation}
      currentH3Cell={driverOps.currentH3Cell}
      paidMinutes={wallet.walletLoaded ? wallet.paidMinutesRemaining : captainProfile?.walletHours ?? 0}
      bonusMinutes={wallet.walletLoaded ? wallet.bonusMinutesRemaining : captainProfile?.bonusHours ?? 0}
      requests={driverOps.requests}
      onSelectRequest={() => driverOps.toggleRequestList(true)}
      onIgnoreRequest={driverOps.rejectRequest}
    />
  );
};
