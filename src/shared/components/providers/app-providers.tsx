'use client';

import type { PropsWithChildren } from 'react';
import { LocaleProvider } from '@/components/providers/locale-provider';
import { AuthProvider } from '@/hooks/use-auth';
import { RouteErrorBoundary } from '@/shared/components/layout/route-error-boundary';
import { QueryProvider } from '@/shared/components/providers/query-provider';
import { DeferredClientTools } from './deferred-client-tools';
import { SaudiGeoGuard } from '@/shared/components/guards/saudi-geo-guard';

const styles = {
  shell: 'contents',
} as const;

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryProvider>
      <LocaleProvider>
        <AuthProvider>
          <SaudiGeoGuard>
            <div className={styles.shell} data-app-shell>
              <RouteErrorBoundary>{children}</RouteErrorBoundary>
              <DeferredClientTools />
            </div>
          </SaudiGeoGuard>
        </AuthProvider>
      </LocaleProvider>
    </QueryProvider>
  );
}
