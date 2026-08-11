'use client';

import { DelegatePortal } from './delegate-portal';

const styles = { root: 'contents' } as const;

export function DelegateWorkspace() {
  return <div className={styles.root}><DelegatePortal /></div>;
}
