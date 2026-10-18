'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase-client';
import { useAuth } from '@/hooks/use-auth';

export type RiderTripStatus = 'idle' | 'searching' | 'busy' | 'rating' | string;
export type RiderSecurityStatus = 'SUSPENDED' | 'BANNED' | null;

interface RiderOperationsContextType {
  tripStatus: RiderTripStatus;
  setTripStatus: (status: RiderTripStatus) => void;
  accountSecurityStatus: RiderSecurityStatus;
  refreshSecurityStatus: () => Promise<void>;
}

export const RiderOperationsContext = createContext<RiderOperationsContextType | undefined>(undefined);

/**
 * [ACT-PWA-11] Sovereign real-time rider status & security tracking.
 * Listens to Realtime profile updates for instant BANNED / SUSPENDED lockout enforcement,
 * and clears instantly when account is reactivated or penalties are reset.
 */
export function RiderOperationsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [tripStatus, setTripStatus] = useState<RiderTripStatus>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = window.localStorage.getItem('radar_rider_trip_status');
        if (saved) return saved;
      } catch {}
    }
    return 'idle';
  });

  const [accountSecurityStatus, setAccountSecurityStatus] = useState<RiderSecurityStatus>(() => {
    if (user?.role === 'rider') {
      const initialStatus = String(user.status || '').toUpperCase();
      const secMeta = (user as any)?.user_metadata?.security_status;
      if (initialStatus === 'SUSPENDED' || secMeta === 'SUSPENDED') return 'SUSPENDED';
      if (initialStatus === 'BANNED' || secMeta === 'BANNED') return 'BANNED';
    }
    return null;
  });

  const refreshSecurityStatus = useCallback(async () => {
    if (!user?.uid || user.role !== 'rider') return;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('status, rank_audit_log')
        .eq('id', user.uid)
        .maybeSingle();

      if (error || !data) return;
      const rawStatus = String(data.status || '').toUpperCase();
      const logs = Array.isArray(data.rank_audit_log) ? data.rank_audit_log : [];

      if (rawStatus === 'BANNED' && logs.includes('ACCOUNT_SUSPENDED')) {
        setAccountSecurityStatus('SUSPENDED');
      } else if (rawStatus === 'BANNED' || rawStatus === 'SUSPENDED') {
        setAccountSecurityStatus(rawStatus === 'SUSPENDED' ? 'SUSPENDED' : 'BANNED');
      } else {
        setAccountSecurityStatus(null);
      }
    } catch (err) {
      console.warn('[useRiderOperations] refreshSecurityStatus error:', err);
    }
  }, [user?.uid, user?.role]);

  // Hydrate on user change
  useEffect(() => {
    if (user?.role === 'rider') {
      const initialStatus = String(user.status || '').toUpperCase();
      const secMeta = (user as any)?.user_metadata?.security_status;
      if (initialStatus === 'SUSPENDED' || secMeta === 'SUSPENDED') {
        setAccountSecurityStatus('SUSPENDED');
      } else if (initialStatus === 'BANNED' || secMeta === 'BANNED') {
        setAccountSecurityStatus('BANNED');
      } else {
        setAccountSecurityStatus(null);
      }
    }
  }, [user?.role, user?.status]);

  // Initial fetch and Realtime subscription to profiles table
  useEffect(() => {
    if (!user?.uid || user.role !== 'rider') return;

    let mounted = true;
    void refreshSecurityStatus();

    const channel = supabase
      .channel(`rider-security-${user.uid}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.uid}`,
        },
        (payload) => {
          if (!mounted) return;
          const newRow = payload.new as { status?: unknown; rank_audit_log?: unknown };
          const rawStatus = String(newRow.status || '').toUpperCase();
          const logs = Array.isArray(newRow.rank_audit_log) ? newRow.rank_audit_log : [];

          if (rawStatus === 'BANNED' && logs.includes('ACCOUNT_SUSPENDED')) {
            setAccountSecurityStatus('SUSPENDED');
          } else if (rawStatus === 'BANNED' || rawStatus === 'SUSPENDED') {
            setAccountSecurityStatus(rawStatus === 'SUSPENDED' ? 'SUSPENDED' : 'BANNED');
          } else if (rawStatus === 'ACTIVE' || rawStatus === 'IDLE') {
            setAccountSecurityStatus(null);
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      void supabase.removeChannel(channel);
    };
  }, [user?.uid, user?.role, refreshSecurityStatus]);

  useEffect(() => {
    const handleStatusChange = (event: Event) => {
      const customEvent = event as CustomEvent<{ role?: string; status?: string }>;
      if (customEvent.detail?.role === 'rider' && customEvent.detail?.status) {
        const newStatus = customEvent.detail.status;
        setTripStatus(newStatus);
        try {
          window.localStorage.setItem('radar_rider_trip_status', newStatus);
        } catch {}
      }
    };
    window.addEventListener('sovereign-status-change', handleStatusChange);
    return () => window.removeEventListener('sovereign-status-change', handleStatusChange);
  }, []);

  const value = useMemo<RiderOperationsContextType>(() => ({
    tripStatus,
    setTripStatus,
    accountSecurityStatus,
    refreshSecurityStatus,
  }), [tripStatus, accountSecurityStatus, refreshSecurityStatus]);

  return (
    <RiderOperationsContext.Provider value={value}>
      {children}
    </RiderOperationsContext.Provider>
  );
}

export function useRiderOperations(): RiderOperationsContextType {
  const context = useContext(RiderOperationsContext);
  if (!context) {
    return {
      tripStatus: 'idle',
      setTripStatus: () => {},
      accountSecurityStatus: null,
      refreshSecurityStatus: async () => {},
    };
  }
  return context;
}
