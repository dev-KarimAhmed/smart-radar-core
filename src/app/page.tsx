'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/contract';
import LoginPage from '@/features/auth/components/login-page';

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
  const { loading, user } = useAuth();
  const router = useRouter();
  const isRedirecting = !!user && (user.role === 'driver' || user.role === 'rider');

  useEffect(() => {
    if (loading || !user) return;
    if (user.role === 'driver') router.replace('/captain');
    if (user.role === 'rider') router.replace('/rider');
  }, [loading, router, user]);

  if (loading || isRedirecting) {
    return (
      <div className={styles.loadingRoot}>
        <div className={styles.loadingIconFrame}><div className={styles.loadingIcon} /></div>
        <div className={styles.loadingTitle}>الرادار الذكي</div>
        <div className={styles.loadingBody}>جاري التحقق من الجلسة...</div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return (
    <div className={styles.fallback}>
      <div className={styles.fallbackContent}>
        <h1 className={styles.fallbackTitle}>مرحباً بك {user.name}</h1>
        <p className={styles.fallbackRole}>دور المستخدم الحالي: {user.role}</p>
        <p className={styles.fallbackWarning}>دور المستخدم هذا غير مسجل في مسارات الرادار الحية.</p>
      </div>
    </div>
  );
}
