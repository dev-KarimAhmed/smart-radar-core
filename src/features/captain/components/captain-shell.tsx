'use client';

import dynamic from 'next/dynamic';
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
