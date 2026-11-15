'use client';

import React from 'react';
import { AlertTriangle, Loader2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import type { PaymentTransferChannel } from '@/features/admin/types/wallet-directory';
import type { TransferChannelsCopy } from './transfer-channels-copy';
import { cn } from '@/lib/utils';

export interface TransferChannelDeleteDialogProps {
  deleteTarget: PaymentTransferChannel | null;
  onOpenChange: (open: boolean) => void;
  isDeleting: boolean;
  onDelete: () => void;
  t: TransferChannelsCopy;
  isArabic: boolean;
}

export function TransferChannelDeleteDialog({
  deleteTarget,
  onOpenChange,
  isDeleting,
  onDelete,
  t,
  isArabic,
}: TransferChannelDeleteDialogProps) {
  return (
    <Dialog open={Boolean(deleteTarget)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm bg-[#0B0F19] border border-rose-500/30 text-white p-6 rounded-3xl" dir={isArabic ? "rtl" : "ltr"}>
        <DialogHeader className={isArabic ? "text-right" : "text-left"}>
          <DialogTitle className="text-base font-black text-rose-400 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{t.confirmDeleteTitle}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-slate-300 leading-relaxed mt-2">
            {t.confirmDeleteDesc(deleteTarget?.nameAr || '', deleteTarget?.accountNumber || '')}
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="gap-2 sm:justify-start pt-4">
          <Button
            type="button"
            disabled={isDeleting}
            onClick={onDelete}
            className="bg-rose-600 hover:bg-rose-500 text-white font-black text-xs h-10 px-5 rounded-xl flex items-center gap-1.5"
          >
            {isDeleting ? <Loader2 className={cn("w-4 h-4 animate-spin", isArabic ? "ml-1" : "mr-1")} /> : <Trash2 className={cn("w-4 h-4", isArabic ? "ml-1" : "mr-1")} />}
            <span>{t.confirmDeleteBtn}</span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            disabled={isDeleting}
            onClick={() => onOpenChange(false)}
            className="text-slate-400 hover:text-white text-xs h-10 rounded-xl"
          >
            {t.back}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
