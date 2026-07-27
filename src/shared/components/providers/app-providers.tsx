'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState, type PropsWithChildren } from 'react';
import { LocaleProvider } from '@/components/providers/locale-provider';
import { AuthProvider } from '@/hooks/use-auth';
import { RouteErrorBoundary } from '@/shared/components/layout/route-error-boundary';

const DeferredClientTools = dynamic(
  () => import('./deferred-client-tools').then((module) => module.DeferredClientTools),
  { ssr: false },
);

const styles = {
  shell: 'contents',
} as const;

function ClientToolsOnInteraction() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const enable = () => setEnabled(true);
    window.addEventListener('pointerdown', enable, { once: true, passive: true });
    window.addEventListener('keydown', enable, { once: true });
    return () => {
      window.removeEventListener('pointerdown', enable);
      window.removeEventListener('keydown', enable);
    };
  }, []);

  return enabled ? <DeferredClientTools /> : null;
}

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <LocaleProvider>
      <AuthProvider>
        <div className={styles.shell} data-app-shell>
          <RouteErrorBoundary>{children}</RouteErrorBoundary>
          <ClientToolsOnInteraction />
        </div>
      </AuthProvider>
    </LocaleProvider>
  );
}
