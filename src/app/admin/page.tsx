'use client';

import dynamic from 'next/dynamic';
import { RouteLoading } from '@/shared/components/layout/route-loading';

const AdminRoute = dynamic(
  () => import('@/features/admin/components/admin-route').then((module) => module.AdminRoute),
  { loading: () => <RouteLoading label="ط¬ط§ط±ظٹ ط§ظ„طھط­ظ…ظٹظ„..." /> },
);

const styles = { root: 'contents' } as const;

export default function AdminPage() {
  return <div className={styles.root}><AdminRoute /></div>;
}
