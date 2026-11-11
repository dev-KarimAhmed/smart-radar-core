'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { User } from '@/core/types';
import { supabase } from '@/lib/supabase-client';
import { useToast } from './use-toast';
import { useTranslations } from 'next-intl';
import { useDashboardLanguage } from './use-dashboard-language';
import {
  type ServerWalletSnapshot,
  type WalletLoadState,
  type WalletTransaction,
  type SubmitWalletReceiptInput,
  type DelegateChargeInput,
  isUuid,
  mapWalletTransactionRow,
  mapWalletAccountRow,
} from './wallet-helpers';
import { useWalletMutations } from './use-wallet-mutations';

export type {
  ServerWalletSnapshot,
  WalletLoadState,
  WalletTransaction,
  SubmitWalletReceiptInput,
  DelegateChargeInput,
};
export { mapWalletTransactionRow, mapWalletAccountRow };

export function useSovereignWallet(user: User | null) {
  const tAuto = useTranslations();
  const { isArabic } = useDashboardLanguage();
  const { toast } = useToast();
  const realtimeInstanceId = useMemo(() => Math.random().toString(36).slice(2), []);
  const [loading, setLoading] = useState(false);
  const [serverWallet, setServerWallet] = useState<ServerWalletSnapshot | null>(null);
  const [walletLoaded, setWalletLoaded] = useState(false);
  const [walletLoadState, setWalletLoadState] = useState<WalletLoadState>('idle');
  const [walletError, setWalletError] = useState('');
  const [refreshIndex, setRefreshIndex] = useState(0);
  const [selfTopupEnabled, setSelfTopupEnabled] = useState(false);
  const [radarHourPrice, setRadarHourPrice] = useState(1);

  useEffect(() => {
    let active = true;
    async function resolveHourlyRate() {
      try {
        const countryId = user?.countryId || 1;
        const { data } = await supabase
          .from('countries')
          .select('radar_hour_price')
          .eq('id', countryId)
          .maybeSingle();

        let price = Number(data?.radar_hour_price) || 1;

        const { data: flagRow } = await supabase
          .from('app_flags')
          .select('note')
          .eq('flag', 'hourly_rates_matrix')
          .maybeSingle();

        if (flagRow?.note) {
          try {
            const matrix = JSON.parse(flagRow.note);
            if (user?.district && matrix.districts?.[String(user.district)]) {
              price = Number(matrix.districts[String(user.district)]);
            } else if (user?.governorate && matrix.governorates?.[String(user.governorate)]) {
              price = Number(matrix.governorates[String(user.governorate)]);
            }
          } catch {}
        }

        if (active) setRadarHourPrice(price > 0 ? price : 1);
      } catch {
        if (active) setRadarHourPrice(1);
      }
    }

    void resolveHourlyRate();
    return () => {
      active = false;
    };
  }, [user?.countryId, user?.district, user?.governorate]);

  useEffect(() => {
    let active = true;
    void supabase
      .from('app_flags')
      .select('enabled')
      .eq('flag', 'captain_self_topup')
      .maybeSingle()
      .then(({ data }) => {
        if (active) setSelfTopupEnabled(Boolean(data?.enabled));
      });
    return () => {
      active = false;
    };
  }, []);

  const userId = user?.uid || '';
  const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const refreshWallet = useCallback(() => {
    setRefreshIndex((value) => value + 1);
  }, []);

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
            ? user.walletTransactions.map((t) => mapWalletTransactionRow(t, tAuto, isArabic))
            : []
        )
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
            .select(
              'profile_id,balance,paid_minutes_remaining,bonus_minutes_remaining,active_package_name,time_bundle_expires_at'
            )
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
                  .select(
                    'profile_id,balance,paid_minutes_remaining,bonus_minutes_remaining,active_package_name,time_bundle_expires_at'
                  )
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

        const transactions = Array.isArray(txData)
          ? txData.map((t) => mapWalletTransactionRow(t, tAuto, isArabic))
          : [];
        setServerWallet(mapWalletAccountRow(walletData as Record<string, any> | null, transactions));
        setWalletLoadState(walletData ? 'ready' : 'missing');
        if (!walletData && process.env.NODE_ENV !== 'production') {
          console.warn(`[Wallet] no wallet_accounts row found for profile_id=${userId}`);
        }
      } catch (error) {
        if (!active) return;
        if (process.env.NODE_ENV !== 'production')
          console.warn('[Wallet] showing empty state because wallet data could not load:', error);
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
  }, [
    isArabic,
    refreshIndex,
    user?.activePackageName,
    user?.bonusHoursRemaining,
    user?.paidHoursRemaining,
    user?.walletBalanceJD,
    userId,
  ]);

  useEffect(() => {
    const handleWalletRefresh = () => {
      refreshWallet();
    };
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
        (payload) => applyWalletPayload(payload.new as Record<string, any> | null)
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'wallet_accounts',
          filter: `profile_id=eq.${userId}`,
        },
        (payload) => applyWalletPayload(payload.new as Record<string, any> | null)
      )
      .subscribe((status) => {
        if ((status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') && process.env.NODE_ENV !== 'production') {
          console.warn('[Wallet] realtime channel issue:', status);
        }
      });

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
          const rowType =
            (payload.new as Record<string, unknown>)?.type ??
            (payload.new as Record<string, unknown>)?.transaction_type ??
            '';
          const isRoutineConsumption = String(rowType) === 'radar_minute_consumption';
          if (isRoutineConsumption) return;

          if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
          refreshTimerRef.current = setTimeout(() => {
            refreshTimerRef.current = null;
            refreshWallet();
          }, 800);
        }
      )
      .subscribe((status) => {
        if ((status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') && process.env.NODE_ENV !== 'production') {
          console.warn('[Wallet transactions] realtime channel issue:', status);
        }
      });

    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      void walletChannel.unsubscribe();
      void transactionsChannel.unsubscribe();
    };
  }, [realtimeInstanceId, refreshWallet, userId]);

  const {
    submitWalletReceipt,
    redeemVoucherCode,
    delegateChargeCaptain,
    selfTopup,
    allocateBalanceToMinutes,
    convertBalanceToMinutes,
    rejectClientMutation,
  } = useWalletMutations({
    user,
    userId,
    setLoading,
    setServerWallet,
    refreshWallet,
    toast,
    tAuto,
  });

  const isDriver = user?.role === 'driver';
  const balanceJD = serverWallet?.balance ?? 0;
  const rawPaidMinutesRemaining = serverWallet?.paidMinutesRemaining ?? 0;
  const bonusMinutesRemaining = serverWallet?.bonusMinutesRemaining ?? 0;
  const cashEquivalentMinutes = radarHourPrice > 0 ? Math.floor((balanceJD * 60) / radarHourPrice) : 0;
  const paidMinutesRemaining = rawPaidMinutesRemaining + cashEquivalentMinutes;
  const totalUsableMinutes = paidMinutesRemaining + bonusMinutesRemaining;
  const subscriptionHours = Number((totalUsableMinutes / 60).toFixed(3));
  const activePackageName = serverWallet?.activePackageName || '';
  const timeBundleExpiresAt = serverWallet?.timeBundleExpiresAt || null;
  const hasActiveTimeBundle =
    totalUsableMinutes > 0 && (!timeBundleExpiresAt || Date.parse(timeBundleExpiresAt) > Date.now());
  const hasStrandedBalance = walletLoadState === 'ready' && balanceJD > 0;
  const transactions = useMemo(() => serverWallet?.transactions ?? [], [serverWallet?.transactions]);

  return {
    loading,
    walletLoaded,
    walletLoadState,
    walletError,
    walletProfileId: userId,
    rechargeWallet: rejectClientMutation,
    fundRiderBalance: rejectClientMutation,
    deductRiderFare: rejectClientMutation,
    purchaseDriverPackage: rejectClientMutation,
    submitWalletReceipt,
    redeemVoucherCode,
    delegateChargeCaptain,
    selfTopup,
    allocateBalanceToMinutes,
    convertBalanceToMinutes,
    selfTopupEnabled,
    isDriver,
    balanceJD,
    hasStrandedBalance,
    radarHourPrice,
    cashEquivalentMinutes,
    rawPaidMinutesRemaining,
    paidMinutesRemaining,
    bonusMinutesRemaining,
    totalUsableMinutes,
    subscriptionHours,
    activePackageName,
    timeBundleExpiresAt,
    hasActiveTimeBundle,
    transactions,
  };
}
