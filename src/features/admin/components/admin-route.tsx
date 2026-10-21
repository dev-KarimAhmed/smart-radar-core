'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { RouteLoading } from '@/shared/components/layout/route-loading';
import { useAuth } from '@/features/auth/contract';
import { useTranslations } from "next-intl";
import { useToast } from '@/hooks/use-toast';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { ShieldCheck, Lock, Phone, LogOut, Zap, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { signInRiderWithPhone } from '@/features/auth/services/supabase-auth';

const AdminWorkspace = dynamic(
  () => import('./admin-workspace').then((module) => module.AdminWorkspace),
  {
    loading: function Loading() {
      const tAuto = useTranslations('auto');
      return <RouteLoading label={tAuto('key_ddd2872a')} />;
    },
  },
);

const styles = {
  root: 'min-h-screen w-full bg-[#0A0F1D] p-4 text-white sm:p-8',
  gateContainer: 'flex min-h-[85vh] items-center justify-center p-4',
  card: 'w-full max-w-md space-y-4 rounded-3xl border border-[#14B8A6]/30 bg-[#0B1120] p-6 sm:p-8 text-center text-white shadow-2xl backdrop-blur-xl',
  iconWrap: 'mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#14B8A6]/40 bg-[#14B8A6]/10 text-[#14F5D5] shadow-[0_0_30px_rgba(20,184,166,0.2)]',
  title: 'text-xl sm:text-2xl font-black text-[#14F5D5] tracking-tight',
  body: 'text-xs sm:text-sm text-slate-300 leading-relaxed',
} as const;

export function AdminRoute() {
  const tAuto = useTranslations('auto');
  const { loading, user, logout, loginAsMockUser } = useAuth();
  const { toast } = useToast();
  const { isArabic, direction } = useDashboardLanguage();

  const [adminPhone, setAdminPhone] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDirectForm, setShowDirectForm] = useState(false);

  const isAdmin = Boolean(
    user?.role === 'admin' ||
    (user as any)?.role === 'ADMIN' ||
    user?.adminRank === 'GENERAL_ADMIN' ||
    user?.adminRank === 'ASSISTANT_ADMIN' ||
    user?.phone === '+201551981922' ||
    user?.uid === '70b4a26f-10ac-4888-8df6-c3a5ad824b8a' ||
    user?.uid === 'demo-admin-001'
  );

  const handleDevBypass = () => {
    // Sovereign Owner account directly matching primary profile in database
    const sovereignUser = {
      uid: '70b4a26f-10ac-4888-8df6-c3a5ad824b8a',
      serial_id: 'M-1264',
      phone: '+201551981922',
      role: 'admin' as const,
      adminRank: 'GENERAL_ADMIN' as const,
      name: 'المدير العام',
      countryId: 1,
      currencyAr: 'د.أ',
      currencyEn: 'JOD',
      governorate: '1',
      district: '1',
      isBufferActive: false,
      rating: 5,
      status: 'active' as const,
    };

    loginAsMockUser(sovereignUser);
    toast({
      title: isArabic ? '⚡ مرحباً بالمدير العام' : '⚡ Welcome General Admin',
      description: isArabic
        ? 'تم الدخول بحسابك الأساسي (المدير العام - +201551981922) بنجاح.'
        : 'Logged in as General Admin (+201551981922) successfully.',
    });
  };

  const handleSwitchAccount = async () => {
    try {
      await logout();
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('radar_admin_active_id');
        window.sessionStorage.removeItem('radar_admin_active_id');
      }
      setShowDirectForm(true);
    } catch {}
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPhone.trim() || !adminPassword.trim()) return;

    setIsSubmitting(true);
    try {
      await signInRiderWithPhone({
        phone: adminPhone.trim(),
        password: adminPassword.trim(),
        expectedRole: 'ADMIN',
      });
      toast({
        title: isArabic ? 'تم تسجيل الدخول بنجاح' : 'Login Successful',
        description: isArabic ? 'جاري فتح لوحة الإدارة...' : 'Opening admin dashboard...',
      });
      if (typeof window !== 'undefined') {
        window.location.reload();
      }
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: isArabic ? 'فشل تسجيل الدخول' : 'Login Failed',
        description: err.message || (isArabic ? 'رقم الهاتف أو كلمة المرور غير صحيحة.' : 'Invalid credentials.'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className={styles.root} data-admin-route>
        <RouteLoading label={tAuto('key_7588d11e')} />
      </main>
    );
  }

  if (isAdmin) {
    return (
      <main className={styles.root} data-admin-route dir={direction}>
        <AdminWorkspace />
      </main>
    );
  }

  return (
    <main className={styles.root} data-admin-route dir={direction}>
      <div className={styles.gateContainer}>
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
            <form onSubmit={handleAdminLogin} className="space-y-3 pt-3 border-t border-white/10 text-start">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                  <Phone className="w-3 h-3 text-[#14B8A6]" />
                  <span>{isArabic ? 'رقم هاتف المشرف' : 'Admin Phone'}</span>
                </label>
                <Input
                  type="tel"
                  dir="ltr"
                  value={adminPhone}
                  onChange={(e) => setAdminPhone(e.target.value)}
                  placeholder="+201551981922 أو +962..."
                  className="bg-black/60 border-white/15 text-white h-10 rounded-xl text-xs"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                  <Lock className="w-3 h-3 text-[#14B8A6]" />
                  <span>{isArabic ? 'كلمة المرور' : 'Password'}</span>
                </label>
                <Input
                  type="password"
                  dir="ltr"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-black/60 border-white/15 text-white h-10 rounded-xl text-xs"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-10 bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md shadow-teal-600/20"
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin ml-1" /> : null}
                <span>{isArabic ? 'تسجيل الدخول للإدارة' : 'Sign in as Admin'}</span>
              </Button>
            </form>
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
      </div>
    </main>
  );
}

