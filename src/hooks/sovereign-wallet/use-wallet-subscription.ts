import { useEffect, useRef } from 'react';
import type { User } from '@/core/types';
import { supabase } from '@/lib/supabase-client';
import {
  ServerWalletSnapshot,
  WalletLoadState,
  isUuid,
  mapWalletAccountRow,
  mapWalletTransactionRow,
} from './wallet-types';

interface UseWalletSubscriptionProps {
  user: User | null;
  userId: string;
  refreshIndex: number;
  walletLoaded: boolean;
  realtimeInstanceId: string;
  setServerWallet: React.Dispatch<React.SetStateAction<ServerWalletSnapshot | null>>;
  setWalletLoaded: (val: boolean) => void;
  setWalletLoadState: (val: WalletLoadState) => void;
  setWalletError: (err: string) => void;
  setLoading: (loading: boolean) => void;
  refreshWallet: () => void;
  tAuto: any;
}

export function useWalletSubscription({
  user,
  userId,
  refreshIndex,
  walletLoaded,
  realtimeInstanceId,
  setServerWallet,
  setWalletLoaded,
  setWalletLoadState,
  setWalletError,
  setLoading,
  refreshWallet,
  tAuto,
}: UseWalletSubscriptionProps) {
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!userId) {
      setServerWallet(null);
      setWalletLoaded(true);
      setWalletLoadState('missing');
      setWalletError('');
      return;
    }

    if (!isUuid(userId)) {
      setServerWallet(
        mapWalletAccountRow(
          {
            balance: user?.walletBalanceJD ?? 0,
            paid_minutes_remaining: user?.paidHoursRemaining ?? 0,
            bonus_minutes_remaining: user?.bonusHoursRemaining ?? 0,
            active_package_name: user?.activePackageName ?? '',
          },
          Array.isArray(user?.walletTransactions)
            ? user.walletTransactions.map((t) => mapWalletTransactionRow(t, tAuto))
            : [],
        ),
      );
      setWalletLoaded(true);
      setWalletLoadState('ready');
      setWalletError('');
      setLoading(false);
      return;
    }

    let active = true;

    async function fetchWalletFromServer() {
      if (!walletLoaded) {
        setWalletLoadState('loading');
        setWalletError('');
        setLoading(true);
      }

      try {
        const [{ data: initialWallet, error: walletError }, { data: txData, error: txError }] = await Promise.all([
          supabase
            .from('wallet_accounts')
            .select('profile_id,balance,paid_minutes_remaining,bonus_minutes_remaining,active_package_name,time_bundle_expires_at')
            .eq('profile_id', userId)
            .maybeSingle(),
          supabase
            .from('wallet_transactions')
            .select('*')
            .eq('profile_id', userId)
            .order('created_at', { ascending: false }),
        ]);

        if (walletError) throw walletError;
        if (txError) throw txError;
        if (!active) return;

        let walletData = initialWallet;
        const currentMins = Number(walletData?.paid_minutes_remaining || 0);
        const hasWelcomePkg = (walletData?.active_package_name || '').includes('ترحيبية');

        if (!hasWelcomePkg && currentMins === 0) {
          try {
            const { data: sessionData } = await supabase.auth.getSession();
            const token = sessionData?.session?.access_token;
            if (token) {
              const claimRes = await fetch('/api/captain/welcome-credit', {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              });
              const claimJson = await claimRes.json();
              if (claimJson?.granted && active) {
                const { data: refreshedWallet } = await supabase
                  .from('wallet_accounts')
                  .select('profile_id,balance,paid_minutes_remaining,bonus_minutes_remaining,active_package_name,time_bundle_expires_at')
                  .eq('profile_id', userId)
                  .maybeSingle();

                if (refreshedWallet && active) {
                  walletData = refreshedWallet;
                }
              }
            }
          } catch (e) {
            console.warn('[Wallet] Auto-claim welcome credit notice:', e);
          }
        }

        const transactions = Array.isArray(txData) ? txData.map((t) => mapWalletTransactionRow(t, tAuto)) : [];
        setServerWallet(mapWalletAccountRow(walletData as Record<string, any> | null, transactions));
        setWalletLoadState(walletData ? 'ready' : 'missing');
      } catch (error) {
        if (!active) return;
        if (process.env.NODE_ENV !== 'production') console.warn('[Wallet] showing empty state because wallet data could not load:', error);
        setServerWallet(null);
        setWalletLoadState('error');
        setWalletError(error instanceof Error ? error.message : 'wallet_load_failed');
      } finally {
        if (active) {
          setLoading(false);
          setWalletLoaded(true);
        }
      }
    }

    void fetchWalletFromServer();

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshIndex, user?.activePackageName, user?.bonusHoursRemaining, user?.paidHoursRemaining, user?.walletBalanceJD, userId]);

  useEffect(() => {
    const handleWalletRefresh = () => refreshWallet();
    window.addEventListener('radar-wallet-refresh', handleWalletRefresh);
    return () => window.removeEventListener('radar-wallet-refresh', handleWalletRefresh);
  }, [refreshWallet]);

  useEffect(() => {
    if (!userId || !isUuid(userId)) return;

    const applyWalletPayload = (row: Record<string, any> | null) => {
      if (!row) return;
      setServerWallet((current) => mapWalletAccountRow(row, current?.transactions ?? []));
      setWalletLoaded(true);
      setWalletLoadState('ready');
      setWalletError('');
    };

    const walletChannel = supabase
      .channel(`wallet-account-${userId}-${realtimeInstanceId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'wallet_accounts',
          filter: `profile_id=eq.${userId}`,
        },
        (payload) => applyWalletPayload(payload.new as Record<string, any> | null),
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'wallet_accounts',
          filter: `profile_id=eq.${userId}`,
        },
        (payload) => applyWalletPayload(payload.new as Record<string, any> | null),
      )
      .subscribe();

    const transactionsChannel = supabase
      .channel(`wallet-transactions-${userId}-${realtimeInstanceId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallet_transactions',
          filter: `profile_id=eq.${userId}`,
        },
        (payload) => {
          const rowType = (payload.new as Record<string, unknown>)?.type ?? (payload.new as Record<string, unknown>)?.transaction_type ?? '';
          if (String(rowType) === 'radar_minute_consumption') return;

          if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
          refreshTimerRef.current = setTimeout(() => {
            refreshTimerRef.current = null;
            refreshWallet();
          }, 800);
        },
      )
      .subscribe();

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      void walletChannel.unsubscribe();
      void transactionsChannel.unsubscribe();
    };
  }, [realtimeInstanceId, refreshWallet, userId, setServerWallet, setWalletError, setWalletLoadState, setWalletLoaded]);
}
