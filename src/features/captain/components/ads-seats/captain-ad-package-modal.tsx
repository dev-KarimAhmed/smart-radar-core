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
import { CaptainAdPackageFeaturesList } from './parts/captain-ad-package-features-list';
import { CaptainAdPackageHeroCard } from './parts/captain-ad-package-hero-card';
import type { CaptainAdPackage } from '../../services/captain-ads-package';

interface CaptainAdPackageModalProps {
  mounted: boolean;
  isOpen: boolean;
  isArabic: boolean;
  radarHourPrice?: number;
  currencySymbol?: string;
  adPackage?: CaptainAdPackage;
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
  adPackage,
  onClose,
  onGoToPayment,
  onActivatePackage,
}: CaptainAdPackageModalProps) {
  const isAlreadyActive = adPackage?.status === 'ACTIVE';
  const isExpired = adPackage?.status === 'EXPIRED';
  const hasActivatedBefore = Boolean(adPackage?.hasActivatedBefore || adPackage?.subscribedAt || isAlreadyActive || isExpired);

  const remainingDays = React.useMemo(() => {
    if (!adPackage?.expiresAt || !isAlreadyActive) return 0;
    const diff = new Date(adPackage.expiresAt).getTime() - Date.now();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [adPackage?.expiresAt, isAlreadyActive]);

  if (!mounted || !isOpen) return null;

  const isEgypt = currencySymbol === 'ج.م' || currencySymbol === 'EGP';
  const defaultCurrency = isEgypt ? (isArabic ? 'ج.م' : 'EGP') : (isArabic ? 'د.أ' : 'JOD');
  const currency = currencySymbol || defaultCurrency;
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
                  {isArabic ? '⭐ 14 ميزة كاملة' : '⭐ 14 Total Features'}
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
          <CaptainAdPackageHeroCard
            isArabic={isArabic}
            currency={currency}
            formattedRate={formattedRate}
            isAlreadyActive={isAlreadyActive}
            isExpired={isExpired}
            hasActivatedBefore={hasActivatedBefore}
            remainingDays={remainingDays}
          />

          <CaptainAdPackageFeaturesList isArabic={isArabic} />
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 sm:p-5 border-t border-white/10 bg-[#070D19]/95 flex flex-col gap-2.5 shrink-0">
          {isAlreadyActive ? (
            <div className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-400/40 bg-emerald-950/60 px-4 text-xs sm:text-sm font-black text-emerald-300 shadow-inner select-none">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>{isArabic ? `الباقة نشطة بالفعل (متبقي ${remainingDays} يوم)` : `Package Active (${remainingDays}d left)`}</span>
            </div>
          ) : isExpired || hasActivatedBefore ? (
            <button
              type="button"
              onClick={onGoToPayment}
              className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-teal-400 px-4 text-xs sm:text-sm font-black text-slate-950 shadow-lg hover:brightness-105 active:scale-[0.99] transition cursor-pointer"
            >
              <CreditCard className="h-4 w-4 text-slate-950 shrink-0" />
              <span>{isArabic ? 'تم تفعيلها سابقاً · اشحن الرصيد للمتابعة' : 'Previously Activated · Recharge Hours'}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onActivatePackage}
              className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-400 via-[#00ffcc] to-emerald-400 px-4 text-xs sm:text-sm font-black text-slate-950 shadow-lg shadow-teal-500/25 hover:shadow-[0_0_25px_rgba(0,255,204,0.4)] hover:brightness-105 active:scale-[0.99] transition cursor-pointer"
            >
              <Sparkles className="h-4 w-4 text-slate-950 shrink-0" />
              <span>{isArabic ? 'تفعيل الباقة الافتتاحية مجاناً (أول 30 يوم)' : 'Activate Launch Package Free (First 30 Days)'}</span>
            </button>
          )}

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
