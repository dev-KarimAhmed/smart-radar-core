'use client';

import dynamic from 'next/dynamic';
import { RecoveryEmailBanner } from '@/features/auth/contract';
import { RouteErrorBoundary } from '@/shared/components/layout/route-error-boundary';
import { RouteLoading } from '@/shared/components/layout/route-loading';
import { useTranslations } from "next-intl";

const CaptainView = dynamic(
  () => import('./captain-view').then((module) => module.DriverViewTab),
  { loading: function Loading() {
      const tAuto = useTranslations('auto'); const t = useTranslations('auto'); return <RouteLoading label={tAuto('key_44baaa8e')} />; } },
);

const styles = {
  root: 'relative min-h-screen w-full bg-[#0B0F19] text-white',
  recoveryPrompt: 'absolute top-16 start-4 end-4 z-[200] empty:hidden md:px-6',
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
