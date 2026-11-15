import React from 'react';
import { supabase } from '@/lib/supabase-client';
import type { UserRole } from '@/core/types';

export function useRiderPresenceSync(
  user: { uid?: string; role?: UserRole } | null,
  accountSecurityStatus: boolean,
  screen: string,
) {
  // Sync rider online presence in profiles table
  React.useEffect(() => {
    if (!user?.uid || user.role !== 'rider') return;
    if (accountSecurityStatus) return;

    void supabase
      .from('profiles')
      .update({ status: 'ACTIVE', updated_at: new Date().toISOString() })
      .eq('id', user.uid)
      .neq('status', 'BANNED');

    return () => {
      void supabase
        .from('profiles')
        .update({ status: 'IDLE', updated_at: new Date().toISOString() })
        .eq('id', user.uid)
        .neq('status', 'BANNED');
    };
  }, [user?.uid, user?.role, accountSecurityStatus]);

  // [ACT-SSOT-07] Broadcast live rider state to outer shell to eliminate shell blindness
  React.useEffect(() => {
    const statusMap: Record<string, string> = {
      IDLE_MAP: 'idle',
      DESTINATION_SELECTION: 'searching',
      RECEIVING_OFFERS: 'searching',
      TRIP_ACTIVE: 'busy',
      RATING_MODAL: 'rating',
      PURGE_LEDGER: 'idle',
      FAVORITE_CAPTAINS: 'idle',
    };
    const currentStatus = statusMap[screen] || 'idle';
    window.dispatchEvent(
      new CustomEvent('sovereign-status-change', {
        detail: { role: 'rider', status: currentStatus },
      }),
    );
  }, [screen]);
}
