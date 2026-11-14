'use client';

import { useCallback, useMemo, useState } from 'react';
import type { User } from '@/core/types';
import { useToast } from './use-toast';
import { useTranslations } from 'next-intl';
import type {
  ServerWalletSnapshot,
  WalletLoadState,
  WalletTransaction,
  SubmitWalletReceiptInput,
  DelegateChargeInput,
} from './sovereign-wallet/wallet-types';
import {
  useRadarHourPrice,
  useSelfTopupFlag,
} from './sovereign-wallet/use-wallet-pricing-flags';
import { useWalletSubscription } from './sovereign-wallet/use-wallet-subscription';
import { useWalletMutations } from './sovereign-wallet/use-wallet-mutations';

export type {
  ServerWalletSnapshot,
  WalletLoadState,
  WalletTransaction,
  SubmitWalletReceiptInput,
  DelegateChargeInput,
};

export function useSovereignWallet(user: User | null) {
  const tAuto = useTranslations();
  const { toast } = useToast();
  const realtimeInstanceId = useMemo(() => Math.random().toString(36).slice(2), []);
  const [loading, setLoading] = useState(false);
  const [serverWallet, setServerWallet] = useState<ServerWalletSnapshot | null>(null);
  const [walletLoaded, setWalletLoaded] = useState(false);
  const [walletLoadState, setWalletLoadState] = useState<WalletLoadState>('idle');
  const [walletError, setWalletError] = useState('');
  const [refreshIndex, setRefreshIndex] = useState(0);

  const radarHourPrice = useRadarHourPrice(user);
  const selfTopupEnabled = useSelfTopupFlag();
  const userId = user?.uid || '';

  const refreshWallet = useCallback(() => {
    setRefreshIndex((value) => value + 1);
  }, []);

  useWalletSubscription({
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
  });

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
