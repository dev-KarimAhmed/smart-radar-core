'use client';

import { useAuth } from '@/hooks/use-auth';
import { AppHeader } from '../app-header';
import { SovereignErrorBoundary } from '../sovereign-error-boundary';
import { BottomNav } from '../layout/bottom-nav';
import { AdStage } from './ad-stage';
import { SpeedSentry } from '@/shared/components/speed-sentry';

import { useRiderOperations } from '@/hooks/use-rider-operations';
import { useDriverOperations } from '@/hooks/use-driver-operations';
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Archive, Bell, History, Home, Languages, Loader2, LogOut, PlusCircle, User, Wallet } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import type { AppLanguage } from '@/lib/i18n/simple-copy';
import { cn } from '@/lib/utils';

// [بروتوكول الاقتران الضعيف]: استدعاء قمرات التحكم والتبويبات لا مركزياً ولحظياً عند الطلب
const DriverViewTab = React.lazy(() => import('./driver-view-tab').then(m => ({ default: m.DriverViewTab })));
const RiderViewTab = React.lazy(() => import('./rider-view-tab').then(m => ({ default: m.RiderViewTab })));
const WalletTab = React.lazy(() => import('./wallet-tab').then(m => ({ default: m.WalletTab })));
const ProfileTab = React.lazy(() => import('./profile-tab').then(m => ({ default: m.ProfileTab })));
const HistoryTab = React.lazy(() => import('./history-tab').then(m => ({ default: m.HistoryTab })));
const VaultTab = React.lazy(() => import('./vault-tab').then(m => ({ default: m.VaultTab })));
const DelegatePortal = React.lazy(() => import('./delegate-portal').then(m => ({ default: m.DelegatePortal })));
const AdminViewTab = React.lazy(() => import('./admin-view-tab').then(m => ({ default: m.AdminViewTab })));

function SovereignLockoutView({ user, logout }: { user: any, logout: () => void }) {
 const [timeLeft, setTimeLeft] = useState<number>(1800);

 useEffect(() => {
 if (!user?.uid) return;
 const key = `sovereign_lockout_deadline_${user.uid}`;
 let deadlineStr = localStorage.getItem(key);
 let deadline = 0;
 if (!deadlineStr) {
 deadline = Date.now() + 30 * 60 * 1000;
 localStorage.setItem(key, deadline.toString());
 } else {
 deadline = parseInt(deadlineStr, 10);
 if (isNaN(deadline)) {
 deadline = Date.now() + 30 * 60 * 1000;
 localStorage.setItem(key, deadline.toString());
 }
 }

 const updateTimer = () => {
 const now = Date.now();
 const diffSecs = Math.max(0, Math.floor((deadline - now) / 1000));
 setTimeLeft(diffSecs);
 };

 updateTimer();
 const interval = setInterval(updateTimer, 1000);
 return () => clearInterval(interval);
 }, [user]);

 const minutes = Math.floor(timeLeft / 60);
 const seconds = timeLeft % 60;
 const timeStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
 const isExpired = timeLeft <= 0;

 return (
 <div className="flex items-center justify-center p-4 min-h-[60vh] font-sans pointer-events-auto">
 <div className="w-full max-w-md bg-[#0D0505] border border-red-500/20 rounded-2xl p-6 text-center space-y-5 shadow-xl shadow-red-950/20 relative overflow-hidden">
 <div className="absolute top-0 left-0 w-full h-1 bg-red-600 animate-pulse" />
 <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mx-auto text-red-500 animate-pulse text-2xl">🚫</div>
 <h2 className="text-xl font-bold text-red-400">تم إيقاف الحساب مؤقتاً</h2>
 <div className="py-4 px-6 bg-red-950/15 border border-red-500/10 rounded-xl space-y-2">
 <p className="text-[11px] uppercase tracking-wider text-red-500 font-bold">الوقت المتبقي قبل إغلاق الجلسة</p>
 <div className="text-3xl font-black text-red-400 tracking-widest font-mono">{isExpired ? "00:00" : timeStr}</div>
 <p className="text-[10px] text-red-400/70 font-bold animate-pulse">
 {isExpired ? "انتهت المهلة. يرجى التواصل مع الدعم." : `متبقي لديك ${minutes} دقيقة و ${seconds} ثانية.`}
 </p>
 </div>
 <p className="text-sm text-gray-300 leading-relaxed text-right">
 عذراً {user?.role === 'driver' ? 'سائق' : 'راكب'} <span className="text-white font-bold">{user?.name}</span>، تم إيقاف الحساب مؤقتاً بسبب انخفاض التقييم أو مخالفة شروط استخدام الخدمة.
 </p>
 </div>
 </div>
 );
}

