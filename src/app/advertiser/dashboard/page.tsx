import { AdvertiserRoute } from '@/features/advertiser/components/advertiser-route';

const styles = { root: 'contents' } as const;

export default function AdvertiserPage() {
  return <div className={styles.root}><AdvertiserRoute /></div>;
}
