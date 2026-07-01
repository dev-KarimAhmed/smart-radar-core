'use client';

import { useAuth } from '@/hooks/use-auth';
import { AppHeader } from '../app-header';
import { SovereignErrorBoundary } from '../sovereign-error-boundary';
import { BottomNav } from '../layout/bottom-nav';
import { AdStage } from './ad-stage';
import { SpeedSentry } from '../shared/speed-sentry';

import { useRiderOperations } from '@/hooks/use-rider-operations';
import { useDriverOperations } from '@/hooks/use-driver-operations';
import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Loader2 } from 'lucide-react';

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
        <h2 className="text-xl font-bold text-red-400">حظر تلقائي سيادي (بروتوكول 30)</h2>
        <div className="py-4 px-6 bg-red-950/15 border border-red-500/10 rounded-xl space-y-2">
          <p className="text-[11px] uppercase tracking-wider text-red-500 font-bold">المؤقت التنازلي التلقائي لشطب الحساب</p>
          <div className="text-3xl font-black text-red-400 tracking-widest font-mono">{isExpired ? "00:00" : timeStr}</div>
          <p className="text-[10px] text-red-400/70 font-bold animate-pulse">
            {isExpired ? "⚠️ تم انتهاء مهلة الاستدراك وشطب الحساب نهائياً!" : `⚠️ متبقي لديك ${minutes} دقيقة و ${seconds} ثانية حتى يتم إغلاق الحساب تلقائياً...`}
          </p>
        </div>
        <p className="text-sm text-gray-300 leading-relaxed text-right">
          عذراً {user?.role === 'driver' ? 'كابتن' : 'مسافر'} <span className="text-white font-bold">{user?.name}</span>، لقد هبط تقييمك العام عن الحد القانوني الدستوري (4.2)، أو تم اكتشاف ممارسات منافية لدستور كوابح السوق وحرية التسعير المتزنة.
        </p>
      </div>
    </div>
  );
}

