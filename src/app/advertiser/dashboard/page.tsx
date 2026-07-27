'use client';

import dynamic from 'next/dynamic';
import { RouteLoading } from '@/shared/components/layout/route-loading';

const AdvertiserRoute = dynamic(
  () => import('@/features/advertiser/components/advertiser-route').then((module) => module.AdvertiserRoute),
  { loading: () => <RouteLoading label="ط¬ط§ط±ظٹ ط§ظ„طھط­ظ…ظٹظ„..." /> },
);

const styles = { root: 'contents' } as const;

export default function AdvertiserPage() {
  return <div className={styles.root}><AdvertiserRoute /></div>;
}
