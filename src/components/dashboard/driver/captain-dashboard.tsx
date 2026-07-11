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

  const walletIsReady = wallet.walletLoadState === 'ready';
  const currentBalance = walletIsReady ? wallet.balanceJD : 0;

  // Time conversion constants
  const TEST_PRICE_PER_HOUR = 200; 
  const totalPaidHours = currentBalance / TEST_PRICE_PER_HOUR;
  const paidHours = Math.floor(totalPaidHours);
  const paidMinutesCalculated = Math.round((totalPaidHours - paidHours) * 60);
  const paidMinutes = paidHours * 60 + paidMinutesCalculated;

  const totalExtraHours = currentBalance > 0 ? paidHours * 0.4 : 0;
  const extraHours = Math.floor(totalExtraHours);
  const extraMinutesCalculated = Math.round((totalExtraHours - extraHours) * 60);
  const bonusMinutes = extraHours * 60 + extraMinutesCalculated;

  return (
    <RadarMapView
      language={language}
      isActive={driverOps.driverStatus === 'active' || driverOps.driverStatus === 'busy'}
      driverLocation={driverOps.driverLocation}
      currentH3Cell={driverOps.currentH3Cell}
      paidMinutes={paidMinutes}
      bonusMinutes={bonusMinutes}
      requests={driverOps.requests}
      onSelectRequest={() => driverOps.toggleRequestList(true)}
      onIgnoreRequest={driverOps.rejectRequest}
    />
  );
};
