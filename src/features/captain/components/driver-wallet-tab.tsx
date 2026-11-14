'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import type { User } from '@/core/types';
import { useSovereignWallet } from '@/hooks/use-sovereign-wallet';
import { DriverReferralCard } from '@/features/referral/components/driver-referral-card';
import type { CaptainReceiptItem } from '../types/driver-wallet-types';
import { useDriverWalletDirectory } from '../hooks/use-driver-wallet-directory';
import { useDriverWalletReceipts } from '../hooks/use-driver-wallet-receipts';
import { DriverWalletBalanceCard } from './wallet/driver-wallet-balance-card';
import { DriverWalletRechargeSection } from './wallet/driver-wallet-recharge-section';
import { DriverWalletReceiptsList } from './wallet/driver-wallet-receipts-list';
import { DriverWalletDelegateCard } from './wallet/driver-wallet-delegate-card';
import { DriverWalletReceiptLightbox } from './wallet/driver-wallet-receipt-lightbox';

export type { CaptainReceiptItem };

interface DriverWalletTabProps {
  user: User | null;
  language: 'ar' | 'en';
  isFlightActive?: boolean;
  onOpenHistory?: () => void;
}

export function DriverWalletTab({
  user,
  language,
  onOpenHistory,
}: DriverWalletTabProps) {
  const t = useTranslations('captainWallet');
  const wallet = useSovereignWallet(user);
  const walletIsReady = wallet.walletLoadState === 'ready';
  const walletIsMissing = wallet.walletLoadState === 'missing';
  const walletHasError = wallet.walletLoadState === 'error';

  const [amount, setAmount] = useState('');
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [copiedChannelId, setCopiedChannelId] = useState<string | null>(null);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [previewReceipt, setPreviewReceipt] = useState<CaptainReceiptItem | null>(null);
  const [isReceiptsOpen, setIsReceiptsOpen] = useState<boolean>(false);
  const [isBalanceOpen, setIsBalanceOpen] = useState<boolean>(false);

  const captainId = user?.uid || (user as any)?.id || '';

  const { effectiveChannels, effectiveDelegate } = useDriverWalletDirectory(
    user,
    t('delegateHint')
  );

  const { receiptsHistory, isLoadingReceipts, fetchReceipts } = useDriverWalletReceipts(captainId);

  const selectedChannel = effectiveChannels.find((c) => c.id === selectedChannelId) || null;

  const copyChannelNumber = (channelId: string, value: string) => {
    navigator.clipboard?.writeText(value);
    setCopiedChannelId(channelId);
    window.setTimeout(() => setCopiedChannelId((current) => (current === channelId ? null : current)), 1500);
  };

  const submitReceipt = async () => {
    if (!receiptFile || !selectedChannel) return;
    const channelLabel = language === 'ar' ? selectedChannel.labelAr : selectedChannel.labelEn;
    const ok = await wallet.submitWalletReceipt({
      amount: Number(amount),
      channel: channelLabel,
      receiptFile,
    });
    if (ok) {
      setAmount('');
      setSelectedChannelId(null);
      setReceiptFile(null);
      setIsReceiptsOpen(true);
      void fetchReceipts(false);
    }
  };

  return (
    <div className="w-full space-y-6 pb-12 text-white min-w-0">
      {/* 1. Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">{t('title')}</h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-400">{t('subtitle')}</p>
      </div>

      {/* Driver Referral Card */}
      <DriverReferralCard user={user} isArabic={language === 'ar'} onOpenHistory={onOpenHistory} />

      {/* 2. Unified Hero Balance Card */}
      <DriverWalletBalanceCard
        user={user}
        language={language}
        wallet={wallet}
        walletIsReady={walletIsReady}
        walletIsMissing={walletIsMissing}
        walletHasError={walletHasError}
        isBalanceOpen={isBalanceOpen}
        setIsBalanceOpen={setIsBalanceOpen}
        t={t}
      />

      {/* 3. Digital Recharge Section */}
      <DriverWalletRechargeSection
        language={language}
        effectiveChannels={effectiveChannels}
        selectedChannelId={selectedChannelId}
        setSelectedChannelId={setSelectedChannelId}
        copiedChannelId={copiedChannelId}
        copyChannelNumber={copyChannelNumber}
        selectedChannel={selectedChannel}
        amount={amount}
        setAmount={setAmount}
        receiptFile={receiptFile}
        setReceiptFile={setReceiptFile}
        submitReceipt={submitReceipt}
        loading={wallet.loading}
        t={t}
      />

      {/* 4. Receipts History Section */}
      <DriverWalletReceiptsList
        language={language}
        receiptsHistory={receiptsHistory}
        isLoadingReceipts={isLoadingReceipts}
        isReceiptsOpen={isReceiptsOpen}
        setIsReceiptsOpen={setIsReceiptsOpen}
        fetchReceipts={fetchReceipts}
        onPreviewReceipt={(r) => setPreviewReceipt(r)}
        t={t}
      />

      {/* 5. Financial Delegate Card */}
      <DriverWalletDelegateCard effectiveDelegate={effectiveDelegate} t={t} />

      {/* 6. Receipt Image Lightbox Modal */}
      <DriverWalletReceiptLightbox
        previewReceipt={previewReceipt}
        onClose={() => setPreviewReceipt(null)}
        language={language}
        t={t}
      />
    </div>
  );
}
