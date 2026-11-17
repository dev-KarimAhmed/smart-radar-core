import React from 'react';
import { supabase } from '@/lib/supabase-client';
import { getSupabaseAuthHeaders } from '@/shared/services/supabase-auth-headers';
import { sanitizeVehicleField } from '../../services/rider-offer-fields';
import type { RiderActiveTrip, RiderMachineAction, RiderMachineScreen } from '../../state/rider-state-machine';

export function useRequestCaptainPhone(params: {
  screen: RiderMachineScreen;
  requestId?: string | null;
  activeTrip?: RiderActiveTrip | null;
  captainId: string | undefined;
  captainPhone: string | undefined;
  dispatch: React.Dispatch<RiderMachineAction>;
}) {
  const { screen, requestId, activeTrip, captainId, captainPhone, dispatch } = params;

  const hasPlate = Boolean(
    sanitizeVehicleField(
      activeTrip?.captain?.plate_number ||
      activeTrip?.captain?.license_plate ||
      activeTrip?.vehiclePlate,
    ),
  );
  const hasColor = Boolean(sanitizeVehicleField(activeTrip?.captain?.vehicle_color));
  const hasModel = Boolean(sanitizeVehicleField(activeTrip?.captain?.vehicle_model));
  const needsHydration = !captainPhone || !hasPlate || !hasColor || !hasModel;

  const attemptedKeyRef = React.useRef<string>('');

  React.useEffect(() => {
    const tripKey = `${requestId || activeTrip?.tripId || ''}:${captainId || ''}`;
    if (screen !== 'TRIP_ACTIVE' || !captainId || !needsHydration) {
      return;
    }
    if (attemptedKeyRef.current === tripKey) {
      return;
    }
    attemptedKeyRef.current = tripKey;

    let active = true;
    (async () => {
      const targetRequestId = requestId || activeTrip?.tripId;
      if (targetRequestId) {
        try {
          const headers = await getSupabaseAuthHeaders();
          if (headers.Authorization) {
            const res = await fetch(`/api/trip/captain-card?requestId=${encodeURIComponent(targetRequestId)}`, {
              method: 'GET',
              headers,
              cache: 'no-store',
            });
            const json = await res.json().catch(() => null);
            if (active && res.ok && json?.success && json.captain) {
              dispatch({
                type: 'HYDRATE_CAPTAIN_CARD',
                captainId,
                captain: json.captain as Record<string, unknown>,
              });
              return;
            }
          }
        } catch {
          // Fall through to RPC fallbacks
        }
      }

      try {
        const [cardsRes, phoneRes] = await Promise.all([
          supabase.rpc('get_safe_captain_cards', { p_captain_ids: [captainId] }),
          !captainPhone
            ? supabase.rpc('get_safe_counterpart_profiles', { p_user_ids: [captainId] })
            : Promise.resolve({ data: null, error: null }),
        ]);

        if (!active) return;

        const merged: Record<string, unknown> = {};
        if (!cardsRes.error && Array.isArray(cardsRes.data) && cardsRes.data.length > 0) {
          Object.assign(merged, cardsRes.data[0]);
        }
        if (!phoneRes.error && Array.isArray(phoneRes.data) && phoneRes.data.length > 0) {
          const row = phoneRes.data[0] as Record<string, unknown>;
          const phone = typeof row.phone === 'string' ? row.phone.trim() : '';
          if (phone) merged.phone = phone;
        }

        if (Object.keys(merged).length > 0) {
          dispatch({ type: 'HYDRATE_CAPTAIN_CARD', captainId, captain: merged });
        }
      } catch {
        // Non-blocking fallback
      }
    })();

    return () => {
      active = false;
    };
  }, [dispatch, screen, requestId, activeTrip?.tripId, captainId, captainPhone, needsHydration]);
}

