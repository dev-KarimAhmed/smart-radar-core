'use client';

import dynamic from 'next/dynamic';
import { RouteLoading } from '@/shared/components/layout/route-loading';

const AdminView = dynamic(
  () => import('./admin-view').then((module) => module.AdminViewTab),
  { loading: () => <RouteLoading label="ط¬ط§ط±ظٹ طھط­ظ…ظٹظ„ ظ„ظˆط­ط© ط§ظ„ط¥ط¯ط§ط±ط©..." /> },
);

const styles = {
  root: 'min-h-screen w-full bg-[#0A0F1D] p-4 text-white sm:p-8',
} as const;

export function AdminRoute() {
  return <main className={styles.root} data-admin-route><AdminView /></main>;
}
