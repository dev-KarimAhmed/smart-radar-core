'use client';

import React from 'react';
import {
  Pencil,
  Pause,
  Play,
  Trash2,
  Plus,
} from 'lucide-react';
import type { CaptainAdItem } from '../../services/captain-ads-service';
import { styles } from './captain-ads-styles';
import { CAPTAIN_ADS_CONFIG } from '../../config/captain-ads-config';

export interface CaptainAdsSeatsGridProps {
  ads: CaptainAdItem[];
  nextSeatNumber: number;
  isArabic: boolean;
  maxAds?: number;
  t: (key: string, values?: any) => string;
  onOpenAddForSeat: (seatNum: number) => void;
  onOpenEdit: (ad: CaptainAdItem) => void;
  onToggleStatus: (ad: CaptainAdItem) => void;
  onDeleteClick: (ad: CaptainAdItem) => void;
  onImageError: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

export function CaptainAdsSeatsGrid({
  ads,
  nextSeatNumber,
  isArabic,
  maxAds = CAPTAIN_ADS_CONFIG.MAX_ADS_LIMIT,
  t,
  onOpenAddForSeat,
  onOpenEdit,
  onToggleStatus,
  onDeleteClick,
  onImageError,
}: CaptainAdsSeatsGridProps) {
  return (
    <div className={styles.seatsGrid}>
      {ads.map((ad) => (
        <div key={ad.id} className={styles.seatCardOccupied}>
          <div>
            <div className={styles.seatBadgeRow}>
              <span className={styles.seatNumberBadge}>
                {t('promotionalAd')} #{ad.seatNumber}
              </span>
              <span className={ad.status === 'ACTIVE' ? styles.seatStatusActive : styles.seatStatusPaused}>
                <span className={styles.statusDot} />
                <span>
                  {ad.status === 'ACTIVE' ? t('statusActive') : t('statusPaused')}
                </span>
              </span>
            </div>

            <div className={styles.adImageThumbnailWrapper}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={ad.imageUrl}
                alt={ad.caption || t('promotionalAd')}
                className={styles.adImageThumbnail}
                onError={onImageError}
              />
            </div>

            {ad.caption ? (
              <p className={styles.captionBox} title={ad.caption}>
                &ldquo;{ad.caption}&rdquo;
              </p>
            ) : (
              <p className={styles.captionFallback}>
                {t('imageOnly')}
              </p>
            )}
          </div>

          {/* أزرار الإجراءات: تعديل، حذف، تجميد */}
          <div className={styles.actionsBar}>
            <button
              type="button"
              onClick={() => onOpenEdit(ad)}
              className={styles.actionBtnEdit}
              title={t('editAd')}
            >
              <Pencil className={styles.pencilIcon} />
              <span>{t('edit')}</span>
            </button>

            <button
              type="button"
              onClick={() => onToggleStatus(ad)}
              className={styles.actionBtnToggle}
              title={ad.status === 'ACTIVE' ? t('pause') : t('activate')}
            >
              {ad.status === 'ACTIVE' ? (
                <Pause className={styles.pauseIconAmber} />
              ) : (
                <Play className={styles.playIconEmerald} />
              )}
            </button>

            <button
              type="button"
              onClick={() => onDeleteClick(ad)}
              className={styles.actionBtnDelete}
              title={t('deleteAd')}
            >
              <Trash2 className={styles.trashIcon} />
            </button>
          </div>
        </div>
      ))}

      {/* كارت إضافة إعلان جديد (يظهر فقط إذا كان عدد الإعلانات أقل من الحد الأقصى 4) */}
      {ads.length < maxAds ? (
        <div className={styles.seatCardVacant}>
          <div className={styles.vacantIconBox}>
            <Plus className={styles.plusIconLarge} />
          </div>
          <h3 className={styles.vacantTitle}>
            {t('newAd')} (#{nextSeatNumber})
          </h3>
          <p className={styles.vacantSubtitle}>
            {isArabic
              ? `مساحة متاحة لإعلان ترويجي جديد (${maxAds - ads.length} متبقية)`
              : `${maxAds - ads.length} slots remaining`}
          </p>
          <button
            type="button"
            onClick={() => onOpenAddForSeat(nextSeatNumber)}
            className={styles.vacantAddBtn}
          >
            <Plus className={styles.plusIcon} />
            <span>{isArabic ? 'ارفع وعدل اعلانك' : t('addNewAd')}</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
