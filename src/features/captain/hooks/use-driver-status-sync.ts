import { useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';
import type { User } from '@/core/types';
import { isDriverStatus, type DriverStatus } from '../services/driver-lifecycle-service';

interface UseDriverStatusSyncProps {
  user: User | null;
  setAccountSecurityStatus: (status: 'SUSPENDED' | 'BANNED' | null) => void;
  setDriverStatus: (status: DriverStatus) => void;
}

export function useDriverStatusSync({
  user,
  setAccountSecurityStatus,
  setDriverStatus,
}: UseDriverStatusSyncProps) {
  useEffect(() => {
    if (user?.role !== 'driver' || !user.uid) return;

    let mounted = true;
    const channel = supabase
      .channel(`captain-status-${user.uid}`)
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
          let rawStatus = String(newRow.status || '').toUpperCase();
          const logs = Array.isArray(newRow.rank_audit_log) ? newRow.rank_audit_log : [];
          if (rawStatus === 'BANNED' && logs.includes('ACCOUNT_SUSPENDED')) {
            rawStatus = 'SUSPENDED';
          }
          if (rawStatus === 'SUSPENDED' || rawStatus === 'BANNED') {
            setAccountSecurityStatus(rawStatus);
            setDriverStatus('idle');
          } else {
            setAccountSecurityStatus(null);
            const status = rawStatus.toLowerCase();
            if (isDriverStatus(status)) {
              setDriverStatus(status);
            }
          }
        },
      )
      .subscribe();

    void supabase
      .from('profiles')
      .select('status, rank_audit_log')
      .eq('id', user.uid)
      .maybeSingle()
      .then(async ({ data, error }) => {
        if (!mounted || error) return;
        const row = data as { status?: unknown; rank_audit_log?: unknown } | null;
        let rawStatus = String(row?.status || '').toUpperCase();
        const logs = Array.isArray(row?.rank_audit_log) ? row.rank_audit_log : [];
        if (rawStatus === 'BANNED' && logs.includes('ACCOUNT_SUSPENDED')) {
          rawStatus = 'SUSPENDED';
        }
        if (rawStatus === 'SUSPENDED' || rawStatus === 'BANNED') {
          setAccountSecurityStatus(rawStatus as 'SUSPENDED' | 'BANNED');
          setDriverStatus('idle');
          return;
        }

        setAccountSecurityStatus(null);
        let status = rawStatus.toLowerCase();
        if (isDriverStatus(status)) {
          setDriverStatus(status as DriverStatus);
        }
      });

    return () => {
      mounted = false;
      void channel.unsubscribe();
    };
  }, [user?.role, user?.uid, setAccountSecurityStatus, setDriverStatus]);
}
