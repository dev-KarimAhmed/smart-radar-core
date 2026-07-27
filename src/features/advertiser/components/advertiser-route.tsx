'use client';

import dynamic from 'next/dynamic';
import { RouteLoading } from '@/shared/components/layout/route-loading';

const AdvertiserPortal = dynamic(
  () => import('./advertiser-portal').then((module) => module.AdvertiserPortal),
  { loading: () => <RouteLoading label="ط¬ط§ط±ظٹ طھط­ظ…ظٹظ„ ظ„ظˆط­ط© ط§ظ„ظ…ط¹ظ„ظ†..." /> },
);

const styles = {
  root: 'min-h-screen w-full bg-[#0B1120] p-4 text-white sm:p-8',
  content: 'mx-auto w-full max-w-4xl',
} as const;

export function AdvertiserRoute() {
  return (
    <main className={styles.root} data-advertiser-route>
      <div className={styles.content}><AdvertiserPortal /></div>
    </main>
  );
}
