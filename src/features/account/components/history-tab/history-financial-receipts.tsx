'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ReceiptText, RefreshCw, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { supabase } from '@/lib/supabase-client';
import { getSupabaseAuthHeaders } from '@/shared/services/supabase-auth-headers';
import {
  FinancialReceiptRecord,
  styles,
} from './receipts/history-financial-receipts-types';
import { HistoryFinancialReceiptItem } from './receipts/history-financial-receipt-item';
import { HistoryFinancialReceiptModal } from './receipts/history-financial-receipt-modal';

export type { FinancialReceiptRecord };

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
        () => void fetchReceipts(false),
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
                {receipts.map((receipt) => (
                  <HistoryFinancialReceiptItem
                    key={receipt.id}
                    receipt={receipt}
                    isArabic={isArabic}
                    onPreview={setPreviewReceipt}
                  />
                ))}
              </div>
            )}
          </CardContent>
        )}
      </Card>

      <HistoryFinancialReceiptModal
        previewReceipt={previewReceipt}
        onClose={() => setPreviewReceipt(null)}
        isArabic={isArabic}
      />
    </>
  );
}
