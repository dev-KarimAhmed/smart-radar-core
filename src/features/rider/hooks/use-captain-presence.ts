import React from 'react';
import { supabase } from '@/lib/supabase-client';
import {
  fetchAvailableCaptainPresence,
  isCaptainPresenceFresh,
  type CaptainPresencePoint,
} from '../services/rider-server-marketplace';

const CAPTAIN_PRESENCE_REFRESH_MS = 15_000;
const CAPTAIN_PRESENCE_PRUNE_MS = 5_000;

/**
 * Polls nearby captain presence around the rider's current H3 cell, prunes
 * stale entries, subscribes to realtime `captain_locations` changes, and
 * marks captains the rider has blocked so callers can filter/style them.
 */
export function useCaptainPresence(userId: string | undefined, activeCountryId: number | undefined, riderH3Cell: string) {
  const [captainLocations, setCaptainLocations] = React.useState<CaptainPresencePoint[]>([]);
  const [blockedCaptainIds, setBlockedCaptainIds] = React.useState<Set<string>>(new Set());

  const loadBlockedCaptains = React.useCallback(async () => {
    if (!userId) return;
    try {
      const { data, error } = await supabase
        .from('user_blocks')
        .select('blocked_id')
        .eq('blocker_id', userId);
      if (error) throw error;
      setBlockedCaptainIds(new Set((data || []).map((row: any) => String(row.blocked_id))));
    } catch (err) {
      if ((process.env.NODE_ENV !== 'production')) console.warn('[Rider View Tab] loadBlockedCaptains error:', err);
    }
  }, [userId]);

  React.useEffect(() => {
    void loadBlockedCaptains();
  }, [loadBlockedCaptains]);

  const mappedCaptains = React.useMemo(() => {
    return captainLocations.map((captain) => ({
      ...captain,
      isBlocked: blockedCaptainIds.has(captain.id),
    }));
  }, [captainLocations, blockedCaptainIds]);

  React.useEffect(() => {
    let active = true;

    async function loadCaptainPresence() {
      if (!activeCountryId) {
        setCaptainLocations([]);
        return;
      }

      try {
        const rows = await fetchAvailableCaptainPresence(supabase, {
          centerH3Cell: riderH3Cell,
          countryId: activeCountryId,
          ringSize: 1,
        });
        if (active) setCaptainLocations(rows);
      } catch (error) {
        if (!active) return;
        if ((process.env.NODE_ENV !== 'production')) console.warn('[Rider Captain Presence]', error);
        setCaptainLocations([]);
      }
    }

    void loadCaptainPresence();
    const refreshInterval = window.setInterval(() => void loadCaptainPresence(), CAPTAIN_PRESENCE_REFRESH_MS);
    const pruneInterval = window.setInterval(() => {
      setCaptainLocations((previous) => previous.filter((captain) => isCaptainPresenceFresh(captain)));
    }, CAPTAIN_PRESENCE_PRUNE_MS);

    const channel = activeCountryId
      ? supabase
          .channel(`captain-presence-${activeCountryId}-${riderH3Cell}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'captain_locations',
            },
            () => void loadCaptainPresence(),
          )
          .subscribe()
      : null;

    return () => {
      active = false;
      window.clearInterval(refreshInterval);
      window.clearInterval(pruneInterval);
      void channel?.unsubscribe();
    };
  }, [activeCountryId, riderH3Cell]);

  const reset = React.useCallback(() => {
    setCaptainLocations([]);
  }, []);

  return { captainLocations, mappedCaptains, loadBlockedCaptains, reset };
}
