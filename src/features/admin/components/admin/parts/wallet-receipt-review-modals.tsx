'use client';

import React from 'react';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { ReceiptItem } from '@/features/admin/types/admin-wallet';

interface WalletReceiptReviewModalsProps {
  receiptToApprove: ReceiptItem | null;
  onCloseApprove: () => void;
  approveCreditType: 'CASH' | 'MINUTES';
  setApproveCreditType: (type: 'CASH' | 'MINUTES') => void;
  approveCustomMinutes: number;
  setApproveCustomMinutes: (min: number) => void;
  approveAdminNote: string;
  setApproveAdminNote: (note: string) => void;
  onConfirmApprove: () => void;
  receiptToReject: ReceiptItem | null;
  onCloseReject: () => void;
  rejectReason: string;
  setRejectReason: (reason: string) => void;
  onConfirmReject: () => void;
  submittingAction: boolean;
  isArabic: boolean;
  direction: 'rtl' | 'ltr';
  t: (key: string, values?: Record<string, any>) => string;
}

export function WalletReceiptReviewModals({
  receiptToApprove,
  onCloseApprove,
  approveCreditType,
  setApproveCreditType,
  approveCustomMinutes,
  setApproveCustomMinutes,
  approveAdminNote,
  setApproveAdminNote,
  onConfirmApprove,
  receiptToReject,
  onCloseReject,
  rejectReason,
  setRejectReason,
  onConfirmReject,
  submittingAction,
  isArabic,
  direction,
  t,
}: WalletReceiptReviewModalsProps) {
  return (
    <>
      {/* MODAL: Approve Receipt */}
      <Dialog open={!!receiptToApprove} onOpenChange={(open) => !open && onCloseApprove()}>
        <DialogContent className={cn("max-w-md bg-[#0B0F19] border border-teal-500/30 text-white rounded-3xl p-6", isArabic ? "text-right" : "text-left")} dir={direction}>
          {receiptToApprove && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-teal-400" />
                  {t('approveModalTitle')}
                </DialogTitle>
                <DialogDescription className="text-slate-400 text-xs mt-1">
                  {t('approveModalDesc', { name: receiptToApprove.captainName, amount: receiptToApprove.amount.toFixed(2), currency: receiptToApprove.currency })}
                </DialogDescription>
              </DialogHeader>

              {/* Credit Type Selector */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-300 block">{t('creditMethodLabel')}</Label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setApproveCreditType('CASH')}
                    className={cn(
                      "p-3 rounded-2xl border transition cursor-pointer flex flex-col justify-between",
                      isArabic ? "text-right" : "text-left",
                      approveCreditType === 'CASH'
                        ? "border-amber-500 bg-amber-500/15 text-white"
                        : "border-white/10 bg-black/40 text-slate-400 hover:text-white"
                    )}
                  >
                    <span className="font-bold text-xs text-amber-300">{t('cashOptionTitle', { currency: receiptToApprove.currency })}</span>
                    <span className="text-[10px] text-slate-400 mt-1">{t('cashOptionSub', { amount: receiptToApprove.amount, currency: receiptToApprove.currency })}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setApproveCreditType('MINUTES')}
                    className={cn(
                      "p-3 rounded-2xl border transition cursor-pointer flex flex-col justify-between",
                      isArabic ? "text-right" : "text-left",
                      approveCreditType === 'MINUTES'
                        ? "border-teal-500 bg-teal-500/15 text-white"
                        : "border-white/10 bg-black/40 text-slate-400 hover:text-white"
                    )}
                  >
                    <span className="font-bold text-xs text-teal-300">{t('minutesOptionTitle')}</span>
                    <span className="text-[10px] text-slate-400 mt-1">{t('minutesOptionSub')}</span>
                  </button>
                </div>
              </div>

              {approveCreditType === 'MINUTES' && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-bold text-slate-300">{t('minutesCountLabel')}</Label>
                  <Input
                    type="number"
                    min="1"
                    value={approveCustomMinutes}
                    onChange={(e) => setApproveCustomMinutes(Number(e.target.value))}
                    className={cn("bg-black/60 border-white/10 text-white font-mono text-sm h-10 rounded-xl", isArabic ? "text-right" : "text-left")}
                  />
                  <span className="text-[10px] text-slate-400">
                    {t('minutesHoursEquiv', { hours: (approveCustomMinutes / 60).toFixed(1) })}
                  </span>
                </div>
              )}

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">{t('confirmNoteLabel')}</Label>
                <Input
                  value={approveAdminNote}
                  onChange={(e) => setApproveAdminNote(e.target.value)}
                  placeholder={t('adminNotePlaceholder2')}
                  className={cn("bg-black/60 border-white/10 text-white text-xs h-10 rounded-xl", isArabic ? "text-right" : "text-left")}
                />
              </div>

              <DialogFooter className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCloseApprove}
                  disabled={submittingAction}
                  className="border-white/10 text-slate-300 text-xs h-10 rounded-xl"
                >
                  {t('cancel')}
                </Button>

                <Button
                  type="button"
                  onClick={onConfirmApprove}
                  disabled={submittingAction}
                  className="bg-teal-500 hover:bg-teal-600 text-[#0B0F19] font-black text-xs sm:text-sm h-10 px-5 rounded-xl transition-all"
                >
                  {submittingAction ? (
                    <>
                      <Loader2 className={cn("w-4 h-4 animate-spin", isArabic ? "ml-2" : "mr-2")} />
                      {t('approving')}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className={cn("w-4 h-4", isArabic ? "ml-1.5" : "mr-1.5")} />
                      {t('confirmApproveBtn')}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* MODAL: Reject Receipt */}
      <Dialog open={!!receiptToReject} onOpenChange={(open) => !open && onCloseReject()}>
        <DialogContent className={cn("max-w-md bg-[#0B0F19] border border-rose-500/30 text-white rounded-3xl p-6", isArabic ? "text-right" : "text-left")} dir={direction}>
          {receiptToReject && (
            <div className="space-y-4">
              <DialogHeader>
                <DialogTitle className="text-lg font-black text-white flex items-center gap-2">
                  <XCircle className="w-5 h-5 text-rose-400" />
                  {t('rejectModalTitle')}
                </DialogTitle>
                <DialogDescription className="text-slate-400 text-xs mt-1">
                  {t('rejectModalDesc', { name: receiptToReject.captainName, amount: receiptToReject.amount.toFixed(2), currency: receiptToReject.currency })}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-300">{t('rejectReasonLabel')}</Label>
                <Input
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder={t('rejectReasonDefault')}
                  className={cn("bg-black/60 border-white/10 text-white text-xs h-10 rounded-xl", isArabic ? "text-right" : "text-left")}
                  required
                />
              </div>

              <DialogFooter className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCloseReject}
                  disabled={submittingAction}
                  className="border-white/10 text-slate-300 text-xs h-10 rounded-xl"
                >
                  {t('back')}
                </Button>

                <Button
                  type="button"
                  onClick={onConfirmReject}
                  disabled={submittingAction}
                  className="bg-rose-600 hover:bg-rose-700 text-white font-black text-xs sm:text-sm h-10 px-5 rounded-xl transition-all"
                >
                  {submittingAction ? (
                    <>
                      <Loader2 className={cn("w-4 h-4 animate-spin", isArabic ? "ml-2" : "mr-2")} />
                      {t('rejecting')}
                    </>
                  ) : (
                    <>
                      <XCircle className={cn("w-4 h-4", isArabic ? "ml-1.5" : "mr-1.5")} />
                      {t('confirmRejectBtn')}
                    </>
                  )}
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

