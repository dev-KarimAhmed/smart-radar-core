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

import React, { useState, useEffect } from 'react';

function SovereignLockoutView({ user, logout }: { user: any, logout: () => void }) {
  const [timeLeft, setTimeLeft] = useState<number>(1800); // 30 minutes in seconds

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
      if (diffSecs <= 0) {
        // Force log out or lock
      }
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
    <div className="flex items-center justify-center p-4 min-h-[60vh] font-sans">
      <div className="w-full max-w-md bg-[#0D0505] border border-red-500/20 rounded-2xl p-6 text-center space-y-5 shadow-xl shadow-red-950/20 relative overflow-hidden">
        {/* Decorative alert ambient neon */}
        <div className="absolute top-0 left-0 w-full h-1 bg-red-600 animate-pulse" />
        
        <div className="w-16 h-16 bg-red-500/10 border border-red-500/30 rounded-full flex items-center justify-center mx-auto text-red-500 animate-pulse text-2xl">
          🚫
        </div>
        
        <h2 className="text-xl font-bold text-red-400">حظر تلقائي سيادي (بروتوكول 30)</h2>
        
        <div className="py-4 px-6 bg-red-950/15 border border-red-500/10 rounded-xl space-y-2">
          <p className="text-[11px] uppercase tracking-wider text-red-500 font-bold">المؤقت التنازلي التلقائي لشطب الحساب</p>
          <div className="text-3xl font-black text-red-400 tracking-widest font-mono">
            {isExpired ? "00:00" : timeStr}
          </div>
          <p className="text-[10px] text-red-400/70 font-bold animate-pulse">
            {isExpired ? "⚠️ تم انتهاء مهلة الاستدراك وشطب الحساب نهائياً!" : `⚠️ متبقي لديك ${minutes} دقيقة و ${seconds} ثانية حتى يتم إغلاق الحساب تلقائياً...`}
          </p>
        </div>

        <p className="text-sm text-gray-300 leading-relaxed text-right">
          عذراً {user?.role === 'driver' ? 'كابتن' : 'مسافر'} <span className="text-white font-bold">{user?.name}</span>، لقد هبط تقييمك العام عن الحد القانوني الدستوري (4.2)، أو تم اكتشاف ممارسات منافية لدستور كوابح السوق وحرية التسعير المتزنة.
        </p>

        <div className="bg-red-950/25 border border-red-900/40 p-3 rounded-lg text-xs text-red-400 font-mono flex justify-between items-center">
          <span>{user?.rating?.toFixed(2) || (user?.ratingSum && user?.ratingCount ? (user.ratingSum / user.ratingCount).toFixed(2) : '5.00')} / 5.0</span>
          <strong>مؤشر تقييمك الحالي:</strong>
        </div>

        <div className="bg-[#1A0005]/50 border border-red-900/20 p-3 rounded-xl text-xs text-red-300 leading-relaxed text-right">
          💡 <strong>إشعار بروتوكول 30:</strong>
          <p className="mt-1 text-red-400/95 font-medium">
            متبقي لديك 30 دقيقة حتى يتم إغلاق الحساب تلقائياً لتطهير الميدان بموجب قانون ديكتاتورية الخادم (بروتوكول 30).
          </p>
        </div>

        <p className="text-xs text-gray-500">
          يرجى مراجعة إدارة اللواء لاستعادة صلاحية العمل أو تقديم تنبيه استثنائي للجنة النضوج قبل انقضاء صلاحية الجلسة.
        </p>
        
        <button 
          onClick={logout} 
          className="w-full py-2 bg-red-950/40 hover:bg-red-900/40 text-red-200 border border-red-500/20 rounded-xl transition-all duration-300 font-bold"
        >
          تسجيل الخروج السريع
        </button>
      </div>
    </div>
  );
}

function DashboardLayout() {
  const { isSovereign, isCaptain, isPassenger, user, logout } = useAuth();
  const [hash, setHash] = useState(typeof window !== 'undefined' ? window.location.hash || '#' : '#');

  useEffect(() => {
    const handleHashChange = () => {
      setHash(window.location.hash || '#');
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleBackgroundClick = (e: React.MouseEvent) => {
    if (
      e.target === e.currentTarget || 
      (e.target as HTMLElement).classList.contains('dashboard-bg-clicker') || 
      (e.target as HTMLElement).classList.contains('dashboard-inner-clicker')
    ) {
      const adStageElement = document.querySelector('.ad-stage-clicktarget');
      if (adStageElement) {
        (adStageElement as HTMLElement).click();
      }
    }
  };
  
  const renderContent = () => {
    if (isSovereign) return <AdminViewTab />;

    // Check rating for block target < 4.2 for both driver & passenger
    const ratingValue = user?.rating !== undefined 
      ? user.rating 
      : (user?.ratingSum && user?.ratingCount ? user.ratingSum / user.ratingCount : 5.0);

    if (ratingValue < 4.2) {
      return <SovereignLockoutView user={user} logout={logout} />;
    }

    if (hash === '#wallet') {
      return <WalletTab />;
    }

    if (hash === '#history') {
      return <HistoryTab />;
    }

    if (hash === '#profile') {
      return <ProfileTab />;
    }

    if (isCaptain) {
      return <DriverViewTab />;
    }
    if (isPassenger) return <RiderViewTab />;
    return null;
  };
  
  return (
      <div className="flex min-h-screen w-full flex-col bg-black overflow-hidden">
        <AppHeader />
        <main className="flex-1 relative overflow-hidden">
          {/* الإعلانات في الطبقة الخلفية z-0 */}
          <AdStage />
          
          {/* المحتوى التفاعلي في الطبقة z-10 - مع التأكد من عدم حجب الأزرار في الهيدر */}
          <div 
            onClick={handleBackgroundClick}
            className={`absolute inset-0 z-10 overflow-y-auto pt-4 pb-24 transition-all duration-300 pointer-events-auto dashboard-bg-clicker ${
              (hash === '#wallet' || hash === '#history' || hash === '#profile') 
                ? 'bg-black/75 backdrop-blur-sm' 
                : ''
            }`}
          >
              <div 
                className="p-4 md:p-8 h-full dashboard-inner-clicker"
                onClick={(e) => {
                  if (e.target === e.currentTarget) {
                    handleBackgroundClick(e);
                  }
                }}
              >
                <SovereignErrorBoundary>
                  {renderContent()}
                </SovereignErrorBoundary>
              </div>
          </div>
          {isCaptain && <SpeedSentry />}
        </main>
        <BottomNav />
      </div>
  );
}

export function Dashboard() {
  return <DashboardLayout />;
}
