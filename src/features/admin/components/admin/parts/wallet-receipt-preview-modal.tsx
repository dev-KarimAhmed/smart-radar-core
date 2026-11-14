'use client';

import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ReceiptItem } from '@/features/admin/types/admin-wallet';

interface WalletReceiptPreviewModalProps {
  receipt: ReceiptItem | null;
  onClose: () => void;
  onApproveTrigger: (rcpt: ReceiptItem) => void;
  onRejectTrigger: (rcpt: ReceiptItem) => void;
  isArabic: boolean;
  direction: 'rtl' | 'ltr';
  t: (key: string, values?: Record<string, any>) => string;
}

export function WalletReceiptPreviewModal({
  receipt,
  onClose,
  onApproveTrigger,
  onRejectTrigger,
  isArabic,
  direction,
  t,
}: WalletReceiptPreviewModalProps) {
  return (
    <Dialog open={!!receipt} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={cn("max-w-2xl bg-[#0B0F19] border border-white/10 text-white rounded-3xl p-6", isArabic ? "text-right" : "text-left")} dir={direction}>
        {receipt && (
          <div className="space-y-4">
            <DialogHeader>
              <DialogTitle className="text-lg font-black text-white flex items-center justify-between">
                <span>{t('previewModalTitle', { name: receipt.captainName })}</span>
                <span className="font-mono text-amber-400 font-bold">
                  {receipt.amount.toFixed(2)} {receipt.currency}
                </span>
              </DialogTitle>
              <DialogDescription className="text-slate-400 text-xs">
                {receipt.channel} • {new Date(receipt.createdAt).toLocaleString(isArabic ? 'ar-JO' : 'en-US')}
              </DialogDescription>
            </DialogHeader>

            <div className="overflow-hidden rounded-2xl border border-white/10 bg-black flex items-center justify-center max-h-[60vh]">
              {receipt.receiptImageUrl ? (
                <img
                  src={receipt.receiptImageUrl}
                  alt="Receipt Full Preview"
                  className="max-h-[60vh] w-auto object-contain"
                />
              ) : (
                <div className="p-12 text-slate-500">{t('noImageAvailable')}</div>
              )}
            </div>

            <DialogFooter className="flex items-center justify-between gap-3 border-t border-white/10 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="border-white/10 text-slate-300 text-xs h-9 rounded-xl"
              >
                {t('close')}
              </Button>

              {receipt.status === 'PENDING' && (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={() => {
                      const target = receipt;
                      onClose();
                      onApproveTrigger(target);
                    }}
                    className="bg-teal-500 hover:bg-teal-600 text-[#0B0F19] text-xs font-black h-9 rounded-xl"
                  >
                    <CheckCircle2 className={cn("w-3.5 h-3.5", isArabic ? "ml-1" : "mr-1")} />
                    {t('approveReceipt')}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      const target = receipt;
                      onClose();
                      onRejectTrigger(target);
                    }}
                    className="border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold h-9 rounded-xl"
                  >
                    <XCircle className={cn("w-3.5 h-3.5", isArabic ? "ml-1" : "mr-1")} />
                    {t('rejectReceipt')}
                  </Button>
                </div>
              )}
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
