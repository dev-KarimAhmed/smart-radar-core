import type { User } from '@/core/types';
import type { ServerWalletSnapshot } from './wallet-types';
import { useWalletReceiptVoucher } from './use-wallet-receipt-voucher';
import { useWalletBalanceAllocations } from './use-wallet-balance-allocations';

interface UseWalletMutationsProps {
  user: User | null;
  userId: string;
  setLoading: (loading: boolean) => void;
  setServerWallet: React.Dispatch<React.SetStateAction<ServerWalletSnapshot | null>>;
  refreshWallet: () => void;
  toast: any;
  tAuto: any;
}

export function useWalletMutations({
  user,
  userId,
  setLoading,
  setServerWallet,
  refreshWallet,
  toast,
  tAuto,
}: UseWalletMutationsProps) {
  const {
    submitWalletReceipt,
    redeemVoucherCode,
    delegateChargeCaptain,
    rejectClientMutation,
  } = useWalletReceiptVoucher({
    user,
    userId,
    setLoading,
    refreshWallet,
    toast,
    tAuto,
  });

  const {
    selfTopup,
    allocateBalanceToMinutes,
    convertBalanceToMinutes,
  } = useWalletBalanceAllocations({
    setLoading,
    setServerWallet,
    refreshWallet,
    toast,
    tAuto,
  });

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
