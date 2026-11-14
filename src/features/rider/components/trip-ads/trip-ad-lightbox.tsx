import React from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, X } from 'lucide-react';
import type { CaptainAdItem } from '@/features/captain/contract';
import { styles } from './trip-ads-styles';

interface TripAdLightboxProps {
  lightboxAd: CaptainAdItem | null;
  mounted: boolean;
  isArabic: boolean;
  t: (key: string) => string;
  onClose: () => void;
  onImageError: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

export function TripAdLightbox({
  lightboxAd,
  mounted,
  isArabic,
  t,
  onClose,
  onImageError,
}: TripAdLightboxProps) {
  if (!mounted || !lightboxAd) return null;

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
            src={lightboxAd.imageUrl}
            alt={lightboxAd.caption || 'Enlarged Ad'}
            className={styles.lightboxImage}
            onError={onImageError}
          />
        </div>

        {lightboxAd.caption ? (
          <div className={styles.lightboxFooter}>
            <p className="text-xs sm:text-sm font-semibold text-slate-100 leading-relaxed whitespace-pre-wrap select-text">
              {lightboxAd.caption}
            </p>
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  );
}
