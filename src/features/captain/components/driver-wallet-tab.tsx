'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import {
  Check,
  Clock,
  Copy,
  Info,
  Loader2,
  MessageCircle,
  Phone,
  ReceiptText,
  Sparkles,
  Upload,
  UserCheck,
  Wallet,
  Zap,
} from 'lucide-react';
import type { User } from '@/core/types';
import { useSovereignWallet } from '@/hooks/use-sovereign-wallet';
import { cn } from '@/lib/utils';
import {
  CAPTAIN_PAYMENT_CHANNELS,
  getCaptainDistrictPaymentInfo,
} from '../lib/wallet-static-config';

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

  const districtPaymentInfo = getCaptainDistrictPaymentInfo(user?.district);
  const selectedChannel = CAPTAIN_PAYMENT_CHANNELS.find((channel) => channel.id === selectedChannelId) || null;

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
    }
  };

  const radarHourPrice = wallet.radarHourPrice || 1;
  const cashEquivalentMinutes = wallet.cashEquivalentMinutes || 0;
  const totalMinutes = wallet.totalUsableMinutes;
  const bonusMinutes = wallet.bonusMinutesRemaining || 0;
  const currencySymbol = user?.currencyAr || user?.currencyEn || '';

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-12 text-white">
      {/* 1. Header & Live Radar Status */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-300">
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
            <span>{t('badge')}</span>
          </div>
          <h1 className="mt-2 text-2xl sm:text-3xl font-black text-white">{t('title')}</h1>
          <p className="mt-1 text-xs sm:text-sm text-slate-400">{t('subtitle')}</p>
        </div>

        <div className="flex items-center gap-3">
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold transition",
              isFlightActive
                ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/40"
                : "bg-slate-800/80 text-slate-400 ring-1 ring-white/10"
            )}
          >
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                isFlightActive ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
              )}
            />
            {isFlightActive ? t('flightActiveOn') : t('flightActiveOff')}
          </span>
        </div>
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
            {CAPTAIN_PAYMENT_CHANNELS.map((channelOption) => {
              const channelNumber = districtPaymentInfo.channelNumbers[channelOption.id] || '';
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
                    {language === 'ar' ? channelOption.descriptionAr : channelOption.descriptionEn}
                  </p>

                  <div className="mt-2.5 flex items-center justify-between gap-2 rounded-xl border border-white/5 bg-black/60 px-2.5 py-1.5">
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

      {/* 4. Compact & Sleek Financial Delegate Card */}
      <div className="rounded-3xl border border-slate-800/80 bg-gradient-to-r from-[#070c18] via-slate-900/70 to-[#070c18] p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-2.5 text-emerald-400 shrink-0">
              <UserCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-black text-white">{t('delegateTitle')}</h3>
                <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">
                  {user?.district || t('noDistrict')}
                </span>
              </div>
              <p className="mt-0.5 text-xs text-slate-400">
                <span className="text-slate-200 font-bold">{districtPaymentInfo.delegateName}</span> · {t('delegateHint')}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href={`tel:${districtPaymentInfo.delegatePhone}`}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-bold text-slate-200 transition hover:bg-white/10 active:scale-95"
            >
              <Phone className="h-3.5 w-3.5 text-emerald-400" />
              <span>{t('delegateCall')}</span>
            </a>
            <a
              href={`https://wa.me/${districtPaymentInfo.delegatePhone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 text-xs font-black text-white shadow-md shadow-emerald-900/30 transition hover:brightness-105 active:scale-95"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              <span>{t('delegateWhatsapp')}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
