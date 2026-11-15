import { useCallback } from 'react';
import { supabase } from '@/lib/supabase-client';
import type { ServerWalletSnapshot } from './wallet-types';

interface UseWalletBalanceAllocationsProps {
  setLoading: (loading: boolean) => void;
  setServerWallet: React.Dispatch<React.SetStateAction<ServerWalletSnapshot | null>>;
  refreshWallet: () => void;
  toast: any;
  tAuto: any;
}

export function useWalletBalanceAllocations({
  setLoading,
  setServerWallet,
  refreshWallet,
  toast,
  tAuto,
}: UseWalletBalanceAllocationsProps) {
  const selfTopup = useCallback(
    async (amount: number, minutes: number) => {
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('captain_self_topup', {
          p_amount: Number(amount) || 0,
          p_minutes: Math.round(Number(minutes) || 0),
        });
        if (error) throw error;
        const res = data as { balance?: number; paidMinutesRemaining?: number; minutesCredited?: number; amountCredited?: number } | null;
        const amountNum = Number(amount) || 0;
        const minutesNum = Math.round(Number(minutes) || 0);
        const creditedMins = res?.minutesCredited ?? minutesNum;
        const creditedBal = res?.amountCredited ?? amountNum;
        setServerWallet((current) =>
          current
            ? {
                ...current,
                balance: res?.balance ?? (current.balance + creditedBal),
                paidMinutesRemaining: res?.paidMinutesRemaining ?? (current.paidMinutesRemaining + creditedMins),
                subscriptionHours: Number(
                  (
                    ((res?.paidMinutesRemaining ?? (current.paidMinutesRemaining + creditedMins)) +
                      current.bonusMinutesRemaining) /
                    60
                  ).toFixed(3),
                ),
              }
            : null,
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
    [refreshWallet, toast, tAuto, setLoading, setServerWallet],
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
        const result = data as { success?: boolean; minutesGranted?: number; paidMinutesRemaining?: number; remainingBalance?: number } | null;
        if (result?.success) {
          setServerWallet((current) =>
            current
              ? {
                  ...current,
                  balance: result.remainingBalance ?? Math.max(0, current.balance - amount),
                  paidMinutesRemaining: result.paidMinutesRemaining ?? (current.paidMinutesRemaining + (result.minutesGranted ?? 0)),
                  subscriptionHours: Number(
                    (
                      ((result.paidMinutesRemaining ?? (current.paidMinutesRemaining + (result.minutesGranted ?? 0))) +
                        current.bonusMinutesRemaining) /
                      60
                    ).toFixed(3),
                  ),
                }
              : null,
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
    [refreshWallet, toast, tAuto, setLoading, setServerWallet],
  );

  const convertBalanceToMinutes = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('convert_wallet_balance_to_minutes');
      if (error) throw error;
      const result = data as { success?: boolean; minutesGranted?: number; paidMinutesRemaining?: number; newBalance?: number; reason?: string } | null;
      if (result?.success) {
        setServerWallet((current) =>
          current
            ? {
                ...current,
                balance: result.newBalance ?? 0,
                paidMinutesRemaining: result.paidMinutesRemaining ?? (current.paidMinutesRemaining + (result.minutesGranted ?? 0)),
                subscriptionHours: Number(
                  (
                    ((result.paidMinutesRemaining ?? (current.paidMinutesRemaining + (result.minutesGranted ?? 0))) +
                      current.bonusMinutesRemaining) /
                    60
                  ).toFixed(3),
                ),
              }
            : null,
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

  return {
    selfTopup,
    allocateBalanceToMinutes,
    convertBalanceToMinutes,
  };
}
