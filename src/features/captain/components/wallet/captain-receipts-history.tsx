'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Eye,
  History,
  Info,
  Loader2,
  ReceiptText,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatReceiptDate, type CaptainReceiptItem } from './wallet-types';
import { ReceiptLightboxModal } from './receipt-lightbox-modal';

interface CaptainReceiptsHistoryProps {
  receiptsHistory: CaptainReceiptItem[];
  isLoadingReceipts: boolean;
  isReceiptsOpen: boolean;
  setIsReceiptsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  onRefresh: () => void;
  language: 'ar' | 'en';
  t: (key: string, values?: any) => string;
}

export function CaptainReceiptsHistory({
  receiptsHistory,
  isLoadingReceipts,
  isReceiptsOpen,
  setIsReceiptsOpen,
  onRefresh,
  language,
  t,
}: CaptainReceiptsHistoryProps) {
  const [previewReceipt, setPreviewReceipt] = useState<CaptainReceiptItem | null>(null);

  return (
    <>
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
                {!isReceiptsOpen && receiptsHistory.some((r) => r.status === 'PENDING') && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/15 px-2 py-0.5 text-[10px] font-bold text-amber-300 animate-pulse">
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
                onRefresh();
              }}
              disabled={isLoadingReceipts}
              className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
              title={t('refreshHistory')}
            >
              <RefreshCw className={cn("h-3.5 w-3.5", isLoadingReceipts && "animate-spin text-cyan-400")} />
              <span className="hidden sm:inline">{t('refreshHistory')}</span>
            </button>

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

      <ReceiptLightboxModal
        previewReceipt={previewReceipt}
        onClose={() => setPreviewReceipt(null)}
        language={language}
        t={t}
      />
    </>
  );
}
