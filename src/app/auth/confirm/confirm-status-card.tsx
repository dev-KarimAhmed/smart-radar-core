import React from 'react';
import Link from 'next/link';
import { CheckCircle2, Loader2, ArrowRight, MailCheck } from 'lucide-react';

export interface ConfirmStatusCardProps {
  status: 'verifying' | 'success' | 'already' | 'error';
  isArabic: boolean;
  errorMessage?: string;
  loginUrl: string;
}

export function ConfirmStatusCard({
  status,
  isArabic,
  errorMessage,
  loginUrl,
}: ConfirmStatusCardProps) {
  if (status === 'verifying') {
    return (
      <div className="py-8 space-y-4 animate-in fade-in duration-300">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#14B8A6]/15 border border-[#14B8A6]/30 text-[#14F5D5]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
        <h1 className="text-xl font-black text-white">
          {isArabic ? 'جارٍ التحقق من تأكيد حسابك...' : 'Verifying account confirmation...'}
        </h1>
        <p className="text-sm text-slate-400">
          {isArabic
            ? 'يرجى الانتظار لحظة بينما نقوم بتفعيل حسابك.'
            : 'Please wait a moment while we activate your account.'}
        </p>
      </div>
    );
  }

  if (status === 'success' || status === 'already') {
    return (
      <div className="py-4 space-y-5 animate-in fade-in duration-300">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#14F5D5]/20 to-[#14B8A6]/10 border border-[#14F5D5]/40 text-[#14F5D5] shadow-[0_0_30px_rgba(20,245,213,0.25)]">
          <CheckCircle2 className="h-10 w-10 text-[#14F5D5]" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-black text-white tracking-tight">
            {status === 'already'
              ? isArabic
                ? 'حسابك مؤكد ومفعل بالفعل!'
                : 'Your account is already verified!'
              : isArabic
              ? '🎉 تم تأكيد حسابك بنجاح!'
              : '🎉 Account confirmed successfully!'}
          </h1>
          <p className="text-sm leading-relaxed text-slate-300">
            {isArabic
              ? 'تم التحقق من بريدك الإلكتروني بنجاح، وأصبح حسابك مفعل وجاهز للاستخدام بالكامل.'
              : 'Your email has been verified successfully. Your account is active and ready to use.'}
          </p>
        </div>

        <div className="pt-4">
          <Link
            href={loginUrl}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#14F5D5] to-[#14B8A6] px-6 py-4 text-base font-black text-[#04140F] shadow-[0_10px_30px_rgba(20,184,166,0.35)] transition-all hover:brightness-110 active:scale-95 cursor-pointer"
          >
            <span>{isArabic ? 'تسجيل الدخول الآن' : 'Log In Now'}</span>
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 space-y-5 animate-in fade-in duration-300">
      <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-rose-500/15 border border-rose-500/30 text-rose-400 shadow-[0_0_25px_rgba(244,63,94,0.2)]">
        <MailCheck className="h-10 w-10 text-rose-400" />
      </div>

      <div className="space-y-2">
        <h1 className="text-xl font-black text-white">
          {isArabic ? 'رابط التأكيد غير صالح أو منتهي' : 'Confirmation link is invalid or expired'}
        </h1>
        <p className="text-sm leading-relaxed text-slate-300">
          {errorMessage ||
            (isArabic
              ? 'قد يكون رابط التأكيد انتهت صلاحيته أو تم استخدامه مسبقاً.'
              : 'The confirmation link may have expired or already been used.')}
        </p>
      </div>

      <div className="pt-4 space-y-2.5">
        <Link
          href={loginUrl}
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-black text-white hover:bg-white/10 transition-all cursor-pointer"
        >
          <span>{isArabic ? 'الانتقال لتسجيل الدخول' : 'Go to Login'}</span>
        </Link>
        <div className="pt-2 text-center">
          <a
            href="mailto:Bynkcominfo@gmail.com?subject=مشكلة في تأكيد الحساب - بينكم"
            className="inline-flex items-center gap-1.5 text-xs text-[#14F5D5] hover:underline"
          >
            <span>{isArabic ? 'تحتاج مساعدة؟ تواصل مع الدعم:' : 'Need help? Contact support:'}</span>
            <span className="font-mono text-white underline">Bynkcominfo@gmail.com</span>
          </a>
        </div>
      </div>
    </div>
  );
}
