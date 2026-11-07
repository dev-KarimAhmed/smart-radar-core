'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import {
  ChevronDown,
  Clock,
  Info,
  Wallet,
  Zap,
} from 'lucide-react';
import type { User } from '@/core/types';
import { useSovereignWallet } from '@/hooks/use-sovereign-wallet';
import { supabase } from '@/lib/supabase-client';
import { cn } from '@/lib/utils';
import {
  CAPTAIN_PAYMENT_CHANNELS,
  getCaptainDistrictPaymentInfo,
} from '../lib/wallet-static-config';
import { CaptainAdsSeatsManager } from './captain-ads-seats-manager';
import { DriverReferralCard } from '@/features/referral/components/driver-referral-card';
import type { PaymentTransferChannel, FinancialDelegate } from '@/features/admin/types/wallet-directory';
import { toHoursMinutes, type CaptainReceiptItem } from './wallet/wallet-types';
import { CaptainWalletTopup } from './wallet/captain-wallet-topup';
import { CaptainReceiptsHistory } from './wallet/captain-receipts-history';
import { FinancialDelegateCard } from './wallet/financial-delegate-card';

// Re-export types for backward compatibility
export type { CaptainReceiptItem } from './wallet/wallet-types';

interface DriverWalletTabProps {
  user: User | null;
  language: 'ar' | 'en';
  isFlightActive?: boolean;
  onOpenHistory?: () => void;
}

