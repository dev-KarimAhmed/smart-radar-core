'use client';

import dynamic from 'next/dynamic';
import { RouteLoading } from '@/shared/components/layout/route-loading';

const DelegateRoute = dynamic(
  () => import('@/features/delegate/components/delegate-route').then((module) => module.DelegateRoute),
  { loading: () => <RouteLoading label="ط¬ط§ط±ظٹ ط§ظ„طھط­ظ…ظٹظ„..." /> },
);

const styles = { root: 'contents' } as const;

export default function DelegatePage() {
  return <div className={styles.root}><DelegateRoute /></div>;
}
