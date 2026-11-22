'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle2, Sparkles, Timer } from 'lucide-react';
import type { CaptainAdPackage } from '../../services/captain-ads-types';

interface LaunchPackageFreeTrialBannerProps {
  adPackage?: CaptainAdPackage;
  language: 'ar' | 'en';
  onOpenAdPackage?: () => void;
}

interface TimeRemaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
}

function calculateRemainingTime(expiresAt?: string, subscribedAt?: string): TimeRemaining {
  let targetMs = expiresAt ? new Date(expiresAt).getTime() : 0;
  if (!targetMs || Number.isNaN(targetMs)) {
    const startMs = subscribedAt ? new Date(subscribedAt).getTime() : Date.now();
    targetMs = startMs + 30 * 24 * 60 * 60 * 1000;
  }

  const diffMs = Math.max(0, targetMs - Date.now());
  if (diffMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true };
  }

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

  return { days, hours, minutes, seconds, isExpired: false };
}

export function LaunchPackageFreeTrialBanner({
  adPackage,
  language,
  onOpenAdPackage,
}: LaunchPackageFreeTrialBannerProps) {
  const isArabic = language === 'ar';
  const isActive = adPackage?.status === 'ACTIVE';
  const isExpired = adPackage?.status === 'EXPIRED';

  const [timeLeft, setTimeLeft] = useState<TimeRemaining>(() =>
    calculateRemainingTime(adPackage?.expiresAt, adPackage?.subscribedAt)
  );

  useEffect(() => {
    if (!isActive) return;
    const interval = setInterval(() => {
      setTimeLeft(calculateRemainingTime(adPackage?.expiresAt, adPackage?.subscribedAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [isActive, adPackage?.expiresAt, adPackage?.subscribedAt]);

  const pad = (n: number) => String(n).padStart(2, '0');

  if (isActive && !timeLeft.isExpired) {
    return (
      <div className="relative overflow-hidden rounded-2xl border border-teal-400/40 bg-gradient-to-r from-teal-950/80 via-slate-900/90 to-emerald-950/70 p-4 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-teal-500/20">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-teal-400/30 bg-teal-500/15 text-[#14F5D5] shadow-[0_0_12px_rgba(20,245,213,0.25)]">
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-sm text-white truncate">
                  {isArabic ? 'الباقة الافتتاحية (فترة العرض المجاني)' : 'Launch Package (Free Trial Period)'}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2.5 py-0.5 text-[10px] font-black text-emerald-300">
                  {isArabic ? 'أول شهر مجاناً بالكامل' : 'First Month 100% Free'}
                </span>
              </div>
              <p className="text-xs text-teal-200/90 mt-0.5 leading-relaxed">
                {isArabic
                  ? 'أنت مستفيد حالياً من عرض الـ 30 يوماً المجاني بصفر تكلفة تشغيل ودون أي خصم رصيد.'
                  : 'You are currently enjoying the 30-day free trial with zero charges and full features.'}
              </p>
            </div>
          </div>

          {onOpenAdPackage && (
            <button
              type="button"
              onClick={onOpenAdPackage}
              className="self-start sm:self-auto shrink-0 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-[#14F5D5] px-3.5 py-1.5 text-xs font-black text-slate-950 shadow-md shadow-teal-500/20 transition-all hover:scale-105 hover:brightness-110 active:scale-95 cursor-pointer"
            >
              <span>{isArabic ? 'عرض التفاصيل (14 ميزة)' : 'Details (14 Features)'}</span>
              <Sparkles className="h-3.5 w-3.5 text-slate-950" />
            </button>
          )}
        </div>

        {/* Live Simple Countdown Timer */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 bg-black/40 border border-teal-500/25 rounded-xl p-2.5 sm:px-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300 font-sans">
            <Timer className="h-4 w-4 text-[#14F5D5] animate-pulse shrink-0" />
            <span>{isArabic ? 'الوقت المتبقي في العرض المجاني:' : 'Free Trial Remaining Time:'}</span>
          </div>

          <div className="flex items-center gap-1.5 font-mono text-xs font-bold text-[#14F5D5]">
            <div className="flex items-center gap-1 bg-teal-950/60 border border-teal-400/30 px-2 py-1 rounded-lg shadow-inner">
              <span className="text-white text-sm font-black">{timeLeft.days}</span>
              <span className="text-[10px] text-teal-300 font-sans">{isArabic ? 'يوم' : 'd'}</span>
            </div>
            <span className="text-teal-400 font-bold">:</span>
            <div className="flex items-center gap-1 bg-teal-950/60 border border-teal-400/30 px-2 py-1 rounded-lg shadow-inner">
              <span className="text-white text-sm font-black">{pad(timeLeft.hours)}</span>
              <span className="text-[10px] text-teal-300 font-sans">{isArabic ? 'ساعة' : 'h'}</span>
            </div>
            <span className="text-teal-400 font-bold">:</span>
            <div className="flex items-center gap-1 bg-teal-950/60 border border-teal-400/30 px-2 py-1 rounded-lg shadow-inner">
              <span className="text-white text-sm font-black">{pad(timeLeft.minutes)}</span>
              <span className="text-[10px] text-teal-300 font-sans">{isArabic ? 'دقيقة' : 'm'}</span>
            </div>
            <span className="text-teal-400 font-bold">:</span>
            <div className="flex items-center gap-1 bg-teal-950/60 border border-teal-400/30 px-2 py-1 rounded-lg shadow-inner">
              <span className="text-[#14F5D5] text-sm font-black animate-pulse">{pad(timeLeft.seconds)}</span>
              <span className="text-[10px] text-teal-300 font-sans">{isArabic ? 'ث' : 's'}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={onOpenAdPackage}
      className="group relative flex w-full items-center justify-between overflow-hidden rounded-2xl border border-cyan-400/40 bg-gradient-to-r from-cyan-950/70 via-slate-900/80 to-emerald-950/50 p-3 sm:p-3.5 text-start transition-all hover:border-[#14F5D5] hover:shadow-[0_0_25px_rgba(20,245,213,0.25)] active:scale-[0.99] cursor-pointer"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-cyan-400/30 bg-cyan-500/15 text-[#14F5D5] transition-transform group-hover:scale-110 shadow-[0_0_12px_rgba(20,245,213,0.2)]">
          <Sparkles className="h-5 w-5" />
        </div>
        <div className="min-w-0">
          <span className="block font-black text-xs sm:text-sm text-white group-hover:text-[#14F5D5] transition-colors truncate">
            {isExpired
              ? (isArabic ? 'انتهت فترة العرض المجاني (30 يوماً)' : 'Free Trial Expired (30 Days)')
              : (isArabic ? 'الباقة الافتتاحية (أول 30 يوم مجاناً)' : 'Launch Package (First 30 Days Free)')}
          </span>
          <span className="block text-[11px] text-teal-300/90 font-sans truncate">
            {isExpired
              ? (isArabic ? 'يمكنك شحن الرصيد لتجديد الباقة واستمرار المزايا' : 'Recharge balance to renew package and retain features')
              : (isArabic ? 'فعّل باقتك الآن واستمتع بـ 30 يوماً مجاناً بالكامل · 14 ميزة' : 'Activate now for 30 days 100% free · 14 exclusive features')}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-[#14F5D5] px-3.5 py-1.5 text-xs font-black text-slate-950 shadow-md shadow-teal-500/20 transition-all group-hover:scale-105 group-hover:brightness-110">
          <span>{isExpired ? (isArabic ? 'شحن وتجديد' : 'Renew') : (isArabic ? 'تفعيل مجاني' : 'Activate Free')}</span>
          <Sparkles className="h-3 w-3 text-slate-950" />
        </span>
      </div>
    </button>
  );
}
