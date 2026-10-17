'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase-client';

export type VerificationStatus = 'APPROVED' | 'PENDING' | 'REJECTED';

export function useCaptainVerification(userId?: string | null) {
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus>('PENDING');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    async function loadStatus() {
      try {
        const { data, error } = await supabase
          .from('captain_profiles')
          .select('verification_status')
          .eq('id', userId)
          .maybeSingle();

        if (!isMounted) return;
        if (!error && data?.verification_status) {
          const norm = String(data.verification_status).toUpperCase() as VerificationStatus;
          setVerificationStatus(norm);
        }
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') console.warn('[useCaptainVerification] load error:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadStatus();

    // Realtime subscription on captain_profiles
    const channelName = `realtime-captain-verification-${userId}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'captain_profiles',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          if (payload.new && (payload.new as any).verification_status) {
            const nextStatus = String((payload.new as any).verification_status).toUpperCase() as VerificationStatus;
            setVerificationStatus(nextStatus);
          }
        }
      )
      .subscribe();

    return () => {
      isMounted = false;
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  return {
    verificationStatus,
    isManuallyApproved: verificationStatus === 'APPROVED',
    isLoading,
  };
}
