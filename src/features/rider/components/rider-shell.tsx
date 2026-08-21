'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { AdStage } from '@/features/ads/ad-stage/contract';
import { AppHeader } from '@/shared/components/layout/app-header';
import { BottomNav } from '@/shared/components/layout/bottom-nav';
import { RouteErrorBoundary } from '@/shared/components/layout/route-error-boundary';
import { RouteLoading } from '@/shared/components/layout/route-loading';
import { useAuth } from '@/hooks/use-auth';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { useRiderOperations } from '../hooks/use-rider-operations';
import { AppSidebar } from './app-sidebar';
import { DesktopRiderSidebar } from './desktop-rider-sidebar';

const RiderView = dynamic(
  () => import('./rider-view').then((module) => module.RiderViewTab),
  { loading: () => <RouteLoading label="جاري تحميل رحلة الراكب..." /> },
);
const HistoryScreen = dynamic(
  () => import('@/features/account/history/contract').then((module) => module.HistoryTab),
  { loading: () => <RouteLoading label="جاري تحميل الرحلات..." /> },
);
const ProfileScreen = dynamic(
  () => import('@/features/account/profile/contract').then((module) => module.ProfileTab),
  { loading: () => <RouteLoading label="جاري تحميل الحساب..." /> },
);
const VaultScreen = dynamic(
  () => import('@/features/account/vault/contract').then((module) => module.VaultTab),
  { loading: () => <RouteLoading label="جاري تحميل الخزنة..." /> },
);

const styles = {
  root: 'flex min-h-screen w-full flex-col bg-[#0A0F1D] text-white lg:h-screen lg:overflow-hidden',
  header: 'sticky top-0 z-[100] w-full shrink-0 lg:hidden',
  main: 'relative flex w-full flex-1 flex-col overflow-y-visible lg:h-screen lg:min-h-0 lg:overflow-hidden',
  mainShifted: 'lg:ps-[288px]',
  mainStandby: 'h-[calc(100vh-120px)] overflow-hidden',
  adStage: 'relative z-[80] flex w-full flex-1 flex-col border-b-2 border-[#14B8A6]/20 shadow-[0_10px_30px_rgba(20,184,166,0.08)]',
  content: 'w-full flex-1 p-4 md:p-8',
  contentHome: 'p-0 md:p-0 lg:p-0',
  contentInner: 'min-h-0 overflow-y-auto px-0 py-4 md:px-0 md:py-6',
  contentHidden: 'hidden',
  footer: 'sticky bottom-0 z-[100] w-full shrink-0 lg:hidden',
} as const;

const CRITICAL_RIDER_STATES = ['searching', 'busy', 'rating', 'checkpoint_required'];

export function RiderShell() {
  const { loading, logout, user } = useAuth();
  const { toast } = useToast();
  const dashboardLanguage = useDashboardLanguage();
  const riderOperations = useRiderOperations();
  const [hash, setHash] = useState('#');
  const [showRequestFlow, setShowRequestFlow] = useState(false);
  const [hasRequestedRideOnce, setHasRequestedRideOnce] = useState(false);
  const tripStatus = riderOperations?.tripStatus || 'idle';

  useEffect(() => {
    const updateHash = () => setHash(window.location.hash || '#');
    updateHash();
    window.addEventListener('hashchange', updateHash);
    return () => window.removeEventListener('hashchange', updateHash);
  }, []);

  useEffect(() => {
    const handleExit = () => {
      setShowRequestFlow(false);
      setHasRequestedRideOnce(false);
    };
    const handleOpen = () => {
      setShowRequestFlow(true);
      setHasRequestedRideOnce(true);
    };
    window.addEventListener('exit-request-flow', handleExit);
    window.addEventListener('rider-open-destination', handleOpen);
    return () => {
      window.removeEventListener('exit-request-flow', handleExit);
      window.removeEventListener('rider-open-destination', handleOpen);
    };
  }, []);

  const isCritical = CRITICAL_RIDER_STATES.includes(tripStatus);
  const isHome = hash === '#' || hash === '' || hash === '#/';
  const isStandby = useMemo(
    () => isHome && !isCritical && !hasRequestedRideOnce && !showRequestFlow,
    [hasRequestedRideOnce, isCritical, isHome, showRequestFlow],
  );

  if (loading) return <RouteLoading fullscreen label={dashboardLanguage.language === 'ar' ? 'جاري تحميل المنصة...' : 'Loading platform...'} />;

  const exitRequestFlow = () => {
    setShowRequestFlow(false);
    setHasRequestedRideOnce(false);
  };

  const content = !isCritical && hash === '#vault'
    ? <VaultScreen />
    : !isCritical && hash === '#history'
      ? <HistoryScreen />
      : !isCritical && hash === '#profile'
        ? <ProfileScreen />
        : <RiderView onExitRequestFlow={exitRequestFlow} isStandbyDismissed={hasRequestedRideOnce} />;

  return (
    <div className={styles.root}>
      {user ? (
        <DesktopRiderSidebar
          hash={hash}
          language={dashboardLanguage.language}
          logout={logout}
          onNotify={() => toast({ title: 'التنبيهات', description: 'لا توجد تنبيهات جديدة حاليا.' })}
          user={user}
        />
      ) : null}
      <header className={styles.header}><AppHeader sidebar={<AppSidebar />} /></header>
      <main className={cn(styles.main, !isHome && styles.mainShifted, isStandby && styles.mainStandby)}>
        {isStandby ? (
          <div className={styles.adStage}>
            <AdStage audience="rider" isFullScreen onRequestRideClick={() => setShowRequestFlow(true)} />
          </div>
        ) : null}
        <div className={cn(styles.content, isHome ? styles.contentHome : styles.contentInner, isStandby && styles.contentHidden)}>
          <RouteErrorBoundary>{content}</RouteErrorBoundary>
        </div>
      </main>
      <footer className={styles.footer}><BottomNav /></footer>
    </div>
  );
}
