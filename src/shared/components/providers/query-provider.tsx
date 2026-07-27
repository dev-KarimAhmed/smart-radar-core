'use client';

import React, { useState } from 'react';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

const styles = {
  root: "",
} as const;


const ONE_DAY = 1000 * 60 * 60 * 24;

/**
 * App-wide TanStack Query provider with localStorage persistence.
 *
 * The query cache is written to localStorage and rehydrated on load, so a full
 * page reload restores the previous results instead of refetching. Combined
 * with each query's `staleTime`, a reload only hits the network once the data
 * has gone stale (e.g. after the ad-campaigns' 10-minute window).
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            // Keep cached entries long enough to survive a persistence restore.
            gcTime: ONE_DAY,
          },
        },
      }),
  );

  const [persister] = useState(() =>
    createSyncStoragePersister({
      // undefined storage on the server → persister is a no-op during SSR.
      storage: typeof window !== 'undefined' ? window.localStorage : undefined,
      key: 'radar-react-query-cache',
    }),
  );

  return (
    <PersistQueryClientProvider
      client={queryClient}
      // maxAge = how long a persisted snapshot is trusted before being discarded.
      // buster = bump this string to invalidate all persisted caches on deploy.
      persistOptions={{ persister, maxAge: ONE_DAY, buster: 'v1' }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
