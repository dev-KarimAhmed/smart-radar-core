'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import type { User } from '@/core/types';
import { useSovereignWallet } from '@/hooks/use-sovereign-wallet';
import type { CaptainReceiptItem } from '../types/driver-wallet-types';
import { useDriverWalletDirectory } from '../hooks/use-driver-wallet-directory';
import { DriverWalletBalanceCard } from './wallet/driver-wallet-balance-card';
import { CaptainAdsSeatsManager } from './captain-ads-seats-manager';
import { DriverWalletRechargeSection } from './wallet/driver-wallet-recharge-section';
import { DriverWalletDelegateCard } from './wallet/driver-wallet-delegate-card';
import { CaptainAdPackageModal } from './ads-seats/captain-ad-package-modal';
import { subscribeCaptainAdPackage } from '../services/captain-ads-service';
import { resolveUserCurrency } from '@/shared/services/currency-label';

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
  const [isBalanceOpen, setIsBalanceOpen] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleActivatePackage = () => {
    const captainId = user?.uid || 'current_captain';
    subscribeCaptainAdPackage(captainId);
    setIsPackageModalOpen(false);
  };

  const handleGoToPayment = () => {
    setIsPackageModalOpen(false);
    const rechargeSection = document.getElementById('captain-recharge-section');
    if (rechargeSection) {
      rechargeSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const { effectiveChannels, effectiveDelegate } = useDriverWalletDirectory(
    user,
    t('delegateHint')
  );

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
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('radar-wallet-refresh'));
      }
    }
  };

  return (
    <div className="w-full space-y-6 pb-12 text-white min-w-0">
      {/* 1. Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">{t('title')}</h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-400">{t('subtitle')}</p>
      </div>

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
        onOpenAdPackage={() => setIsPackageModalOpen(true)}
      />

      {/* 3. Digital Recharge Section (وسائل الدفع والشحن) */}
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

      {/* 4. Financial Delegate Card */}
      <DriverWalletDelegateCard effectiveDelegate={effectiveDelegate} t={t} />

      {/* 5. Captain Promotional Ad Seats Manager (مكان رفع ونشر الإعلانات) */}
      <CaptainAdsSeatsManager user={user} language={language} totalUsableMinutes={wallet.totalUsableMinutes} />

      {/* 6. Captain Ad Package Modal (الباقة الافتتاحية) */}
      <CaptainAdPackageModal
        mounted={mounted}
        isOpen={isPackageModalOpen}
        isArabic={language === 'ar'}
        radarHourPrice={wallet.radarHourPrice || 300}
        currencySymbol={resolveUserCurrency(user, language)}
        onClose={() => setIsPackageModalOpen(false)}
        onGoToPayment={handleGoToPayment}
        onActivatePackage={handleActivatePackage}
      />
    </div>
  );
}
