'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, CheckCircle2, Sparkles, Timer } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CaptainAdPackage } from '../../services/captain-ads-types';
import { checkAndDispatchPackageExpirationReminder } from '../../services/captain-package-reminder';
import { useAdPackageCountdown } from './hooks/use-ad-package-countdown';

interface LaunchPackageFreeTrialBannerProps {
  adPackage?: CaptainAdPackage;
  language: 'ar' | 'en';
  onOpenAdPackage?: () => void;
  captainId?: string;
}

export function LaunchPackageFreeTrialBanner({
  adPackage,
  language,
  onOpenAdPackage,
  captainId = 'current_captain',
}: LaunchPackageFreeTrialBannerProps) {
  const isArabic = language === 'ar';
  const isActive = adPackage?.status === 'ACTIVE';
  const isExpired = adPackage?.status === 'EXPIRED';

  const timeLeft = useAdPackageCountdown(isActive, adPackage?.expiresAt, adPackage?.subscribedAt);
  const isUrgent = isActive && !timeLeft.isExpired && timeLeft.days <= 2;

  useEffect(() => {
    if (isActive && captainId) {
      checkAndDispatchPackageExpirationReminder({
        captainId,
        adPackage,
        language,
      });
    }
  }, [isActive, captainId, adPackage, language]);

  const pad = (n: number) => String(n).padStart(2, '0');

  if (isActive && !timeLeft.isExpired) {
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl border p-4 shadow-xl transition-all',
          isUrgent
            ? 'border-amber-400/50 bg-gradient-to-r from-amber-950/80 via-slate-900/90 to-amber-950/60 shadow-amber-950/30'
            : 'border-teal-400/40 bg-gradient-to-r from-teal-950/80 via-slate-900/90 to-emerald-950/70 shadow-teal-950/30'
        )}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/10">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={cn(
                'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all',
                isUrgent
                  ? 'border-amber-400/40 bg-amber-500/20 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.25)]'
                  : 'border-teal-400/30 bg-teal-500/15 text-[#14F5D5] shadow-[0_0_12px_rgba(20,245,213,0.25)]'
              )}
            >
              {isUrgent ? (
                <AlertTriangle className="h-5 w-5 text-amber-400 animate-pulse" />
              ) : (
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-sm text-white truncate">
                  {isArabic ? 'الباقة الافتتاحية (فترة العرض المجاني)' : 'Launch Package (Free Trial Period)'}
                </span>
                <span
                  className={cn(
                    'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[10px] font-black',
                    isUrgent
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                      : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                  )}
                >
                  {isUrgent
                    ? (isArabic ? '⚠️ يوشك العرض على الانتهاء' : '⚠️ Expiring in < 48 Hours')
                    : (isArabic ? 'أول شهر مجاناً بالكامل' : 'First Month 100% Free')}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                {isUrgent
                  ? (isArabic
                    ? 'تنبيه: متبقي أقل من 48 ساعة على انتهاء العرض المجاني. يرجى شحن الرصيد لتجنب توقف استقبال الرحلات.'
                    : 'Reminder: Less than 48 hours remaining. Please recharge to avoid interruption in receiving rides.')
                  : (isArabic
                    ? 'أنت مستفيد حالياً من عرض الـ 30 يوماً المجاني بصفر تكلفة تشغيل ودون أي خصم رصيد.'
                    : 'You are currently enjoying the 30-day free trial with zero charges and full features.')}
              </p>
            </div>
          </div>

          {onOpenAdPackage && (
            <button
              type="button"
              onClick={onOpenAdPackage}
              className={cn(
                'self-start sm:self-auto shrink-0 inline-flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-black transition-all hover:scale-105 hover:brightness-110 active:scale-95 cursor-pointer shadow-md',
                isUrgent
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 shadow-amber-500/20'
                  : 'bg-gradient-to-r from-teal-500 to-[#14F5D5] text-slate-950 shadow-teal-500/20'
              )}
            >
              <span>{isUrgent ? (isArabic ? 'تجديد وشحن الرصيد' : 'Renew / Top-Up') : (isArabic ? 'عرض التفاصيل (14 ميزة)' : 'Details (14 Features)')}</span>
              <Sparkles className="h-3.5 w-3.5 text-slate-950" />
            </button>
          )}
        </div>

        {/* Live Simple Countdown Timer */}
        <div
          className={cn(
            'mt-3 flex flex-wrap items-center justify-between gap-3 border rounded-xl p-2.5 sm:px-4',
            isUrgent
              ? 'bg-black/50 border-amber-500/30'
              : 'bg-black/40 border-teal-500/25'
          )}
        >
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300 font-sans">
            <Timer
              className={cn(
                'h-4 w-4 shrink-0 animate-pulse',
                isUrgent ? 'text-amber-400' : 'text-[#14F5D5]'
              )}
            />
            <span>{isArabic ? 'الوقت المتبقي في العرض المجاني:' : 'Free Trial Remaining Time:'}</span>
          </div>

          <div
            className={cn(
              'flex items-center gap-1.5 font-mono text-xs font-bold',
              isUrgent ? 'text-amber-300' : 'text-[#14F5D5]'
            )}
          >
            <div
              className={cn(
                'flex items-center gap-1 border px-2 py-1 rounded-lg shadow-inner',
                isUrgent ? 'bg-amber-950/60 border-amber-400/30' : 'bg-teal-950/60 border-teal-400/30'
              )}
            >
              <span className="text-white text-sm font-black">{timeLeft.days}</span>
              <span className={cn('text-[10px] font-sans', isUrgent ? 'text-amber-300' : 'text-teal-300')}>{isArabic ? 'يوم' : 'd'}</span>
            </div>
            <span className={cn('font-bold', isUrgent ? 'text-amber-400' : 'text-teal-400')}>:</span>
            <div
              className={cn(
                'flex items-center gap-1 border px-2 py-1 rounded-lg shadow-inner',
                isUrgent ? 'bg-amber-950/60 border-amber-400/30' : 'bg-teal-950/60 border-teal-400/30'
              )}
            >
              <span className="text-white text-sm font-black">{pad(timeLeft.hours)}</span>
              <span className={cn('text-[10px] font-sans', isUrgent ? 'text-amber-300' : 'text-teal-300')}>{isArabic ? 'ساعة' : 'h'}</span>
            </div>
            <span className={cn('font-bold', isUrgent ? 'text-amber-400' : 'text-teal-400')}>:</span>
            <div
              className={cn(
                'flex items-center gap-1 border px-2 py-1 rounded-lg shadow-inner',
                isUrgent ? 'bg-amber-950/60 border-amber-400/30' : 'bg-teal-950/60 border-teal-400/30'
              )}
            >
              <span className="text-white text-sm font-black">{pad(timeLeft.minutes)}</span>
              <span className={cn('text-[10px] font-sans', isUrgent ? 'text-amber-300' : 'text-teal-300')}>{isArabic ? 'دقيقة' : 'm'}</span>
            </div>
            <span className={cn('font-bold', isUrgent ? 'text-amber-400' : 'text-teal-400')}>:</span>
            <div
              className={cn(
                'flex items-center gap-1 border px-2 py-1 rounded-lg shadow-inner',
                isUrgent ? 'bg-amber-950/60 border-amber-400/30' : 'bg-teal-950/60 border-teal-400/30'
              )}
            >
              <span className={cn('text-sm font-black animate-pulse', isUrgent ? 'text-amber-300' : 'text-[#14F5D5]')}>
                {pad(timeLeft.seconds)}
              </span>
              <span className={cn('text-[10px] font-sans', isUrgent ? 'text-amber-300' : 'text-teal-300')}>{isArabic ? 'ث' : 's'}</span>
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
