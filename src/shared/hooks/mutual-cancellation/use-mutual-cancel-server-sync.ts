import { useCallback } from 'react';
import { supabase } from '@/lib/supabase-client';
import {
  type MutualCancelRole,
  type PostCommitExpectationLock,
  shouldAcceptServerSyncResult,
} from '../mutual-cancellation-helpers';
import { fetchWithSupabaseAuthRetry } from './mutual-cancel-transport';

export interface UseMutualCancelServerSyncParams {
  inFlightMutationsRef: React.MutableRefObject<number>;
  mutationEpochRef: React.MutableRefObject<number>;
  postCommitLockRef: React.MutableRefObject<PostCommitExpectationLock | null>;
  setPendingRequestFrom: (val: MutualCancelRole | null) => void;
  applyCaptainFreeze: (durationMins?: number) => void;
  triggerCancelledConfirmedOnce: () => Promise<void>;
}

export function useMutualCancelServerSync({
  inFlightMutationsRef,
  mutationEpochRef,
  postCommitLockRef,
  setPendingRequestFrom,
  applyCaptainFreeze,
  triggerCancelledConfirmedOnce,
}: UseMutualCancelServerSyncParams) {
  const syncServerStatus = useCallback(async (targetId: string) => {
    if (inFlightMutationsRef.current > 0) return;
    const pollEpoch = mutationEpochRef.current;

    try {
      let serverStatus: unknown;
      let serverCancelRequestedBy: unknown;
      let resolved = false;

      const { res, data } = await fetchWithSupabaseAuthRetry(
        `/api/trip/mutual-cancel?requestId=${encodeURIComponent(targetId)}`,
        { method: 'GET', requireAuthForInitialTry: true },
      );

      if (res?.ok && data?.success) {
        serverStatus = data.status;
        serverCancelRequestedBy = data.cancel_requested_by;
        resolved = true;
      } else {
        const { data: rowData, error: rowErr } = await supabase
          .from('ride_requests')
          .select('id, status, cancel_requested_by')
          .eq('id', targetId)
          .maybeSingle();

        if (!rowErr && rowData) {
          const row = rowData as Record<string, unknown>;
          serverStatus = row.status;
          serverCancelRequestedBy = row.cancel_requested_by;
          resolved = true;
        }
      }

      if (!resolved) return;

      const decision = shouldAcceptServerSyncResult({
        pollEpoch,
        currentEpoch: mutationEpochRef.current,
        inFlightMutations: inFlightMutationsRef.current,
        serverStatus,
        serverCancelRequestedBy,
        postCommitLock: postCommitLockRef.current,
        nowMs: Date.now(),
      });

      if (!decision.accept) return;

      if (decision.terminalStatus === 'CANCELLED') {
        setPendingRequestFrom(null);
        applyCaptainFreeze();
        await triggerCancelledConfirmedOnce();
        return;
      }

      if (decision.terminalStatus === 'COMPLETED') {
        setPendingRequestFrom(null);
        return;
      }

      setPendingRequestFrom(decision.nextPendingFrom ?? null);
    } catch {
      // Ignore background network errors
    }
  }, [applyCaptainFreeze, triggerCancelledConfirmedOnce, inFlightMutationsRef, mutationEpochRef, postCommitLockRef, setPendingRequestFrom]);

  return { syncServerStatus };
}
