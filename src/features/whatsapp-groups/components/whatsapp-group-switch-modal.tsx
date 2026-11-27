'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeftRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const styles = {
  content: 'border border-[#14B8A6]/30 bg-[#0B0F19] text-slate-100 rounded-3xl p-6 max-w-md shadow-2xl',
  header: 'text-start space-y-2',
  iconWrap: 'flex h-12 w-12 items-center justify-center rounded-2xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 text-[#14B8A6] mb-1',
  icon: 'h-6 w-6',
  title: 'text-base font-black text-white flex items-center gap-2',
  description: 'text-xs text-slate-300 leading-relaxed pt-1',
  comparisonBox: 'mt-3 space-y-2 rounded-2xl border border-white/10 bg-[#161F30]/80 p-3.5',
  groupRow: 'flex items-center justify-between gap-2 text-xs',
  groupLabel: 'font-semibold text-slate-400',
  currentName: 'font-black text-slate-100',
  targetName: 'font-black text-[#14F5D5]',
  noteBox: 'mt-3 flex items-start gap-2 rounded-xl border border-[#14B8A6]/20 bg-[#14B8A6]/5 p-3 text-[11px] font-medium leading-relaxed text-slate-300',
  noteIcon: 'h-4 w-4 shrink-0 text-[#14B8A6] mt-0.5',
  footer: 'mt-4 flex flex-col gap-2 sm:flex-col',
  confirmButton: 'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#14B8A6] px-4 py-3 text-xs font-black text-[#0B0F19] transition hover:bg-[#2DD4BF] disabled:opacity-50 cursor-pointer',
  keepButton: 'inline-flex w-full items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-xs font-bold text-slate-200 transition hover:bg-white/10 disabled:opacity-50 cursor-pointer',
  btnIcon: 'h-4 w-4',
} as const;

export interface WhatsAppGroupSwitchModalProps {
  open: boolean;
  currentGroupName: string;
  targetGroupName: string;
  isConfirming: boolean;
  isArabic: boolean;
  onConfirm: (confirm: boolean) => void;
}

export function WhatsAppGroupSwitchModal({
  open,
  currentGroupName,
  targetGroupName,
  isConfirming,
  isArabic,
  onConfirm,
}: WhatsAppGroupSwitchModalProps) {
  const t = useTranslations('whatsappGroupFlow');

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen && !isConfirming) {
        onConfirm(false);
      }
    },
    [isConfirming, onConfirm],
  );

  const handleConfirmSwitch = useCallback(() => {
    onConfirm(true);
  }, [onConfirm]);

  const handleKeepCurrent = useCallback(() => {
    onConfirm(false);
  }, [onConfirm]);

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent dir={isArabic ? 'rtl' : 'ltr'} className={styles.content}>
        <AlertDialogHeader className={styles.header}>
          <div className={styles.iconWrap}>
            <ArrowLeftRight className={styles.icon} aria-hidden="true" />
          </div>
          <AlertDialogTitle className={styles.title}>{t('switchTitle')}</AlertDialogTitle>
          <AlertDialogDescription className={styles.description}>
            {t('switchDescription')}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className={styles.comparisonBox}>
          <div className={styles.groupRow}>
            <span className={styles.groupLabel}>{t('currentGroupLabel')}</span>
            <span className={styles.currentName}>{currentGroupName}</span>
          </div>
          <div className={styles.groupRow}>
            <span className={styles.groupLabel}>{t('newGroupLabel')}</span>
            <span className={styles.targetName}>{targetGroupName}</span>
          </div>
        </div>

        <div className={styles.noteBox}>
          <ShieldCheck className={styles.noteIcon} aria-hidden="true" />
          <span>{t('noMinutesTransferNote')}</span>
        </div>

        <AlertDialogFooter className={styles.footer}>
          <button
            type="button"
            disabled={isConfirming}
            onClick={handleConfirmSwitch}
            className={styles.confirmButton}
          >
            <CheckCircle2 className={styles.btnIcon} aria-hidden="true" />
            <span>{isConfirming ? t('switchingProgress') : t('confirmSwitchButton')}</span>
          </button>
          <button
            type="button"
            disabled={isConfirming}
            onClick={handleKeepCurrent}
            className={styles.keepButton}
          >
            {t('keepCurrentButton')}
          </button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
