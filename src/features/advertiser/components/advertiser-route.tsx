'use client';

import dynamic from 'next/dynamic';
import { RouteLoading } from '@/shared/components/layout/route-loading';
import { RoleAccessGate } from '@/shared/components/layout/role-access-gate';
import { useAuth } from '@/features/auth/contract';

const AdvertiserWorkspace = dynamic(
  () => import('./advertiser-workspace').then((module) => module.AdvertiserWorkspace),
  { loading: () => <RouteLoading label="ط¬ط§ط±ظٹ طھط­ظ…ظٹظ„ ظ„ظˆط­ط© ط§ظ„ظ…ط¹ظ„ظ†..." /> },
);

const styles = {
  root: 'min-h-screen w-full bg-[#0B1120] p-4 text-white sm:p-8',
} as const;

export function AdvertiserRoute() {
  const { loading, user } = useAuth();
  return (
    <main className={styles.root} data-advertiser-route>
      {loading ? <RouteLoading label="جاري التحقق من الجلسة..." /> : user?.role === 'advertiser'
        ? <AdvertiserWorkspace />
        : <RoleAccessGate title="لوحة المعلن" body="سجّل الدخول بحساب معلن لإدارة الحملات الإعلانية." />}
    </main>
  );
}
