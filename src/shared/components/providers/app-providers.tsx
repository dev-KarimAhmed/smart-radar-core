'use client';

import dynamic from 'next/dynamic';
import type { PropsWithChildren } from 'react';
import { QueryProvider } from '@/components/providers/query-provider';
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

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryProvider>
      <LocaleProvider>
        <AuthProvider>
          <div className={styles.shell} data-app-shell>
            <RouteErrorBoundary>{children}</RouteErrorBoundary>
            <DeferredClientTools />
          </div>
        </AuthProvider>
      </LocaleProvider>
    </QueryProvider>
  );
}
