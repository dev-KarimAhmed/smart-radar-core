'use client';

import type { PropsWithChildren } from 'react';
import { LocaleProvider } from '@/components/providers/locale-provider';
import { AuthProvider } from '@/hooks/use-auth';
import { RouteErrorBoundary } from '@/shared/components/layout/route-error-boundary';
import { QueryProvider } from '@/shared/components/providers/query-provider';
import { DeferredClientTools } from './deferred-client-tools';

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
