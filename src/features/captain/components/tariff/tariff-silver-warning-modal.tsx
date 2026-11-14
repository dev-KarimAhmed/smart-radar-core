'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';
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
import { tariffModalStyles as styles } from './tariff-modal-styles';

interface TariffSilverWarningModalProps {
  isOpen: boolean;
  direction: string;
  isSaving: boolean;
  onCancel: () => void;
  onConfirm: () => Promise<void>;
  t: (key: string, values?: any) => string;
}

export function TariffSilverWarningModal({
  isOpen,
  direction,
  isSaving,
  onCancel,
  onConfirm,
  t,
}: TariffSilverWarningModalProps) {
  if (!isOpen) return null;

  return (
    <AlertDialog open>
      <AlertDialogContent className={styles.silverModalContent} dir={direction}>
        <AlertDialogHeader>
          <AlertDialogTitle className={styles.silverModalTitle}>
            {t('tariffSilverModalTitle')}
          </AlertDialogTitle>
          <AlertDialogDescription className={styles.silverModalDescription}>
            {t('tariffSilverModalBody')}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className={styles.silverModalFooter}>
          <AlertDialogCancel onClick={onCancel} className={styles.silverModalCancel}>
            {t('tariffSilverModalCancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            disabled={isSaving}
            onClick={onConfirm}
            className={styles.silverModalConfirm}
          >
            {isSaving ? (
              <Loader2 className="h-5 w-5 animate-spin mx-auto text-white" />
            ) : (
              t('tariffSilverModalConfirm')
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
