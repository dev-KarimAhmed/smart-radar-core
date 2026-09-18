'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useAuth } from '@/features/auth/contract';
import { RouteLoading } from '@/shared/components/layout/route-loading';
import { useTranslations } from 'next-intl';

const CaptainWorkspace = dynamic(
  () => import('./captain-workspace').then((module) => module.CaptainWorkspace),
  {
    loading: function Loading() {
      const tAuto = useTranslations('auto');
      return <RouteLoading label={tAuto('key_7638191e')} />;
    },
  },
);

const styles = {
  root: 'contents',
  gate: 'flex min-h-screen items-center justify-center bg-[#0B0F19] p-6 text-center text-white',
  gateCard: 'max-w-sm space-y-3 rounded-3xl border border-[#14B8A6]/20 bg-[#05080f] p-6',
  gateTitle: 'text-xl font-black text-[#14F5D5]',
  gateBody: 'text-sm text-slate-400',
  gateLink: 'inline-flex rounded-xl bg-[#14B8A6] px-5 py-3 text-sm font-black text-[#06111f]',
} as const;

export function CaptainRoute() {
  const tAuto = useTranslations('auto');
  const { loading, user } = useAuth();

  return (
    <div className={styles.root} data-captain-route>
      {loading ? (
        <RouteLoading label={tAuto('key_7588d11e')} />
      ) : user?.role === 'driver' ? (
        <CaptainWorkspace />
      ) : (
        <main className={styles.gate}>
          <section className={styles.gateCard}>
            <h1 className={styles.gateTitle}>{tAuto('key_0864e85b')}</h1>
            <p className={styles.gateBody}>{tAuto('key_42de5ca2')}</p>
            <Link className={styles.gateLink} href="/">{tAuto('key_b5dcde74')}</Link>
          </section>
        </main>
      )}
    </div>
  );
}
