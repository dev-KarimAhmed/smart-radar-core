'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { User } from '@/core/types';
import { supabase } from '@/lib/supabase-client';
import { useToast } from './use-toast';

interface ServerWalletSnapshot {
  balance: number;
  paidHoursMin: number;
  bonusHoursMin: number;
  subscriptionHours: number;
  activePackageName: string;
  transactions: WalletTransaction[];
}

interface WalletTransaction {
  id: string;
  type: string;
  amount: number;
  currency: string;
  description: string;
  createdAt: string;
  status: string;
  timestamp: number;
}

function mapWalletTransactionRow(row: Record<string, any>): WalletTransaction {
  const timestamp = parseTimestamp(row.created_at ?? row.createdAt ?? row.timestamp);
  return {
    id: String(row.id),
    type: row.type || row.transaction_type || 'transaction',
    amount: firstNumber(row.amount, 0),
    currency: firstString(row.currency_ar, row.currency, row.currency_code, ''),
    description: firstString(row.description_ar, row.description, row.memo, 'عملية على الرصيد'),
    createdAt: timestamp
      ? new Date(timestamp).toLocaleString('ar', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })
      : '',
    status: row.status || 'completed',
    timestamp: timestamp || Date.now(),
  };
}

function firstNumber(...values: unknown[]) {
  for (const value of values) {
    const numberValue = Number(value);
    if (Number.isFinite(numberValue)) return numberValue;
  }
  return 0;
}

function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

function parseTimestamp(value: unknown) {
  if (typeof value === 'number') return value;
  if ((value as any)?.seconds) return (value as any).seconds * 1000;
  const parsed = Date.parse(String(value || ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function useSovereignWallet(user: User | null) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [serverWallet, setServerWallet] = useState<ServerWalletSnapshot | null>(null);
  const [walletLoaded, setWalletLoaded] = useState(false);

  const userId = user?.uid || '';

  useEffect(() => {
    if (!userId) {
      setServerWallet(null);
      setWalletLoaded(true);
      return;
    }

    let active = true;

    async function fetchWalletFromServer() {
      setWalletLoaded(false);
      setLoading(true);

      try {
        const [{ data: walletData, error: walletError }, { data: txData, error: txError }] = await Promise.all([
          supabase
            .from('wallet_accounts')
            .select('*')
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

        if (!walletData) {
          setServerWallet(null);
          return;
        }

        setServerWallet({
          balance: firstNumber(walletData.balance, walletData.balance_jd, walletData.wallet_balance, 0),
          paidHoursMin: firstNumber(walletData.paid_hours_remaining, walletData.paid_minutes_remaining, 0),
          bonusHoursMin: firstNumber(walletData.bonus_hours_remaining, walletData.bonus_minutes_remaining, 0),
          subscriptionHours: firstNumber(walletData.subscription_hours, 0),
          activePackageName: firstString(walletData.active_package_name, walletData.package_name, ''),
          transactions: Array.isArray(txData) ? txData.map(mapWalletTransactionRow) : [],
        });
      } catch (error) {
        if (!active) return;
        if (import.meta.env.DEV) console.warn('[Wallet] showing empty state because wallet data could not load:', error);
        setServerWallet(null);
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
  }, [userId]);

  const rejectClientMutation = useCallback(async (..._args: unknown[]) => {
    toast({
      variant: 'destructive',
      title: 'تعذر تعديل الرصيد',
      description: 'تعديل الرصيد يتم من الخادم فقط بعد تأكيد العملية.',
    });
    return false;
  }, [toast]);

  const isDriver = user?.role === 'driver';
  const balanceJD = serverWallet?.balance ?? 0;
  const paidHoursMin = serverWallet?.paidHoursMin ?? 0;
  const bonusHoursMin = serverWallet?.bonusHoursMin ?? 0;
  const subscriptionHours = serverWallet?.subscriptionHours ?? Number(((paidHoursMin + bonusHoursMin) / 60).toFixed(3));
  const activePackageName = serverWallet?.activePackageName || '';

  const transactions = useMemo(() => serverWallet?.transactions ?? [], [serverWallet?.transactions]);

  return {
    loading,
    walletLoaded,
    rechargeWallet: rejectClientMutation,
    fundRiderBalance: rejectClientMutation,
    deductRiderFare: rejectClientMutation,
    purchaseDriverPackage: rejectClientMutation,
    isDriver,
    balanceJD,
    paidHoursMin,
    bonusHoursMin,
    subscriptionHours,
    activePackageName,
    transactions,
  };
}
