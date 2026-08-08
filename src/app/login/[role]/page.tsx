import LoginPage from '@/features/auth/components/login-page';

const styles = { root: 'contents' } as const;

export default function LoginRolePage() {
  return <div className={styles.root}><LoginPage /></div>;
}
