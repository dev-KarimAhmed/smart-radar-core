'use client';

import dynamic from 'next/dynamic';
import { RouteLoading } from '@/shared/components/layout/route-loading';
import { RoleAccessGate } from '@/shared/components/layout/role-access-gate';
import { useAuth } from '@/features/auth/contract';

const AdminWorkspace = dynamic(
  () => import('./admin-workspace').then((module) => module.AdminWorkspace),
  { loading: () => <RouteLoading label="ط¬ط§ط±ظٹ طھط­ظ…ظٹظ„ ظ„ظˆط­ط© ط§ظ„ط¥ط¯ط§ط±ط©..." /> },
);

const styles = {
  root: 'min-h-screen w-full bg-[#0A0F1D] p-4 text-white sm:p-8',
} as const;

export function AdminRoute() {
  const { loading, user } = useAuth();
  return (
    <main className={styles.root} data-admin-route>
      {loading ? <RouteLoading label="جاري التحقق من الجلسة..." /> : user?.role === 'admin'
        ? <AdminWorkspace />
        : <RoleAccessGate title="لوحة الإدارة" body="سجّل الدخول بحساب إداري مصرح للوصول إلى أدوات السيادة." />}
    </main>
  );
}
