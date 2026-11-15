import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  FinancialReceiptRecord,
  formatReceiptDate,
  styles,
} from './history-financial-receipts-types';

interface HistoryFinancialReceiptItemProps {
  receipt: FinancialReceiptRecord;
  isArabic: boolean;
  onPreview: (receipt: FinancialReceiptRecord) => void;
}

export function HistoryFinancialReceiptItem({
  receipt,
  isArabic,
  onPreview,
}: HistoryFinancialReceiptItemProps) {
  const isPending = receipt.status === 'PENDING';
  const isCompleted = receipt.status === 'COMPLETED';
  const isRejected = receipt.status === 'REJECTED';

  return (
    <div
      className={cn(
        styles.itemCard,
        isPending && 'border-amber-500/25 bg-amber-950/10',
        isCompleted && 'border-emerald-500/25 bg-emerald-950/10',
        isRejected && 'border-rose-500/25 bg-rose-950/10',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/5 pb-2.5">
        <div className="flex items-center gap-2">
          {isCompleted && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 text-xs font-bold text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{isArabic ? 'مقبول ومضاف للرصيد' : 'Completed'}</span>
            </span>
          )}
          {isPending && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/10 px-2.5 py-0.5 text-xs font-bold text-amber-300 animate-pulse">
              <Clock className="h-3.5 w-3.5" />
              <span>{isArabic ? 'قيد المراجعة والتدقيق' : 'Pending'}</span>
            </span>
          )}
          {isRejected && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-rose-500/40 bg-rose-500/10 px-2.5 py-0.5 text-xs font-bold text-rose-300">
              <XCircle className="h-3.5 w-3.5" />
              <span>{isArabic ? 'مرفوض' : 'Rejected'}</span>
            </span>
          )}

          <span className="text-xs text-slate-300 font-bold">{receipt.channel}</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
          <Clock className="h-3 w-3 text-slate-500" />
          <span>{formatReceiptDate(receipt.createdAt, isArabic)}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-lg font-black text-white font-mono">
              {Number(receipt.amount).toFixed(2)}
            </span>
            <span className="text-xs text-emerald-400 font-bold">
              {receipt.currencyAr || receipt.currencyCode || ''}
            </span>
          </div>

          {isCompleted && (receipt.minutesCredited || receipt.amountCredited) && (
            <p className="text-[11px] text-emerald-300/90 mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" />
              <span>
                {receipt.creditType === 'MINUTES'
                  ? isArabic
                    ? `تمت إضافة ${receipt.minutesCredited} دقيقة تشغيل`
                    : `${receipt.minutesCredited} operational minutes added`
                  : isArabic
                    ? `تمت إضافة ${receipt.amountCredited} إلى الرصيد`
                    : `${receipt.amountCredited} added to balance`}
              </span>
            </p>
          )}

          {isRejected && receipt.rejectReason && (
            <p className="text-[11px] text-rose-300 mt-0.5 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              <span>{receipt.rejectReason}</span>
            </p>
          )}
        </div>

        {receipt.signedImageUrl && (
          <button
            type="button"
            onClick={() => onPreview(receipt)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs font-bold text-slate-200 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <Eye className="h-3.5 w-3.5 text-emerald-400" />
            <span>{isArabic ? 'معاينة الإيصال' : 'View receipt'}</span>
          </button>
        )}
      </div>
    </div>
  );
}

