'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import type { User } from '@/core/types';
import { supabase } from '@/lib/supabase-client';
import { useToast } from './use-toast';

interface ServerWalletSnapshot {
  balance: number;
  paidMinutesRemaining: number;
  bonusMinutesRemaining: number;
  subscriptionHours: number;
  activePackageName: string;
  timeBundleExpiresAt: string | null;
  transactions: WalletTransaction[];
}

type WalletLoadState = 'idle' | 'loading' | 'ready' | 'missing' | 'error';

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

interface SubmitWalletReceiptInput {
  amount: number;
  channel: string;
  receiptFile: File;
}

interface DelegateChargeInput {
  captainId: string;
  amount: number;
  description?: string;
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

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
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

function mapWalletAccountRow(row: Record<string, any> | null, transactions: WalletTransaction[] = []): ServerWalletSnapshot | null {
  if (!row) return null;
  const paidMinutes = firstNumber(row.paid_minutes_remaining, 0);
  const bonusMinutes = firstNumber(row.bonus_minutes_remaining, 0);

  return {
    balance: firstNumber(row.balance, 0),
    paidMinutesRemaining: paidMinutes,
    bonusMinutesRemaining: bonusMinutes,
    subscriptionHours: Number(((paidMinutes + bonusMinutes) / 60).toFixed(3)),
    activePackageName: firstString(row.active_package_name, ''),
    timeBundleExpiresAt: firstString(row.time_bundle_expires_at, '') || null,
    transactions,
  };
}

export function useSovereignWallet(user: User | null) {
  const { toast } = useToast();
  const realtimeInstanceId = useMemo(() => Math.random().toString(36).slice(2), []);
  const [loading, setLoading] = useState(false);
  const [serverWallet, setServerWallet] = useState<ServerWalletSnapshot | null>(null);
  const [walletLoaded, setWalletLoaded] = useState(false);
  const [walletLoadState, setWalletLoadState] = useState<WalletLoadState>('idle');
  const [walletError, setWalletError] = useState('');
  const [refreshIndex, setRefreshIndex] = useState(0);
  // Only decides whether the testing control is rendered. The RPC re-reads the same flag
  // server-side, so hiding the button is cosmetic — turning the flag off is what closes it.
  const [selfTopupEnabled, setSelfTopupEnabled] = useState(false);

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
      setServerWallet(mapWalletAccountRow({
        balance: user?.walletBalanceJD ?? 0,
        paid_minutes_remaining: user?.paidHoursRemaining ?? 0,
        bonus_minutes_remaining: user?.bonusHoursRemaining ?? 0,
        active_package_name: user?.activePackageName ?? '',
      }, Array.isArray(user?.walletTransactions) ? user.walletTransactions.map(mapWalletTransactionRow) : []));
      setWalletLoaded(true);
      setWalletLoadState('ready');
      setWalletError('');
      setLoading(false);
      return;
    }

    let active = true;

