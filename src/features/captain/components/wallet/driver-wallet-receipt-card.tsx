'use client';

import React from 'react';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  Info,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  formatReceiptDate,
  type CaptainReceiptItem,
} from '../../types/driver-wallet-types';

interface DriverWalletReceiptCardProps {
  receipt: CaptainReceiptItem;
  language: 'ar' | 'en';
  onPreviewReceipt: (receipt: CaptainReceiptItem) => void;
  t: (key: string, values?: any) => string;
}

export function DriverWalletReceiptCard({
  receipt,
  language,
  onPreviewReceipt,
  t,
}: DriverWalletReceiptCardProps) {
  const isPending = receipt.status === 'PENDING';
  const isCompleted = receipt.status === 'COMPLETED';
  const isRejected = receipt.status === 'REJECTED';

  return (
    <div
      className={cn(
        'group relative overflow-hidden rounded-2xl border p-4 transition-all duration-200',
        isPending && 'border-amber-500/30 bg-gradient-to-r from-[#17120a] via-[#0d121c] to-[#070c18]',
        isCompleted && 'border-emerald-500/30 bg-gradient-to-r from-[#071913] via-[#08151b] to-[#070c18]',
        isRejected && 'border-rose-500/30 bg-gradient-to-r from-[#1c0c11] via-[#120a10] to-[#070c18]'
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="rounded-lg bg-black/50 px-2.5 py-1 text-xs font-black text-slate-200 border border-white/5">
            {receipt.channel}
          </span>
          <span className="text-[11px] font-mono text-slate-400">
            {formatReceiptDate(receipt.createdAt, language)}
          </span>
        </div>

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

      <div className="mt-3 flex items-center justify-between">
        <div>
          <span className="text-xs text-slate-400 block">{t('amount')}</span>
          <div className="flex items-baseline gap-1.5">
            <span
              className={cn(
                'font-mono text-2xl font-black tracking-tight',
                isPending && 'text-amber-400',
                isCompleted && 'text-emerald-400',
                isRejected && 'text-rose-400'
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
            onClick={() => onPreviewReceipt(receipt)}
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
}
