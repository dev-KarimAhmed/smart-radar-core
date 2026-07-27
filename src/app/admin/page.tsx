import { AdminRoute } from '@/features/admin/components/admin-route';

const styles = { root: 'contents' } as const;

export default function AdminPage() {
  return <div className={styles.root}><AdminRoute /></div>;
}
