'use client';

import React from 'react';
import {
  Check,
  Clock,
  Download,
  Loader2,
  Mail,
  MailCheck,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { SovereignPwaInstallModal } from '@/components/sovereign-pwa-install-modal';
import { maskEmail, styles } from './personal-step-constants';

interface ActivationConfirmationViewProps {
  awaitingConfirmationEmail: string;
  isArabic: boolean;
  role: string | null;
  otpInput: string;
  setOtpInput: (val: string) => void;
  isVerifyingOtp: boolean;
  handleVerifyOtp: () => Promise<void>;
  isResending: boolean;
  resendCountdown: number;
  handleResendConfirmation: () => Promise<void>;
  onBackToLogin: () => void;
  showPwaInstallModal: boolean;
  setShowPwaInstallModal: (val: boolean) => void;
}

export function ActivationConfirmationView({
  awaitingConfirmationEmail,
  isArabic,
  role,
  otpInput,
  setOtpInput,
  isVerifyingOtp,
  handleVerifyOtp,
  isResending,
  resendCountdown,
  handleResendConfirmation,
  onBackToLogin,
  showPwaInstallModal,
  setShowPwaInstallModal,
}: ActivationConfirmationViewProps) {
  return (
    <main dir={isArabic ? 'rtl' : 'ltr'} className={styles.style329_1}>
      <div className={styles.style331_2} />
      <div className="relative z-10 flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md rounded-3xl border border-emerald-500/30 bg-[#0D1424]/95 p-6 sm:p-8 shadow-2xl backdrop-blur-xl text-center space-y-6 animate-in fade-in duration-200">
          {/* Header Icon */}
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#14B8A6]/25 to-teal-500/10 border border-[#14B8A6]/40 text-[#14F5D5] shadow-[0_0_30px_rgba(20,184,166,0.3)]">
            <MailCheck className="h-10 w-10 animate-pulse drop-shadow-[0_0_10px_rgba(20,245,213,0.6)]" />
          </div>

          {/* Title & Description */}
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {isArabic ? 'تأكيد وتفعيل الحساب' : 'Account Activation'}
            </h2>
            <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3 text-center">
              <p className="text-xs sm:text-sm font-bold text-amber-200 leading-relaxed max-w-xs mx-auto">
                {isArabic
                  ? `عليك تفعيل الحساب من الإيميل (${maskEmail(awaitingConfirmationEmail)})`
                  : `Please activate your account from your email (${maskEmail(awaitingConfirmationEmail)})`}
              </p>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-xs mx-auto">
              {isArabic
                ? 'تم إرسال كود تفعيل مكون من 6 أرقام إلى بريدك الإلكتروني لتأكيد وتفعيل الحساب:'
                : 'A 6-digit activation code was sent to your email to confirm your account:'}
            </p>
          </div>

          {/* Email Address Pill */}
          <div className="inline-flex items-center gap-2 rounded-2xl border border-[#14B8A6]/40 bg-[#14B8A6]/10 px-4 py-2 shadow-inner">
            <Mail className="h-4 w-4 text-[#14F5D5]" />
            <span className="font-mono font-bold text-xs sm:text-sm text-[#14F5D5] tracking-wide" dir="ltr">
              {awaitingConfirmationEmail}
            </span>
          </div>

          {/* 6-digit OTP Code Input Card */}
          <div className="rounded-2xl border border-emerald-500/30 bg-black/50 p-4 space-y-3.5" dir={isArabic ? 'rtl' : 'ltr'}>
            <label className="block text-xs font-bold text-slate-200 text-center">
              {isArabic ? 'أدخل كود التفعيل المكون من 6 أرقام:' : 'Enter the 6-digit verification code:'}
            </label>

            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={6}
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="• • • • • •"
              dir="ltr"
              className="w-full h-13 rounded-xl border-2 border-[#14B8A6]/50 bg-black/70 px-4 text-center font-mono text-2xl sm:text-3xl font-black text-[#14F5D5] tracking-[0.4em] focus:border-[#14F5D5] focus:outline-none focus:ring-2 focus:ring-[#14F5D5]/30 transition-all placeholder:tracking-normal placeholder:text-slate-600 shadow-inner"
            />

            <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-amber-300">
              <Clock className="h-3.5 w-3.5 shrink-0 text-amber-400 animate-pulse" />
              <span>{isArabic ? 'الكود صالح لمدة 15 دقيقة فقط' : 'Code is valid for 15 minutes only'}</span>
            </div>

            {/* Verify Button */}
            <button
              type="button"
              disabled={otpInput.trim().length !== 6 || isVerifyingOtp}
              onClick={handleVerifyOtp}
              className="w-full min-h-12 flex items-center justify-center gap-2 rounded-xl bg-[#14B8A6] hover:bg-[#2DD4BF] active:scale-95 text-[#0B0F19] font-black text-sm transition shadow-[0_10px_25px_rgba(20,184,166,0.35)] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              {isVerifyingOtp ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#0B0F19]" />
              ) : (
                <Check className="h-4 w-4 stroke-[3]" />
              )}
              <span>{isArabic ? 'تأكيد الكود وتفعيل الحساب 🚀' : 'Confirm & Activate 🚀'}</span>
            </button>
          </div>

          {/* Actions: Resend & Login */}
          <div className="space-y-3 pt-1">
            <button
              type="button"
              onClick={() => setShowPwaInstallModal(true)}
              className="w-full flex items-center justify-center gap-2 rounded-2xl border border-[#14B8A6]/40 bg-[#14B8A6]/10 hover:bg-[#14B8A6]/20 active:scale-95 h-11 text-xs sm:text-sm font-bold text-[#14F5D5] transition-all cursor-pointer shadow-md shadow-[#14B8A6]/10"
            >
              <Download className="h-4 w-4" />
              <span>{isArabic ? 'تثبيت تطبيق بينكم (PWA)' : 'Install Among You (PWA)'}</span>
            </button>

            <button
              type="button"
              disabled={isResending || resendCountdown > 0}
              onClick={handleResendConfirmation}
              className="w-full flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 active:scale-95 h-11 text-xs sm:text-sm font-bold text-slate-300 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isResending ? (
                <Loader2 className="h-4 w-4 animate-spin text-[#14F5D5]" />
              ) : (
                <RefreshCw className={cn("h-4 w-4 text-[#14F5D5]", resendCountdown > 0 ? "" : "hover:rotate-180 transition-transform")} />
              )}
              <span>
                {resendCountdown > 0
                  ? (isArabic ? `إعادة الإرسال خلال (${resendCountdown} ثانية)` : `Resend in (${resendCountdown}s)`)
                  : (isArabic ? 'إعادة إرسال كود التفعيل' : 'Resend activation code')}
              </span>
            </button>

            <button
              type="button"
              onClick={onBackToLogin}
              className="w-full flex items-center justify-center gap-2 rounded-2xl border border-white/5 bg-transparent hover:bg-white/5 active:scale-95 h-10 text-xs font-bold text-slate-400 hover:text-white transition-all cursor-pointer"
            >
              <ArrowRight className={cn("h-4 w-4", isArabic ? "" : "rotate-180")} />
              <span>{isArabic ? 'الانتقال إلى تسجيل الدخول' : 'Go to login'}</span>
            </button>
          </div>
        </div>
      </div>
      <SovereignPwaInstallModal
        isOpen={showPwaInstallModal}
        onClose={() => setShowPwaInstallModal(false)}
        isArabic={isArabic}
        role={role === 'driver' ? 'captain' : 'rider'}
      />
    </main>
  );
}
