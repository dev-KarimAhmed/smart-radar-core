'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import {
  Sparkles,
  X,
  CreditCard,
  Clock,
  Zap,
} from 'lucide-react';
import { styles } from './captain-ads-styles';
import { CAPTAIN_AD_PACKAGE_FEATURES } from '../../config/captain-ad-package-features';

interface CaptainAdPackageModalProps {
  mounted: boolean;
  isOpen: boolean;
  isArabic: boolean;
  radarHourPrice?: number;
  currencySymbol?: string;
  onClose: () => void;
  onGoToPayment: () => void;
  onActivatePackage: () => void;
}

export function CaptainAdPackageModal({
  mounted,
  isOpen,
  isArabic,
  radarHourPrice = 300,
  currencySymbol,
  onClose,
  onGoToPayment,
  onActivatePackage,
}: CaptainAdPackageModalProps) {
  if (!mounted || !isOpen) return null;

  const currency = currencySymbol || (isArabic ? 'ج.م' : 'EGP');
  const formattedRate = Number(radarHourPrice || 300).toFixed(2);

  return createPortal(
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="relative flex flex-col max-h-[92vh] w-full max-w-lg rounded-3xl border border-[#00ffcc]/40 bg-[#070D19] shadow-2xl text-start overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-4 sm:p-5 pb-4 bg-[#070D19] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-teal-500/30 bg-teal-500/10 text-[#00ffcc] shadow-[0_0_15px_rgba(0,255,204,0.15)]">
              <Sparkles className="h-5 w-5 text-[#00ffcc]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white truncate">
                  {isArabic ? 'الباقة الافتتاحية' : 'The Launch Package'}
                </h3>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full border border-teal-500/30 bg-teal-500/10 text-[#00ffcc] text-[11px] font-bold shrink-0">
                  {isArabic ? 'الباقة الافتتاحية · 14 ميزة' : 'Launch Package · 14 Features'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans mt-0.5 truncate">
                {isArabic ? 'أول شهر مجاني بالكامل · كافة المزايا التشغيلية والإعلانية' : 'First month 100% free · All operational & promotional features'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer shrink-0"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-4 sm:p-5 space-y-4 flex-1 overscroll-contain">
          {/* Hostinger-Style Pricing Hero Card */}
          <div className="relative overflow-hidden rounded-3xl border border-cyan-400/40 bg-gradient-to-br from-cyan-950/80 via-slate-900/95 to-emerald-950/70 p-4 sm:p-5 shadow-2xl">
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-cyan-500/20 blur-2xl" />
            <div className="pointer-events-none absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-emerald-500/20 blur-2xl" />

            {/* Offer Badges */}
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/15 px-3 py-1 text-[11px] font-black text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
                <Zap className="h-3.5 w-3.5 text-amber-300" />
                <span>{isArabic ? 'عرض التدشين الحصري' : 'Exclusive Launch Offer'}</span>
              </div>
              <span className="inline-flex items-center rounded-xl bg-gradient-to-r from-teal-500 to-[#00ffcc] px-2.5 py-0.5 text-[11px] font-black text-slate-950 shadow-sm">
                {isArabic ? 'وفر 100%' : 'SAVE 100%'}
              </span>
            </div>

            {/* Main Price Headline */}
            <div className="flex flex-wrap items-baseline gap-2 sm:gap-3">
              <span className="text-3xl sm:text-4xl font-black text-white tracking-tight">
                {isArabic ? 'مجاناً' : 'FREE'}
              </span>
              <span className="text-xs sm:text-sm font-bold text-[#00ffcc]">
                {isArabic ? 'أول شهر مجاني بالكامل' : 'First Full Month Free'}
              </span>
              <div className="flex items-center gap-1.5 ms-auto text-xs text-slate-400 font-sans">
                <span className="line-through decoration-rose-500/80 decoration-2 text-slate-400 font-bold">
                  {formattedRate} {currency} / {isArabic ? 'ساعة' : 'hr'}
                </span>
              </div>
            </div>

            {/* Subtitle / Hourly rate breakdown */}
            <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between gap-2 text-xs text-slate-300 font-sans">
              <div className="flex items-center gap-1.5 text-cyan-200">
                <Clock className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                <span>
                  {isArabic
                    ? `سعر ساعة التشغيل: 0.00 ${currency} للشهر الأول (بدلاً من ${formattedRate} ${currency}/ساعة)`
                    : `Hourly rate: 0.00 ${currency} for month 1 (Regular: ${formattedRate} ${currency}/hr)`}
                </span>
              </div>
              <span className="hidden sm:inline-block text-[11px] text-emerald-400 font-bold shrink-0">
                {isArabic ? '30 يوماً مجاناً' : '30 Days Free'}
              </span>
            </div>
          </div>

          {/* Clean 14 Features Checklist (No descriptions below items) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-bold text-slate-300">
                {isArabic ? 'المميزات المشمولة في الباقة الافتتاحية:' : 'Features included in Launch Package:'}
              </span>
              <span className="text-[11px] font-mono text-[#00ffcc]">
                {CAPTAIN_AD_PACKAGE_FEATURES.length} {isArabic ? 'ميزة كاملة' : 'Total'}
              </span>
            </div>

            {CAPTAIN_AD_PACKAGE_FEATURES.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.id}
                  className="flex items-center justify-between gap-3 p-2.5 sm:p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-teal-400/30 hover:bg-white/[0.06] transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-xl border border-teal-500/30 bg-teal-500/10 text-[#00ffcc] font-black text-xs font-mono shadow-[0_0_10px_rgba(0,255,204,0.1)]">
                      {feat.id < 10 ? `0${feat.id}` : feat.id}
                    </div>
                    <span className="text-white font-bold text-xs sm:text-sm truncate">
                      {isArabic ? feat.titleAr : feat.titleEn}
                    </span>
                  </div>
                  <div className="flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-xl bg-slate-800/60 border border-white/5 text-teal-300">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-[#070D19]/95 flex flex-col gap-2.5 shrink-0">
          {/* Primary Hero Button: Activate 100% Free Month Now */}
          <button
            type="button"
            onClick={onActivatePackage}
            className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-400 via-[#00ffcc] to-emerald-400 px-4 text-xs sm:text-sm font-black text-slate-950 shadow-lg shadow-teal-500/25 hover:shadow-[0_0_25px_rgba(0,255,204,0.4)] hover:brightness-105 active:scale-[0.99] transition cursor-pointer"
          >
            <Sparkles className="h-4 w-4 text-slate-950 shrink-0" />
            <span>
              {isArabic ? 'تفعيل الباقة الافتتاحية مجاناً (أول 30 يوم)' : 'Activate Launch Package Free (First 30 Days)'}
            </span>
          </button>

          {/* Secondary Row: Payment Channels and Back */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onGoToPayment}
              className="flex-1 h-11 inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-500/30 bg-cyan-950/40 hover:bg-cyan-900/40 hover:border-cyan-400 text-cyan-200 px-3 text-xs sm:text-sm font-bold active:scale-[0.98] transition cursor-pointer"
            >
              <CreditCard className="h-4 w-4 shrink-0 text-cyan-400" />
              <span>{isArabic ? 'وسائل الدفع والشحن' : 'Payment Methods'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="shrink-0 h-11 px-5 inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:text-white text-slate-300 text-xs sm:text-sm font-bold active:scale-[0.98] transition cursor-pointer"
            >
              {isArabic ? 'رجوع' : 'Back'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
