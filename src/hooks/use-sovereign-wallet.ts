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
  const [refreshIndex, setRefreshIndex] = useState(0);
  const userId = user?.uid || '';

  const refreshWallet = useCallback(() => {
    setRefreshIndex((value) => value + 1);
  }, []);

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
          supabase.from('wallet_accounts').select('*').eq('profile_id', userId).maybeSingle(),
          supabase.from('wallet_transactions').select('*').eq('profile_id', userId).order('created_at', { ascending: false }),
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
  }, [refreshIndex, userId]);

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
      if (import.meta.env.DEV) console.warn('[Wallet Receipt]', error);
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
      if (import.meta.env.DEV) console.warn('[Wallet Voucher]', error);
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
      if (import.meta.env.DEV) console.warn('[Wallet Delegate Charge]', error);
      toast({ variant: 'destructive', title: 'تعذر شحن الرصيد', description: 'لم يتم تنفيذ العملية من الخادم.' });
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
    submitWalletReceipt,
    redeemVoucherCode,
    delegateChargeCaptain,
    isDriver,
    balanceJD,
    paidHoursMin,
    bonusHoursMin,
    subscriptionHours,
    activePackageName,
    transactions,
  };
}
