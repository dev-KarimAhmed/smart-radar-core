import { useCallback } from 'react';
import type { User } from '@/core/types';
import { supabase } from '@/lib/supabase-client';
import type {
  SubmitWalletReceiptInput,
  DelegateChargeInput,
} from './wallet-types';

interface UseWalletReceiptVoucherProps {
  user: User | null;
  userId: string;
  setLoading: (loading: boolean) => void;
  refreshWallet: () => void;
  toast: any;
  tAuto: any;
}

export function useWalletReceiptVoucher({
  user,
  userId,
  setLoading,
  refreshWallet,
  toast,
  tAuto,
}: UseWalletReceiptVoucherProps) {
  const submitWalletReceipt = useCallback(
    async (input: SubmitWalletReceiptInput) => {
      if (!userId) {
        toast({ variant: 'destructive', title: tAuto('failedToSubmitReceipt'), description: tAuto('pleaseLoginToTryAgain') });
        return false;
      }

      if (!Number.isFinite(input.amount) || input.amount <= 0) {
        toast({ variant: 'destructive', title: tAuto('invalidValue'), description: tAuto('enterValidAmountGtZero') });
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
        toast({ variant: 'destructive', title: tAuto('failedToSubmitReceipt'), description: tAuto('checkConnectionTryAgain') });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [refreshWallet, toast, tAuto, user?.countryId, user?.currencyAr, user?.currencyEn, user?.phone, userId, setLoading],
  );

  const redeemVoucherCode = useCallback(
    async (code: string) => {
      if (!code.trim()) {
        toast({ variant: 'destructive', title: tAuto('codeRequired'), description: tAuto('enterRechargeCodeTryAgain') });
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
        toast({ variant: 'destructive', title: tAuto('failedToActivateCode'), description: tAuto('verifyCodeOrTryAgain') });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [refreshWallet, toast, tAuto, setLoading],
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
        toast({ variant: 'destructive', title: tAuto('failedToRechargeBalance'), description: tAuto('operationNotExecutedByServer') });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [refreshWallet, toast, tAuto, setLoading],
  );

  const rejectClientMutation = useCallback(
    async (..._args: unknown[]) => {
      toast({
        variant: 'destructive',
        title: tAuto('failedToModifyBalance'),
        description: tAuto('balanceModificationOnlyFromServer'),
      });
      return false;
    },
    [toast, tAuto],
  );

  return {
    submitWalletReceipt,
    redeemVoucherCode,
    delegateChargeCaptain,
    rejectClientMutation,
  };
}
