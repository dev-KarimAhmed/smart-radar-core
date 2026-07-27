'use client';

import { QueryProvider } from '@/shared/components/providers/query-provider';
import { AdminViewTab } from './admin-view';

const styles = { root: 'contents' } as const;

export function AdminWorkspace() {
  return <QueryProvider><div className={styles.root}><AdminViewTab /></div></QueryProvider>;
}
