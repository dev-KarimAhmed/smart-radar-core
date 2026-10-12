import { Suspense } from 'react';

import { ResetPasswordRoute } from '@/features/auth/components/reset-password-route';

const styles = { root: 'contents' } as const;

// useSearchParams needs a Suspense boundary or the whole route opts out of static rendering.
export default function ResetPasswordPage() {
  return (
    <div className={styles.root}>
      <Suspense>
        <ResetPasswordRoute />
      </Suspense>
    </div>
  );
}
