'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ReceiptText,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Eye,
  X,
  ExternalLink,
  ChevronDown,
  Wallet,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase-client';
import { getSupabaseAuthHeaders } from '@/shared/services/supabase-auth-headers';

export interface FinancialReceiptRecord {
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

function formatReceiptDate(isoString: string, isArabic = true) {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    return date.toLocaleString(isArabic ? 'ar-EG' : 'en-US', {
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

const styles = {
  card: 'relative overflow-hidden rounded-3xl border border-emerald-500/25 bg-[#0B0F19]/90 shadow-2xl backdrop-blur-xl w-full text-white',
  accentBar: 'absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent shadow-[0_0_12px_rgba(16,185,129,0.5)]',
  header: 'p-4 sm:p-5 pb-3.5 sm:pb-3',
  headerButton: 'w-full text-right cursor-pointer select-none transition-colors hover:bg-white/[0.02]',
  headerRow: 'flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3',
  headerInfo: 'flex items-center gap-3 min-w-0',
  iconBox: 'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.2)]',
  icon: 'h-5 w-5',
  title: 'text-base font-black text-white font-sans',
  descDesktop: 'hidden sm:block text-xs text-slate-400 mt-0.5 leading-relaxed font-sans',
  descMobile: 'sm:hidden text-xs text-slate-400 leading-relaxed font-sans truncate min-w-0 flex-1',
  actionsRow: 'flex items-center justify-between sm:justify-end gap-2.5 pt-2 sm:pt-0 border-t border-white/[0.05] sm:border-0 shrink-0',
  actionsGroup: 'flex items-center gap-2 shrink-0',
  countBadge: 'shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 sm:px-3 py-1 text-xs font-bold text-emerald-300 shadow-sm font-mono',
  chevronBox: 'flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 transition-all hover:bg-emerald-500/20 shrink-0',
  chevronIcon: 'h-4 w-4 transition-transform duration-200',
  chevronRotated: 'rotate-180',
  content: 'p-5 pt-2',
  emptyBox: 'rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-center flex flex-col items-center justify-center gap-2.5 my-2',
  emptyIcon: 'h-8 w-8 text-slate-500',
  emptyTitle: 'text-xs font-semibold text-slate-400',
  emptyDesc: 'text-[11px] text-slate-500 leading-normal max-w-sm',
  list: 'space-y-3 max-h-[480px] overflow-y-auto pr-1',
  itemCard: 'group relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.03] to-transparent p-4 transition-all hover:border-emerald-500/30 space-y-3',
} as const;

interface HistoryFinancialReceiptsProps {
  isArabic?: boolean;
}

export function HistoryFinancialReceipts({ isArabic = true }: HistoryFinancialReceiptsProps) {
  const { user } = useAuth();
  const [receipts, setReceipts] = useState<FinancialReceiptRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [previewReceipt, setPreviewReceipt] = useState<FinancialReceiptRecord | null>(null);

  const captainId = user?.uid || (user as any)?.id || '';

  const fetchReceipts = useCallback(async (showLoading = true) => {
    if (!captainId) return;
    if (showLoading) setIsLoading(true);
    try {
      const authHeaders = await getSupabaseAuthHeaders();
      const res = await fetch(`/api/captain/receipts?captainId=${encodeURIComponent(captainId)}`, {
        headers: authHeaders,
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && Array.isArray(data.receipts)) {
        setReceipts(data.receipts);
      }
    } catch (err) {
      console.warn('[HistoryFinancialReceipts] Failed to fetch receipts:', err);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [captainId]);

  useEffect(() => {
    if (!captainId) return;
    void fetchReceipts(true);

    const handleRefresh = () => void fetchReceipts(false);
    window.addEventListener('radar-wallet-refresh', handleRefresh);
    window.addEventListener('focus', handleRefresh);

    const channel = supabase
      .channel(`history-receipts-${captainId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'wallet_transactions',
          filter: `profile_id=eq.${captainId}`,
        },
        () => void fetchReceipts(false)
      )
      .subscribe();

    return () => {
      window.removeEventListener('radar-wallet-refresh', handleRefresh);
      window.removeEventListener('focus', handleRefresh);
      void channel.unsubscribe();
    };
  }, [captainId, fetchReceipts]);

  return (
    <>
      <Card className={styles.card} dir={isArabic ? 'rtl' : 'ltr'}>
        <div className={styles.accentBar} />
        <CardHeader className={styles.header}>
          <div
            role="button"
            tabIndex={0}
            onClick={() => setIsExpanded(!isExpanded)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsExpanded(!isExpanded);
              }
            }}
            className={styles.headerButton}
          >
            <div className={styles.headerRow}>
              {/* Top on Mobile: Icon + Full Title */}
              <div className={styles.headerInfo}>
                <div className={styles.iconBox}>
                  <ReceiptText className={styles.icon} />
                </div>
                <div className="min-w-0 flex-1">
                  <CardTitle className={styles.title}>
                    {isArabic ? 'سجل الإيصالات المالية' : 'Financial Receipts Log'}
                  </CardTitle>
                  <CardDescription className={styles.descDesktop}>
                    {isArabic
                      ? 'سجل عمليات شحن الرصيد الرقمي والمحلي وحالتها'
                      : 'Records of wallet recharges, invoices & statuses'}
                  </CardDescription>
                </div>
              </div>

              {/* Bottom on Mobile: Subtitle + Badge + Chevron */}
              <div className={styles.actionsRow}>
                <CardDescription className={styles.descMobile}>
                  {isArabic
                    ? 'شحن الرصيد الرقمي والمحلي وحالتها'
                    : 'Wallet recharges & invoice statuses'}
                </CardDescription>

                <div className={styles.actionsGroup}>
                  <span className={styles.countBadge}>
                    {receipts.length} {isArabic ? 'إيصال' : 'receipts'}
                  </span>

                  <div className={styles.chevronBox}>
                    <ChevronDown className={cn(styles.chevronIcon, isExpanded && styles.chevronRotated)} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardHeader>

        {isExpanded && (
          <CardContent className={styles.content}>
            {/* Toolbar inside expanded content */}
            <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-white/5">
              <span className="text-xs text-slate-400 font-sans font-medium">
                {isArabic ? `إجمالي الإيصالات: ${receipts.length}` : `Total invoices: ${receipts.length}`}
              </span>
              <button
                type="button"
                onClick={() => void fetchReceipts(true)}
                disabled={isLoading}
                className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-xs font-semibold text-emerald-300 transition-all cursor-pointer disabled:opacity-50"
                title={isArabic ? 'تحديث السجل' : 'Refresh'}
              >
                <RefreshCw className={cn('h-3.5 w-3.5', isLoading && 'animate-spin')} />
                <span>{isArabic ? 'تحديث' : 'Refresh'}</span>
              </button>
            </div>
            {isLoading && receipts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-slate-400 gap-2">
                <RefreshCw className="h-6 w-6 animate-spin text-emerald-400" />
                <span className="text-xs">{isArabic ? 'جاري جلب الإيصالات المالية...' : 'Loading receipts...'}</span>
              </div>
            ) : receipts.length === 0 ? (
              <div className={styles.emptyBox}>
                <ReceiptText className={styles.emptyIcon} />
                <p className={styles.emptyTitle}>
                  {isArabic ? 'لا توجد إيصالات مالية مسجلة حالياً' : 'No financial invoices found'}
                </p>
                <p className={styles.emptyDesc}>
                  {isArabic
                    ? 'يتم عرض آخر 5 إيصالات لعمليات شحن الرصيد والتحويل الرقمي هنا تلقائياً لمتابعة حالتها.'
                    : 'Your last 5 recharge operations and invoices will appear here automatically.'}
                </p>
              </div>
            ) : (
              <div className={styles.list}>
                {receipts.map((receipt) => {
                  const isPending = receipt.status === 'PENDING';
                  const isCompleted = receipt.status === 'COMPLETED';
                  const isRejected = receipt.status === 'REJECTED';

                  return (
                    <div
                      key={receipt.id}
                      className={cn(
                        styles.itemCard,
                        isPending && 'border-amber-500/25 bg-amber-950/10',
                        isCompleted && 'border-emerald-500/25 bg-emerald-950/10',
                        isRejected && 'border-rose-500/25 bg-rose-950/10'
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
                            onClick={() => setPreviewReceipt(receipt)}
                            className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-1.5 text-xs font-bold text-slate-200 transition-all cursor-pointer shadow-sm active:scale-95"
                          >
                            <Eye className="h-3.5 w-3.5 text-emerald-400" />
                            <span>{isArabic ? 'معاينة الإيصال' : 'View receipt'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Preview Dialog */}
      {previewReceipt && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          dir={isArabic ? 'rtl' : 'ltr'}
        >
          <div
            className="fixed inset-0 bg-transparent cursor-pointer"
            onClick={() => setPreviewReceipt(null)}
          />
          <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-emerald-500/40 bg-[#0E1527] p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-sm font-bold text-white">
                {isArabic ? 'معاينة إيصال الشحن المرفق' : 'Receipt preview'}
              </h3>
              <button
                type="button"
                onClick={() => setPreviewReceipt(null)}
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
      )}
    </>
  );
}

