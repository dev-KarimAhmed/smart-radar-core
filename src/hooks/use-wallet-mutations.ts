'use client';

import { useCallback } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import type { User } from '@/core/types';
import { supabase } from '@/lib/supabase-client';
import type {
  ServerWalletSnapshot,
  SubmitWalletReceiptInput,
  DelegateChargeInput,
} from './wallet-helpers';

interface WalletMutationOptions {
  user: User | null;
  userId: string;
  setLoading: Dispatch<SetStateAction<boolean>>;
  setServerWallet: Dispatch<SetStateAction<ServerWalletSnapshot | null>>;
  refreshWallet: () => void;
  toast: (props: { variant?: 'default' | 'destructive'; title?: string; description?: string }) => void;
  tAuto: (key: string, values?: Record<string, any>) => string;
}

export function useWalletMutations({
  user,
  userId,
  setLoading,
  setServerWallet,
  refreshWallet,
  toast,
  tAuto,
}: WalletMutationOptions) {
  const submitWalletReceipt = useCallback(
    async (input: SubmitWalletReceiptInput) => {
      if (!userId) {
        toast({
          variant: 'destructive',
          title: tAuto('failedToSubmitReceipt'),
          description: tAuto('pleaseLoginToTryAgain'),
        });
        return false;
      }

      if (!Number.isFinite(input.amount) || input.amount <= 0) {
        toast({
          variant: 'destructive',
          title: tAuto('invalidValue'),
          description: tAuto('enterValidAmountGtZero'),
        });
        return false;
      }

      setLoading(true);
      try {
        const extension =
          input.receiptFile.name.split('.').pop()?.replace(/[^a-z0-9]/gi, '').toLowerCase() || 'jpg';
        const receiptPath = `${userId}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage.from('receipts').upload(receiptPath, input.receiptFile, {
          cacheControl: '3600',
          contentType: input.receiptFile.type || 'image/jpeg',
          upsert: false,
        });
        if (uploadError) throw uploadError;

        const isEgypt = user?.countryId === 2 || String(user?.phone || '').startsWith('+20');
        const resolvedCurrencyCode = user?.currencyEn || (isEgypt ? 'EGP' : 'JOD');
        const resolvedCurrencyAr = user?.currencyAr || (isEgypt ? 'ج.م' : 'د.أ');

        const { error: insertError } = await supabase.from('wallet_transactions').insert({
          profile_id: userId,
          type: 'receipt',
          transaction_type: 'receipt',
          amount: input.amount,
          currency_code: resolvedCurrencyCode,
          currency_ar: resolvedCurrencyAr,
          status: 'PENDING',
          description_ar: tAuto('receiptAwaitingReview'),
          payment_channel: input.channel,
          receipt_path: receiptPath,
          metadata: {
            original_file_name: input.receiptFile.name,
            file_size: input.receiptFile.size,
          },
        });
        if (insertError) throw insertError;

        toast({ title: tAuto('receiptSubmitted'), description: tAuto('receiptAwaitingReviewMsg') });
        refreshWallet();
        return true;
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') console.warn('[Wallet Receipt]', error);
        toast({
          variant: 'destructive',
          title: tAuto('failedToSubmitReceipt'),
          description: tAuto('checkConnectionTryAgain'),
        });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [refreshWallet, toast, tAuto, user?.countryId, user?.currencyAr, user?.currencyEn, user?.phone, userId, setLoading]
  );

  const redeemVoucherCode = useCallback(
    async (code: string) => {
      if (!code.trim()) {
        toast({
          variant: 'destructive',
          title: tAuto('codeRequired'),
          description: tAuto('enterRechargeCodeTryAgain'),
        });
        return false;
      }

      setLoading(true);
      try {
        const { error } = await supabase.rpc('redeem_voucher_code', { p_code: code.trim().toUpperCase() });
        if (error) throw error;
        toast({ title: tAuto('codeActivated'), description: tAuto('codeValueAddedToAccount') });
        refreshWallet();
        return true;
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') console.warn('[Wallet Voucher]', error);
        toast({
          variant: 'destructive',
          title: tAuto('failedToActivateCode'),
          description: tAuto('verifyCodeOrTryAgain'),
        });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [refreshWallet, toast, tAuto, setLoading]
  );

  const delegateChargeCaptain = useCallback(
    async (input: DelegateChargeInput) => {
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
        if (process.env.NODE_ENV !== 'production') console.warn('[Wallet Delegate Charge]', error);
        toast({
          variant: 'destructive',
          title: tAuto('failedToRechargeBalance'),
          description: tAuto('operationNotExecutedByServer'),
        });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [refreshWallet, toast, tAuto, setLoading]
  );

  const selfTopup = useCallback(
    async (amount: number, minutes: number) => {
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('captain_self_topup', {
          p_amount: Number(amount) || 0,
          p_minutes: Math.round(Number(minutes) || 0),
        });
        if (error) throw error;
        const res = data as {
          balance?: number;
          paidMinutesRemaining?: number;
          minutesCredited?: number;
          amountCredited?: number;
        } | null;
        const amountNum = Number(amount) || 0;
        const minutesNum = Math.round(Number(minutes) || 0);
        const creditedMins = res?.minutesCredited ?? minutesNum;
        const creditedBal = res?.amountCredited ?? amountNum;
        setServerWallet((current) =>
          current
            ? {
                ...current,
                balance: res?.balance ?? current.balance + creditedBal,
                paidMinutesRemaining: res?.paidMinutesRemaining ?? current.paidMinutesRemaining + creditedMins,
                subscriptionHours: Number(
                  (
                    ((res?.paidMinutesRemaining ?? current.paidMinutesRemaining + creditedMins) +
                      current.bonusMinutesRemaining) /
                    60
                  ).toFixed(3)
                ),
              }
            : null
        );
        toast({
          title: tAuto('walletRecharged'),
          description: tAuto('amountAddedToCashBalanceAllocatable'),
        });
        refreshWallet();
        return true;
      } catch (error) {
        const message = String((error as { message?: string })?.message || '');
        if (process.env.NODE_ENV !== 'production') console.warn('[Wallet Self Topup]', error);
        toast({
          variant: 'destructive',
          title: tAuto('failedTestRecharge'),
          description: message.includes('self_topup_disabled')
            ? tAuto('selfTopupDisabled')
            : message.includes('above_test_limit')
            ? tAuto('aboveTestLimit')
            : message.includes('amount_below_one_minute')
            ? tAuto('amountBelowOneMinute')
            : tAuto('operationNotExecutedByServer'),
        });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [refreshWallet, toast, tAuto, setLoading, setServerWallet]
  );

  const allocateBalanceToMinutes = useCallback(
    async (amount: number) => {
      if (!amount || amount <= 0) {
        toast({ variant: 'destructive', title: tAuto('invalidAmount'), description: tAuto('enterAmountGtZero') });
        return false;
      }
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('allocate_cash_balance_to_minutes', { p_amount: Number(amount) });
        if (error) throw error;
        const result = data as {
          success?: boolean;
          minutesGranted?: number;
          paidMinutesRemaining?: number;
          remainingBalance?: number;
        } | null;
        if (result?.success) {
          setServerWallet((current) =>
            current
              ? {
                  ...current,
                  balance: result.remainingBalance ?? Math.max(0, current.balance - amount),
                  paidMinutesRemaining:
                    result.paidMinutesRemaining ?? current.paidMinutesRemaining + (result.minutesGranted ?? 0),
                  subscriptionHours: Number(
                    (
                      ((result.paidMinutesRemaining ?? current.paidMinutesRemaining + (result.minutesGranted ?? 0)) +
                        current.bonusMinutesRemaining) /
                      60
                    ).toFixed(3)
                  ),
                }
              : null
          );

          toast({
            title: tAuto('radarTimeAllocated'),
            description: tAuto('amountDeductedAndMinutesAdded', { amount, minutes: result.minutesGranted ?? 0 }),
          });
        }
        refreshWallet();
        return true;
      } catch (error) {
        const message = String((error as { message?: string })?.message || '');
        if (process.env.NODE_ENV !== 'production') console.warn('[Wallet Allocate Balance]', error);
        toast({
          variant: 'destructive',
          title: tAuto('failedToAllocate'),
          description: message.includes('insufficient_balance')
            ? tAuto('insufficientCashBalance')
            : tAuto('allocationNotExecuted'),
        });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [refreshWallet, toast, tAuto, setLoading, setServerWallet]
  );

  const convertBalanceToMinutes = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('convert_wallet_balance_to_minutes');
      if (error) throw error;
      const result = data as {
        success?: boolean;
        minutesGranted?: number;
        paidMinutesRemaining?: number;
        newBalance?: number;
        reason?: string;
      } | null;
      if (result?.success) {
        setServerWallet((current) =>
          current
            ? {
                ...current,
                balance: result.newBalance ?? 0,
                paidMinutesRemaining:
                  result.paidMinutesRemaining ?? current.paidMinutesRemaining + (result.minutesGranted ?? 0),
                subscriptionHours: Number(
                  (
                    ((result.paidMinutesRemaining ?? current.paidMinutesRemaining + (result.minutesGranted ?? 0)) +
                      current.bonusMinutesRemaining) /
                    60
                  ).toFixed(3)
                ),
              }
            : null
        );

        if ((result.minutesGranted ?? 0) > 0) {
          toast({
            title: tAuto('balanceConverted'),
            description: tAuto('balanceConvertedToRadarMinutes', { minutes: result.minutesGranted ?? 0 }),
          });
        }
      } else if (result?.reason === 'balance_already_zero') {
        toast({ title: tAuto('zeroBalance'), description: tAuto('noCashBalanceToConvert') });
      }
      refreshWallet();
      return true;
    } catch (error) {
      if (process.env.NODE_ENV !== 'production') console.warn('[Wallet Convert Balance]', error);
      toast({
        variant: 'destructive',
        title: tAuto('failedToConvert'),
        description: tAuto('balanceNotConvertedTryAgainOrContactAgent'),
      });
      return false;
    } finally {
      setLoading(false);
    }
  }, [refreshWallet, toast, tAuto, setLoading, setServerWallet]);

  const rejectClientMutation = useCallback(
    async (..._args: unknown[]) => {
      toast({
        variant: 'destructive',
        title: tAuto('failedToModifyBalance'),
        description: tAuto('balanceModificationOnlyFromServer'),
      });
      return false;
    },
    [toast, tAuto]
  );

  return {
    submitWalletReceipt,
    redeemVoucherCode,
    delegateChargeCaptain,
    selfTopup,
    allocateBalanceToMinutes,
    convertBalanceToMinutes,
    rejectClientMutation,
  };
}
