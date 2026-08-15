'use client';

import React from 'react';

/**
 * Shows the browser's native "leave site?" warning while a trip is active,
 * to discourage an accidental reload/close mid-trip. Browsers render their
 * own generic text for this prompt — it cannot be customized. Trip state
 * itself survives an actual reload via each role's own resync-on-mount
 * logic, so no further action is needed here once the user confirms leaving.
 */
export function useActiveTripReloadGuard(isTripActive: boolean) {
  React.useEffect(() => {
    if (!isTripActive) return;
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isTripActive]);
}
