'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { AlertOctagon } from 'lucide-react';

const styles = {
  content: "max-w-[420px] border border-red-500/25 bg-[#0B0F19] text-white shadow-2xl",
  headerRtl: "text-right",
  headerLtr: "text-left",
  title: "flex items-center gap-2 text-xl font-black text-red-500",
  description: "text-sm leading-6 text-slate-300 mt-2",
  actions: "mt-4 flex gap-3",
  actionsRtl: "flex-row-reverse",
  actionsLtr: "flex-row",
  retryButton: "flex-1 rounded-xl bg-red-600 py-3 font-black text-white hover:bg-red-500",
  cancelButton: "flex-1 rounded-xl border border-white/10 bg-white/5 py-3 font-black text-white hover:bg-white/10",
} as const;

export interface CaptainCancelledDialogProps {
  isArabic: boolean;
  open: boolean;
  onRetry: () => void;
  onCancel: () => void;
}

export function CaptainCancelledDialog({ isArabic, open, onRetry, onCancel }: CaptainCancelledDialogProps) {
  const t = useTranslations('riderView');

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent 
        className={styles.content} 
        dir={isArabic ? 'rtl' : 'ltr'}
        onInteractOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader className={cn(isArabic ? styles.headerRtl : styles.headerLtr)}>
          <DialogTitle className={styles.title}>
            <AlertOctagon className="h-6 w-6" />
            {t('request.cancelledByCaptainTitle')}
          </DialogTitle>
          <DialogDescription className={styles.description}>
            {isArabic 
              ? "قام الكابتن بإلغاء الرحلة. هل تود البحث عن كباتن آخرين لنفس الوجهة؟" 
              : "The captain has cancelled the ride. Would you like to search for other captains for the same destination?"}
          </DialogDescription>
        </DialogHeader>
        <div className={cn(styles.actions, isArabic ? styles.actionsRtl : styles.actionsLtr)}>
          <Button
            type="button"
            onClick={onRetry}
            className={styles.retryButton}
          >
            {isArabic ? 'نعم، ابحث مجدداً' : 'Yes, search again'}
          </Button>
          <Button
            type="button"
            onClick={onCancel}
            className={styles.cancelButton}
          >
            {isArabic ? 'إلغاء' : 'Cancel'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
