import LoginPage from '@/features/auth/components/login-page';

const styles = { root: 'contents' } as const;

export default function RegisterRolePage() {
  return <div className={styles.root}><LoginPage /></div>;
}