function DashboardLayout() {
 const { isSovereign, isCaptain, isPassenger, user, loading, logout } = useAuth();
 const { toast } = useToast();
 const dashboardLanguage = useDashboardLanguage();
 const [hash, setHash] = useState('#');
 const riderOps = useRiderOperations() || {} as any;
 const driverOps = useDriverOperations() || {} as any;

  const [showRequestFlow, setShowRequestFlow] = useState(false);
  const [hasRequestedRideOnce, setHasRequestedRideOnce] = useState(false);

 useEffect(() => {
   setHash(window.location.hash || '#');
   const handleHashChange = () => {
     setHash(window.location.hash || '#');
   };
   window.addEventListener('hashchange', handleHashChange);
   return () => window.removeEventListener('hashchange', handleHashChange);
 }, []);

 const tripStatus = useMemo(() => isPassenger ? (riderOps?.tripStatus || 'idle') : 'idle', [isPassenger, riderOps?.tripStatus]);
 const driverStatus = useMemo(() => isCaptain ? (driverOps?.driverStatus || 'idle') : 'idle', [isCaptain, driverOps?.driverStatus]);

 // 🩸 [بروتوكول الربط الشرياني]: قفل مسارات المستخدم الإجبارية لمنع تمزق الواجهات وفقدان الذاكرة المرحلية
 useEffect(() => {
 const criticalRiderStates = ['searching', 'busy', 'rating', 'checkpoint_required'];
 const criticalDriverStates = ['busy', 'rating'];

 if (hash !== '#' && hash !== '' && hash !== '#/') {
 if (isPassenger && criticalRiderStates.includes(tripStatus)) {
 window.location.hash = '#';
 } else if (isCaptain && criticalDriverStates.includes(driverStatus)) {
 window.location.hash = '#';
 }
 }
 }, [hash, tripStatus, driverStatus, isPassenger, isCaptain]);

 useEffect(() => {
   if (isPassenger) {
     const criticalRiderStates = ['searching', 'busy', 'rating', 'checkpoint_required'];
     if (criticalRiderStates.includes(tripStatus) || riderOps?.requestId) {
       setShowRequestFlow(true);
     }
   }
 }, [isPassenger, tripStatus, riderOps?.requestId]);

   useEffect(() => {
     const handleExitRequestFlow = () => {
       setShowRequestFlow(false);
       setHasRequestedRideOnce(false);
     };
     const handleOpenDestination = () => {
       setShowRequestFlow(true);
       setHasRequestedRideOnce(true);
     };
     window.addEventListener('exit-request-flow', handleExitRequestFlow);
     window.addEventListener('rider-open-destination', handleOpenDestination);
     return () => {
       window.removeEventListener('exit-request-flow', handleExitRequestFlow);
       window.removeEventListener('rider-open-destination', handleOpenDestination);
     };
   }, []);

   const isStandby = useMemo(() => {
     if (isSovereign) return false;
     if (isCaptain) return false;
     if (hash !== '#' && hash !== '' && hash !== '#/') return false;
 
     if (isPassenger) {
       const criticalRiderStates = ['searching', 'busy', 'rating', 'checkpoint_required'];
       if (criticalRiderStates.includes(tripStatus) || riderOps?.requestId) {
         return false;
       }
       if (hasRequestedRideOnce) {
         return false;
       }
       return !showRequestFlow;
     }
 
     return true;
   }, [isSovereign, hash, isPassenger, isCaptain, tripStatus, riderOps?.requestId, showRequestFlow, hasRequestedRideOnce]);

 const renderArterialBridge = () => {
  if (hash === '#' || hash === '' || hash === '#/') return null;

  const { isArabic, language } = dashboardLanguage;
  const chromeCopy = dashboardChromeCopy[language];

  if (isPassenger && ['searching', 'busy'].includes(tripStatus)) {
    const activeTrip = riderOps?.trip;
    const displayPrice = activeTrip?.offerPrice !== undefined && activeTrip?.offerPrice !== -1
      ? `${Number(activeTrip.offerPrice).toFixed(2)} ${chromeCopy.currency}`
      : chromeCopy.farePending;

    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg mx-auto bg-[#0F172A]/90 border border-[#14B8A6]/20 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-[0_15px_40px_rgba(20,184,166,0.1)] backdrop-blur-xl mb-6 pointer-events-auto"
        dir={isArabic ? 'rtl' : 'ltr'}
      >
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <div className={isArabic ? 'text-right' : 'text-left'}>
            <p className="text-xs font-black text-emerald-400 tracking-tight">{chromeCopy.activeTrip}</p>
            <p className="text-[10px] text-gray-400 font-bold mt-0.5">{chromeCopy.priceLabel}: <span className="text-white font-mono">{displayPrice}</span></p>
          </div>
        </div>

        <button
          onClick={() => { window.location.hash = '#'; }}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-lg transition-all duration-300 transform active:scale-95 pointer-events-auto z-[120]"
        >
          {chromeCopy.backToTrip}
        </button>
      </motion.div>
    );
  }

  if (isCaptain && driverStatus === 'busy') {
    const activeTrip = driverOps?.activeRequest;
    const displayPrice = activeTrip?.offerPrice !== undefined && activeTrip?.offerPrice !== -1
      ? `${Number(activeTrip.offerPrice).toFixed(2)} ${chromeCopy.currency}`
      : chromeCopy.farePending;

    return (
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg mx-auto bg-[#0F172A]/90 border border-[#14B8A6]/20 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-[0_15px_40px_rgba(20,184,166,0.1)] backdrop-blur-xl mb-6 pointer-events-auto"
        dir={isArabic ? 'rtl' : 'ltr'}
      >
        <div className="flex items-center gap-3">
          <span className="relative flex h-3 w-3 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <div className={isArabic ? 'text-right' : 'text-left'}>
            <p className="text-xs font-black text-emerald-400 tracking-tight">{chromeCopy.tripInProgress}</p>
            <p className="text-[10px] text-gray-400 font-bold mt-0.5">{chromeCopy.priceLabel}: <span className="text-white font-mono">{displayPrice}</span></p>
          </div>
        </div>

        <button
          onClick={() => { window.location.hash = '#'; }}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-lg transition-all duration-300 transform active:scale-95 pointer-events-auto z-[120]"
        >
          {chromeCopy.backToTrip}
        </button>
      </motion.div>
    );
  }

  return null;
};

 const renderContent = () => {
 if (isSovereign) {
 return (
 <React.Suspense fallback={
 <div className="flex flex-col items-center justify-center p-8 bg-[#0F172A]/60 border border-white/[0.06] rounded-2xl animate-pulse text-center space-y-4 backdrop-blur-md">
 <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto" />
 <p className="text-gray-400 text-xs font-sans">جاري تحميل لوحة التحكم...</p>
 </div>
 }>
 <AdminViewTab />
 </React.Suspense>
 );
 }

 const ratingValue = user?.rating !== undefined
 ? user.rating
 : (user?.ratingSum && user?.ratingCount ? user.ratingSum / user.ratingCount : 5.0);

 if (ratingValue < 4.2) {
 return <SovereignLockoutView user={user} logout={logout} />;
 }

 // 🛡️ [RAD-CMD-061]: Rider Memory Isolation & Decoupled Routing Layout
 if (user?.role === 'rider') {
 const isRequestModalOpen = riderOps?.isRequestModalOpen || false;
 const currentTripStatus = riderOps?.tripStatus || 'idle';
 const criticalRiderStates = ['searching', 'busy', 'rating', 'checkpoint_required'];

 // 🩸 [تحصين الذاكرة المرحلية للراكب]: إذا كانت الرحلة نشطة أو بحالة حرجة، نمنع إلغاء تحميل RiderViewTab تماماً مهما تغير الهش لمنع تمزق الواجهات وفقدان حالة تتبع المركبة
 if (criticalRiderStates.includes(currentTripStatus)) {
 return <RiderViewTab onExitRequestFlow={() => { setShowRequestFlow(false); setHasRequestedRideOnce(false); }} isStandbyDismissed={hasRequestedRideOnce} />;
 }

 if (hash === '#vault') return <VaultTab />;
 if (hash === '#history') return <HistoryTab />;
 if (hash === '#profile') return <ProfileTab />;

 return <RiderViewTab onExitRequestFlow={() => { setShowRequestFlow(false); setHasRequestedRideOnce(false); }} isStandbyDismissed={hasRequestedRideOnce} />;
 }

 if (user?.role === 'advertiser') {
 if (hash === '#wallet') return <WalletTab />;
 if (hash === '#vault') return <VaultTab />;
 if (hash === '#history') return <HistoryTab />;
 if (hash === '#profile') return <ProfileTab />;

 return (
 <div className="flex flex-col items-center justify-center p-6 text-center space-y-6 max-w-lg mx-auto bg-black/40 border border-emerald-500/15 rounded-2xl animate-fade-in my-8">
 <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto text-emerald-400 text-3xl animate-bounce">📣</div>
 <div className="space-y-2">
 <h2 className="text-xl font-bold text-emerald-400">لوحة المعلن</h2>
 <p className="text-xs text-gray-400 leading-relaxed max-w-md mx-auto">
 مرحباً بك. يمكنك إدارة حملاتك الإعلانية، حجز الباقات، ومتابعة النتائج من هنا.
 </p>
 </div>
 <div className="p-3.5 bg-emerald-950/20 border border-emerald-500/10 rounded-xl space-y-1 w-full text-right text-xs">
 <p className="text-emerald-400 font-bold">✓ البيانات المهنية الموثقة:</p>
 <p className="text-gray-300">🏢 اسم العلامة: <span className="font-bold text-white">{user.companyName || 'منشأة عامة'}</span></p>
 <p className="text-gray-300">📝 رقم الترخيص: <span className="font-mono text-white">{user.adLicense || 'معلقة التحديث'}</span></p>
 </div>
 <button
 onClick={() => {
 window.dispatchEvent(new CustomEvent('open-advertiser-portal'));
 }}
 className="w-full py-3 bg-emerald-600 hover:bg-emerald-50 hover:text-emerald-950 text-white font-black text-xs rounded-xl shadow-lg transition-all duration-300 transform active:scale-95 cursor-pointer"
 >
 فتح إدارة الحملات
 </button>
 </div>
 );
 }

 if (user?.role === 'delegate') {
 if (hash === '#wallet') return <WalletTab />;
 if (hash === '#vault') return <VaultTab />;
 if (hash === '#history') return <HistoryTab />;
 if (hash === '#profile') return <ProfileTab />;

 return <DelegatePortal />;
 }

 // إذا كان السائق في رحلة جارية، نمنع إلغاء تحميل DriverViewTab حتى لا تفقد الواجهة حالتها.
 const criticalDriverStates = ['busy', 'rating'];
 if (isCaptain && criticalDriverStates.includes(driverStatus)) {
 return <DriverViewTab />;
 }

 if (isCaptain) return <DriverViewTab />;

 if (hash === '#wallet') return <WalletTab />;
 if (hash === '#vault') return <VaultTab />;
 if (hash === '#history') return <HistoryTab />;
 if (hash === '#profile') return <ProfileTab />;

 return null;
 };

  const contentIsHidden = isStandby;
  const isRiderHomeSurface = user?.role === 'rider' && !contentIsHidden && (hash === '#' || hash === '' || hash === '#/');

  if (loading) {
    return (
      <div className="flex min-h-screen w-full flex-col items-center justify-center bg-[#0A0F1D] text-white">
        <Loader2 className="h-10 w-10 animate-spin text-[#14B8A6] mb-4" />
        <p className="text-sm font-bold text-gray-400">
          {dashboardLanguage.language === 'ar' ? 'جاري تحميل المنصة...' : 'Loading platform...'}
        </p>
      </div>
    );
  }

  return (
 // استخدام flex-col لضمان تدفق الصفحة (Doc Flow) والسماح بالتمرير الطبيعي
 <div className={cn('flex min-h-screen w-full flex-col bg-[#0A0F1D] text-white', !isCaptain && 'lg:h-screen lg:overflow-hidden')}>
 {user?.role === 'rider' && (
 <DesktopRiderSidebar
 hash={hash}
 language={dashboardLanguage.language}
 logout={logout}
 onNotify={() => toast({ title: 'التنبيهات', description: 'لا توجد تنبيهات جديدة حاليا.' })}
 user={user}
 />
 )}

 {/* الهيدر ثابت في الأعلى */}
 <header className="sticky top-0 z-[100] w-full shrink-0 lg:hidden">
 <AppHeader />
 </header>

 {/* المحتوى الرئيسي يتمدد ويسمح بالتمرير (Scroll) */}
 <main className={cn(
 'relative flex w-full flex-1 flex-col overflow-y-visible',
 isCaptain ? 'lg:min-h-screen lg:overflow-y-auto' : 'lg:h-screen lg:min-h-0 lg:overflow-hidden',
 user?.role === 'rider' && !isRiderHomeSurface && 'lg:ps-[288px]',
 isStandby && 'h-[calc(100vh-120px)] overflow-hidden'
 )}>

 {/* مسرح الإعلانات يأخذ مساحته الطبيعية في التدفق */}
 {isStandby && (
 <div className="w-full flex-1 flex flex-col relative z-[80] border-b-2 border-[#14B8A6]/20 shadow-[0_10px_30px_rgba(20,184,166,0.08)]">
  <AdStage isFullScreen={true} onRequestRideClick={() => setShowRequestFlow(true)} />
 </div>
 )}

 {/* الحاوية التي تحمل التبويبات (تسمح بالتمرير للأسفل) */}
 <div className={cn('w-full flex-1 p-4 md:p-8', contentIsHidden && 'hidden', user?.role === 'rider' && (isRiderHomeSurface ? 'p-0 md:p-0 lg:p-0' : 'px-0 md:px-0 py-4 md:py-6 min-h-0 overflow-y-auto'))}>
 {renderArterialBridge()}
 <SovereignErrorBoundary>
 <React.Suspense fallback={
 <div className="flex flex-col items-center justify-center p-8 bg-[#0F172A]/60 border border-white/[0.06] rounded-2xl animate-pulse text-center space-y-4 backdrop-blur-md">
 <Loader2 className="w-8 h-8 animate-spin text-[#14B8A6] mx-auto" />
 <p className="text-gray-400 text-xs font-sans">جاري تحميل الصفحة...</p>
 </div>
 }>
 {renderContent()}
 </React.Suspense>
 </SovereignErrorBoundary>
 </div>

 {isCaptain && <SpeedSentry />}
 </main>

 {/* الفوتر ثابت في الأسفل */}
 <footer className="sticky bottom-0 z-[100] w-full shrink-0 lg:hidden">
 <BottomNav />
 </footer>
 </div>
 );
}

function DesktopRiderSidebar({
 hash,
 language,
 logout,
 onNotify,
 user,
}: {
 hash: string;
 language: AppLanguage;
 logout: () => void;
 onNotify: () => void;
 user: any;
}) {
 const initials = getInitials(user?.name || user?.phone || 'R');
 const copy = dashboardChromeCopy[language];
  const items = [
    { href: '#', icon: Home, label: copy.nav.home },
    { href: '#history', icon: History, label: copy.nav.history },
    { href: '#vault', icon: Archive, label: copy.nav.vault },
    { href: '#profile', icon: User, label: copy.nav.profile },
  ];

 const { isArabic, toggleLanguage } = useDashboardLanguage();

 const openRideRequest = () => {
 window.location.hash = '#';
 window.dispatchEvent(new CustomEvent('rider-open-destination'));
 };

 return (
 <aside className="fixed inset-y-0 start-0 z-[140] hidden w-[288px] flex-col border-e border-white/[0.06] bg-[#0A0F1D]/95 shadow-[22px_0_70px_rgba(0,0,0,0.38)] backdrop-blur-xl lg:flex" dir={language === 'ar' ? 'rtl' : 'ltr'}>
 <div className="flex items-center gap-3 border-b border-white/10 p-5">
 <Avatar className="h-12 w-12 border border-[#14B8A6]/35 bg-[#101827]">
 <AvatarFallback className="bg-[#101827] text-sm font-black text-white">{initials}</AvatarFallback>
 </Avatar>

 <div className={cn('min-w-0', language === 'ar' ? 'text-right' : 'text-left')}>
 <p className={cn('truncate text-sm font-black text-white', language === 'ar' ? 'text-right' : 'text-left')}>{user?.name || copy.fallbackName}</p>
 <p className={cn('truncate text-xs font-bold text-[#14B8A6]', language === 'ar' ? 'text-right' : 'text-left')}>{user?.phone || copy.fallbackPhone}</p>
 </div>
 <Button
 type="button"
 variant="ghost"
 size="sm"
 onClick={toggleLanguage}
 aria-label={isArabic ? 'Switch to English' : 'التبديل إلى العربية'}
 title={isArabic ? 'English' : 'العربية'}
 className="ms-auto h-8 shrink-0 gap-1 rounded-lg border border-[#14B8A6]/25 bg-[#14B8A6]/10 px-2 text-[10px] font-black text-[#14F5D5] hover:bg-[#14B8A6]/20 hover:text-[#14F5D5]"
 >
 <Languages className="h-3.5 w-3.5" />
 <span>{isArabic ? 'EN' : 'ع'}</span>
 </Button>
 </div>

 <div className="space-y-3 p-4">
 <Button
 onClick={openRideRequest}
 className="h-12 w-full justify-center gap-2 rounded-2xl bg-[#14B8A6] text-sm font-black text-[#031315] shadow-[0_16px_35px_rgba(20,184,166,0.18)] hover:bg-[#2DD4BF]"
 >
 <PlusCircle className="h-5 w-5" />
 {copy.requestRide}
 </Button>
 <Button
 onClick={onNotify}
 variant="ghost"
 className="h-11 w-full justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm font-bold text-slate-200 hover:bg-white/[0.07]"
 >
 <Bell className="h-4 w-4 text-[#14B8A6]" />
 {copy.notifications}
 </Button>
 </div>

 <nav className="flex-1 space-y-2 px-4 pt-2">
 {items.map((item) => {
 const Icon = item.icon;
 const isActive = hash === item.href || (item.href === '#' && (hash === '' || hash === '#/'));

 return (
 <a
 key={item.href}
 href={item.href}
 className={cn(
 'flex h-12 items-center justify-between rounded-2xl border px-4 text-sm font-black transition',
 isActive
 ? 'border-[#14B8A6]/35 bg-[#14B8A6]/15 text-[#14F5D5]'
 : 'border-transparent text-slate-400 hover:border-white/10 hover:bg-white/[0.04] hover:text-white',
 )}
 >
 <span>{item.label}</span>
 <Icon className="h-5 w-5" />
 </a>
 );
 })}
 </nav>

 <div className="space-y-3 border-t border-white/10 p-4">
 <div className={cn("rounded-2xl border border-[#14B8A6]/15 bg-[#14B8A6]/8 p-3", language === 'ar' ? "text-right" : "text-left")}>
 <p className="text-[11px] font-black text-[#14F5D5]">{copy.accountStatus}</p>
 <p className="mt-1 text-xs font-bold text-slate-300">{copy.ready}</p>
 </div>
 <Button
 onClick={logout}
 className="h-12 w-full justify-center gap-2 rounded-2xl bg-red-600/90 text-sm font-black text-white hover:bg-red-500"
 >
 <LogOut className="h-5 w-5" />
 {copy.logout}
 </Button>
 </div>
 </aside>
 );
}

const dashboardChromeCopy = {
 ar: {
 accountStatus: 'حالة الحساب',
 fallbackName: 'راكب',
 fallbackPhone: 'تطبيق الرحلات',
 logout: 'تسجيل الخروج',
 nav: {
 home: 'الرئيسية',
 history: 'رحلاتي',
 profile: 'حسابي',
 vault: 'الخزنة',
 wallet: 'الرصيد',
 },
 notifications: 'التنبيهات',
 ready: 'جاهز لطلب رحلة',
    activeTrip: 'الرحلة نشطة الآن',
    tripInProgress: 'الرحلة جارية',
    priceLabel: 'السعر',
    farePending: 'السعر قيد التأكيد',
    currency: 'د.أ',
    backToTrip: 'العودة للرحلة',
 requestRide: 'اطلب رحلة',
 },
 en: {
 accountStatus: 'Account status',
 fallbackName: 'Rider',
 fallbackPhone: 'Ride app',
 logout: 'Log out',
 nav: {
 home: 'Home',
 history: 'Trips',
 profile: 'Profile',
 vault: 'Vault',
 wallet: 'Wallet',
 },
 notifications: 'Notifications',
 ready: 'Ready to request a ride',
    activeTrip: 'Trip is active now',
    tripInProgress: 'Trip in progress',
    priceLabel: 'Price',
    farePending: 'Fare pending confirmation',
    currency: 'JOD',
    backToTrip: 'Back to trip',
 requestRide: 'Request ride',
 },
} satisfies Record<AppLanguage, {
  accountStatus: string;
  fallbackName: string;
  fallbackPhone: string;
  logout: string;
  nav: Record<'home' | 'history' | 'profile' | 'vault' | 'wallet', string>;
  notifications: string;
  ready: string;
  requestRide: string;
  activeTrip: string;
  tripInProgress: string;
  priceLabel: string;
  farePending: string;
  currency: string;
  backToTrip: string;
}>;

function getInitials(value: string) {
 const words = value.trim().split(/\s+/).filter(Boolean);
 if (words.length >= 2) return `${words[0][0] || ''}${words[1][0] || ''}`.toUpperCase();
 return value.slice(0, 2).toUpperCase();
}

export function Dashboard() {
 return <DashboardLayout />;
}
