import { RiderRoute } from '@/features/rider/components/rider-route';

const styles = { root: 'contents' } as const;

export default function RiderPage() {
  return <div className={styles.root}><RiderRoute /></div>;
}
