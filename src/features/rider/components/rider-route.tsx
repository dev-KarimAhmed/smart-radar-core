'use client';

import { RiderOperationsProvider } from '../hooks/use-rider-operations';
import { RiderShell } from './rider-shell';

const styles = {
  root: 'contents',
} as const;

export function RiderRoute() {
  return (
    <div className={styles.root} data-rider-route>
      <RiderOperationsProvider>
        <RiderShell />
      </RiderOperationsProvider>
    </div>
  );
}
