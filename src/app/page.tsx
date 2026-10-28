'use client';

import { useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/contract';
import LoginPage from '@/features/auth/components/login-page';
import { useTranslations } from "next-intl";
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

    const targetPath =
      user.role === 'driver' ? `/captain${search}` :
      user.role === 'rider' ? `/rider${search}` :
      user.role === 'admin' ? `/admin${search}` :
      user.role === 'advertiser' ? `/advertiser/dashboard${search}` :
      user.role === 'delegate' ? `/delegate${search}` :
      null;

    if (targetPath) {
      // 1. محاولة الانتقال السريع بـ SPA Router
      try {
        router.replace(targetPath);
      } catch {}

      // 2. صمام أمان حتمي فوري (Hard Redirect Fallback):
      // إذا تأخر راوتر Next.js أو علق لأي سبب شبكي أو محلي لأكثر من 800ms،
      // يُجبر المتصفح على الانتقال مباشرة وتجاوز شاشة التحميل دون الحاجة لـ Reload يدوي
      const timer = window.setTimeout(() => {
        if (typeof window !== 'undefined' && window.location.pathname !== targetPath.split('?')[0]) {
          window.location.replace(targetPath);
        }
      }, 800);

      return () => window.clearTimeout(timer);
    }
  }, [loading, router, user]);

  const loadingSubtitle = useMemo(() => {
    if (isRedirecting) {
      if (user?.role === 'driver') return 'جاري فتح منصة الكابتن...';
      if (user?.role === 'rider') return 'جاري فتح منصة الراكب...';
      if (user?.role === 'admin') return 'جاري فتح لوحة التحكم...';
      if (user?.role === 'advertiser') return 'جاري فتح منصة المعلن...';
      if (user?.role === 'delegate') return 'جاري فتح منصة المندوب...';
    }
    return tAuto('key_7588d11e');
  }, [isRedirecting, user?.role, tAuto]);

  if (loading || isRedirecting) {
    const directTarget =
      user?.role === 'driver' ? '/captain' :
      user?.role === 'rider' ? '/rider' :
      user?.role === 'admin' ? '/admin' :
      user?.role === 'advertiser' ? '/advertiser/dashboard' :
      user?.role === 'delegate' ? '/delegate' :
      null;

    return (
      <div className={styles.loadingRoot}>
        <div className={styles.loadingIconFrame}><div className={styles.loadingIcon} /></div>
        <div className={styles.loadingTitle}>{tAuto('key_74d1106b')}</div>
        <div className={styles.loadingBody}>{loadingSubtitle}</div>
        {directTarget && (
          <button
            type="button"
            onClick={() => window.location.replace(directTarget)}
            className="mt-4 text-[11px] font-bold text-[#14F5D5]/80 hover:text-[#14F5D5] underline underline-offset-4 cursor-pointer transition active:scale-95"
          >
            اضغط هنا للدخول المباشر
          </button>
        )}
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
