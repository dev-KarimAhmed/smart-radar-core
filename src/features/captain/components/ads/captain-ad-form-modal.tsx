'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import { Sparkles, X, Upload, Eye, CheckCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { styles } from './captain-ads-styles';
import { CAPTAIN_ADS_CONFIG } from '../../config/captain-ads-config';
import type { CaptainAdItem } from '../../services/captain-ads-service';

interface CaptainAdFormModalProps {
  isOpen: boolean;
  editingAd: CaptainAdItem | null;
  imageUrl: string | null;
  caption: string;
  imageError: string | null;
  captionError: string | null;
  fileInputId: string;
  isArabic: boolean;
  onClose: () => void;
  onImageFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCaptionChange: (val: string) => void;
  onSaveAd: () => void;
  onImageError: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

export function CaptainAdFormModal({
  isOpen,
  editingAd,
  imageUrl,
  caption,
  imageError,
  captionError,
  fileInputId,
  isArabic,
  onClose,
  onImageFileChange,
  onCaptionChange,
  onSaveAd,
  onImageError,
}: CaptainAdFormModalProps) {
  const t = useTranslations('captainAds');

  if (!isOpen || typeof document === 'undefined') return null;

  const captionLength = caption.length;
  const charCountColorStyle =
    captionLength > CAPTAIN_ADS_CONFIG.MAX_CAPTION_LENGTH
      ? styles.charCountLimit
      : captionLength > CAPTAIN_ADS_CONFIG.MAX_CAPTION_LENGTH * 0.8
      ? styles.charCountWarn
      : styles.charCountOk;

  return createPortal(
    <div className={styles.modalOverlay} role="dialog" aria-modal="true" dir={isArabic ? 'rtl' : 'ltr'}>
      <div className={styles.modalBox}>
        <div className={styles.modalHeader}>
          <h3 className={styles.modalTitleText}>
            <Sparkles className={styles.modalTitleIcon} />
            <span>
              {editingAd ? t('modalTitleEdit') : t('modalTitleNew')}
            </span>
          </h3>
          <button
            type="button"
            onClick={onClose}
            className={styles.modalCloseBtn}
          >
            <X className={styles.modalCloseIcon} />
          </button>
        </div>

        {/* محتوى النموذج قابل للتمرير بسلاسة */}
        <div className={styles.modalBody}>
          {/* رفع صورة الإعلان */}
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>
              {t('adImageLabel')}
            </label>

            {imageUrl ? (
              <div className={styles.imagePreviewWrapper}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt={t('livePreviewTitle')}
                  className={styles.imagePreviewImg}
                  onError={onImageError}
                />
                <label htmlFor={fileInputId} className={styles.imagePreviewChangeBtn}>
                  <Upload className={styles.uploadMiniIcon} />
                  <span>{t('changeImage')}</span>
                </label>
              </div>
            ) : (
              <label htmlFor={fileInputId} className={styles.uploadDropzone}>
                <Upload className={styles.uploadIcon} />
                <span className={styles.uploadTextMain}>
                  {t('uploadImagePrompt')}
                </span>
                <span className={styles.uploadTextSub}>
                  {t('uploadImageTypes', { maxMb: CAPTAIN_ADS_CONFIG.MAX_IMAGE_SIZE_BYTES / (1024 * 1024) })}
                </span>
              </label>
            )}

            <input
              id={fileInputId}
              type="file"
              accept="image/*"
              className={styles.hiddenFileInput}
              onChange={onImageFileChange}
            />

            {imageError && (
              <p className={styles.errorMessageText}>⚠️ {imageError}</p>
            )}
          </div>

          {/* نص الإعلان (اختياري - حتى 100 حرف) */}
          <div className={styles.formGroup}>
            <div className={styles.captionHeaderRow}>
              <label className={styles.formLabel}>
                {t('adCaptionLabel')}
              </label>
              <span className={styles.charCounterRow}>
                <span className={charCountColorStyle}>{captionLength}</span>
                <span> / {CAPTAIN_ADS_CONFIG.MAX_CAPTION_LENGTH}</span>
              </span>
            </div>

            <textarea
              value={caption}
              onChange={(e) => onCaptionChange(e.target.value)}
              maxLength={CAPTAIN_ADS_CONFIG.MAX_CAPTION_LENGTH}
              placeholder={t('adCaptionPlaceholder')}
              className={styles.captionTextarea}
            />

            {captionError && (
              <p className={styles.errorMessageText}>⚠️ {captionError}</p>
            )}
            <p className={styles.formHelper}>
              {t('captionHelper')}
            </p>
          </div>

          {/* معاينة حية لشكل الإعلان */}
          {imageUrl && (
            <div className={styles.previewCardWrapper}>
              <span className={styles.previewTitle}>
                <Eye className={styles.previewEyeIcon} />
                <span>{t('livePreviewTitle')}</span>
              </span>
              <div className={styles.previewContentRow}>
                <div className={styles.previewThumbWrapper}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl} alt={t('livePreviewTitle')} className={styles.previewThumbImg} />
                </div>
                <div className={styles.previewInfoCol}>
                  <span className={styles.previewSeatText}>
                    {t('promotionalAd')}
                  </span>
                  <p className={styles.previewCaptionText}>
                    {caption || t('noCaption')}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* أزرار الإجراءات */}
        <div className={styles.modalActionsRow}>
          <button
            type="button"
            onClick={onSaveAd}
            disabled={!imageUrl || Boolean(captionError)}
            className={styles.submitBtn}
          >
            <CheckCircle2 className={styles.submitBtnIcon} />
            <span>{editingAd ? t('updateAdBtn') : t('savePublishBtn')}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className={styles.cancelBtn}
          >
            {t('cancelBtn')}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
