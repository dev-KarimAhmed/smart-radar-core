'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import {
  Sparkles,
  X,
  Upload,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { CAPTAIN_ADS_CONFIG } from '../../config/captain-ads-config';
import type { CaptainAdItem } from '../../services/captain-ads-service';
import { styles } from './captain-ads-styles';

interface CaptainAdEditModalProps {
  mounted: boolean;
  isOpen: boolean;
  isArabic: boolean;
  editingAd: CaptainAdItem | null;
  imageUrl: string;
  caption: string;
  imageError: string;
  captionError: string;
  captionLength: number;
  charCountColorStyle: string;
  fileInputId: string;
  t: (key: string, values?: any) => string;
  onClose: () => void;
  onImageFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCaptionChange: (val: string) => void;
  onSave: () => void;
  onImageError: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

export function CaptainAdEditModal({
  mounted,
  isOpen,
  isArabic,
  editingAd,
  imageUrl,
  caption,
  imageError,
  captionError,
  captionLength,
  charCountColorStyle,
  fileInputId,
  t,
  onClose,
  onImageFileChange,
  onCaptionChange,
  onSave,
  onImageError,
}: CaptainAdEditModalProps) {
  if (!mounted || !isOpen) return null;

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

        <div className={styles.modalBody}>
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

        <div className={styles.modalActionsRow}>
          <button
            type="button"
            onClick={onSave}
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
