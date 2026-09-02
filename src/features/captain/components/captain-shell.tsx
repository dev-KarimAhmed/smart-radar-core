'use client';

import dynamic from 'next/dynamic';
import { RecoveryEmailBanner } from '@/features/auth/contract';
import { RouteErrorBoundary } from '@/shared/components/layout/route-error-boundary';
import { RouteLoading } from '@/shared/components/layout/route-loading';

const CaptainView = dynamic(
  () => import('./captain-view').then((module) => module.DriverViewTab),
  { loading: () => <RouteLoading label="ط¬ط§ط±ظٹ طھط­ظ…ظٹظ„ ظ„ظˆط­ط© ط§ظ„ظƒط§ط¨طھظ†..." /> },
);

const styles = {
  root: 'min-h-screen w-full bg-[#0B0F19] text-white',
  // empty:hidden so the wrapper collapses when the banner renders null, which is the case
  // for every account that already has a recovery email.
  recoveryPrompt: 'px-4 pt-4 empty:hidden md:px-6',
} as const;

export function CaptainShell() {
  return (
    <main className={styles.root}>
      {/* Captains lose the most from a lockout — no account means no earnings that day —
          and they are the ones an admin-assisted reset gives an admin power over. */}
      <div className={styles.recoveryPrompt}><RecoveryEmailBanner /></div>
      <RouteErrorBoundary>
        <CaptainView />
      </RouteErrorBoundary>
    </main>
  );
}
