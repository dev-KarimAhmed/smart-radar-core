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
import { ShieldAlert, AlertTriangle } from 'lucide-react';
import { useTranslations } from "next-intl";
import { useReferralListener } from '@/features/referral/hooks/use-referral-listener';
import { ReferralConflictModal } from '@/features/referral/components/referral-conflict-modal';

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
const NotificationsScreen = dynamic(
  () => import('@/features/account/components/notifications-tab').then((module) => module.NotificationsTab),
  { loading: function Loading() { return <RouteLoading label="Loading..." />; } },
);

const styles = {
  root: 'flex min-h-screen w-full flex-col bg-[#0A0F1D] text-white lg:h-screen lg:overflow-hidden',
  header: 'sticky top-0 z-[100] w-full shrink-0 lg:hidden',
  main: 'relative flex w-full flex-1 flex-col overflow-y-visible lg:h-screen lg:min-h-0 lg:overflow-hidden',
  mainShifted: 'lg:ps-[288px]',
  mainStandby: 'h-[calc(100dvh-120px)] overflow-hidden flex flex-col justify-start items-center pt-2 lg:h-full lg:justify-center lg:pt-0',
  adStage: 'relative z-[80] flex w-full flex-1 flex-col justify-start items-center pt-2 border-b-2 border-[#14B8A6]/20 shadow-[0_10px_30px_rgba(20,184,166,0.08)] lg:h-full lg:justify-center lg:pt-0',
  content: 'w-full flex-1 p-4 md:p-8',
  contentHome: 'p-0 md:p-0 lg:p-0',
  contentInner: 'min-h-0 overflow-y-auto scrollbar-thin px-0 py-4 md:px-0 md:py-6',
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
  const isArabic = dashboardLanguage.language === 'ar';
  const { conflictModalInfo, closeConflictModal } = useReferralListener(isArabic);
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
      if (typeof window !== 'undefined' && window.location.hash && window.location.hash !== '#') {
        window.location.hash = '#';
      }
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

  if (riderOperations?.accountSecurityStatus === 'BANNED') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0F19] p-6 text-center text-white" dir={dashboardLanguage.isArabic ? 'rtl' : 'ltr'}>
        <div className="max-w-md w-full space-y-5 rounded-3xl border border-rose-500/40 bg-[#160808]/95 p-7 text-center text-white shadow-2xl backdrop-blur-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/15 border border-rose-500/30">
            <ShieldAlert className="h-9 w-9 text-rose-500 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-black text-rose-200">
              {dashboardLanguage.isArabic ? 'حساب المستخدم محظور نهائياً 🚫' : 'Rider Account Permanently Banned 🚫'}
            </h1>
            <p className="text-xs leading-6 text-rose-100/80">
              {dashboardLanguage.isArabic
                ? 'تم حظر حسابك نهائياً من قبل إدارة المنظومة لمخالفة المعايير التشغيلية والسيادية. تم إيقاف طلب الرحلات وعزل الحساب عن الرادار.'
                : 'Your account has been permanently banned by platform administration due to policy violations. Ride requests and radar access have been disabled.'}
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex items-center justify-center rounded-2xl bg-rose-500/20 border border-rose-500/50 px-6 py-2.5 text-xs font-black text-rose-300 hover:bg-rose-500/30 transition shadow-lg cursor-pointer"
            >
              {dashboardLanguage.isArabic ? 'تسجيل الخروج' : 'Log Out'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (riderOperations?.accountSecurityStatus === 'SUSPENDED') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0F19] p-6 text-center text-white" dir={dashboardLanguage.isArabic ? 'rtl' : 'ltr'}>
        <div className="max-w-md w-full space-y-5 rounded-3xl border border-amber-500/40 bg-[#171208]/95 p-7 text-center text-white shadow-2xl backdrop-blur-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/30">
            <AlertTriangle className="h-9 w-9 text-amber-500 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-black text-amber-200">
              {dashboardLanguage.isArabic ? 'حساب المستخدم معلق مؤقتاً ⚠️' : 'Rider Account Suspended ⚠️'}
            </h1>
            <p className="text-xs leading-6 text-amber-100/80">
              {dashboardLanguage.isArabic
                ? 'تم تعليق حسابك مؤقتاً من قبل إدارة العمليات لمراجعة معايير النزاهة والمناعة السلوكية. يرجى مراجعة الإدارة أو التواصل مع الدعم لفك التعليق وتنشيط الحساب.'
                : 'Your account is temporarily suspended by platform administration to review behavioral immunity standards. Please contact support.'}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => void riderOperations.refreshSecurityStatus()}
              className="inline-flex items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-500/50 px-5 py-2.5 text-xs font-black text-amber-300 hover:bg-amber-500/30 transition shadow-lg cursor-pointer"
            >
              {dashboardLanguage.isArabic ? 'تحديث الحالة 🔄' : 'Refresh 🔄'}
            </button>
            <button
              type="button"
              onClick={() => void logout()}
              className="inline-flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 px-5 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/10 transition cursor-pointer"
            >
              {dashboardLanguage.isArabic ? 'تسجيل الخروج' : 'Log Out'}
            </button>
          </div>
        </div>
      </div>
    );
  }

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
        : hash === '#notifications'
          ? <NotificationsScreen onClose={() => { window.location.hash = '#'; }} />
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
          isRideFlowActive={showRequestFlow || isCritical}
        />
      ) : null}
      <header className={styles.header}><AppHeader sidebar={<AppSidebar isCritical={false} />} /></header>
      <main className={cn(styles.main, Boolean(user) && styles.mainShifted, isStandby && styles.mainStandby)}>
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
            <AdStage
              audience="rider"
              isFullScreen
              onRequestRideClick={() => {
                setShowRequestFlow(true);
                window.dispatchEvent(new CustomEvent('rider-open-destination'));
              }}
            />
          </div>
        ) : null}
        <div className={cn(styles.content, isHome ? styles.contentHome : styles.contentInner, isStandby && styles.contentHidden)}>
          <RouteErrorBoundary>{content}</RouteErrorBoundary>
        </div>
      </main>
      <footer className={styles.footer}><BottomNav /></footer>

      <ReferralConflictModal
        open={conflictModalInfo.open}
        onClose={closeConflictModal}
        existingCaptainName={conflictModalInfo.existingCaptainName}
        existingCaptainSerial={conflictModalInfo.existingCaptainSerial}
        isArabic={isArabic}
      />
    </div>
  );
}
