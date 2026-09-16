'use client';

import dynamic from 'next/dynamic';
import { RouteLoading } from '@/shared/components/layout/route-loading';
import { RoleAccessGate } from '@/shared/components/layout/role-access-gate';
import { useAuth } from '@/features/auth/contract';
import { useTranslations } from "next-intl";

const AdvertiserWorkspace = dynamic(
  () => import('./advertiser-workspace').then((module) => module.AdvertiserWorkspace),
  { loading: function Loading() { const t = useTranslations('auto'); return <RouteLoading label={t('key_a04d84ed')} />; } },
);

const styles = {
  root: 'min-h-screen w-full bg-[#0B1120] p-4 text-white sm:p-8',
} as const;

export function AdvertiserRoute() {
    const t = useTranslations('auto');
  const { loading, user } = useAuth();
  return (
    <main className={styles.root} data-advertiser-route>
      {loading ? <RouteLoading label={t('key_7588d11e')} /> : user?.role === 'advertiser'
        ? <AdvertiserWorkspace />
        : <RoleAccessGate title={t('key_86da01ef')} body={t('key_b5e4f25a')} />}
    </main>
  );
}
