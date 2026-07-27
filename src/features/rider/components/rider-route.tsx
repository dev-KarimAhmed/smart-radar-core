'use client';

import dynamic from 'next/dynamic';
import { useAuth } from '@/features/auth/contract';
import { RouteLoading } from '@/shared/components/layout/route-loading';

const LoginPage = dynamic(
  () => import('@/features/auth/components/login-page'),
  { loading: () => <RouteLoading fullscreen label="جاري التحقق من الجلسة..." /> },
);

const RiderWorkspace = dynamic(
  () => import('./rider-workspace').then((module) => module.RiderWorkspace),
  { loading: () => <RouteLoading label="جاري تحميل منصة الراكب..." /> },
);

const styles = {
  root: 'contents',
} as const;

export function RiderRoute() {
  const { loading, user } = useAuth();

  return (
    <div className={styles.root} data-rider-route>
      {loading ? <RouteLoading fullscreen label="جاري التحقق من الجلسة..." /> : user?.role === 'rider' ? (
        <RiderWorkspace />
      ) : (
        <LoginPage />
      )}
    </div>
  );
}
