'use client';

import dynamic from 'next/dynamic';
import { RouteLoading } from '@/shared/components/layout/route-loading';
import { RoleAccessGate } from '@/shared/components/layout/role-access-gate';
import { useAuth } from '@/features/auth/contract';

const DelegateWorkspace = dynamic(
  () => import('./delegate-workspace').then((module) => module.DelegateWorkspace),
  { loading: () => <RouteLoading label="ط¬ط§ط±ظٹ طھط­ظ…ظٹظ„ ظ„ظˆط­ط© ط§ظ„ظ…ظ†ط¯ظˆط¨..." /> },
);

const styles = {
  root: 'min-h-screen w-full bg-[#0A0F1D] p-4 text-white sm:p-8',
} as const;

export function DelegateRoute() {
  const { loading, user } = useAuth();
  return (
    <main className={styles.root} data-delegate-route>
      {loading ? <RouteLoading label="جاري التحقق من الجلسة..." /> : user?.role === 'delegate'
        ? <DelegateWorkspace />
        : <RoleAccessGate title="لوحة المندوب" body="سجّل الدخول بحساب مندوب للوصول إلى المهام والعمولات." />}
    </main>
  );
}
