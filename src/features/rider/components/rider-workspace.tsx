'use client';

import { RiderOperationsProvider } from '../hooks/use-rider-operations';
import { RiderShell } from './rider-shell';
import { QueryProvider } from '@/shared/components/providers/query-provider';

const styles = { root: 'contents' } as const;

export function RiderWorkspace() {
  return (
    <div className={styles.root}>
      <QueryProvider><RiderOperationsProvider><RiderShell /></RiderOperationsProvider></QueryProvider>
    </div>
  );
}
