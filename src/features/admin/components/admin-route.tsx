'use client';

import dynamic from 'next/dynamic';
import { RouteLoading } from '@/shared/components/layout/route-loading';
import { RoleAccessGate } from '@/shared/components/layout/role-access-gate';
import { useAuth } from '@/features/auth/contract';
import { useTranslations } from "next-intl";

const AdminWorkspace = dynamic(
  () => import('./admin-workspace').then((module) => module.AdminWorkspace),
  { loading: function Loading() {
      const tAuto = useTranslations('auto'); const t = useTranslations('auto'); return <RouteLoading label={tAuto('key_ddd2872a')} />; } },
);

const styles = {
  root: 'min-h-screen w-full bg-[#0A0F1D] p-4 text-white sm:p-8',
} as const;

export function AdminRoute() {
    const tAuto = useTranslations('auto');
    const t = useTranslations('auto');
  const { loading, user } = useAuth();
  return (
    <main className={styles.root} data-admin-route>
      {loading ? <RouteLoading label={tAuto('key_7588d11e')} /> : user?.role === 'admin'
        ? <AdminWorkspace />
        : <RoleAccessGate title={tAuto('key_afa34246')} body={tAuto('key_d9b948a8')} />}
    </main>
  );
}
