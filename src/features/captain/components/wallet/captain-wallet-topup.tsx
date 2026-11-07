'use client';

import React from 'react';
import {
  Check,
  Copy,
  Loader2,
  ReceiptText,
  Upload,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PaymentTransferChannel } from '@/features/admin/types/wallet-directory';

interface CaptainWalletTopupProps {
  channels: PaymentTransferChannel[];
  selectedChannel: PaymentTransferChannel | null;
  selectedChannelId: string | null;
  setSelectedChannelId: (id: string) => void;
  copiedChannelId: string | null;
  copyChannelNumber: (channelId: string, value: string) => void;
  amount: string;
  setAmount: (amount: string) => void;
  receiptFile: File | null;
  setReceiptFile: (file: File | null) => void;
  submitReceipt: () => Promise<void>;
  loading: boolean;
  language: 'ar' | 'en';
  t: (key: string) => string;
}

export function CaptainWalletTopup({
  channels,
  selectedChannel,
  selectedChannelId,
  setSelectedChannelId,
  copiedChannelId,
  copyChannelNumber,
  amount,
  setAmount,
  receiptFile,
  setReceiptFile,
  submitReceipt,
  loading,
  language,
  t,
}: CaptainWalletTopupProps) {
  return (
    <div id="captain-recharge-section" className="space-y-6 rounded-3xl border border-slate-800 bg-[#070c18] p-5 sm:p-7 shadow-xl">
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
          {channels.map((channelOption) => {
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
            loading ||
            !receiptFile ||
            !selectedChannel ||
            !Number.isFinite(Number(amount)) ||
            Number(amount) <= 0
          }
          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-[#14B8A6] px-5 py-4 text-sm font-black text-slate-950 shadow-lg shadow-emerald-500/20 transition hover:brightness-110 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin text-slate-950" />
          ) : (
            <ReceiptText className="h-4 w-4 text-slate-950" />
          )}
          <span>{t('sendReceipt')}</span>
        </button>
      </div>
    </div>
  );
}
