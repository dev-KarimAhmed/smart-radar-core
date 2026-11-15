'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { getSupabaseAuthHeaders } from '@/shared/services/supabase-auth-headers';
import type { CaptainReceiptItem } from '../types/driver-wallet-types';

export function useDriverWalletReceipts(captainId: string) {
  const [receiptsHistory, setReceiptsHistory] = useState<CaptainReceiptItem[]>([]);
  const [isLoadingReceipts, setIsLoadingReceipts] = useState<boolean>(false);

  const fetchReceipts = useCallback(async (showLoading = true) => {
    if (!captainId) return;
    if (showLoading) setIsLoadingReceipts(true);
    try {
      const authHeaders = await getSupabaseAuthHeaders();
      const res = await fetch(`/api/captain/receipts?captainId=${encodeURIComponent(captainId)}`, {
        headers: authHeaders,
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && Array.isArray(data.receipts)) {
        setReceiptsHistory(data.receipts);
      }
    } catch (err) {
      console.warn('[DriverWalletTab] Failed to fetch receipts history:', err);
    } finally {
      if (showLoading) setIsLoadingReceipts(false);
    }
  }, [captainId]);

  useEffect(() => {
    if (!captainId) return;
    void fetchReceipts(true);

    const handleRefresh = () => {
      void fetchReceipts(false);
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void fetchReceipts(false);
      }
    };

    window.addEventListener('radar-wallet-refresh', handleRefresh);
    window.addEventListener('focus', handleRefresh);
    document.addEventListener('visibilitychange', handleVisibility);

    const channel = supabase
      .channel(`captain-receipts-history-${captainId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallet_transactions',
          filter: `profile_id=eq.${captainId}`,
        },
        () => {
          void fetchReceipts(false);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          void fetchReceipts(false);
        }
      });

    return () => {
      window.removeEventListener('radar-wallet-refresh', handleRefresh);
      window.removeEventListener('focus', handleRefresh);
      document.removeEventListener('visibilitychange', handleVisibility);
      void channel.unsubscribe();
    };
  }, [fetchReceipts, captainId]);

  return {
    receiptsHistory,
    isLoadingReceipts,
    fetchReceipts,
  };
}
