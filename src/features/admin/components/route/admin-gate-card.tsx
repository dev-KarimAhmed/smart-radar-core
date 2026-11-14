import React from 'react';
import Link from 'next/link';
import { ShieldCheck, LogOut, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { adminRouteStyles as styles } from './admin-route-styles';
import { AdminLoginForm } from './admin-login-form';

export interface AdminGateCardProps {
  tAuto: (key: string) => string;
  isArabic: boolean;
  user: any;
  handleDevBypass: () => void;
  handleSwitchAccount: () => void;
  showDirectForm: boolean;
  adminPhone: string;
  setAdminPhone: (val: string) => void;
  isAdminPhoneValid: boolean;
  adminPhoneValidation: { ok: boolean; message?: string };
  adminPassword: string;
  setAdminPassword: (val: string) => void;
  isSubmitting: boolean;
  handleAdminLogin: (e: React.FormEvent) => void;
}

export function AdminGateCard({
  tAuto,
  isArabic,
  user,
  handleDevBypass,
  handleSwitchAccount,
  showDirectForm,
  adminPhone,
  setAdminPhone,
  isAdminPhoneValid,
  adminPhoneValidation,
  adminPassword,
  setAdminPassword,
  isSubmitting,
  handleAdminLogin,
}: AdminGateCardProps) {
  return (
    <section className={styles.card}>
      <div className={styles.iconWrap}>
        <ShieldCheck className="h-7 w-7" />
      </div>

      <h1 className={styles.title}>{tAuto('key_afa34246')}</h1>
      <p className={styles.body}>{tAuto('key_d9b948a8')}</p>

      {/* If logged in with non-admin account */}
      {user && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-3.5 text-xs text-amber-200 text-center space-y-1">
          <p className="font-bold">
            {isArabic
              ? `أنت مسجل حالياً بحساب: ${user.name || user.phone}`
              : `Currently signed in as: ${user.name || user.phone}`}
          </p>
          <p className="text-[11px] text-amber-300/80">
            {isArabic
              ? `الدور الحالي (${user.role === 'driver' ? 'كابتن معلن' : user.role === 'rider' ? 'مستخدم' : user.role}) غير مصرح له بدخول لوحة الإدارة.`
              : `Current role (${user.role}) is not authorized for Admin.`}
          </p>
        </div>
      )}

      {/* Sovereign Admin instant bypass button */}
      <Button
        type="button"
        onClick={handleDevBypass}
        className="w-full h-12 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-teal-500/25 active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
      >
        <Zap className="w-4 h-4 fill-current text-slate-950" />
        <span>
          {isArabic
            ? '⚡ دخول فوري كمسؤول المنظومة (+201551981922)'
            : '⚡ Enter as System Admin (+201551981922)'}
        </span>
      </Button>

      {/* If user is signed in with another role, offer logout & switch */}
      {user && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
          <Button
            type="button"
            variant="outline"
            onClick={handleSwitchAccount}
            className="h-10 text-xs font-bold border-white/10 hover:border-teal-500/40 text-slate-200 hover:text-white rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-rose-400" />
            <span>{isArabic ? 'تسجيل الخروج والتبديل' : 'Switch Account'}</span>
          </Button>

          <Link
            href={user.role === 'driver' ? '/captain' : '/rider'}
            className="h-10 text-xs font-bold border border-white/10 hover:border-white/20 text-slate-400 hover:text-white rounded-xl flex items-center justify-center gap-1.5 transition-colors"
          >
            <span>{isArabic ? 'العودة لحسابك' : 'Return to App'}</span>
          </Link>
        </div>
      )}

      {/* Direct credentials form toggle / display */}
      {(!user || showDirectForm) && (
        <AdminLoginForm
          isArabic={isArabic}
          adminPhone={adminPhone}
          setAdminPhone={setAdminPhone}
          isAdminPhoneValid={isAdminPhoneValid}
          adminPhoneValidation={adminPhoneValidation}
          adminPassword={adminPassword}
          setAdminPassword={setAdminPassword}
          isSubmitting={isSubmitting}
          onSubmit={handleAdminLogin}
        />
      )}

      {!user && (
        <div className="pt-2">
          <Link
            href="/login/admin"
            className="text-xs text-teal-400 hover:text-teal-300 underline font-medium block"
          >
            {isArabic ? 'الانتقال لصفحة تسجيل الدخول الكاملة' : 'Go to Full Login Page'}
          </Link>
        </div>
      )}
    </section>
  );
}
