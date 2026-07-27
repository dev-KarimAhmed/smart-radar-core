'use client';

import dynamic from 'next/dynamic';
import { RouteErrorBoundary } from '@/shared/components/layout/route-error-boundary';
import { RouteLoading } from '@/shared/components/layout/route-loading';

const CaptainView = dynamic(
  () => import('./captain-view').then((module) => module.DriverViewTab),
  { loading: () => <RouteLoading label="ط¬ط§ط±ظٹ طھط­ظ…ظٹظ„ ظ„ظˆط­ط© ط§ظ„ظƒط§ط¨طھظ†..." /> },
);

const styles = {
  root: 'min-h-screen w-full bg-[#0B0F19] text-white',
} as const;

export function CaptainShell() {
  return (
    <main className={styles.root}>
      <RouteErrorBoundary>
        <CaptainView />
      </RouteErrorBoundary>
    </main>
  );
}
