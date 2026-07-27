'use client';

import dynamic from 'next/dynamic';
import { RouteLoading } from '@/shared/components/layout/route-loading';

const DelegatePortal = dynamic(
  () => import('./delegate-portal').then((module) => module.DelegatePortal),
  { loading: () => <RouteLoading label="ط¬ط§ط±ظٹ طھط­ظ…ظٹظ„ ظ„ظˆط­ط© ط§ظ„ظ…ظ†ط¯ظˆط¨..." /> },
);

const styles = {
  root: 'min-h-screen w-full bg-[#0A0F1D] p-4 text-white sm:p-8',
} as const;

export function DelegateRoute() {
  return <main className={styles.root} data-delegate-route><DelegatePortal /></main>;
}