function DashboardLayout() {
  const { isSovereign, isCaptain, isPassenger, user, logout } = useAuth();
  const [hash, setHash] = useState(typeof window !== 'undefined' ? window.location.hash || '#' : '#');
  const riderOps = useRiderOperations() || {} as any;
  const driverOps = useDriverOperations() || {} as any;

  useEffect(() => {
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

  const isStandby = useMemo(() => {
    if (isSovereign) return false;
    if (hash !== '#' && hash !== '' && hash !== '#/') return false;
    
    if (isPassenger) {
      const isRequestModalOpen = riderOps?.isRequestModalOpen || false;
      const currentTripStatus = riderOps?.tripStatus || 'idle';
      if (isRequestModalOpen || currentTripStatus !== 'idle') return false;
    }
    
    if (isCaptain) {
      const currentDriverStatus = driverOps?.driverStatus || 'idle';
      const isRequestListOpen = driverOps?.isRequestListOpen || false;
      if (currentDriverStatus === 'active' || currentDriverStatus === 'busy' || isRequestListOpen) return false;
    }
    
    return true;
  }, [isSovereign, hash, isPassenger, isCaptain, riderOps?.isRequestModalOpen, riderOps?.tripStatus, driverOps?.driverStatus, driverOps?.isRequestListOpen]);
  
  const renderArterialBridge = () => {
    if (hash === '#' || hash === '' || hash === '#/') return null;

    if (isPassenger && ['searching', 'busy'].includes(tripStatus)) {
      const activeTrip = riderOps?.trip;
      const displayPrice = activeTrip?.offerPrice !== undefined && activeTrip?.offerPrice !== -1 
        ? `${Number(activeTrip.offerPrice).toFixed(2)} د.أ` 
        : 'سعر مجمّد برادار النبض';

      return (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg mx-auto bg-[#051105]/95 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-[0_15px_40px_rgba(16,185,129,0.15)] backdrop-blur-md mb-6 pointer-events-auto"
          dir="rtl"
        >
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div className="text-right">
              <p className="text-xs font-black text-emerald-400 tracking-tight">بث الرحلة الشرياني نشط الآن 📡</p>
              <p className="text-[10px] text-gray-400 font-bold mt-0.5">القيمة الملتزم بها: <span className="text-white font-mono">{displayPrice}</span></p>
            </div>
          </div>
          
          <button 
            onClick={() => { window.location.hash = '#'; }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-lg transition-all duration-300 transform active:scale-95 pointer-events-auto z-[120]"
          >
            العودة للملاحة الحية 🚀
          </button>
        </motion.div>
      );
    }

    if (isCaptain && driverStatus === 'busy') {
      const activeTrip = driverOps?.activeRequest;
      const displayPrice = activeTrip?.offerPrice !== undefined && activeTrip?.offerPrice !== -1 
        ? `${Number(activeTrip.offerPrice).toFixed(2)} د.أ` 
        : 'قيد الملاحة الميدانية';

      return (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-lg mx-auto bg-[#071307]/95 border border-emerald-500/30 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-[0_15px_40px_rgba(16,185,129,0.15)] backdrop-blur-md mb-6 pointer-events-auto"
          dir="rtl"
        >
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div className="text-right">
              <p className="text-xs font-black text-emerald-400 tracking-tight">الجسر الشرياني للفرسان: الرحلة جارية</p>
              <p className="text-[10px] text-gray-400 font-bold mt-0.5">سعر العداد المجمّد: <span className="text-white font-mono">{displayPrice}</span></p>
            </div>
          </div>
          
          <button 
            onClick={() => { window.location.hash = '#'; }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-lg transition-all duration-300 transform active:scale-95 pointer-events-auto z-[120]"
          >
            العودة لقمرة الميدان 🚀
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
          <div className="flex flex-col items-center justify-center p-8 bg-[#090d1a] border border-cyan-900/30 rounded-2xl animate-pulse text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto" />
            <p className="text-gray-400 text-xs font-sans">برج الصلاحية: يتم استدعاء قمرة التحكم السيادية لاحقاً...</p>
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
        return <RiderViewTab />;
      }

      if (hash === '#wallet') return <WalletTab />;
      if (hash === '#vault') return <VaultTab />;
      if (hash === '#history') return <HistoryTab />;
      if (hash === '#profile') return <ProfileTab />;
      
      return <RiderViewTab />;
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
            <h2 className="text-xl font-bold text-emerald-400">قمرة التحكم للمعلن السيادي</h2>
            <p className="text-xs text-gray-400 leading-relaxed max-w-md mx-auto">
              مرحباً بك كمعلن مهني موثق. تم تأمين حسابك ودراسة ميزانيتك. الآن يمكنك إدارة حملات النبضات، حجز الباقات، وإطلاق الملصقات الإعلانية.
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
            إطلاق معالج الحملات والباقات السيادية 🚀
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

    // 🩸 [تحصين الذاكرة المرحلية للكابتن]: إذا كان الكابتن في رحلة جارية، نمنع إلغاء تحميل DriverViewTab تماماً لمنع تمزق الواجهات وفقدان الذاكرة المرحلية
    const criticalDriverStates = ['busy', 'rating'];
    if (isCaptain && criticalDriverStates.includes(driverStatus)) {
      return <DriverViewTab />;
    }

    if (hash === '#wallet') return <WalletTab />;
    if (hash === '#vault') return <VaultTab />;
    if (hash === '#history') return <HistoryTab />;
    if (hash === '#profile') return <ProfileTab />;

    if (isCaptain) return <DriverViewTab />;
    return null;
  };
  
  return (
    // استخدام flex-col لضمان تدفق الصفحة (Doc Flow) والسماح بالتمرير الطبيعي
    <div className="flex flex-col min-h-screen w-full bg-[#0B1120] text-white overflow-y-auto">
      
      {/* الهيدر ثابت في الأعلى */}
      <header className="sticky top-0 z-[100] w-full shrink-0">
        <AppHeader />
      </header>
      
      {/* المحتوى الرئيسي يتمدد ويسمح بالتمرير (Scroll) */}
      <main className="flex-1 w-full relative flex flex-col overflow-y-visible">
        
        {/* مسرح الإعلانات يأخذ مساحته الطبيعية في التدفق */}
        {isStandby && (
          <div className="w-full flex-1 flex flex-col relative z-[80] border-b-2 border-[#00ffcc]/30 shadow-[0_10px_30px_rgba(0,255,204,0.1)]">
            <AdStage isFullScreen={true} />
          </div>
        )}
        
        {/* الحاوية التي تحمل التبويبات (تسمح بالتمرير للأسفل) */}
        <div className={`flex-1 w-full p-4 md:p-8 ${isStandby ? 'hidden' : ''}`}>
           {renderArterialBridge()}
           <SovereignErrorBoundary>
             <React.Suspense fallback={
               <div className="flex flex-col items-center justify-center p-8 bg-[#090d1a]/80 border border-cyan-500/20 rounded-2xl animate-pulse text-center space-y-4">
                 <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mx-auto" />
                 <p className="text-gray-400 text-xs font-sans">جاري التجهيز النيابي واستدعاء وحدة التحكم المستقلة...</p>
               </div>
             }>
               {renderContent()}
             </React.Suspense>
           </SovereignErrorBoundary>
        </div>
        
        {isCaptain && <SpeedSentry />}
      </main>
      
      {/* الفوتر ثابت في الأسفل */}
      <footer className="sticky bottom-0 z-[100] w-full shrink-0">
        <BottomNav />
      </footer>
    </div>
  );
}

export function Dashboard() {
  return <DashboardLayout />;
}
