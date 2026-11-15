import React from 'react';
import { supabase } from '@/lib/supabase-client';
import type { RiderMachineAction, RiderMachineScreen } from '../../state/rider-state-machine';

export function useRequestCaptainPhone(params: {
  screen: RiderMachineScreen;
  captainId: string | undefined;
  captainPhone: string | undefined;
  dispatch: React.Dispatch<RiderMachineAction>;
}) {
  const { screen, captainId, captainPhone, dispatch } = params;

  React.useEffect(() => {
    if (screen !== 'TRIP_ACTIVE' || !captainId || captainPhone) {
      return;
    }

    let active = true;
    (async () => {
      try {
        const { data, error } = await supabase.rpc('get_safe_counterpart_profiles', {
          p_user_ids: [captainId],
        });
        if (!active || error || !Array.isArray(data) || data.length === 0) return;
        const row = data[0] as Record<string, unknown>;
        const phone = typeof row.phone === 'string' ? row.phone.trim() : '';
        if (phone) {
          dispatch({ type: 'HYDRATE_CAPTAIN_PHONE', captainId, phone });
        }
      } catch {
        // Non-blocking fallback
      }
    })();

    return () => {
      active = false;
    };
  }, [dispatch, screen, captainId, captainPhone]);
}

