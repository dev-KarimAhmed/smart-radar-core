'use client';

import { DriverOperationsProvider } from '../hooks/use-driver-operations';
import { CaptainShell } from './captain-shell';

const styles = {
  root: 'contents',
} as const;

export function CaptainRoute() {
  return (
    <div className={styles.root} data-captain-route>
      <DriverOperationsProvider>
        <CaptainShell />
      </DriverOperationsProvider>
    </div>
  );
}
