import { CaptainRoute } from '@/features/captain/components/captain-route';

const styles = { root: 'contents' } as const;

export default function CaptainPage() {
  return <div className={styles.root}><CaptainRoute /></div>;
}
