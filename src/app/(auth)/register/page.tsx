import { Suspense } from 'react';
import { RegisterRoute } from '@/features/auth/components/register-route';

const styles = {
  fallback: 'flex min-h-dvh items-center justify-center bg-[#0B0F19] text-slate-100',
} as const;

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className={styles.fallback}>Loading layout parameters...</div>}>
      <RegisterRoute />
    </Suspense>
  );
}
