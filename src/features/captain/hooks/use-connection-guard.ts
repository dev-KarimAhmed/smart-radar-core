'use client';

import { useEffect, useState } from 'react';

// Spec 5.1.2 without the encrypted IndexedDB counter/hash: real `online`/
// `offline` browser events still let us honestly (a) pull the captain out of
// the auction floor the instant connectivity drops, and (b) hold them in a
// brief "resyncing" gate on reconnect before letting them go active again —
// standing in for the "silent settlement handshake" without inventing fake
// cryptographic state we can't actually verify client-side.
const RECONNECT_SYNC_MS = 3000;

export function useConnectionGuard() {
  const [isOffline, setIsOffline] = useState(() => (typeof navigator === 'undefined' ? false : !navigator.onLine));
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      setIsReconnecting(false);
    };

    const handleOnline = () => {
      setIsOffline(false);
      setIsReconnecting(true);
      window.setTimeout(() => setIsReconnecting(false), RECONNECT_SYNC_MS);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  return { isOffline, isReconnecting };
}
