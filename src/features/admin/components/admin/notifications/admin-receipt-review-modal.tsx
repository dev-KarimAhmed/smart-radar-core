'use client';

import React from 'react';
import {
  ReceiptText,
  Loader2,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import type { AdminNotificationItem, NotificationsSummary } from '../../../types/admin-notification-types';
import { useAdminReceiptReview } from '../../../hooks/use-admin-receipt-review';
import { AdminReceiptPreview } from './admin-receipt-preview';

interface AdminReceiptReviewModalProps {
  reviewItem: AdminNotificationItem | null;
  onClose: () => void;
  isArabic: boolean;
  direction: 'rtl' | 'ltr';
  setNotifications: React.Dispatch<React.SetStateAction<AdminNotificationItem[]>>;
  setSummary: React.Dispatch<React.SetStateAction<NotificationsSummary>>;
  fetchNotifications: () => void;
  t: (key: string, values?: any) => string;
}

export function AdminReceiptReviewModal({
  reviewItem,
  onClose,
  isArabic,
  direction,
  setNotifications,
  setSummary,
  fetchNotifications,
  t,
}: AdminReceiptReviewModalProps) {
  const {
    creditType,
    setCreditType,
    minutesValue,
    setMinutesValue,
    adminNote,
    setAdminNote,
    processingAction,
    rejectMode,
    setRejectMode,
    rejectionReason,
    setRejectionReason,
    handleApprove,
    handleReject,
  } = useAdminReceiptReview({
    reviewItem,
    onClose,
    setNotifications,
    setSummary,
    fetchNotifications,
    t,
  });

  if (!reviewItem) return null;

  return (
    <Dialog open={Boolean(reviewItem)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-xl bg-[#0B0F19] border border-emerald-500/40 text-white shadow-2xl rounded-2xl p-5" dir={direction}>
        <DialogHeader className={cn('space-y-1.5 border-b border-white/10 pb-3', isArabic ? 'text-right' : 'text-left')}>
          <div className="flex items-center gap-2 text-emerald-400">
            <ReceiptText className="w-5 h-5 text-emerald-400" />
            <DialogTitle className="text-base sm:text-lg font-black text-white">
              {t('reviewModalTitle')}
            </DialogTitle>
          </div>
          <DialogDescription className="text-slate-400 text-xs">
            {t('reviewModalDesc')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <AdminReceiptPreview reviewItem={reviewItem} t={t} />

          {/* Toggle Modes: Approval vs Rejection */}
          {!rejectMode ? (
            <div className="space-y-3 pt-2">
              <Label className={cn('text-xs font-bold text-slate-300 block', isArabic ? 'text-right' : 'text-left')}>
                {t('creditMethodLabel')}
              </Label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setCreditType('MINUTES');
                    setMinutesValue(Math.round((reviewItem.payload.amount || 0) * 60));
                  }}
                  className={`p-2.5 rounded-xl border text-start transition-all ${
                    creditType === 'MINUTES'
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/50'
                      : 'border-white/10 bg-black/40 text-slate-400'
                  }`}
                >
                  <span className="text-xs font-bold block">{t('minutesOption')}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">{t('minutesOptionDesc', { currency: reviewItem.payload.currency || '' })}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setCreditType('CASH')}
                  className={`p-2.5 rounded-xl border text-start transition-all ${
                    creditType === 'CASH'
                      ? 'border-emerald-500 bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/50'
                      : 'border-white/10 bg-black/40 text-slate-400'
                  }`}
                >
                  <span className="text-xs font-bold block">{t('cashOption')}</span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">{t('cashOptionDesc', { amount: reviewItem.payload.amount || 0, currency: reviewItem.payload.currency || '' })}</span>
                </button>
              </div>

              {creditType === 'MINUTES' && (
                <div className={cn('space-y-1', isArabic ? 'text-right' : 'text-left')}>
                  <Label className="text-[11px] font-bold text-slate-400">{t('minutesCountLabel')}</Label>
                  <Input
                    type="number"
                    min="1"
                    value={minutesValue}
                    onChange={(e) => setMinutesValue(Number(e.target.value) || 0)}
                    className="bg-black/60 border-white/10 text-white font-mono text-xs h-9 rounded-xl text-start"
                  />
                </div>
              )}

              <div className={cn('space-y-1', isArabic ? 'text-right' : 'text-left')}>
                <Label className="text-[11px] font-bold text-slate-400">{t('adminNoteLabel')}</Label>
                <Input
                  type="text"
                  placeholder={t('adminNotePlaceholder')}
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                  className="bg-black/60 border-white/10 text-white text-xs h-9 rounded-xl text-start"
                />
              </div>
            </div>
          ) : (
            <div className={cn('space-y-2 pt-2', isArabic ? 'text-right' : 'text-left')}>
              <Label className="text-xs font-bold text-rose-400 block">{t('rejectionReasonLabel')}</Label>
              <Input
                type="text"
                placeholder={t('rejectionReasonPlaceholder')}
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="bg-black/60 border-rose-500/40 focus:border-rose-500 text-white text-xs h-10 rounded-xl text-start"
                autoFocus
              />
              <p className="text-[10px] text-slate-400">{t('rejectionNotice')}</p>
            </div>
          )}
        </div>

        <DialogFooter className="flex-row gap-2 sm:justify-start pt-3 border-t border-white/10">
          {!rejectMode ? (
            <>
              <Button
                type="button"
                disabled={processingAction}
                onClick={handleApprove}
                className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-black font-black text-xs sm:text-sm h-10 rounded-xl transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
              >
                {processingAction ? (
                  <>
                    <Loader2 className={cn('w-4 h-4 animate-spin', isArabic ? 'ml-2' : 'mr-2')} />
                    {t('approving')}
                  </>
                ) : (
                  <>
                    <CheckCircle2 className={cn('w-4 h-4', isArabic ? 'ml-1.5' : 'mr-1.5')} />
                    {t('approveButton')}
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={processingAction}
                onClick={() => setRejectMode(true)}
                className="border-rose-500/30 text-rose-400 hover:bg-rose-500/10 h-10 rounded-xl text-xs font-bold"
              >
                {t('rejectButton')}
              </Button>
            </>
          ) : (
            <>
              <Button
                type="button"
                disabled={processingAction || !rejectionReason.trim()}
                onClick={handleReject}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-black text-xs sm:text-sm h-10 rounded-xl transition-all"
              >
                {processingAction ? (
                  <>
                    <Loader2 className={cn('w-4 h-4 animate-spin', isArabic ? 'ml-2' : 'mr-2')} />
                    {t('rejecting')}
                  </>
                ) : (
                  <>
                    <XCircle className={cn('w-4 h-4', isArabic ? 'ml-1.5' : 'mr-1.5')} />
                    {t('confirmRejectButton')}
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                disabled={processingAction}
                onClick={() => setRejectMode(false)}
                className="border-white/10 text-slate-300 hover:bg-white/5 h-10 rounded-xl text-xs"
              >
                {t('backToApprove')}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
