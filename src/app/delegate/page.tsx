import { DelegateRoute } from '@/features/delegate/components/delegate-route';

const styles = { root: 'contents' } as const;

export default function DelegatePage() {
  return <div className={styles.root}><DelegateRoute /></div>;
}