    async function fetchWalletFromServer() {
      setWalletLoaded(false);
      setWalletLoadState('loading');
      setWalletError('');
      setLoading(true);

      try {
        const [{ data: walletData, error: walletError }, { data: txData, error: txError }] = await Promise.all([
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

        const transactions = Array.isArray(txData) ? txData.map(mapWalletTransactionRow) : [];
        setServerWallet(mapWalletAccountRow(walletData as Record<string, any> | null, transactions));
        setWalletLoadState(walletData ? 'ready' : 'missing');
        if (!walletData && (process.env.NODE_ENV !== 'production')) {
          console.warn(`[Wallet] no wallet_accounts row found for profile_id=${userId}`);
        }
      } catch (error) {
        if (!active) return;
        if ((process.env.NODE_ENV !== 'production')) console.warn('[Wallet] showing empty state because wallet data could not load:', error);
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
  }, [refreshIndex, user?.activePackageName, user?.bonusHoursRemaining, user?.paidHoursRemaining, user?.walletBalanceJD, user?.walletTransactions, userId]);

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
      .subscribe((status) => {
        if ((status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') && (process.env.NODE_ENV !== 'production')) {
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
        () => refreshWallet(),
      )
      .subscribe((status) => {
        if ((status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') && (process.env.NODE_ENV !== 'production')) {
          console.warn('[Wallet transactions] realtime channel issue:', status);
        }
      });

    return () => {
      void walletChannel.unsubscribe();
      void transactionsChannel.unsubscribe();
    };
  }, [realtimeInstanceId, refreshWallet, userId]);

  const submitWalletReceipt = useCallback(async (input: SubmitWalletReceiptInput) => {
    if (!userId) {
      toast({ variant: 'destructive', title: 'تعذر إرسال الإيصال', description: 'يرجى تسجيل الدخول ثم حاول مرة أخرى.' });
      return false;
    }

    if (!Number.isFinite(input.amount) || input.amount <= 0) {
      toast({ variant: 'destructive', title: 'قيمة غير صحيحة', description: 'اكتب مبلغاً صحيحاً أكبر من صفر.' });
      return false;
    }

    setLoading(true);
    try {
      const extension = input.receiptFile.name.split('.').pop()?.replace(/[^a-z0-9]/gi, '').toLowerCase() || 'jpg';
      const receiptPath = `${userId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
      const { error: uploadError } = await supabase.storage.from('receipts').upload(receiptPath, input.receiptFile, {
        cacheControl: '3600',
        contentType: input.receiptFile.type || 'image/jpeg',
        upsert: false,
      });
      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase.from('wallet_transactions').insert({
        profile_id: userId,
        type: 'receipt',
        transaction_type: 'receipt',
        amount: input.amount,
        currency_code: user?.currencyEn || null,
        currency_ar: user?.currencyAr || null,
        status: 'PENDING',
        description_ar: 'إيصال شحن بانتظار المراجعة.',
        payment_channel: input.channel,
        receipt_path: receiptPath,
        metadata: {
          original_file_name: input.receiptFile.name,
          file_size: input.receiptFile.size,
        },
      });
      if (insertError) throw insertError;

      toast({ title: 'تم إرسال الإيصال', description: 'وصل الإيصال للمراجعة. سيظهر الرصيد بعد اعتماده.' });
      refreshWallet();
      return true;
    } catch (error) {
      if ((process.env.NODE_ENV !== 'production')) console.warn('[Wallet Receipt]', error);
      toast({ variant: 'destructive', title: 'تعذر إرسال الإيصال', description: 'تحقق من الاتصال وحاول مرة أخرى.' });
      return false;
    } finally {
      setLoading(false);
    }
  }, [refreshWallet, toast, user?.currencyAr, user?.currencyEn, userId]);

  const redeemVoucherCode = useCallback(async (code: string) => {
    if (!code.trim()) {
      toast({ variant: 'destructive', title: 'الكود مطلوب', description: 'اكتب كود الشحن ثم حاول مرة أخرى.' });
      return false;
    }

    setLoading(true);
    try {
      const { error } = await supabase.rpc('redeem_voucher_code', { p_code: code.trim().toUpperCase() });
      if (error) throw error;
      toast({ title: 'تم تفعيل الكود', description: 'تمت إضافة قيمة الكود إلى حسابك.' });
      refreshWallet();
      return true;
    } catch (error) {
      if ((process.env.NODE_ENV !== 'production')) console.warn('[Wallet Voucher]', error);
      toast({ variant: 'destructive', title: 'تعذر تفعيل الكود', description: 'تأكد من صحة الكود أو حاول مرة أخرى.' });
      return false;
    } finally {
      setLoading(false);
    }
  }, [refreshWallet, toast]);

  const delegateChargeCaptain = useCallback(async (input: DelegateChargeInput) => {
    setLoading(true);
    try {
      const { error } = await supabase.rpc('delegate_charge_captain', {
        p_captain_id: input.captainId,
        p_amount: input.amount,
        p_description: input.description || null,
      });
      if (error) throw error;
      refreshWallet();
      return true;
    } catch (error) {
      if ((process.env.NODE_ENV !== 'production')) console.warn('[Wallet Delegate Charge]', error);
      toast({ variant: 'destructive', title: 'تعذر شحن الرصيد', description: 'لم يتم تنفيذ العملية من الخادم.' });
      return false;
    } finally {
      setLoading(false);
    }
  }, [refreshWallet, toast]);

  /**
   * TESTING ONLY. Credits the signed-in captain's own wallet with no approver.
   *
   * Gated server-side by app_flags.captain_self_topup and capped per call; when the flag is
   * off the RPC raises `self_topup_disabled` and this surfaces that as a plain message
   * rather than a generic failure. `selfTopupEnabled` below is only used to hide the
   * control — the flag that actually matters is the one the RPC checks.
   */
  const selfTopup = useCallback(async (amount: number, minutes: number) => {
    setLoading(true);
    try {
      const { error } = await supabase.rpc('captain_self_topup', {
        p_amount: Number(amount) || 0,
        p_minutes: Math.round(Number(minutes) || 0),
      });
      if (error) throw error;
      toast({ title: 'تم الشحن الاختباري', description: 'تمت إضافة الرصيد والدقائق إلى حسابك.' });
      refreshWallet();
      return true;
    } catch (error) {
      const message = String((error as { message?: string })?.message || '');
      if ((process.env.NODE_ENV !== 'production')) console.warn('[Wallet Self Topup]', error);
      toast({
        variant: 'destructive',
        title: 'تعذر الشحن الاختباري',
        description: message.includes('self_topup_disabled')
          ? 'الشحن الذاتي متوقف من الإدارة.'
          : message.includes('above_test_limit')
            ? 'المبلغ أو الدقائق أعلى من حد التجربة المسموح.'
            : 'لم يتم تنفيذ العملية من الخادم.',
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [refreshWallet, toast]);

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
  const paidMinutesRemaining = serverWallet?.paidMinutesRemaining ?? 0;
  const bonusMinutesRemaining = serverWallet?.bonusMinutesRemaining ?? 0;
  const subscriptionHours = serverWallet?.subscriptionHours ?? Number(((paidMinutesRemaining + bonusMinutesRemaining) / 60).toFixed(3));
  const activePackageName = serverWallet?.activePackageName || '';
  const timeBundleExpiresAt = serverWallet?.timeBundleExpiresAt || null;
  const hasActiveTimeBundle =
    paidMinutesRemaining + bonusMinutesRemaining > 0
    && (!timeBundleExpiresAt || Date.parse(timeBundleExpiresAt) > Date.now());
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
    selfTopupEnabled,
    isDriver,
    balanceJD,
    paidMinutesRemaining,
    bonusMinutesRemaining,
    subscriptionHours,
    activePackageName,
    timeBundleExpiresAt,
    hasActiveTimeBundle,
    transactions,
  };
}
