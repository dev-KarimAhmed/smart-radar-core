'use client';

import React from 'react';
import { supabase } from '@/lib/supabase-client';
import type { Trip } from '@/core/types';
import type {
  CaptainDashboardAction,
  CaptainDashboardState,
} from '../state/captain-state-machine';
import { getCaptainTripStepFromStatus } from '../state/captain-state-machine';
import type { useDriverOperations } from './use-driver-operations';
import type { useToast } from '@/hooks/use-toast';

interface CaptainSyncEffectsParams {
  driverOps: ReturnType<typeof useDriverOperations>;
  isOffline: boolean;
  state: CaptainDashboardState;
  dispatch: React.Dispatch<CaptainDashboardAction>;
  toast: ReturnType<typeof useToast>['toast'];
  t: (key: string) => string;
}

export function useCaptainSyncEffects({
  driverOps,
  isOffline,
  state,
  dispatch,
  toast,
  t,
}: CaptainSyncEffectsParams) {
  const knownRequestIdsRef = React.useRef<Set<string> | null>(null);

  // Auto idle on network offline
  React.useEffect(() => {
    if (!driverOps || !isOffline) return;
    if (driverOps.driverStatus === 'active') void driverOps.toggleDriverStatus('idle');
  }, [driverOps, isOffline]);

  // Sync active trip status with server
  React.useEffect(() => {
    if (!driverOps) return;
    if (driverOps.activeRequest) {
      const syncedStep = getCaptainTripStepFromStatus(driverOps.activeRequest.status);
      const isSameTrip = state.selectedRequest?.id === driverOps.activeRequest.id;
      if (isSameTrip) {
        if (state.tripStep !== syncedStep) {
          dispatch({ type: 'SERVER_ACCEPTED', request: driverOps.activeRequest, step: syncedStep });
        }
        return;
      }
      dispatch({ type: 'SERVER_ACCEPTED', request: driverOps.activeRequest, step: syncedStep });
      return;
    }
    if (state.screen === 'ACTIVE_TRIP') dispatch({ type: 'TRIP_COMPLETED' });
  }, [driverOps, driverOps?.activeRequest, state.screen, state.selectedRequest?.id, state.tripStep, dispatch]);

  // Check bidding request still pending
  React.useEffect(() => {
    if (state.screen !== 'BIDDING' || !state.selectedRequest?.id) return;
    const requestId = state.selectedRequest.id;
    let isCancelled = false;

    const checkStillPending = async () => {
      const { data, error } = await supabase
        .from('captain_radar_requests')
        .select('id, created_at')
        .eq('id', requestId)
        .maybeSingle();
      if (isCancelled || error) return;
      if (!data) {
        toast({ title: t('requestNoLongerAvailableTitle'), description: t('requestNoLongerAvailableBody') });
        dispatch({ type: 'IGNORE_REQUEST', requestId });
        return;
      }
      const row = data as Record<string, unknown>;
      const createdAt = row.created_at ? new Date(row.created_at as string).getTime() : 0;
      if (createdAt > 0 && Date.now() - createdAt > 240_000) {
        toast({ title: t('requestNoLongerAvailableTitle'), description: t('requestNoLongerAvailableBody') });
        dispatch({ type: 'IGNORE_REQUEST', requestId });
      }
    };

    const intervalId = window.setInterval(() => void checkStillPending(), 5_000);
    return () => {
      isCancelled = true;
      window.clearInterval(intervalId);
    };
  }, [state.screen, state.selectedRequest?.id, toast, t, dispatch]);

  // Notifications for incoming requests
  React.useEffect(() => {
    if (!driverOps) return;
    const nextIds = new Set(driverOps.requests.map((request: Trip) => request.id));
    const previousIds = knownRequestIdsRef.current;
    if (!previousIds) {
      knownRequestIdsRef.current = nextIds;
      if (nextIds.size > 0 && driverOps.driverStatus === 'active') {
        toast({ title: t('nearbyRequestsToastTitle'), description: t('nearbyRequestsToastBody') });
      }
      return;
    }
    const hasNewRequest = [...nextIds].some((id) => !previousIds.has(id));
    knownRequestIdsRef.current = nextIds;
    if (!hasNewRequest || driverOps.driverStatus !== 'active') return;
    toast({ title: t('newRequestToastTitle'), description: t('newRequestToastBody') });
  }, [driverOps, driverOps?.driverStatus, driverOps?.requests, t, toast]);

  // Open radar on custom event
  React.useEffect(() => {
    const handleOpen = () => dispatch({ type: 'OPEN_RADAR' });
    window.addEventListener('open-captain-dashboard', handleOpen);
    return () => window.removeEventListener('open-captain-dashboard', handleOpen);
  }, [dispatch]);

  // Smooth scroll to top on screen change
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [state.screen]);
}
