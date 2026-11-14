'use client';

import React from 'react';
import { ReceiptText, ExternalLink } from 'lucide-react';
import type { AdminNotificationItem } from '../../../types/admin-notification-types';

interface AdminReceiptPreviewProps {
  reviewItem: AdminNotificationItem;
  t: (key: string, values?: any) => string;
}

export function AdminReceiptPreview({ reviewItem, t }: AdminReceiptPreviewProps) {
  const { payload } = reviewItem;

  return (
    <>
      {/* Receipt Image Preview */}
      <div className="relative rounded-2xl overflow-hidden border border-white/10 bg-black/80 flex items-center justify-center min-h-52 max-h-72">
        {payload.receiptImageUrl ? (
          <img
            src={payload.receiptImageUrl}
            alt={t('tabReceipts')}
            className="max-h-72 w-full object-contain cursor-pointer hover:opacity-95 transition"
            onClick={() => {
              if (typeof window !== 'undefined' && payload.receiptImageUrl) {
                window.open(payload.receiptImageUrl, '_blank');
              }
            }}
          />
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-slate-500 text-xs gap-1">
            <ReceiptText className="w-8 h-8 text-slate-600" />
            <span>{t('noImage')}</span>
          </div>
        )}

        {payload.receiptImageUrl && (
          <a
            href={payload.receiptImageUrl}
            target="_blank"
            rel="noreferrer"
            className="absolute top-2.5 left-2.5 bg-black/70 hover:bg-black text-white text-[10px] font-bold px-2 py-1 rounded-lg border border-white/20 flex items-center gap-1 backdrop-blur-md"
          >
            <ExternalLink className="w-3 h-3" />
            <span>{t('fullSize')}</span>
          </a>
        )}
      </div>

      {/* Transaction & Captain Details Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 p-3 rounded-xl bg-black/50 border border-white/5 text-xs font-mono">
        <div>
          <span className="text-[10px] text-slate-400 block font-sans">{t('captainLabel')}</span>
          <span className="font-bold text-white block truncate">{payload.captainName}</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 block font-sans">{t('phoneLabel')}</span>
          <span className="font-bold text-slate-300 block" dir="ltr">{payload.captainPhone}</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 block font-sans">{t('channelLabel')}</span>
          <span className="font-bold text-emerald-400 block">{payload.channel}</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 block font-sans">{t('amountLabel')}</span>
          <span className="font-bold text-amber-300 block text-sm">
            {payload.amount} {payload.currency}
          </span>
        </div>
      </div>
    </>
  );
}
