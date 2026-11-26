'use client';

import React from 'react';
import { Sparkles, Clock, CheckCircle2, Zap } from 'lucide-react';
import type { CaptainAdPackage } from '../../../services/captain-ads-package';

interface CaptainAdPackageHeroProps {
  isArabic: boolean;
  formattedRate: string;
  currency: string;
  adPackage?: CaptainAdPackage;
  isAlreadyActive: boolean;
  isExpired: boolean;
  hasActivatedBefore: boolean;
  remainingDays: number;
}

export function CaptainAdPackageHero({
  isArabic,
  formattedRate,
  currency,
  adPackage,
  isAlreadyActive,
  isExpired,
  hasActivatedBefore,
  remainingDays,
}: CaptainAdPackageHeroProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-[#00ffcc]/35 bg-gradient-to-b from-[#0f1d33] via-[#091424] to-[#050b14] p-5 shadow-[0_0_35px_rgba(0,255,204,0.12)]">
      <div className="pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#00ffcc]/15 blur-3xl" />
      <div className="pointer-events-none absolute -left-12 -bottom-12 h-36 w-36 rounded-full bg-emerald-500/15 blur-3xl" />

      {/* Badges Row */}
      <div className="flex items-center justify-between gap-2 mb-3">
        {isAlreadyActive ? (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-1 text-xs font-black text-emerald-300">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>{isArabic ? 'الباقة مفعلة حالياً' : 'Package Active'}</span>
          </div>
        ) : isExpired ? (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/15 px-3 py-1 text-xs font-black text-amber-300">
            <Clock className="h-3.5 w-3.5 text-amber-300" />
            <span>{isArabic ? 'انتهت الـ 30 يوماً المجانية' : '30 Days Expired'}</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/15 px-3 py-1 text-xs font-black text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
            <Zap className="h-3.5 w-3.5 text-amber-300" />
            <span>{isArabic ? 'عرض التدشين الحصري' : 'Exclusive Launch Offer'}</span>
          </div>
        )}
        <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-emerald-400 to-[#00ffcc] px-3 py-1 text-xs font-black text-slate-950">
          <span>{isAlreadyActive ? (isArabic ? `متبقي ${remainingDays} يوم` : `${remainingDays}d Left`) : (isArabic ? 'وفر 100%' : 'SAVE 100%')}</span>
        </span>
      </div>

      {/* Pricing Numbers */}
      <div className="my-3">
        <div className="flex items-center gap-2 text-xs text-slate-400 font-sans mb-1">
          <span>{isArabic ? 'السعر بعد العرض:' : 'Regular Price:'}</span>
          <span className="line-through decoration-rose-500 decoration-2 font-bold text-slate-400">
            {formattedRate} {currency} / {isArabic ? 'ساعة' : 'hr'}
          </span>
        </div>

        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-1.5">
            <span className="text-4xl sm:text-5xl font-black text-white tracking-tight font-mono">
              0.00
            </span>
            <span className="text-lg sm:text-xl font-bold text-[#00ffcc]">
              {currency}
            </span>
            <span className="text-xs sm:text-sm text-slate-300 font-sans">
              / {isArabic ? 'ساعة تشغيل' : 'operating hour'}
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 rounded-xl border border-teal-400/40 bg-teal-500/20 px-3 py-1 text-xs font-black text-[#00ffcc] shadow-[0_0_15px_rgba(0,255,204,0.15)]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>
              {isAlreadyActive
                ? (isArabic ? `متبقي ${remainingDays} يوماً` : `${remainingDays}d left`)
                : isExpired || hasActivatedBefore
                ? (isArabic ? 'انتهى العرض' : 'Expired')
                : (isArabic ? 'أول شهر مجاني' : 'First Month Free')}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-3 border-t border-white/10 text-xs text-slate-200 font-sans">
        <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/5 px-3 py-2">
          <Clock className="h-4 w-4 text-[#00ffcc] shrink-0" />
          <span className="truncate">
            {isArabic ? 'سعر ساعة التشغيل: 0.00 للشهر الأول' : 'Hourly rate: 0.00 for month 1'}
          </span>
        </div>
        <div className="flex items-center gap-2 rounded-xl bg-white/[0.04] border border-white/5 px-3 py-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span className="truncate">
            {isArabic ? '30 يوماً كاملة بصفر تكلفة' : 'Full 30 days at zero cost'}
          </span>
        </div>
      </div>

      <p className="mt-2 text-center text-[11px] text-slate-400 font-sans">
        {isArabic
          ? `* يطبق السعر الاعتيادي (${formattedRate} ${currency}/ساعة) بعد انتهاء فترة الهدية المجانية`
          : `* Regular rate (${formattedRate} ${currency}/hr) applies only after the free gift period`}
      </p>
    </div>
  );
}
