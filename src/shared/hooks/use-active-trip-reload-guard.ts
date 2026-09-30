'use client';

import React from 'react';

/**
 * [ACT-PWA-08] Sovereign Active Trip Exit Guard
 * Shows the browser's native "leave site?" warning while a trip/radar is active,
 * and traps the mobile back button (popstate) in standalone PWA mode to prevent
 * accidental app exit mid-trip.
 */
export function useActiveTripReloadGuard(isTripActive: boolean) {
  React.useEffect(() => {
    if (!isTripActive || typeof window === 'undefined') return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };

    // Push sovereign guard state to intercept Android/iOS swipe-back gesture
    window.history.pushState({ sovereignTripGuard: true }, '');

    const handlePopState = () => {
      // Re-push state to trap accidental exit while trip/radar is running
      window.history.pushState({ sovereignTripGuard: true }, '');
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isTripActive]);
}
