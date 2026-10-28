'use client';

import { AdminViewTab } from './admin-view';

const styles = { root: 'contents' } as const;

export function AdminWorkspace() {
  return <div className={styles.root}><AdminViewTab /></div>;
}
