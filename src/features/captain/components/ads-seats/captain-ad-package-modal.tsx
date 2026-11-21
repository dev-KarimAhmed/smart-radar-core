'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import {
  Sparkles,
  X,
  CreditCard,
  CheckCircle2,
} from 'lucide-react';
import { styles } from './captain-ads-styles';
import { CAPTAIN_AD_PACKAGE_FEATURES } from '../../config/captain-ad-package-features';

interface CaptainAdPackageModalProps {
  mounted: boolean;
  isOpen: boolean;
  isArabic: boolean;
  onClose: () => void;
  onGoToPayment: () => void;
  onActivatePackage: () => void;
}

export function CaptainAdPackageModal({
  mounted,
  isOpen,
  isArabic,
  onClose,
  onGoToPayment,
  onActivatePackage,
}: CaptainAdPackageModalProps) {
  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="relative flex flex-col max-h-[92vh] w-full max-w-lg rounded-3xl border border-[#00ffcc]/40 bg-[#070D19] shadow-2xl text-start overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-5 pb-4 bg-[#070D19] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-teal-500/30 bg-teal-500/10 text-[#00ffcc] shadow-[0_0_15px_rgba(0,255,204,0.15)]">
              <Sparkles className="h-5 w-5 text-[#00ffcc]" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white truncate">
                  {isArabic ? 'مميزات باقة الخدمات الإعلانية' : 'Ad Services Package Features'}
                </h3>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full border border-teal-500/30 bg-teal-500/10 text-[#00ffcc] text-[11px] font-bold shrink-0">
                  {isArabic ? 'باقة A · 14 ميزة' : 'Package A · 14 Features'}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans mt-0.5 truncate">
                {isArabic ? 'حصص النشر وبث إعلاناتك الترويجية مع كافة المزايا التشغيلية' : 'Promotional broadcast quotas with full operational benefits'}
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

        {/* Modal Body: 14 Features from User Table */}
        <div className="overflow-y-auto p-4 sm:p-5 space-y-2.5 flex-1 overscroll-contain">
          {CAPTAIN_AD_PACKAGE_FEATURES.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.id}
                className="flex items-center gap-3 p-2.5 sm:p-3 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-teal-400/30 hover:bg-white/[0.06] transition-all"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-teal-500/30 bg-teal-500/10 text-[#00ffcc] font-black text-xs font-mono shadow-[0_0_10px_rgba(0,255,204,0.1)]">
                  {feat.id < 10 ? `0${feat.id}` : feat.id}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="block text-white font-bold text-xs sm:text-sm truncate">
                    {isArabic ? feat.titleAr : feat.titleEn}
                  </span>
                  <span className="block text-slate-400 text-[11px] font-sans truncate mt-0.5">
                    {isArabic ? feat.descAr : feat.descEn}
                  </span>
                </div>
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-800/60 border border-white/5 text-teal-300">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-[#070D19]/95 flex items-center gap-2 sm:gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onGoToPayment}
            className="flex-1 min-w-0 h-11 sm:h-12 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-400 to-[#00ffcc] px-3 sm:px-4 text-xs sm:text-sm font-black text-slate-950 shadow-lg shadow-teal-500/20 hover:brightness-105 hover:shadow-[0_0_20px_rgba(0,255,204,0.3)] active:scale-[0.98] transition cursor-pointer whitespace-nowrap"
          >
            <CreditCard className="h-4 w-4 shrink-0" />
            <span className="truncate">{isArabic ? 'الانتقال لوسائل الدفع' : 'Proceed to Payment'}</span>
          </button>

          <button
            type="button"
            onClick={onActivatePackage}
            className="flex-1 min-w-0 h-11 sm:h-12 inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 hover:border-emerald-400 px-3 sm:px-4 text-xs sm:text-sm font-black text-emerald-300 active:scale-[0.98] transition cursor-pointer whitespace-nowrap"
            title={isArabic ? 'تفعيل فوري للباقة' : 'Activate now'}
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span className="truncate">{isArabic ? 'تأكيد وتفعيل الباقة' : 'Activate Package'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="shrink-0 h-11 sm:h-12 inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:text-white px-4 text-xs sm:text-sm font-bold text-slate-300 active:scale-[0.98] transition cursor-pointer whitespace-nowrap"
          >
            {isArabic ? 'رجوع' : 'Back'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
