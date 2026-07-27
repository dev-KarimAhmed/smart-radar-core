'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/features/auth/contract';
import { RouteLoading } from '@/shared/components/layout/route-loading';

const LoginPage = dynamic(
  () => import('@/features/auth/components/login-page'),
  { loading: () => <RouteLoading label="جاري تحميل تسجيل الدخول..." /> },
);

const styles = {
  root: 'flex min-h-dvh items-center justify-center bg-[#0A0F1D] p-6 text-center text-white',
  card: 'w-full max-w-lg space-y-6 rounded-3xl border border-[#14B8A6]/20 bg-[#0B1120] p-8 shadow-2xl',
  badge: 'text-sm font-black text-[#14B8A6]',
  title: 'text-4xl font-black text-white',
  body: 'text-sm leading-7 text-slate-400',
  actions: 'flex flex-col justify-center gap-3 sm:flex-row',
  primary: 'rounded-2xl bg-[#14B8A6] px-6 py-3 text-sm font-black text-[#06111f]',
  secondary: 'rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-black text-white',
} as const;

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    if (!user) return;
    const roleRoutes: Partial<Record<typeof user.role, string>> = {
      rider: '/rider',
      driver: '/captain',
      advertiser: '/advertiser/dashboard',
      delegate: '/delegate',
      admin: '/admin',
    };
    router.replace(roleRoutes[user.role] || '/register');
  }, [router, user]);

  if (showLogin) return <LoginPage />;

  return (
    <main className={styles.root}>
      <section className={styles.card}>
        <p className={styles.badge}>الرادار الذكي</p>
        <h1 className={styles.title}>رحلتك تبدأ من هنا</h1>
        <p className={styles.body}>منصة موحدة للراكب والكابتن والمعلن والمندوب، مصممة للعمل السريع والآمن.</p>
        <div className={styles.actions}>
          <button className={styles.primary} type="button" onClick={() => setShowLogin(true)}>تسجيل الدخول</button>
          <Link className={styles.secondary} href="/register?role=rider">إنشاء حساب</Link>
        </div>
      </section>
    </main>
  );
}
