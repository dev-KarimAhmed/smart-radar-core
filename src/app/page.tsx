'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/contract';
import LoginPage from '@/features/auth/components/login-page';
import { useLocale, useTranslations } from "next-intl";
import { storePendingCaptainReferral, clearPendingCaptainReferral, removeReferralParamFromUrl } from '@/features/referral/services/captain-referral';

const styles = {
  loadingRoot: 'flex h-dvh w-screen select-none flex-col items-center justify-center bg-[#0A0F1D] text-white/90',
  loadingIconFrame: 'flex h-14 w-14 items-center justify-center rounded-2xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 shadow-[0_0_30px_rgba(20,184,166,0.18)]',
  loadingIcon: 'h-5 w-5 animate-spin rounded-full border-2 border-[#14B8A6]/25 border-t-[#14B8A6]',
  loadingTitle: 'mt-5 animate-pulse text-xl font-black tracking-normal',
  loadingBody: 'mt-2 text-xs font-bold text-[#94A3B8]',
  fallback: 'flex h-dvh w-screen flex-col items-center justify-center bg-[#0A0F1D] p-6 text-center text-white',
  fallbackContent: 'max-w-md space-y-4',
  fallbackTitle: 'text-xl font-bold',
  fallbackRole: 'text-xs text-gray-400',
  fallbackWarning: 'text-xs text-red-400',
} as const;

export default function HomePage() {
  const tAuto = useTranslations('auto');
  const locale = useLocale();
  const isArabic = locale === 'ar';
  const { loading, user } = useAuth();
  const router = useRouter();
  const hasRedirectedRef = useRef(false);

  const isRecoveryIntent =
    typeof window !== 'undefined' &&
    ((window.location.hash &&
      (window.location.hash.includes('type=recovery') ||
       window.location.hash.includes('access_token=') ||
       window.location.hash.includes('error='))) ||
     (window.location.search &&
      (window.location.search.includes('type=recovery') ||
       window.location.search.includes('error='))));

  const isRedirecting = !isRecoveryIntent && !!user && (
    user.role === 'driver' ||
    user.role === 'rider' ||
    user.role === 'admin' ||
    user.role === 'advertiser' ||
    user.role === 'delegate'
  );

  // Eager prefetch target route to accelerate transition
  useEffect(() => {
    if (!user) return;
    if (user.role === 'driver') router.prefetch('/captain');
    else if (user.role === 'rider') router.prefetch('/rider');
    else if (user.role === 'admin') router.prefetch('/admin');
    else if (user.role === 'advertiser') router.prefetch('/advertiser/dashboard');
    else if (user.role === 'delegate') router.prefetch('/delegate');
  }, [router, user]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash || '';
      const search = window.location.search || '';

      const searchParams = new URLSearchParams(search);
      const ref = searchParams.get('ref') || searchParams.get('captain');
      if (ref && ref.trim()) {
        if (!user && !loading) {
          storePendingCaptainReferral(ref.trim());
          router.replace(`/register/rider${search}`);
          return;
        } else if (user) {
          clearPendingCaptainReferral();
          removeReferralParamFromUrl();
        }
      }
      if (
        hash.includes('type=recovery') ||
        hash.includes('access_token=') ||
        hash.includes('error=') ||
        search.includes('type=recovery') ||
        search.includes('error=')
      ) {
        window.location.replace(`/reset-password${search}${hash}`);
        return;
      }
    }
    if (loading || !user || hasRedirectedRef.current) return;
    hasRedirectedRef.current = true;
    const search = typeof window !== 'undefined' ? window.location.search : '';
    if (user.role === 'driver') router.replace(`/captain${search}`);
    else if (user.role === 'rider') router.replace(`/rider${search}`);
    else if (user.role === 'admin') router.replace(`/admin${search}`);
    else if (user.role === 'advertiser') router.replace(`/advertiser/dashboard${search}`);
    else if (user.role === 'delegate') router.replace(`/delegate${search}`);
  }, [loading, router, user]);

  const loadingSubtitle = useMemo(() => {
    if (isRedirecting) {
      if (user?.role === 'driver') return isArabic ? 'جاري فتح منصة الكابتن...' : 'Opening Captain Portal...';
      if (user?.role === 'rider') return isArabic ? 'جاري فتح منصة الراكب...' : 'Opening Rider Portal...';
      if (user?.role === 'admin') return isArabic ? 'جاري فتح لوحة التحكم...' : 'Opening Admin Dashboard...';
      if (user?.role === 'advertiser') return isArabic ? 'جاري فتح منصة المعلن...' : 'Opening Advertiser Portal...';
      if (user?.role === 'delegate') return isArabic ? 'جاري فتح منصة المندوب...' : 'Opening Delegate Portal...';
    }
    return tAuto('key_7588d11e');
  }, [isRedirecting, user?.role, tAuto]);

  if (loading || isRedirecting) {
    return (
      <div className={styles.loadingRoot}>
        <div className={styles.loadingIconFrame}><div className={styles.loadingIcon} /></div>
        <div className={styles.loadingTitle}>{tAuto('key_74d1106b')}</div>
        <div className={styles.loadingBody}>{loadingSubtitle}</div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return (
    <div className={styles.fallback}>
      <div className={styles.fallbackContent}>
        <h1 className={styles.fallbackTitle}>{tAuto('key_aa12bda7')} {user.name}</h1>
        <p className={styles.fallbackRole}>{tAuto('key_ccda32d9')} {user.role}</p>
        <p className={styles.fallbackWarning}>{tAuto('key_8160066f')}</p>
      </div>
    </div>
  );
}
