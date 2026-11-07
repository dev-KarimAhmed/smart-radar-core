'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { styles } from './captain-ads-styles';
import type { CaptainAdItem } from '../../services/captain-ads-service';

interface CaptainAdDeleteModalProps {
  adToDelete: CaptainAdItem | null;
  isArabic: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export function CaptainAdDeleteModal({
  adToDelete,
  isArabic,
  onCancel,
  onConfirm,
}: CaptainAdDeleteModalProps) {
  const t = useTranslations('captainAds');

  if (!adToDelete || typeof document === 'undefined') return null;

  return createPortal(
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className={styles.deleteConfirmModalBox}>
        <div className={styles.deleteConfirmBox}>
          <Trash2 className={styles.trashIconLarge} />
          <h4 className={styles.deleteConfirmTitle}>
            {t('deleteConfirmTitle')}
          </h4>
          <p className={styles.deleteConfirmDesc}>
            {t('deleteConfirmDesc')}
          </p>
          <div className={styles.deleteConfirmActions}>
            <button
              type="button"
              onClick={onConfirm}
              className={styles.deleteConfirmBtn}
            >
              {t('deleteConfirmYes')}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className={styles.deleteCancelBtn}
            >
              {t('deleteConfirmNo')}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
