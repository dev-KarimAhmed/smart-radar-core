'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, X, CreditCard, CheckCircle2, FileCheck } from 'lucide-react';
import { styles } from './captain-ads-styles';
import { CaptainAdPackageFeaturesList } from './parts/captain-ad-package-features-list';
import { CaptainAdPackageHero } from './parts/captain-ad-package-hero';
import { CaptainUnifiedTermsModal } from '@/shared/components/captain-unified-terms-modal';
import { navigateToLegalRecord } from '../../services/captain-package-activation-flow';
import type { CaptainAdPackage } from '../../services/captain-ads-package';

interface CaptainAdPackageModalProps {
  mounted: boolean;
  isOpen: boolean;
  isArabic: boolean;
  radarHourPrice?: number;
  currencySymbol?: string;
  adPackage?: CaptainAdPackage;
  captainId?: string;
  onClose: () => void;
  onGoToPayment: () => void;
  onActivatePackage: () => void | Promise<void>;
}

export function CaptainAdPackageModal({
  mounted,
  isOpen,
  isArabic,
  radarHourPrice = 300,
  currencySymbol,
  adPackage,
  captainId = '',
  onClose,
  onGoToPayment,
  onActivatePackage,
}: CaptainAdPackageModalProps) {
  const [hasAgreedContract, setHasAgreedContract] = useState(false);
  const [showContractModal, setShowContractModal] = useState(false);
  const [isActivatedSuccess, setIsActivatedSuccess] = useState(false);
  const [isActivating, setIsActivating] = useState(false);

  React.useEffect(() => {
    if (!isOpen) {
      setIsActivatedSuccess(false);
      setIsActivating(false);
    }
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  const isEgypt = currencySymbol === 'ج.م' || currencySymbol === 'EGP';
  const defaultCurrency = isEgypt ? (isArabic ? 'ج.م' : 'EGP') : (isArabic ? 'د.أ' : 'JOD');
  const currency = currencySymbol || defaultCurrency;
  const formattedRate = Number(radarHourPrice || 300).toFixed(2);

  const isAlreadyActive = adPackage?.status === 'ACTIVE';
  const isExpired = adPackage?.status === 'EXPIRED';
  const hasActivatedBefore = Boolean(adPackage?.hasActivatedBefore || adPackage?.subscribedAt || isAlreadyActive || isExpired);

  const remainingDays = !adPackage?.expiresAt || !isAlreadyActive
    ? 0
    : Math.max(0, Math.ceil((new Date(adPackage.expiresAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)));

  const handleDoActivate = async () => {
    setIsActivating(true);
    try {
      await onActivatePackage();
      setIsActivatedSuccess(true);
    } finally {
      setIsActivating(false);
    }
  };

  return createPortal(
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="relative flex flex-col max-h-[92vh] w-full max-w-lg rounded-3xl border border-[#00ffcc]/40 bg-[#070D19] shadow-2xl text-start overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-4 sm:p-5 pb-4 bg-[#070D19] shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-teal-500/30 bg-teal-500/10 text-[#00ffcc] shadow-[0_0_15px_rgba(0,255,204,0.15)]">
              <Sparkles className="h-5 w-5 text-[#00ffcc]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-black text-white truncate">
                {isActivatedSuccess ? (isArabic ? 'تم تفعيل الباقة بنجاح 🎉' : 'Package Activated! 🎉') : (isArabic ? 'الباقة الافتتاحية' : 'The Launch Package')}
              </h3>
              <p className="text-xs text-slate-400 font-sans mt-0.5 truncate">
                {isActivatedSuccess ? (isArabic ? 'الوثيقة جاهزة الآن في السجل القانوني' : 'Contract ready in Legal Record') : (isArabic ? 'أول شهر مجاني بالكامل · كافة المزايا' : 'First month free · All features')}
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer shrink-0">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Body */}
        {isActivatedSuccess ? (
          <div className="p-6 text-center space-y-5">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl border border-teal-500/40 bg-teal-500/15 text-[#14F5D5] shadow-[0_0_25px_rgba(20,245,213,0.3)]">
              <FileCheck className="h-8 w-8 text-[#14F5D5]" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg sm:text-xl font-black text-white">
                {isArabic ? 'أصبحت الوثيقة الرسمية جاهزة في سجلاتي! 📜' : 'Official Document is Ready in Records! 📜'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans max-w-sm mx-auto">
                {isArabic
                  ? 'تم اعتماد وتوثيق وثيقة الكابتن في السجل القانوني بشاشة سجلاتي، وتم إرسال نسخة معتمدة بصيغة PDF إلى بريدك الإلكتروني.'
                  : 'The Captain Contract is certified in your Legal Log, and a certified copy has been sent to your email.'}
              </p>
            </div>

            <div className="pt-2 space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  navigateToLegalRecord();
                  onClose();
                }}
                className="w-full h-12 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-400 via-[#00ffcc] to-emerald-400 px-4 text-xs sm:text-sm font-black text-slate-950 shadow-lg shadow-teal-500/25 hover:shadow-[0_0_25px_rgba(0,255,204,0.4)] hover:brightness-105 active:scale-[0.99] transition cursor-pointer"
              >
                <FileCheck className="h-4 w-4 shrink-0" />
                <span>{isArabic ? 'الانتقال إلى السجل القانوني وتحميل الوثيقة الرسمية 📜' : 'Go to Legal Record & Download Contract 📜'}</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full h-11 inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 text-slate-300 text-xs sm:text-sm font-bold transition cursor-pointer"
              >
                {isArabic ? 'إغلاق والمتابعة' : 'Close & Continue'}
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-y-auto p-4 sm:p-5 space-y-4 flex-1 overscroll-contain">
              <CaptainAdPackageHero
                isArabic={isArabic}
                formattedRate={formattedRate}
                currency={currency}
                adPackage={adPackage}
                isAlreadyActive={isAlreadyActive}
                isExpired={isExpired}
                hasActivatedBefore={hasActivatedBefore}
                remainingDays={remainingDays}
              />
              <CaptainAdPackageFeaturesList isArabic={isArabic} />
            </div>

            <div className="p-4 sm:p-5 border-t border-white/10 bg-[#070D19]/95 flex flex-col gap-2.5 shrink-0">
              {!isAlreadyActive && !isExpired && !hasActivatedBefore ? (
                <div className="rounded-2xl border border-teal-500/25 bg-teal-500/5 p-3">
                  <label className="flex items-start gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hasAgreedContract}
                      onChange={(e) => setHasAgreedContract(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded border-teal-500/40 bg-black/40 text-[#14F5D5] focus:ring-teal-500/20 cursor-pointer"
                    />
                    <span className="text-xs text-slate-300 leading-relaxed select-none">
                      {isArabic ? 'قرأت وأوافق على ' : 'I have read and agree to the '}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setShowContractModal(true);
                        }}
                        className="font-bold text-[#14F5D5] underline hover:text-teal-300 transition cursor-pointer"
                      >
                        {isArabic ? 'وثيقة التأسيس والتعاقد وشروط اشتراك الكابتن المعلن' : 'Foundational Agreement & Captain Advertiser Subscription Terms'}
                      </button>
                    </span>
                  </label>
                </div>
              ) : null}

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
                  onClick={handleDoActivate}
                  disabled={!hasAgreedContract || isActivating}
                  className={`w-full h-12 inline-flex items-center justify-center gap-2 rounded-2xl px-4 text-xs sm:text-sm font-black transition cursor-pointer ${
                    hasAgreedContract && !isActivating
                      ? 'bg-gradient-to-r from-teal-400 via-[#00ffcc] to-emerald-400 text-slate-950 shadow-lg shadow-teal-500/25 hover:shadow-[0_0_25px_rgba(0,255,204,0.4)] hover:brightness-105 active:scale-[0.99]'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
                  }`}
                >
                  <Sparkles className="h-4 w-4 shrink-0" />
                  <span>{isActivating ? (isArabic ? 'جاري تفعيل الباقة وتوثيق الوثيقة...' : 'Activating & certifying...') : (isArabic ? 'تفعيل الباقة الافتتاحية مجاناً (أول 30 يوم)' : 'Activate Launch Package Free (First 30 Days)')}</span>
                </button>
              )}

              <div className="flex items-center gap-2">
                <button type="button" onClick={onGoToPayment} className="flex-1 h-11 inline-flex items-center justify-center gap-2 rounded-2xl border border-cyan-500/30 bg-cyan-950/40 hover:bg-cyan-900/40 hover:border-cyan-400 text-cyan-200 px-3 text-xs sm:text-sm font-bold active:scale-[0.98] transition cursor-pointer">
                  <CreditCard className="h-4 w-4 shrink-0 text-cyan-400" />
                  <span>{isArabic ? 'وسائل الدفع والشحن' : 'Payment Methods'}</span>
                </button>
                <button type="button" onClick={onClose} className="shrink-0 h-11 px-5 inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:text-white text-slate-300 text-xs sm:text-sm font-bold active:scale-[0.98] transition cursor-pointer">
                  {isArabic ? 'رجوع' : 'Back'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      <CaptainUnifiedTermsModal
        isOpen={showContractModal}
        onClose={() => setShowContractModal(false)}
        readOnly={true}
        captainId={captainId}
        isArabic={isArabic}
      />
    </div>,
    document.body,
  );
}
