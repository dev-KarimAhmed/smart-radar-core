'use client';

import { QueryProvider } from '@/shared/components/providers/query-provider';
import { AdvertiserPortal } from './advertiser-portal';

const styles = { content: 'mx-auto w-full max-w-4xl' } as const;

export function AdvertiserWorkspace() {
  return <QueryProvider><div className={styles.content}><AdvertiserPortal /></div></QueryProvider>;
}
