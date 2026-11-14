import React from 'react';
import { X } from 'lucide-react';
import { FinancialReceiptRecord } from './history-financial-receipts-types';

interface HistoryFinancialReceiptModalProps {
  previewReceipt: FinancialReceiptRecord | null;
  onClose: () => void;
  isArabic: boolean;
}

export function HistoryFinancialReceiptModal({
  previewReceipt,
  onClose,
  isArabic,
}: HistoryFinancialReceiptModalProps) {
  if (!previewReceipt) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      <div
        className="fixed inset-0 bg-transparent cursor-pointer"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-emerald-500/40 bg-[#0E1527] p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <h3 className="text-sm font-bold text-white">
            {isArabic ? 'معاينة إيصال الشحن المرفق' : 'Receipt preview'}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-3 overflow-hidden rounded-2xl border border-white/10 bg-black/40 flex items-center justify-center max-h-[70vh]">
          {previewReceipt.signedImageUrl && (
            <img
              src={previewReceipt.signedImageUrl}
              alt={isArabic ? 'صورة الإيصال' : 'Receipt image'}
              className="max-h-[65vh] w-auto object-contain"
            />
          )}
        </div>
      </div>
    </div>
  );
}

