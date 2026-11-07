'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { CaptainAdItem } from '@/features/captain/contract';
import { captainTripAdsStyles as styles } from './captain-trip-ads-styles';

interface CaptainTripAdsLightboxProps {
  ad: CaptainAdItem | null;
  isArabic: boolean;
  onClose: () => void;
  onImageError: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

export function CaptainTripAdsLightbox({
  ad,
  isArabic,
  onClose,
  onImageError,
}: CaptainTripAdsLightboxProps) {
  const t = useTranslations('captainAds');

  if (!ad || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={styles.lightboxOverlay}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      <div className={styles.lightboxContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.lightboxHeader}>
          <span className={styles.lightboxTitle}>
            <Sparkles className={styles.lightboxTitleIcon} />
            <span>{t('promotionalAd')}</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className={styles.lightboxCloseBtn}
            title={t('close')}
            aria-label="Close"
          >
            <X className={styles.lightboxCloseIcon} />
          </button>
        </div>

        <div className={styles.lightboxBody}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={ad.imageUrl}
            alt={ad.caption || 'Enlarged Ad'}
            className={styles.lightboxImage}
            onError={onImageError}
          />
        </div>

        {ad.caption ? (
          <div className={styles.lightboxFooter}>
            <p className="text-xs sm:text-sm font-semibold text-slate-100 leading-relaxed whitespace-pre-wrap select-text">
              {ad.caption}
            </p>
          </div>
        ) : null}
      </div>
    </div>,
    document.body
  );
}
