'use client';

import React from 'react';
import {
  ChevronDown,
  Clock,
  History,
  Loader2,
  ReceiptText,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CaptainReceiptItem } from '../../types/driver-wallet-types';
import { DriverWalletReceiptCard } from './driver-wallet-receipt-card';

interface DriverWalletReceiptsListProps {
  language: 'ar' | 'en';
  receiptsHistory: CaptainReceiptItem[];
  isLoadingReceipts: boolean;
  isReceiptsOpen: boolean;
  setIsReceiptsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  fetchReceipts: (showLoading?: boolean) => void;
  onPreviewReceipt: (receipt: CaptainReceiptItem) => void;
  t: (key: string, values?: any) => string;
}

export function DriverWalletReceiptsList({
  language,
  receiptsHistory,
  isLoadingReceipts,
  isReceiptsOpen,
  setIsReceiptsOpen,
  fetchReceipts,
  onPreviewReceipt,
  t,
}: DriverWalletReceiptsListProps) {
  return (
    <div
      className={cn(
        'overflow-hidden rounded-3xl border border-slate-800 bg-[#070c18] shadow-xl transition-all duration-300',
        isReceiptsOpen ? 'p-5 sm:p-7 space-y-4' : 'p-4 sm:p-5'
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
          'group flex w-full items-center justify-between cursor-pointer select-none transition-colors',
          isReceiptsOpen ? 'border-b border-slate-800/80 pb-4' : ''
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
            <RefreshCw className={cn('h-3.5 w-3.5', isLoadingReceipts && 'animate-spin text-cyan-400')} />
            <span className="hidden sm:inline">{t('refreshHistory')}</span>
          </button>

          <div
            className={cn(
              'flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition-all duration-300 group-hover:border-cyan-400/50 group-hover:bg-cyan-950/30 group-hover:text-cyan-300',
              isReceiptsOpen ? 'rotate-180 border-cyan-500/40 bg-cyan-950/50 text-cyan-300' : ''
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
              {receiptsHistory.map((receipt) => (
                <DriverWalletReceiptCard
                  key={receipt.id}
                  receipt={receipt}
                  language={language}
                  onPreviewReceipt={onPreviewReceipt}
                  t={t}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
