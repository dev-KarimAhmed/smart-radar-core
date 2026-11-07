'use client';

import React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { styles } from './tariff-modal-styles';

interface SilverRankWarningModalProps {
  isOpen: boolean;
  direction: string;
  isArabic: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function SilverRankWarningModal({
  isOpen,
  direction,
  isArabic,
  onCancel,
  onConfirm,
}: SilverRankWarningModalProps) {
  if (!isOpen) return null;

  return (
    <AlertDialog open>
      <AlertDialogContent className={styles.silverModalContent} dir={direction}>
        <AlertDialogHeader>
          <AlertDialogTitle className={styles.silverModalTitle}>
            {isArabic ? 'تنبيه كباتن الرتبة الفضية (Silver)' : 'Silver Rank Captain Alert'}
          </AlertDialogTitle>
          <AlertDialogDescription className={styles.silverModalDescription}>
            {isArabic
              ? 'إن تحديد أسعار أعلى من متوسط سعر السوق قد يقلل من فرص قبول عروضك من قِبل الركاب. ننصح بالبقاء عند متوسط السوق أو أقل لزيادة قبول العروض ورفع رتبتك إلى الذهبية.'
              : 'Setting prices above market average might reduce passenger acceptance for Silver captains. Staying at or below market average increases requests and boosts your rank.'}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className={styles.silverModalFooter}>
          <AlertDialogCancel onClick={onCancel} className={styles.silverModalCancel}>
            {isArabic ? 'تعديل السعر' : 'Adjust Price'}
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} className={styles.silverModalConfirm}>
            {isArabic ? 'متابعة والحفظ على أي حال' : 'Continue & Save Anyway'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
