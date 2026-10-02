'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { AdStage } from '@/features/ads/ad-stage/contract';
import { AppHeader } from '@/shared/components/layout/app-header';
import { RecoveryEmailBanner } from '@/features/auth/contract';
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
import { useTranslations } from "next-intl";

const RiderView = dynamic(
  () => import('./rider-view').then((module) => module.RiderViewTab),
  { loading: function Loading() {
      const tAuto = useTranslations('auto'); const t = useTranslations('auto'); return <RouteLoading label={tAuto('key_1b555d14')} />; } },
);
const HistoryScreen = dynamic(
  () => import('@/features/account/history/contract').then((module) => module.HistoryTab),
  { loading: function Loading() {
      const tAuto = useTranslations('auto'); const t = useTranslations('auto'); return <RouteLoading label={tAuto('key_a14eef96')} />; } },
);
const ProfileScreen = dynamic(
  () => import('@/features/account/profile/contract').then((module) => module.ProfileTab),
  { loading: function Loading() {
      const tAuto = useTranslations('auto'); const t = useTranslations('auto'); return <RouteLoading label={tAuto('key_890243fa')} />; } },
);
const VaultScreen = dynamic(
  () => import('@/features/account/vault/contract').then((module) => module.VaultTab),
  { loading: function Loading() {
      const tAuto = useTranslations('auto'); const t = useTranslations('auto'); return <RouteLoading label={tAuto('key_4ccb93e5')} />; } },
);

const styles = {
  root: 'flex min-h-screen w-full flex-col bg-[#0A0F1D] text-white lg:h-screen lg:overflow-hidden',
  header: 'sticky top-0 z-[100] w-full shrink-0 lg:hidden',
  main: 'relative flex w-full flex-1 flex-col overflow-y-visible lg:h-screen lg:min-h-0 lg:overflow-hidden',
  mainShifted: 'lg:ps-[288px]',
  mainStandby: 'h-[calc(100dvh-120px)] overflow-hidden',
  adStage: 'relative z-[80] flex w-full flex-1 flex-col border-b-2 border-[#14B8A6]/20 shadow-[0_10px_30px_rgba(20,184,166,0.08)]',
  content: 'w-full flex-1 p-4 md:p-8',
  recoveryPrompt: 'absolute top-4 start-4 end-4 z-[200] empty:hidden lg:start-[320px] lg:end-8',
  contentHome: 'p-0 md:p-0 lg:p-0',
  contentInner: 'min-h-0 overflow-y-auto px-0 py-4 md:px-0 md:py-6',
  contentHidden: 'hidden',
  footer: 'sticky bottom-0 z-[100] w-full shrink-0 lg:hidden',
} as const;

const CRITICAL_RIDER_STATES = ['searching', 'busy', 'rating', 'checkpoint_required'];

export function RiderShell() {
    const tAuto = useTranslations('auto');
    const t = useTranslations('auto');
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

  if (loading) return <RouteLoading fullscreen label={dashboardLanguage.language === 'ar' ? tAuto('key_4e3169c6') : 'Loading platform...'} />;

  const exitRequestFlow = () => {
    setShowRequestFlow(false);
    setHasRequestedRideOnce(false);
  };

  const content = hash === '#vault'
    ? <VaultScreen />
    : hash === '#history'
      ? <HistoryScreen />
      : hash === '#profile'
        ? <ProfileScreen />
        : <RiderView onExitRequestFlow={exitRequestFlow} isStandbyDismissed={hasRequestedRideOnce} />;

  return (
    <div className={styles.root}>
      {user ? (
        <DesktopRiderSidebar
          hash={hash}
          language={dashboardLanguage.language}
          logout={logout}
          onNotify={() => window.dispatchEvent(new CustomEvent('open-app-notifications'))}
          user={user}
          isCritical={false}
        />
      ) : null}
      <header className={styles.header}><AppHeader sidebar={<AppSidebar isCritical={false} />} /></header>
      <main className={cn(styles.main, !isHome && styles.mainShifted, isStandby && styles.mainStandby)}>
        {isCritical && !isHome && (
          <div className="sticky top-0 z-[150] flex items-center justify-between border-b border-[#14B8A6]/40 bg-[#0C1527]/95 px-4 py-2.5 shadow-lg backdrop-blur-md">
            <div className="flex items-center gap-2 text-xs font-bold text-[#14F5D5]">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#14F5D5] opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#14F5D5]" />
              </span>
              <span>{dashboardLanguage.language === 'ar' ? 'لديك رحلة جارية الآن' : 'Active trip in progress'}</span>
            </div>
            <button
              type="button"
              onClick={() => { window.location.hash = '#'; }}
              className="rounded-xl border border-[#14B8A6]/40 bg-[#14B8A6]/20 px-3 py-1 text-xs font-black text-[#14F5D5] transition hover:bg-[#14B8A6]/30 cursor-pointer"
            >
              {dashboardLanguage.language === 'ar' ? 'العودة للتتبع' : 'Return to trip'}
            </button>
          </div>
        )}
        {isStandby ? (
          <div className={styles.adStage}>
            <AdStage audience="rider" isFullScreen onRequestRideClick={() => setShowRequestFlow(true)} />
          </div>
        ) : null}
        <div className={styles.recoveryPrompt}><RecoveryEmailBanner /></div>
        <div className={cn(styles.content, isHome ? styles.contentHome : styles.contentInner, isStandby && styles.contentHidden)}>
          <RouteErrorBoundary>{content}</RouteErrorBoundary>
        </div>
      </main>
      <footer className={styles.footer}><BottomNav /></footer>
    </div>
  );
}
