'use client';

import dynamic from 'next/dynamic';
import { RouteLoading } from '@/shared/components/layout/route-loading';

const CaptainRoute = dynamic(
  () => import('@/features/captain/components/captain-route').then((module) => module.CaptainRoute),
  { loading: () => <RouteLoading label="ط¬ط§ط±ظٹ طھط­ظ…ظٹظ„ ظ…ظ†طµط© ط§ظ„ظƒط§ط¨طھظ†..." /> },
);

const styles = {
  root: 'contents',
} as const;

export default function CaptainPage() {
  return <div className={styles.root}><CaptainRoute /></div>;
}
