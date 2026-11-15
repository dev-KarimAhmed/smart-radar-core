import React from 'react';
import { getServerTime } from '@/lib/server-time';
import { RADAR_SCAN_STAGES_KM, STAGE_WINDOW_SECONDS } from './use-offers-lifecycle-constants';
import type { RiderMachineScreen } from '../state/rider-state-machine';

export function useCaptainSearchRadius(
  screen: RiderMachineScreen,
  requestStartedAt?: number | null,
  requestCancelledAt?: number | null,
) {
  const [captainSearchRadiusKm, setCaptainSearchRadiusKm] = React.useState<number>(0.5);
  const [isExpandingCaptainSearch, setIsExpandingCaptainSearch] = React.useState(false);

  React.useEffect(() => {
    if (screen !== 'RECEIVING_OFFERS' || requestCancelledAt) {
      setCaptainSearchRadiusKm(0.5);
      setIsExpandingCaptainSearch(false);
      return;
    }

    const syncRadiusWithTime = () => {
      const startedAt = requestStartedAt ?? getServerTime();
      const elapsedSec = Math.floor(Math.max(0, getServerTime() - startedAt) / 1000);
      const stageIdx = Math.min(RADAR_SCAN_STAGES_KM.length - 1, Math.floor(elapsedSec / STAGE_WINDOW_SECONDS));
      const targetRadius = RADAR_SCAN_STAGES_KM[stageIdx];

      setCaptainSearchRadiusKm((current) => {
        if (current !== targetRadius) {
          setIsExpandingCaptainSearch(true);
          window.setTimeout(() => setIsExpandingCaptainSearch(false), 900);
          return targetRadius;
        }
        return current;
      });
    };

    syncRadiusWithTime();
    const intervalId = window.setInterval(syncRadiusWithTime, 1000);

    return () => window.clearInterval(intervalId);
  }, [requestCancelledAt, requestStartedAt, screen]);

  return {
    captainSearchRadiusKm,
    setCaptainSearchRadiusKm,
    isExpandingCaptainSearch,
    setIsExpandingCaptainSearch,
  };
}
