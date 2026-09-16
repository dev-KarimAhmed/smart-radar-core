'use client';

import dynamic from 'next/dynamic';
import { RouteLoading } from '@/shared/components/layout/route-loading';
import { RoleAccessGate } from '@/shared/components/layout/role-access-gate';
import { useAuth } from '@/features/auth/contract';
import { useTranslations } from "next-intl";

const DelegateWorkspace = dynamic(
  () => import('./delegate-workspace').then((module) => module.DelegateWorkspace),
  { loading: function Loading() { const t = useTranslations('auto'); return <RouteLoading label={t('key_ac21beff')} />; } },
);

const styles = {
  root: 'min-h-screen w-full bg-[#0A0F1D] p-4 text-white sm:p-8',
} as const;

export function DelegateRoute() {
    const t = useTranslations('auto');
  const { loading, user } = useAuth();
  return (
    <main className={styles.root} data-delegate-route>
      {loading ? <RouteLoading label={t('key_7588d11e')} /> : user?.role === 'delegate'
        ? <DelegateWorkspace />
        : <RoleAccessGate title={t('key_729b322e')} body={t('key_cdd1f760')} />}
    </main>
  );
}
