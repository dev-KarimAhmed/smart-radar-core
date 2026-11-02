'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const styles = {
  content: "max-w-[480px] border border-red-500/30 bg-[#0B0F19] p-6 sm:p-7 text-white shadow-2xl rounded-2xl",
  headerRtl: "text-right",
  headerLtr: "text-left",
  titleWrap: "flex items-center gap-3",
  titleIcon: "h-6 w-6 text-red-500 shrink-0",
  titleText: "text-xl sm:text-2xl font-black text-white tracking-tight",
  consentBox: "mt-4 rounded-2xl border border-red-500/25 bg-red-950/30 p-5 text-sm sm:text-base font-bold leading-relaxed text-slate-100",
  actions: "mt-6 flex gap-3",
  actionsRtl: "flex-row-reverse",
  actionsLtr: "flex-row",
  cancelButton: "flex-1 rounded-xl border border-slate-700 bg-slate-800/90 py-3.5 text-sm sm:text-base font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition-all cursor-pointer",
  confirmButton: "flex-1 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 py-3.5 text-sm sm:text-base font-black text-white shadow-lg shadow-red-600/30 transition-all cursor-pointer",
} as const;

export interface EmergencyConsentDialogProps {
  isArabic: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
}

export function EmergencyConsentDialog({
  isArabic,
  open,
  onOpenChange,
  onConfirm,
}: EmergencyConsentDialogProps) {
  const t = useTranslations('riderView');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={styles.content} dir={isArabic ? 'rtl' : 'ltr'}>
        <DialogHeader className={cn(isArabic ? styles.headerRtl : styles.headerLtr)}>
          <DialogTitle asChild>
            <div className={styles.titleWrap}>
              <ShieldAlert className={styles.titleIcon} />
              <span className={styles.titleText}>{t('emergency.confirmTitle')}</span>
            </div>
          </DialogTitle>
          <DialogDescription asChild>
            <div className={styles.consentBox}>
              {t('emergency.consentText')}
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className={cn(styles.actions, isArabic ? styles.actionsRtl : styles.actionsLtr)}>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className={styles.cancelButton}
          >
            {t('emergency.cancelBtn')}
          </Button>

          <Button
            type="button"
            onClick={onConfirm}
            className={styles.confirmButton}
          >
            {t('emergency.confirmSendBtn')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