export function DriverWalletTab({ user, language, isFlightActive = false, onOpenHistory }: DriverWalletTabProps) {
  const t = useTranslations('captainWallet');
  const wallet = useSovereignWallet(user);
  const walletIsReady = wallet.walletLoadState === 'ready';
  const walletIsMissing = wallet.walletLoadState === 'missing';
  const walletHasError = wallet.walletLoadState === 'error';

  const [amount, setAmount] = React.useState('');
  const [selectedChannelId, setSelectedChannelId] = React.useState<string | null>(null);
  const [copiedChannelId, setCopiedChannelId] = React.useState<string | null>(null);
  const [receiptFile, setReceiptFile] = React.useState<File | null>(null);

  // Dynamic Directory from Admin
  const [dynamicChannels, setDynamicChannels] = React.useState<PaymentTransferChannel[]>([]);
  const [dynamicDelegate, setDynamicDelegate] = React.useState<FinancialDelegate | null>(null);
  const [isLoadingDirectory, setIsLoadingDirectory] = React.useState<boolean>(true);

  const districtPaymentInfo = getCaptainDistrictPaymentInfo(user?.district);

  React.useEffect(() => {
    let isMounted = true;
    const fetchDirectory = async () => {
      try {
        const params = new URLSearchParams();
        if (user?.countryId) params.append('countryId', String(user.countryId));
        if (user?.governorate) params.append('governorate', user.governorate);
        if (user?.district) params.append('district', user.district);

        const res = await fetch(`/api/captain/wallet-directory?${params.toString()}`);
        if (!res.ok) return;
        const data = await res.json();
        if (isMounted && data.success) {
          if (Array.isArray(data.channels) && data.channels.length > 0) {
            setDynamicChannels(data.channels);
          }
          setDynamicDelegate(data.delegate || null);
        }
      } catch (err) {
        console.warn('[DriverWalletTab] Failed to fetch dynamic wallet directory, using fallback:', err);
      } finally {
        if (isMounted) setIsLoadingDirectory(false);
      }
    };

    fetchDirectory();
    return () => {
      isMounted = false;
    };
  }, [user?.countryId, user?.governorate, user?.district]);

  // Unified Effective Channels (Dynamic from DB with static fallback)
  const effectiveChannels = React.useMemo(() => {
    if (dynamicChannels.length > 0) {
      return dynamicChannels.map((c) => ({
        id: c.id,
        nameAr: c.nameAr,
        nameEn: c.nameEn,
        labelAr: c.nameAr,
        labelEn: c.nameEn,
        descriptionAr: c.descriptionAr || '',
        descriptionEn: c.descriptionEn || '',
        accountNumber: c.accountNumber,
        accountHolder: c.accountHolder,
        channelType: c.channelType,
        displayOrder: c.displayOrder,
        isActive: c.isActive,
      }));
    }
    return CAPTAIN_PAYMENT_CHANNELS.map((channel) => ({
      id: channel.id,
      nameAr: channel.labelAr,
      nameEn: channel.labelEn,
      labelAr: channel.labelAr,
      labelEn: channel.labelEn,
      descriptionAr: channel.descriptionAr,
      descriptionEn: channel.descriptionEn,
      accountNumber: districtPaymentInfo.channelNumbers[channel.id] || '',
      accountHolder: undefined,
      channelType: 'CUSTOM' as const,
      displayOrder: 0,
      isActive: true,
    }));
  }, [dynamicChannels, districtPaymentInfo]);

  const selectedChannel = effectiveChannels.find((channel) => channel.id === selectedChannelId) || null;

  const effectiveDelegate = React.useMemo(() => {
    if (!dynamicDelegate) return null;
    if (!dynamicDelegate.phone && !dynamicDelegate.whatsapp) return null;
    return {
      id: dynamicDelegate.id,
      countryId: dynamicDelegate.countryId,
      governorateId: dynamicDelegate.governorateId,
      governorateName: dynamicDelegate.governorateName,
      districtId: dynamicDelegate.districtId,
      districtName: dynamicDelegate.districtName,
      name: dynamicDelegate.name,
      phone: dynamicDelegate.phone,
      whatsapp: dynamicDelegate.whatsapp || dynamicDelegate.phone,
      areaBadge: dynamicDelegate.districtName || dynamicDelegate.governorateName || undefined,
      hint: dynamicDelegate.notes || t('delegateHint'),
      notes: dynamicDelegate.notes,
      displayOrder: dynamicDelegate.displayOrder,
      isActive: dynamicDelegate.isActive,
    };
  }, [dynamicDelegate, t]);

  // Receipts History (Last 5)
  const [receiptsHistory, setReceiptsHistory] = React.useState<CaptainReceiptItem[]>([]);
  const [isLoadingReceipts, setIsLoadingReceipts] = React.useState<boolean>(false);
  const [isReceiptsOpen, setIsReceiptsOpen] = React.useState<boolean>(false);
  const [isBalanceOpen, setIsBalanceOpen] = React.useState<boolean>(false);

  const captainId = user?.uid || (user as any)?.id || '';

  const fetchReceipts = React.useCallback(async (showLoading = true) => {
    if (!captainId) return;
    if (showLoading) setIsLoadingReceipts(true);
    try {
      const res = await fetch(`/api/captain/receipts?captainId=${encodeURIComponent(captainId)}`);
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && Array.isArray(data.receipts)) {
        setReceiptsHistory(data.receipts);
      }
    } catch (err) {
      console.warn('[DriverWalletTab] Failed to fetch receipts history:', err);
    } finally {
      if (showLoading) setIsLoadingReceipts(false);
    }
  }, [captainId]);

  React.useEffect(() => {
    if (!captainId) return;
    void fetchReceipts(true);

    const handleRefresh = () => {
      void fetchReceipts(false);
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        void fetchReceipts(false);
      }
    };

    window.addEventListener('radar-wallet-refresh', handleRefresh);
    window.addEventListener('focus', handleRefresh);
    document.addEventListener('visibilitychange', handleVisibility);

    const channel = supabase
      .channel(`captain-receipts-history-${captainId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallet_transactions',
          filter: `profile_id=eq.${captainId}`,
        },
        () => {
          void fetchReceipts(false);
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          void fetchReceipts(false);
        }
      });

    return () => {
      window.removeEventListener('radar-wallet-refresh', handleRefresh);
      window.removeEventListener('focus', handleRefresh);
      document.removeEventListener('visibilitychange', handleVisibility);
      void channel.unsubscribe();
    };
  }, [fetchReceipts, captainId]);

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

  const radarHourPrice = wallet.radarHourPrice || 1;
  const totalMinutes = wallet.totalUsableMinutes;
  const bonusMinutes = wallet.bonusMinutesRemaining || 0;
  const currencySymbol = user?.currencyAr || user?.currencyEn || '';

  return (
    <div className="w-full space-y-6 pb-12 text-white min-w-0">
      {/* 1. Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">{t('title')}</h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-400">{t('subtitle')}</p>
      </div>

      {/* Driver Referral Card per client specification */}
      <DriverReferralCard user={user} isArabic={language === 'ar'} onOpenHistory={onOpenHistory} />

      {/* 2. Unified Hero Balance Card (Collapsible Dropdown) */}
      <div
        className={cn(
          "relative overflow-hidden rounded-3xl border border-emerald-500/25 bg-gradient-to-br from-slate-900/95 via-[#071324] to-[#040812] shadow-2xl backdrop-blur-xl transition-all duration-300",
          isBalanceOpen ? "p-5 sm:p-7 space-y-6" : "p-4 sm:p-5"
        )}
      >
        <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-cyan-500/15 blur-3xl" />

        {/* Clickable Header Dropdown Toggle */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsBalanceOpen((prev) => !prev)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsBalanceOpen((prev) => !prev);
            }
          }}
          className={cn(
            "group relative z-10 flex w-full items-center justify-between cursor-pointer select-none transition-colors",
            isBalanceOpen ? "border-b border-white/10 pb-4" : ""
          )}
          aria-expanded={isBalanceOpen}
          aria-label={t('balance')}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-emerald-400/30 bg-emerald-500/10 text-emerald-400 transition-transform duration-300 group-hover:scale-105 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
              <Wallet className="h-5 w-5" />
            </div>
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <h2 className="text-sm sm:text-base font-black text-white group-hover:text-emerald-300 transition-colors">
                {t('balance')}
              </h2>

              <div className="flex flex-wrap items-center gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-500/15 px-2.5 py-0.5 text-xs font-mono font-bold text-amber-300">
                  {walletIsReady ? `${wallet.balanceJD.toFixed(2)} ${currencySymbol}` : '...'}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-cyan-400/30 bg-cyan-500/15 px-2.5 py-0.5 text-xs font-mono font-bold text-[#14F5D5]">
                  <Clock className="h-3 w-3" />
                  <span>{walletIsReady ? t('durationFormat', toHoursMinutes(totalMinutes)) : '...'}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {radarHourPrice > 0 ? (
              <span className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-950/60 px-3 py-1 text-xs font-mono font-bold text-cyan-300">
                <Zap className="h-3.5 w-3.5 text-cyan-400" />
                <span>
                  {t('hourlyRateCard')}: {radarHourPrice.toFixed(2)} {currencySymbol}/ساعة
                </span>
              </span>
            ) : null}

            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition-all duration-300 group-hover:border-emerald-400/50 group-hover:bg-emerald-950/30 group-hover:text-emerald-300",
                isBalanceOpen ? "rotate-180 border-emerald-500/40 bg-emerald-950/50 text-emerald-300" : ""
              )}
            >
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Dropdown Content */}
        {isBalanceOpen && (
          <div className="relative z-10 space-y-6 animate-in fade-in slide-in-from-top-2 duration-200">
            {radarHourPrice > 0 && (
              <div className="flex md:hidden items-center justify-end">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-950/60 px-3 py-1 text-xs font-mono font-bold text-cyan-300">
                  <Zap className="h-3.5 w-3.5 text-cyan-400" />
                  <span>
                    {t('hourlyRateCard')}: {radarHourPrice.toFixed(2)} {currencySymbol}/ساعة
                  </span>
                  <span className="text-cyan-400/70 text-[11px]">
                    ({(radarHourPrice / 60).toFixed(3)}/د)
                  </span>
                </span>
              </div>
            )}

            {/* Main Balance & Radar Time Grid */}
            <div className="grid gap-6 sm:grid-cols-2 items-center">
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="font-mono text-4xl sm:text-5xl font-black text-amber-400 tracking-tight">
                    {walletIsReady ? wallet.balanceJD.toFixed(2) : wallet.walletLoaded ? '-' : '...'}
                  </span>
                  <span className="text-xl font-bold text-slate-300">{currencySymbol}</span>
                </div>
                <p className="text-xs text-slate-400">
                  {language === 'ar' ? 'الرصيد النقدي الفعلي في محفظتك' : 'Current wallet cash balance'}
                </p>
              </div>

              <div className="sm:border-r sm:border-white/10 sm:pr-6 space-y-1">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-2.5 text-cyan-300 shadow-[0_0_15px_rgba(20,245,213,0.15)]">
                    <Clock className="h-6 w-6 text-[#14F5D5]" />
                  </div>
                  <div>
                    <div className="font-mono text-2xl sm:text-3xl font-black text-[#14F5D5]">
                      {walletIsReady ? t('durationFormat', toHoursMinutes(totalMinutes)) : '...'}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-400 font-mono">
                        ({totalMinutes} {language === 'ar' ? 'دقيقة رادار' : 'radar mins'})
                      </span>
                      {bonusMinutes > 0 ? (
                        <span className="rounded-md border border-emerald-400/40 bg-emerald-500/15 px-2 py-0.5 text-[11px] font-bold text-emerald-300">
                          +{bonusMinutes} {language === 'ar' ? 'مكافأة' : 'bonus'}
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-2xl border border-cyan-500/20 bg-cyan-950/30 px-4 py-2.5 text-xs text-cyan-200/90 leading-relaxed">
              <Info className="h-4 w-4 shrink-0 text-cyan-400" />
              <span>{t('rateLinkingNote')}</span>
            </div>

            {walletIsMissing || walletHasError ? (
              <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-xs text-amber-100">
                <p className="font-bold">{walletIsMissing ? t('walletMissingTitle') : t('walletErrorTitle')}</p>
                <p className="mt-1 text-amber-200/80">{walletIsMissing ? t('walletMissingBody') : t('walletErrorBody')}</p>
              </div>
            ) : null}

            <CaptainAdsSeatsManager user={user} language={language} />
          </div>
        )}
      </div>

      {/* 3. Digital Recharge Section */}
      <CaptainWalletTopup
        channels={effectiveChannels}
        selectedChannel={selectedChannel}
        selectedChannelId={selectedChannelId}
        setSelectedChannelId={setSelectedChannelId}
        copiedChannelId={copiedChannelId}
        copyChannelNumber={copyChannelNumber}
        amount={amount}
        setAmount={setAmount}
        receiptFile={receiptFile}
        setReceiptFile={setReceiptFile}
        submitReceipt={submitReceipt}
        loading={wallet.loading}
        language={language}
        t={t}
      />

      {/* 4. Last 5 Receipts History Section */}
      <CaptainReceiptsHistory
        receiptsHistory={receiptsHistory}
        isLoadingReceipts={isLoadingReceipts}
        isReceiptsOpen={isReceiptsOpen}
        setIsReceiptsOpen={setIsReceiptsOpen}
        onRefresh={() => void fetchReceipts(true)}
        language={language}
        t={t}
      />

      {/* 5. Financial Delegate Card (Only visible if a real delegate exists) */}
      {effectiveDelegate && (
        <FinancialDelegateCard delegate={effectiveDelegate} t={t} />
      )}
    </div>
  );
}
