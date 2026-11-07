'use client';

import React from 'react';
import {
  CheckCircle2,
  XCircle,
  Loader2,
  Search,
  Eye,
  MessageSquare,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { ReceiptItem } from '../wallet-types';

interface WalletReceiptsPanelProps {
  receipts: ReceiptItem[];
  filteredReceipts: ReceiptItem[];
  loadingData: boolean;
  receiptStatusFilter: 'ALL' | 'PENDING' | 'COMPLETED' | 'REJECTED';
  setReceiptStatusFilter: (st: 'ALL' | 'PENDING' | 'COMPLETED' | 'REJECTED') => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onPreviewReceipt: (r: ReceiptItem) => void;
  onOpenApproveModal: (r: ReceiptItem) => void;
  onOpenRejectModal: (r: ReceiptItem) => void;
  onOpenMessageModal: (r: ReceiptItem) => void;
  isArabic: boolean;
  t: (key: any, values?: any) => string;
}

export function WalletReceiptsPanel({
  filteredReceipts,
  loadingData,
  receiptStatusFilter,
  setReceiptStatusFilter,
  searchQuery,
  setSearchQuery,
  onPreviewReceipt,
  onOpenApproveModal,
  onOpenRejectModal,
  onOpenMessageModal,
  isArabic,
  t,
}: WalletReceiptsPanelProps) {
  return (
    <div className="space-y-4">
      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#0B0F19]/80 border border-white/5 p-3 rounded-2xl">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {(['PENDING', 'ALL', 'COMPLETED', 'REJECTED'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setReceiptStatusFilter(st)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-xs font-bold transition-all",
                receiptStatusFilter === st
                  ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                  : "bg-white/5 text-slate-400 hover:text-white border border-transparent"
              )}
            >
              {st === 'PENDING' && t('receiptFilterPending')}
              {st === 'ALL' && t('receiptFilterAll')}
              {st === 'COMPLETED' && t('receiptFilterApproved')}
              {st === 'REJECTED' && t('receiptFilterRejected')}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className={cn("absolute top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400", isArabic ? "right-3" : "left-3")} />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('searchReceiptsPlaceholder')}
            className={cn("bg-black/60 border-white/10 text-white text-xs h-9 rounded-xl", isArabic ? "pr-9 text-right" : "pl-9 text-left")}
          />
        </div>
      </div>

      {/* Receipts Table / Cards */}
      {loadingData ? (
        <div className="p-12 text-center bg-[#0B0F19]/60 rounded-3xl border border-white/5">
          <Loader2 className="w-8 h-8 animate-spin text-teal-400 mx-auto mb-3" />
          <p className="text-slate-400 text-xs">{t('loadingReceipts')}</p>
        </div>
      ) : filteredReceipts.length === 0 ? (
        <div className="p-12 text-center bg-[#0B0F19]/60 rounded-3xl border border-white/5 space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
          <h3 className="text-base font-bold text-white">{t('noReceiptsMatch')}</h3>
          <p className="text-xs text-slate-400">{t('noReceiptsMatchSub')}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-3xl border border-white/10 bg-[#0B0F19]/90 shadow-2xl backdrop-blur-xl">
          <table className={cn("w-full text-xs", isArabic ? "text-right" : "text-left")}>
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02] text-slate-400">
                <th className="py-3.5 px-4 font-bold">{t('colCaptain')}</th>
                <th className="py-3.5 px-4 font-bold">{t('colChannelAmount')}</th>
                <th className="py-3.5 px-4 font-bold">{t('colReceiptImage')}</th>
                <th className="py-3.5 px-4 font-bold">{t('colSentAt')}</th>
                <th className="py-3.5 px-4 font-bold">{t('colStatus')}</th>
                <th className="py-3.5 px-4 font-bold text-center">{t('colActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredReceipts.map((rcpt) => (
                <tr key={rcpt.id} className="hover:bg-white/[0.02] transition-colors">
                  {/* Captain */}
                  <td className="py-3.5 px-4">
                    <div className="space-y-0.5">
                      <p className="font-bold text-white text-sm">{rcpt.captainName}</p>
                      <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400">
                        <span dir="ltr">{rcpt.captainPhone}</span>
                        <span>•</span>
                        <span className="text-teal-400">{rcpt.captainSerial}</span>
                      </div>
                      <span className="text-[10px] text-slate-500">{rcpt.governorate} - {rcpt.district}</span>
                    </div>
                  </td>

                  {/* Amount & Channel */}
                  <td className="py-3.5 px-4">
                    <div className="space-y-1">
                      <span className="font-mono text-base font-black text-amber-400">
                        {rcpt.amount.toFixed(2)} {rcpt.currency}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Badge className="bg-white/5 border border-white/10 text-slate-300 text-[10px] font-normal">
                          {rcpt.channel}
                        </Badge>
                      </div>
                    </div>
                  </td>

                  {/* Receipt Image */}
                  <td className="py-3.5 px-4">
                    {rcpt.receiptImageUrl ? (
                      <button
                        type="button"
                        onClick={() => onPreviewReceipt(rcpt)}
                        className="group relative h-12 w-16 overflow-hidden rounded-xl border border-white/10 bg-black/40 hover:border-teal-500/50 transition-all cursor-pointer"
                      >
                        <img
                          src={rcpt.receiptImageUrl}
                          alt="Receipt"
                          className="h-full w-full object-cover group-hover:scale-110 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <Eye className="w-4 h-4 text-white" />
                        </div>
                      </button>
                    ) : (
                      <span className="text-slate-500 text-[11px]">{t('noAttachment')}</span>
                    )}
                  </td>

                  {/* Date */}
                  <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px]">
                    {new Date(rcpt.createdAt).toLocaleString(isArabic ? 'ar-JO' : 'en-US', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4">
                    {rcpt.status === 'PENDING' && (
                      <Badge className="bg-amber-500/15 text-amber-300 border border-amber-500/30 font-bold text-[10px]">
                        {t('pendingBadge')}
                      </Badge>
                    )}
                    {rcpt.status === 'COMPLETED' && (
                      <Badge className="bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-bold text-[10px]">
                        {t('approvedBadge')}
                      </Badge>
                    )}
                    {rcpt.status === 'REJECTED' && (
                      <Badge className="bg-rose-500/15 text-rose-300 border border-rose-500/30 font-bold text-[10px]">
                        {t('rejectedBadge')}
                      </Badge>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                      {rcpt.status === 'PENDING' ? (
                        <>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => onOpenApproveModal(rcpt)}
                            className="h-8 px-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-[#0B0F19] text-xs font-black flex items-center gap-1 shadow-sm active:scale-95 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>{t('btnApprove')}</span>
                          </Button>

                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => onOpenRejectModal(rcpt)}
                            className="h-8 px-2.5 rounded-xl border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold flex items-center gap-1 cursor-pointer"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>{t('btnReject')}</span>
                          </Button>
                        </>
                      ) : (
                        <span className="text-[11px] text-slate-500 font-mono ml-2">
                          {rcpt.metadata?.approved_by ? t('approvedBadge') : rcpt.metadata?.rejected_by ? t('rejectedBadge') : t('approvedBadge')}
                        </span>
                      )}

                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => onOpenMessageModal(rcpt)}
                        className="h-8 px-2.5 rounded-xl border-teal-500/30 bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 text-xs font-bold flex items-center gap-1 cursor-pointer"
                        title={t('btnMessageTooltip')}
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-teal-400" />
                        <span>{t('btnMessage')}</span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
