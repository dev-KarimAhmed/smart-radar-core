'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const styles = {
  content: "max-w-[420px] border border-[#14B8A6]/25 bg-[#0B0F19] text-white shadow-2xl",
  headerRtl: "text-right",
  headerLtr: "text-left",
  title: "text-xl font-black text-white",
  description: "text-sm leading-6 text-slate-300",
  actions: "mt-2 flex gap-3",
  actionsRtl: "flex-row-reverse",
  actionsLtr: "flex-row",
  addButton: "flex-1 rounded-xl bg-[#14B8A6] py-3 font-black text-[#07111F] hover:bg-[#2DD4BF]",
  cancelButton: "rounded-xl border-white/15 bg-white/5 px-5 text-white hover:bg-white/10",
} as const;

export interface EmergencyContactDialogProps {
  isArabic: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddNumber: () => void;
}

export function EmergencyContactDialog({ isArabic, open, onOpenChange, onAddNumber }: EmergencyContactDialogProps) {
  const t = useTranslations('riderView');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={styles.content} dir={isArabic ? 'rtl' : 'ltr'}>
        <DialogHeader className={cn(isArabic ? styles.headerRtl : styles.headerLtr)}>
          <DialogTitle className={styles.title}>
            {t('emergency.dialogTitle')}
          </DialogTitle>
          <DialogDescription className={styles.description}>
            {t('emergency.dialogDescription')}
          </DialogDescription>
        </DialogHeader>
        <div className={cn(styles.actions, isArabic ? styles.actionsRtl : styles.actionsLtr)}>
          <Button
            type="button"
            onClick={onAddNumber}
            className={styles.addButton}
          >
            {t('emergency.addNumber')}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className={styles.cancelButton}
          >
            {t('emergency.cancel')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
