'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useAuth } from '@/features/auth/contract';
import { RouteLoading } from '@/shared/components/layout/route-loading';

const RiderWorkspace = dynamic(
  () => import('./rider-workspace').then((module) => module.RiderWorkspace),
  { loading: () => <RouteLoading label="جاري تحميل منصة الراكب..." /> },
);

const styles = {
  root: 'contents',
  gate: 'flex min-h-screen items-center justify-center bg-[#0A0F1D] p-6 text-center text-white',
  gateCard: 'max-w-sm space-y-3 rounded-3xl border border-[#14B8A6]/20 bg-[#0B1120] p-6',
  gateTitle: 'text-xl font-black text-[#14F5D5]',
  gateBody: 'text-sm text-slate-400',
  gateLink: 'inline-flex rounded-xl bg-[#14B8A6] px-5 py-3 text-sm font-black text-[#06111f]',
} as const;

export function RiderRoute() {
  const { loading, user } = useAuth();

  return (
    <div className={styles.root} data-rider-route>
      {loading ? <RouteLoading label="جاري التحقق من الجلسة..." /> : user?.role === 'rider' ? (
        <RiderWorkspace />
      ) : (
        <main className={styles.gate}>
          <section className={styles.gateCard}>
            <h1 className={styles.gateTitle}>منصة الراكب</h1>
            <p className={styles.gateBody}>سجّل الدخول بحساب راكب للوصول إلى الرادار وطلب الرحلة.</p>
            <Link className={styles.gateLink} href="/">تسجيل الدخول</Link>
          </section>
        </main>
      )}
    </div>
  );
}
