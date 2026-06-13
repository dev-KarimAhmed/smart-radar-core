'use client';

import { useAuth } from '@/hooks/use-auth';
import { AppHeader } from '../app-header';
import { SovereignErrorBoundary } from '../sovereign-error-boundary';
import { BottomNav } from '../layout/bottom-nav';
import { AdStage } from './ad-stage';
import { SpeedSentry } from '../shared/speed-sentry';

import { AdminViewTab } from './admin-view-tab';
import { DriverViewTab } from './driver-view-tab';
import { RiderViewTab } from './rider-view-tab';
import { WalletTab } from './wallet-tab';
import { ProfileTab } from './profile-tab';
import { HistoryTab } from './history-tab';
import { VaultTab } from './vault-tab';

import { useRiderOperations } from '@/hooks/use-rider-operations';
import { useDriverOperations } from '@/hooks/use-driver-operations';
import React, { useState, useEffect, useMemo } from 'react';

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
        <button onClick={logout} className="w-full py-3 mt-4 bg-red-900 hover:bg-red-800 text-white rounded-xl transition-all duration-300 font-bold pointer-events-auto relative z-50">
          تسجيل الخروج السريع
        </button>
      </div>
    </div>
  );
}

function DashboardLayout() {
  const { isSovereign, isCaptain, isPassenger, user, logout } = useAuth();
  const [hash, setHash] = useState(typeof window !== 'undefined' ? window.location.hash || '#' : '#');
  const riderOps = useRiderOperations();
  const driverOps = useDriverOperations();

  useEffect(() => {
    const handleHashChange = () => {
      setHash(window.location.hash || '#');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const isStandby = useMemo(() => {
    if (isSovereign) return false;
    if (hash !== '#' && hash !== '' && hash !== '#/') return false;
    
    if (isPassenger) {
      const isRequestModalOpen = riderOps?.isRequestModalOpen || false;
      const tripStatus = riderOps?.tripStatus || 'idle';
      if (isRequestModalOpen || tripStatus !== 'idle') return false;
    }
    
    if (isCaptain) {
      const driverStatus = driverOps?.driverStatus || 'idle';
      const isRequestListOpen = driverOps?.isRequestListOpen || false;
      if (driverStatus === 'active' || driverStatus === 'busy' || isRequestListOpen) return false;
    }
    
    return true;
  }, [isSovereign, hash, isPassenger, isCaptain, riderOps?.isRequestModalOpen, riderOps?.tripStatus, driverOps?.driverStatus, driverOps?.isRequestListOpen]);
  
  const renderContent = () => {
    if (isSovereign) return <AdminViewTab />;

    const ratingValue = user?.rating !== undefined 
      ? user.rating 
      : (user?.ratingSum && user?.ratingCount ? user.ratingSum / user.ratingCount : 5.0);

    if (ratingValue < 4.2) {
      return <SovereignLockoutView user={user} logout={logout} />;
    }

    if (isStandby) return null;

    if (hash === '#wallet') return <WalletTab />;
    if (hash === '#vault') return <VaultTab />;
    if (hash === '#history') return <HistoryTab />;
    if (hash === '#profile') return <ProfileTab />;

    if (isCaptain) return <DriverViewTab />;
    if (isPassenger) return <RiderViewTab />;
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
          <div className="w-full shrink-0">
            <AdStage />
          </div>
        )}
        
        {/* الحاوية التي تحمل التبويبات (تسمح بالتمرير للأسفل) */}
        <div className="flex-1 w-full p-4 md:p-8">
           <SovereignErrorBoundary>
             {renderContent()}
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
