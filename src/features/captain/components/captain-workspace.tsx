'use client';

import { DriverOperationsProvider } from '../hooks/use-driver-operations';
import { CaptainShell } from './captain-shell';
import { QueryProvider } from '@/shared/components/providers/query-provider';

const styles = { root: 'contents' } as const;

export function CaptainWorkspace() {
  return (
    <div className={styles.root}>
      <QueryProvider><DriverOperationsProvider><CaptainShell /></DriverOperationsProvider></QueryProvider>
    </div>
  );
}
