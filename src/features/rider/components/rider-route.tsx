'use client';

import dynamic from 'next/dynamic';
import { useAuth } from '@/features/auth/contract';
import { RouteLoading } from '@/shared/components/layout/route-loading';
import { useTranslations } from "next-intl";

const LoginPage = dynamic(
  () => import('@/features/auth/components/login-page'),
  { loading: function Loading() {
      const tAuto = useTranslations('auto'); const t = useTranslations('auto'); return <RouteLoading fullscreen label={tAuto('key_7588d11e')} />; } },
);

const RiderWorkspace = dynamic(
  () => import('./rider-workspace').then((module) => module.RiderWorkspace),
  { loading: function Loading() {
      const tAuto = useTranslations('auto'); const t = useTranslations('auto'); return <RouteLoading label={tAuto('key_68bee0d5')} />; } },
);

const styles = {
  root: 'contents',
} as const;

export function RiderRoute() {
    const tAuto = useTranslations('auto');
    const t = useTranslations('auto');
  const { loading, user } = useAuth();

  return (
    <div className={styles.root} data-rider-route>
      {loading ? <RouteLoading fullscreen label={tAuto('key_7588d11e')} /> : user?.role === 'rider' ? (
        <RiderWorkspace />
      ) : (
        <LoginPage />
      )}
    </div>
  );
}
