'use client';

import React from 'react';
import {
  computeTripCountdown,
  tripCountdownPhase,
  type TripCountdown,
  type TripCountdownInput,
} from '../services/trip-countdown';

/**
 * The live trip countdown, for the rider's screen and the captain's alike.
 *
 * The only stateful thing here is the current time. The countdown itself is derived from the
 * server's own anchor on every tick, which is what makes the two sides agree and what stops
 * a re-render from restarting the clock — the rider's old implementation kept the remaining
 * seconds in state and re-seeded them from `state.activeTrip`, an object rebuilt on every
 * realtime row.
 */
export function useTripCountdown(input: Omit<TripCountdownInput, 'nowMs'>): TripCountdown {
  const {
    status,
    acceptedAtMs,
    arrivedAtMs,
    startedAtMs,
    pickupEtaMinutes,
    pickupDistanceKm,
    tripDurationMinutes,
    tripDistanceKm,
  } = input;

  // No interval while the captain is waiting at the pickup or the trip is over: there is
  // nothing counting, so a timer would just re-render the screen every second forever.
  const phase = tripCountdownPhase(status);
  const isTicking = phase === 'TO_PICKUP' || phase === 'ON_TRIP';

  const [nowMs, setNowMs] = React.useState(() => Date.now());

  React.useEffect(() => {
    if (!isTicking) return;

    const sync = () => setNowMs(Date.now());
    sync();
    const interval = window.setInterval(sync, 1000);
    // Background tabs have their intervals throttled to as little as once a minute, so the
    // displayed value can be badly stale the moment the rider looks again. Reading the clock
    // rather than decrementing a counter means it is only ever late, never wrong — and this
    // makes it not even late.
    const onVisible = () => { if (document.visibilityState === 'visible') sync(); };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [isTicking]);

  return React.useMemo(() => computeTripCountdown({
    status,
    acceptedAtMs,
    arrivedAtMs,
    startedAtMs,
    pickupEtaMinutes,
    pickupDistanceKm,
    tripDurationMinutes,
    tripDistanceKm,
    nowMs,
  }), [
    acceptedAtMs,
    arrivedAtMs,
    nowMs,
    pickupDistanceKm,
    pickupEtaMinutes,
    startedAtMs,
    status,
    tripDistanceKm,
    tripDurationMinutes,
  ]);
}
