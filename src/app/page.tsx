'use client';

import React, { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import LoginPage from '@/features/auth/components/login-page';
import { Loader2 } from 'lucide-react';

const styles = {
  style27_1: "flex h-dvh w-screen select-none flex-col items-center justify-center bg-[#0A0F1D] text-white/90",
  style28_2: "flex h-14 w-14 items-center justify-center rounded-2xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 shadow-[0_0_30px_rgba(20,184,166,0.18)]",
  style29_3: "h-5 w-5 animate-spin rounded-full border-2 border-[#14B8A6]/25 border-t-[#14B8A6]",
  style31_4: "mt-5 animate-pulse text-xl font-black tracking-normal",
  style32_5: "mt-2 text-xs font-bold text-[#94A3B8]",
  style43_6: "flex h-dvh w-screen flex-col items-center justify-center bg-[#0A0F1D] text-white p-6 text-center",
  style44_7: "max-w-md space-y-4",
  style45_8: "text-xl font-bold",
  style46_9: "text-xs text-gray-400",
  style47_10: "text-xs text-red-400",
} as const;


export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const isRedirecting = !!user && (user.role === 'driver' || user.role === 'rider');

  useEffect(() => {
    if (loading || !user) return;

    if (user.role === 'driver') {
      router.replace('/captain');
    } else if (user.role === 'rider') {
      router.replace('/rider');
    }
  }, [user, loading, router]);

  if (loading || isRedirecting) {
    return (
      <div className={styles.style27_1}>
        <div className={styles.style28_2}>
          <div className={styles.style29_3} />
        </div>
        <div className={styles.style31_4}>الرادار الذكي</div>
        <div className={styles.style32_5}>جاري التحقق من الجلسة...</div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  // If user role is loaded but not rider/driver, we can show a simple fallback or prompt them:
  return (
    <div className={styles.style43_6}>
      <div className={styles.style44_7}>
        <h1 className={styles.style45_8}>مرحباً بك {user.name}</h1>
        <p className={styles.style46_9}>دور المستخدم الحالي: {user.role}</p>
        <p className={styles.style47_10}>دور المستخدم هذا غير مسجل في مسارات الرادار الحية.</p>
      </div>
    </div>
  );
}
