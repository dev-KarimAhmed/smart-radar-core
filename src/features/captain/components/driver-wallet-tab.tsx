'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  ExternalLink,
  Eye,
  History,
  Info,
  Loader2,
  MessageCircle,
  Phone,
  ReceiptText,
  RefreshCw,
  Upload,
  UserCheck,
  Wallet,
  X,
  XCircle,
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
import type { PaymentTransferChannel, FinancialDelegate } from '@/features/admin/types/wallet-directory';

export interface CaptainReceiptItem {
  id: string;
  amount: number;
  currencyAr: string;
  currencyCode: string;
  channel: string;
  status: 'PENDING' | 'COMPLETED' | 'REJECTED';
  createdAt: string;
  receiptPath: string | null;
  signedImageUrl: string | null;
  descriptionAr?: string;
  rejectReason?: string | null;
  adminNote?: string | null;
  creditType?: 'MINUTES' | 'CASH' | null;
  minutesCredited?: number | null;
  amountCredited?: number | null;
}

function formatReceiptDate(isoString: string, language: 'ar' | 'en') {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

interface DriverWalletTabProps {
  user: User | null;
  language: 'ar' | 'en';
  isFlightActive?: boolean;
}

function toHoursMinutes(totalMinutes: number) {
  const safeMinutes = Math.max(0, Math.floor(Number(totalMinutes) || 0));
  return { hours: Math.floor(safeMinutes / 60), minutes: safeMinutes % 60 };
}

export function DriverWalletTab({ user, language, isFlightActive = false }: DriverWalletTabProps) {
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
        labelAr: c.nameAr,
        labelEn: c.nameEn,
        descriptionAr: c.descriptionAr || '',
        descriptionEn: c.descriptionEn || '',
        accountNumber: c.accountNumber,
        accountHolder: c.accountHolder,
      }));
    }
    return CAPTAIN_PAYMENT_CHANNELS.map((channel) => ({
      id: channel.id,
      labelAr: channel.labelAr,
      labelEn: channel.labelEn,
      descriptionAr: channel.descriptionAr,
      descriptionEn: channel.descriptionEn,
      accountNumber: districtPaymentInfo.channelNumbers[channel.id] || '',
      accountHolder: undefined,
    }));
  }, [dynamicChannels, districtPaymentInfo]);

  const selectedChannel = effectiveChannels.find((channel) => channel.id === selectedChannelId) || null;

  // Unified Effective Delegate: Only present if a real delegate is assigned to the captain's governorate or district
  const effectiveDelegate = React.useMemo(() => {
    if (!dynamicDelegate) {
      return null;
    }
    // Safety check: must have contact number
    if (!dynamicDelegate.phone && !dynamicDelegate.whatsapp) {
      return null;
    }
    return {
      name: dynamicDelegate.name,
      phone: dynamicDelegate.phone,
      whatsapp: dynamicDelegate.whatsapp || dynamicDelegate.phone,
      areaBadge: dynamicDelegate.districtName || dynamicDelegate.governorateName || undefined,
      hint: dynamicDelegate.notes || t('delegateHint'),
    };
  }, [dynamicDelegate, t]);

  // Receipts History (Last 5)
  const [receiptsHistory, setReceiptsHistory] = React.useState<CaptainReceiptItem[]>([]);
  const [isLoadingReceipts, setIsLoadingReceipts] = React.useState<boolean>(false);
  const [previewReceipt, setPreviewReceipt] = React.useState<CaptainReceiptItem | null>(null);
  const [isReceiptsOpen, setIsReceiptsOpen] = React.useState<boolean>(false);

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
  const cashEquivalentMinutes = wallet.cashEquivalentMinutes || 0;
  const totalMinutes = wallet.totalUsableMinutes;
  const bonusMinutes = wallet.bonusMinutesRemaining || 0;
  const currencySymbol = user?.currencyAr || user?.currencyEn || '';

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12 text-white">
      {/* 1. Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-white">{t('title')}</h1>
        <p className="mt-1 text-xs sm:text-sm text-slate-400">{t('subtitle')}</p>
      </div>

      {/* 2. Unified Hero Balance Card */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-500/25 bg-gradient-to-br from-slate-900/95 via-[#071324] to-[#040812] p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
        <div className="pointer-events-none absolute -left-20 -top-20 h-56 w-56 rounded-full bg-emerald-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-cyan-500/15 blur-3xl" />

        <div className="relative space-y-6">
          {/* Card Top Row: Label & Hourly Rate Pill */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
              <Wallet className="h-4 w-4 text-emerald-400" />
              <span>{t('balance')}</span>
            </div>

            {radarHourPrice > 0 ? (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-950/60 px-3 py-1 text-xs font-mono font-bold text-cyan-300">
                <Zap className="h-3.5 w-3.5 text-cyan-400" />
                <span>
                  {t('hourlyRateCard')}: {radarHourPrice.toFixed(2)} {currencySymbol}/ساعة
                </span>
                <span className="text-cyan-400/70 text-[11px]">
                  ({(radarHourPrice / 60).toFixed(3)}/د)
                </span>
              </span>
            ) : null}
          </div>

          {/* Main Balance & Radar Time Grid */}
          <div className="grid gap-6 sm:grid-cols-2 items-center">
            {/* Cash Balance Display */}
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

            {/* Equivalent Radar Time Display */}
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

          {/* Reassuring micro-explainer */}
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
        </div>
      </div>

      {/* 3. Digital Recharge Section */}
      <div className="space-y-6 rounded-3xl border border-slate-800 bg-[#070c18] p-5 sm:p-7 shadow-xl">
        {/* Step 1: Channels */}
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-white">{t('selectPaymentChannel')}</h2>
            <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full">
              {t('refillTitle')}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-400">{t('refillHint')}</p>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {effectiveChannels.map((channelOption) => {
              const channelNumber = channelOption.accountNumber || '';
              const isSelected = selectedChannelId === channelOption.id;
              const isCopied = copiedChannelId === channelOption.id;

              return (
                <div
                  key={channelOption.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setSelectedChannelId(channelOption.id)}
                  onKeyDown={(event) => {
                    if (event.key !== 'Enter' && event.key !== ' ') return;
                    setSelectedChannelId(channelOption.id);
                  }}
                  className={cn(
                    "group relative rounded-2xl border p-3.5 text-right transition cursor-pointer",
                    isSelected
                      ? "border-emerald-400 bg-emerald-500/10 shadow-[0_0_15px_rgba(16,185,129,0.15)] ring-1 ring-emerald-400/30"
                      : "border-slate-800 bg-black/40 hover:border-slate-700 hover:bg-slate-900/50"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black text-sm text-white">
                      {language === 'ar' ? channelOption.labelAr : channelOption.labelEn}
                    </span>
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full",
                        isSelected ? "bg-emerald-400" : "bg-slate-700"
                      )}
                    />
                  </div>
                  <p className="mt-1 text-[11px] text-slate-400 line-clamp-1">
                    {language === 'ar' ? (channelOption.descriptionAr || '') : (channelOption.descriptionEn || channelOption.descriptionAr || '')}
                  </p>

                  {isSelected && channelNumber ? (
                    <div className="mt-2.5 flex items-center justify-between gap-2 rounded-xl border border-white/5 bg-black/60 px-2.5 py-1.5 animate-in fade-in duration-150">
                      <span className="truncate font-mono text-xs font-bold text-slate-200">
                        {channelNumber}
                      </span>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          copyChannelNumber(channelOption.id, channelNumber);
                        }}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-bold transition",
                          isCopied
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                        )}
                        aria-label={t('copy')}
                      >
                        {isCopied ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" />
                            <span>{t('copied')}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>{t('copy')}</span>
                          </>
                        )}
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
          {!selectedChannel ? (
            <p className="mt-2.5 text-xs font-semibold text-amber-300/80">
              ⚠️ {t('chooseChannelHint')}
            </p>
          ) : null}
        </div>

        {/* Step 2: Amount & Receipt Upload */}
        <div className="border-t border-slate-800 pt-5 space-y-4">
          <h2 className="text-base font-black text-white">{t('amountAndReceipt')}</h2>

          {/* Amount input & Selected Channel indicator */}
          <div className="grid gap-3 sm:grid-cols-2">
            <input
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              inputMode="decimal"
              placeholder={t('amount')}
              className="w-full rounded-2xl border border-slate-800 bg-black/50 px-4 py-3.5 text-sm font-bold text-white placeholder-slate-500 outline-none transition focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
            />

            <div className="flex items-center justify-between rounded-2xl border border-slate-800/80 bg-black/30 px-4 py-3.5 text-xs">
              <span className="text-slate-400">{t('selectedChannelLabel')}</span>
              <span className="font-bold text-[#14F5D5]">
                {selectedChannel
                  ? (language === 'ar' ? selectedChannel.labelAr : selectedChannel.labelEn)
                  : t('noChannelSelected')}
              </span>
            </div>
          </div>

          {/* Receipt File Upload */}
          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-700 bg-black/30 px-4 py-4 text-xs font-semibold text-slate-300 transition hover:border-emerald-400 hover:bg-slate-900/40">
            {receiptFile ? (
              <span className="inline-flex items-center gap-2 text-emerald-300">
                <Check className="h-4 w-4 text-emerald-400" />
                <span className="truncate max-w-xs">{receiptFile.name}</span>
                <span className="text-slate-400 text-[11px]">
                  ({(receiptFile.size / 1024).toFixed(0)} KB)
                </span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <Upload className="h-4 w-4 text-slate-400" />
                <span>{t('chooseImageHint')}</span>
              </span>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => setReceiptFile(event.target.files?.[0] || null)}
            />
          </label>

          {/* Submit Receipt Button */}
          <button
            onClick={submitReceipt}
            disabled={
              wallet.loading ||
              !receiptFile ||
              !selectedChannel ||
              !Number.isFinite(Number(amount)) ||
              Number(amount) <= 0
            }
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-[#14B8A6] px-5 py-4 text-sm font-black text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {wallet.loading ? (
              <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
            ) : (
              <ReceiptText className="h-4 w-4 text-slate-950" />
            )}
            <span>{t('sendReceipt')}</span>
          </button>
        </div>
      </div>

      {/* 3.5. Captain Promotional Ad Seats Manager */}
      <CaptainAdsSeatsManager user={user} language={language} />

      {/* 4. Last 5 Receipts History Section (Collapsible Dropdown Menu) */}
      <div
        className={cn(
          "overflow-hidden rounded-3xl border border-slate-800 bg-[#070c18] shadow-xl transition-all duration-300",
          isReceiptsOpen ? "p-5 sm:p-7 space-y-4" : "p-4 sm:p-5"
        )}
      >
        {/* Header (Clickable Dropdown Toggle) */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsReceiptsOpen((prev) => !prev)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsReceiptsOpen((prev) => !prev);
            }
          }}
          className={cn(
            "group flex w-full items-center justify-between cursor-pointer select-none transition-colors",
            isReceiptsOpen ? "border-b border-slate-800/80 pb-4" : ""
          )}
          aria-expanded={isReceiptsOpen}
          aria-label={t('receiptHistoryTitle')}
        >
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-cyan-400/30 bg-cyan-500/10 p-2.5 text-[#14F5D5] transition-transform duration-300 group-hover:scale-105">
              <History className="h-5 w-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-black text-white group-hover:text-cyan-300 transition-colors">
                  {t('receiptHistoryTitle')}
                </h2>
                <span className="rounded-full bg-cyan-950/80 border border-cyan-500/30 px-2 py-0.5 text-[10px] font-mono font-bold text-cyan-300">
                  {receiptsHistory.length}/5
                </span>
                {/* Pending indicator pill if collapsed */}
                {!isReceiptsOpen && receiptsHistory.some((r) => r.status === 'PENDING') && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-300 animate-pulse">
                    <Clock className="h-3 w-3" />
                    <span>{language === 'ar' ? 'إيصال قيد المراجعة' : 'Pending review'}</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400">{t('receiptHistorySubtitle')}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                void fetchReceipts(true);
              }}
              disabled={isLoadingReceipts}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
              title={t('refreshHistory')}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isLoadingReceipts && "animate-spin text-cyan-400")} />
              <span className="hidden sm:inline">{t('refreshHistory')}</span>
            </button>

            {/* Dropdown Chevron Toggle Icon */}
            <div
              className={cn(
                "flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition-all duration-300 group-hover:border-cyan-400/50 group-hover:bg-cyan-950/30 group-hover:text-cyan-300",
                isReceiptsOpen ? "rotate-180 border-cyan-500/40 bg-cyan-950/50 text-cyan-300" : ""
              )}
            >
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
        </div>

        {/* Dropdown Content */}
        {isReceiptsOpen && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
            {isLoadingReceipts && receiptsHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-500">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
                <span className="mt-3 text-xs font-bold text-slate-400">
                  {language === 'ar' ? 'جاري تحميل سجل الإيصالات...' : 'Loading receipts...'}
                </span>
              </div>
            ) : receiptsHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-800 py-10 text-center">
                <div className="rounded-full bg-slate-800/60 p-3 text-slate-500">
                  <ReceiptText className="h-6 w-6" />
                </div>
                <p className="mt-3 text-sm font-bold text-slate-300">{t('receiptHistoryEmpty')}</p>
                <p className="mt-1 max-w-sm text-xs text-slate-500">{t('receiptHistoryEmptyDesc')}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {receiptsHistory.map((receipt) => {
                  const isPending = receipt.status === 'PENDING';
                  const isCompleted = receipt.status === 'COMPLETED';
                  const isRejected = receipt.status === 'REJECTED';

                  return (
                    <div
                      key={receipt.id}
                      className={cn(
                        "group relative overflow-hidden rounded-2xl border p-4 transition-all duration-200",
                        isPending && "border-amber-500/30 bg-gradient-to-r from-[#17120a] via-[#0d121c] to-[#070c18]",
                        isCompleted && "border-emerald-500/30 bg-gradient-to-r from-[#071913] via-[#08151b] to-[#070c18]",
                        isRejected && "border-rose-500/30 bg-gradient-to-r from-[#1c0c11] via-[#120a10] to-[#070c18]"
                      )}
                    >
                      {/* Top Row: Channel & Status Badge */}
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="rounded-lg bg-black/50 px-2.5 py-1 text-xs font-black text-slate-200 border border-white/5">
                            {receipt.channel}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            {formatReceiptDate(receipt.createdAt, language)}
                          </span>
                        </div>

                        {/* Status Badge */}
                        {isPending && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/15 px-3 py-1 text-xs font-black text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.15)] animate-pulse">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{t('statusPending')}</span>
                          </span>
                        )}
                        {isCompleted && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-500/15 px-3 py-1 text-xs font-black text-emerald-300 shadow-[0_0_12px_rgba(16,185,129,0.15)]">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            <span>{t('statusCompleted')}</span>
                          </span>
                        )}
                        {isRejected && (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/40 bg-rose-500/15 px-3 py-1 text-xs font-black text-rose-300 shadow-[0_0_12px_rgba(244,63,94,0.15)]">
                            <XCircle className="h-3.5 w-3.5" />
                            <span>{t('statusRejected')}</span>
                          </span>
                        )}
                      </div>

                      {/* Middle Row: Amount & Actions */}
                      <div className="mt-3 flex items-center justify-between">
                        <div>
                          <span className="text-xs text-slate-400 block">{t('amount')}</span>
                          <div className="flex items-baseline gap-1.5">
                            <span
                              className={cn(
                                "font-mono text-2xl font-black tracking-tight",
                                isPending && "text-amber-400",
                                isCompleted && "text-emerald-400",
                                isRejected && "text-rose-400"
                              )}
                            >
                              {receipt.amount.toFixed(2)}
                            </span>
                            <span className="text-xs font-bold text-slate-300">
                              {receipt.currencyAr}
                            </span>
                          </div>
                        </div>

                        {/* Receipt Preview Trigger */}
                        {receipt.signedImageUrl ? (
                          <button
                            type="button"
                            onClick={() => setPreviewReceipt(receipt)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2 text-xs font-bold text-slate-200 transition active:scale-95 shadow-sm"
                          >
                            <Eye className="h-3.5 w-3.5 text-cyan-400" />
                            <span>{t('previewReceiptImage')}</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">
                            {language === 'ar' ? 'لا تتوفر صورة' : 'No image'}
                          </span>
                        )}
                      </div>

                      {/* Contextual Status Details Box */}
                      {isPending && (
                        <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/5 px-3 py-2 text-xs text-amber-200/90 flex items-center gap-2">
                          <Info className="h-3.5 w-3.5 shrink-0 text-amber-400" />
                          <span>{t('pendingHint')}</span>
                        </div>
                      )}

                      {isCompleted && (
                        <div className="mt-3 space-y-1.5">
                          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3 py-2 text-xs text-emerald-200/90 flex items-center gap-2">
                            <Check className="h-3.5 w-3.5 shrink-0 text-emerald-400" />
                            <span>
                              {receipt.creditType === 'MINUTES' && receipt.minutesCredited
                                ? t('completedCreditMinutes', { minutes: receipt.minutesCredited })
                                : t('completedCreditCash', {
                                    amount: receipt.amountCredited || receipt.amount,
                                    currency: receipt.currencyAr,
                                  })}
                            </span>
                          </div>
                          {receipt.adminNote && (
                            <p className="text-[11px] text-slate-400 pr-2">
                              <span className="font-bold text-slate-300">{t('adminNoteLabel')}</span> {receipt.adminNote}
                            </p>
                          )}
                        </div>
                      )}

                      {isRejected && (
                        <div className="mt-3 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2.5 text-xs text-rose-200 flex items-start gap-2">
                          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
                          <div>
                            <span className="font-bold text-rose-300">{t('rejectionReasonLabel')} </span>
                            <span>
                              {receipt.rejectReason ||
                                receipt.descriptionAr ||
                                (language === 'ar'
                                  ? 'الإيصال غير مطابق أو لم يتم تأكيد التحويل'
                                  : 'Receipt rejected by admin')}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 5. Compact & Sleek Financial Delegate Card (Only visible if a real delegate exists for captain's area) */}
      {effectiveDelegate && (
        <div className="rounded-3xl border border-slate-800/80 bg-gradient-to-r from-[#070c18] via-slate-900/70 to-[#070c18] p-4 sm:p-5 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-2.5 text-emerald-400 shrink-0">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-black text-white">{t('delegateTitle')}</h3>
                  {effectiveDelegate.areaBadge && (
                    <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                      {effectiveDelegate.areaBadge}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 text-xs text-slate-400">
                  <span className="text-slate-200 font-bold">{effectiveDelegate.name}</span>
                  {effectiveDelegate.hint ? ` · ${effectiveDelegate.hint}` : ''}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {effectiveDelegate.phone && (
                <a
                  href={`tel:${effectiveDelegate.phone}`}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-slate-200 transition hover:bg-white/10 active:scale-95"
                >
                  <Phone className="h-3.5 w-3.5 text-emerald-400" />
                  <span>{t('delegateCall')}</span>
                </a>
              )}
              {effectiveDelegate.whatsapp && (
                <a
                  href={`https://wa.me/${effectiveDelegate.whatsapp.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-emerald-900/30 transition hover:brightness-105 active:scale-95"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  <span>{t('delegateWhatsapp')}</span>
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. Receipt Image Lightbox Modal */}
      {previewReceipt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setPreviewReceipt(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative max-h-[90vh] w-full max-w-lg overflow-hidden rounded-3xl border border-slate-700 bg-slate-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 bg-[#070c18] px-5 py-3.5">
              <div className="flex items-center gap-2">
                <ReceiptText className="h-4 w-4 text-cyan-400" />
                <span className="text-sm font-black text-white">{t('previewReceiptImage')}</span>
                <span className="text-xs text-slate-400 font-mono">({previewReceipt.channel})</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewReceipt(null)}
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition"
                aria-label={t('closePreview')}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body / Image */}
            <div className="relative flex max-h-[65vh] items-center justify-center overflow-auto bg-black/90 p-4">
              {previewReceipt.signedImageUrl ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img
                  src={previewReceipt.signedImageUrl}
                  alt="Receipt Preview"
                  className="max-h-[60vh] w-auto rounded-xl object-contain shadow-lg"
                />
              ) : (
                <div className="py-12 text-center text-slate-400">
                  <p className="text-sm">{language === 'ar' ? 'الصورة غير متوفرة' : 'Image unavailable'}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-slate-800 bg-[#070c18] px-5 py-3.5 text-xs">
              <div className="font-mono font-bold text-slate-300">
                <span>{previewReceipt.amount.toFixed(2)} {previewReceipt.currencyAr}</span>
              </div>
              <div className="flex items-center gap-2">
                {previewReceipt.signedImageUrl && (
                  <a
                    href={previewReceipt.signedImageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs font-bold text-slate-200 transition"
                  >
                    <ExternalLink className="h-3.5 w-3.5 text-cyan-400" />
                    <span>{t('openOriginal')}</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setPreviewReceipt(null)}
                  className="rounded-xl bg-slate-800 hover:bg-slate-700 px-4 py-1.5 font-bold text-white transition"
                >
                  {t('closePreview')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
