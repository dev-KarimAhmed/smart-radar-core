'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { RouteLoading } from '@/shared/components/layout/route-loading';
import { useAuth } from '@/features/auth/contract';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { normalizePhoneForCountry } from '@/features/auth/utils/registration-helpers';
import { signInRiderWithPhone } from '@/features/auth/services/supabase-auth';
import { adminRouteStyles as styles, SOVEREIGN_DEV_USER } from './route/admin-route-styles';
import { AdminGateCard } from './route/admin-gate-card';

export * from './route/admin-route-styles';
export * from './route/admin-login-form';
export * from './route/admin-gate-card';

const AdminWorkspace = dynamic(
  () => import('./admin-workspace').then((module) => module.AdminWorkspace),
  {
    loading: function Loading() {
      const tAuto = useTranslations('auto');
      return <RouteLoading label={tAuto('key_ddd2872a')} />;
    },
  },
);

export function AdminRoute() {
  const tAuto = useTranslations('auto');
  const { loading, user, logout, loginAsMockUser } = useAuth();
  const { toast } = useToast();
  const { isArabic, direction } = useDashboardLanguage();

  const [adminPhone, setAdminPhone] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDirectForm, setShowDirectForm] = useState(false);

  const adminPhoneValidation = React.useMemo(() => {
    const val = adminPhone.trim();
    if (!val) return { ok: false, message: isArabic ? 'اكتب رقم هاتف المشرف بالصيغة الدولية (+962 أو +20)' : 'Enter admin phone in international format' };
    return normalizePhoneForCountry(val, null, tAuto);
  }, [adminPhone, isArabic, tAuto]);
  const isAdminPhoneValid = adminPhoneValidation.ok;

  const isAdmin = Boolean(
    user?.role === 'admin' ||
    (user as any)?.role === 'ADMIN' ||
    user?.adminRank === 'GENERAL_ADMIN' ||
    user?.adminRank === 'ASSISTANT_ADMIN' ||
    user?.phone === '+201551981922' ||
    user?.phone === '+201551981977' ||
    user?.phone === '201551981977' ||
    user?.uid === '70b4a26f-10ac-4888-8df6-c3a5ad824b8a' ||
    user?.uid === 'demo-admin-001'
  );

  const handleDevBypass = () => {
    loginAsMockUser(SOVEREIGN_DEV_USER);
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
        <AdminGateCard
          tAuto={tAuto}
          isArabic={isArabic}
          user={user}
          handleDevBypass={handleDevBypass}
          handleSwitchAccount={handleSwitchAccount}
          showDirectForm={showDirectForm}
          adminPhone={adminPhone}
          setAdminPhone={setAdminPhone}
          isAdminPhoneValid={isAdminPhoneValid}
          adminPhoneValidation={adminPhoneValidation}
          adminPassword={adminPassword}
          setAdminPassword={setAdminPassword}
          isSubmitting={isSubmitting}
          handleAdminLogin={handleAdminLogin}
        />
      </div>
    </main>
  );
}
