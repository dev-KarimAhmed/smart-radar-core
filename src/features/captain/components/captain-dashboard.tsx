'use client';

import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { useDriverOperations } from '../hooks/use-driver-operations';
import { useSovereignWallet } from '@/hooks/use-sovereign-wallet';
import dynamic from 'next/dynamic';

const styles = {
  style26_1: "rounded-3xl border border-emerald-500/20 bg-[#05080f] p-6 text-center text-slate-400",
} as const;

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
      <section className={styles.style26_1}>
        {language === 'ar' ? 'جاري تحميل لوحة الكابتن...' : 'Loading captain dashboard...'}
      </section>
    );
  }

  const walletIsReady = wallet.walletLoadState === 'ready';
  const paidMinutes = walletIsReady ? wallet.paidMinutesRemaining : 0;
  const bonusMinutes = walletIsReady ? wallet.bonusMinutesRemaining : 0;

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
