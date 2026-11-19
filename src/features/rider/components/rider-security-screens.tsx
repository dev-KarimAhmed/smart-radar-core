import React from 'react';
import { ShieldAlert, AlertTriangle } from 'lucide-react';

interface RiderSecurityScreenProps {
  status: 'BANNED' | 'SUSPENDED';
  isArabic: boolean;
  onLogout: () => void;
  onRefresh?: () => void;
}

export function RiderSecurityScreen({
  status,
  isArabic,
  onLogout,
  onRefresh,
}: RiderSecurityScreenProps) {
  if (status === 'BANNED') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B0F19] p-6 text-center text-white" dir={isArabic ? 'rtl' : 'ltr'}>
        <div className="max-w-md w-full space-y-5 rounded-3xl border border-rose-500/40 bg-[#160808]/95 p-7 text-center text-white shadow-2xl backdrop-blur-2xl">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/15 border border-rose-500/30">
            <ShieldAlert className="h-9 w-9 text-rose-500 animate-pulse" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-black text-rose-200">
              {isArabic ? 'حساب المستخدم محظور نهائياً 🚫' : 'Rider Account Permanently Banned 🚫'}
            </h1>
            <p className="text-xs leading-6 text-rose-100/80">
              {isArabic
                ? 'تم حظر حسابك نهائياً من قبل إدارة المنظومة لمخالفة المعايير التشغيلية والسيادية. تم إيقاف طلب الرحلات وعزل الحساب عن الرادار.'
                : 'Your account has been permanently banned by platform administration due to policy violations. Ride requests and radar access have been disabled.'}
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center justify-center rounded-2xl bg-rose-500/20 border border-rose-500/50 px-6 py-2.5 text-xs font-black text-rose-300 hover:bg-rose-500/30 transition shadow-lg cursor-pointer"
            >
              {isArabic ? 'تسجيل الخروج' : 'Log Out'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0B0F19] p-6 text-center text-white" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className="max-w-md w-full space-y-5 rounded-3xl border border-amber-500/40 bg-[#171208]/95 p-7 text-center text-white shadow-2xl backdrop-blur-2xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-500/15 border border-amber-500/30">
          <AlertTriangle className="h-9 w-9 text-amber-500 animate-pulse" />
        </div>
        <div className="space-y-2">
          <h1 className="text-xl font-black text-amber-200">
            {isArabic ? 'حساب المستخدم معلق مؤقتاً ⚠️' : 'Rider Account Suspended ⚠️'}
          </h1>
          <p className="text-xs leading-6 text-amber-100/80">
            {isArabic
              ? 'تم تعليق حسابك مؤقتاً من قبل إدارة العمليات لمراجعة معايير النزاهة والمناعة السلوكية. يرجى مراجعة الإدارة أو التواصل مع الدعم عبر البريد الإلكتروني (Bynkcominfo@gmail.com) لفك التعليق وتنشيط الحساب.'
              : 'Your account is temporarily suspended by platform administration to review behavioral immunity standards. Please contact support via email (Bynkcominfo@gmail.com).'}
          </p>
        </div>
        <div className="flex items-center justify-center gap-3 pt-2">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="inline-flex items-center justify-center rounded-2xl bg-amber-500/20 border border-amber-500/50 px-5 py-2.5 text-xs font-black text-amber-300 hover:bg-amber-500/30 transition shadow-lg cursor-pointer"
            >
              {isArabic ? 'تحديث الحالة 🔄' : 'Refresh 🔄'}
            </button>
          )}
          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 px-5 py-2.5 text-xs font-bold text-slate-300 hover:bg-white/10 transition cursor-pointer"
          >
            {isArabic ? 'تسجيل الخروج' : 'Log Out'}
          </button>
        </div>
      </div>
    </div>
  );
}
