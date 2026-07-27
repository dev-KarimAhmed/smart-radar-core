'use client';

import dynamic from 'next/dynamic';
import { RouteLoading } from '@/shared/components/layout/route-loading';

const RiderRoute = dynamic(
  () => import('@/features/rider/components/rider-route').then((module) => module.RiderRoute),
  { loading: () => <RouteLoading label="جاري تحميل منصة الراكب..." /> },
);

const styles = {
  root: 'contents',
} as const;

export default function RiderPage() {
  return <div className={styles.root}><RiderRoute /></div>;
}
