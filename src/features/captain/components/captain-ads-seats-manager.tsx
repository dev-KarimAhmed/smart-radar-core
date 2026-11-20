'use client';

import React, { useId } from 'react';
import { Sparkles, Tv, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { User } from '@/core/types';
import { useCaptainAdsManager } from '../hooks/use-captain-ads-manager';
import { styles } from './ads-seats/captain-ads-styles';
import { CaptainAdsSeatsGrid } from './ads-seats/captain-ads-seats-grid';
import { CaptainAdEditModal } from './ads-seats/captain-ad-edit-modal';
import { CaptainAdDeleteModal } from './ads-seats/captain-ad-delete-modal';
import { TIER_CAPABILITIES, normalizeTierRank } from '@/core/logic/driver-tier';

export * from './ads-seats/captain-ads-styles';
export * from '../hooks/use-captain-ads-manager';
export * from './ads-seats/captain-ads-seats-grid';
export * from './ads-seats/captain-ad-edit-modal';
export * from './ads-seats/captain-ad-delete-modal';

export interface CaptainAdsSeatsManagerProps {
  user: User | null;
  language?: 'ar' | 'en';
}

/**
 * 🛡️ مفتاح باقات الإعلانات (مخفية مؤقتاً لعدم اكتمال جاهزيتها)
 */
export const SHOW_CAPTAIN_AD_PACKAGES = false;

export function CaptainAdsSeatsManager({ user, language = 'ar' }: CaptainAdsSeatsManagerProps) {
  const t = useTranslations('captainAds');
  const isArabic = language === 'ar';
  const fileInputId = useId();

  const rankTier = normalizeTierRank(user?.rank || (user as any)?.tier);
  const capability = TIER_CAPABILITIES[rankTier];
  const maxCapStr = capability.isFlexibleCapacity ? (isArabic ? 'سعة مرنة' : 'Flexible') : `${capability.adCapacityMax}`;

  const state = useCaptainAdsManager({ user, t });

  return (
    <div className={styles.container} dir={isArabic ? 'rtl' : 'ltr'}>
      {/* الترويسة الرئيسية للنظام الإعلاني (سعة المحفظة حسب الرتبة) */}
      <div className={styles.headerWrapper}>
        <div className={styles.titleRow}>
          <div className={styles.headerIconBox}>
            <Tv className={styles.titleIcon} />
          </div>
          <div>
            <h2 className={styles.titleText}>
              {isArabic ? 'إدارة النشر وترويج إعلاناتك المعروضة في المحيط' : t('title')}
            </h2>
            <p className={styles.subtitleText}>
              {isArabic
                ? `سعة المحفظة لرتبة ${capability.nameAr}: (${capability.adCapacityMin}–${maxCapStr} مواد نشطة) · اشتراك موحد وثابت`
                : `Ad vault capacity for ${capability.nameEn}: (${capability.adCapacityMin}–${maxCapStr} ads) · Unified Subscription`}
            </p>
          </div>
        </div>

        <div className={styles.headerActionsRight}>
          <div className={styles.seatSummaryBadge}>
            <Sparkles className={styles.sparklesIcon} />
            <span>
              {isArabic ? `${state.ads.length} / ${maxCapStr} (${capability.nameAr})` : `${state.ads.length} / ${maxCapStr} (${capability.nameEn})`}
            </span>
          </div>

          <button
            type="button"
            onClick={() => state.handleOpenAddForSeat(state.nextSeatNumber)}
            className={styles.addNewHeaderBtn}
          >
            <Plus className={styles.plusIcon} />
            <span>{isArabic ? 'ارفع وعدل اعلانك' : t('addNewAd')}</span>
          </button>
        </div>
      </div>

      {/* شبكة المقاعد الإعلانية (مفتوحة بدون حد أقصى) */}
      <CaptainAdsSeatsGrid
        ads={state.ads}
        nextSeatNumber={state.nextSeatNumber}
        isArabic={isArabic}
        t={t}
        onOpenAddForSeat={state.handleOpenAddForSeat}
        onOpenEdit={state.handleOpenEdit}
        onToggleStatus={state.handleToggleStatus}
        onDeleteClick={(ad) => state.setAdToDelete(ad)}
        onImageError={state.handleImageError}
      />

      {/* نافذة إنشاء / تعديل الإعلان */}
      <CaptainAdEditModal
        mounted={state.mounted}
        isOpen={state.isModalOpen}
        isArabic={isArabic}
        editingAd={state.editingAd}
        imageUrl={state.imageUrl}
        caption={state.caption}
        imageError={state.imageError}
        captionError={state.captionError}
        captionLength={state.captionLength}
        charCountColorStyle={state.charCountColorStyle}
        fileInputId={fileInputId}
        t={t}
        onClose={() => state.setIsModalOpen(false)}
        onImageFileChange={state.handleImageFileChange}
        onCaptionChange={state.handleCaptionChange}
        onSave={state.handleSaveAd}
        onImageError={state.handleImageError}
      />

      {/* نافذة تأكيد الحذف */}
      <CaptainAdDeleteModal
        mounted={state.mounted}
        isOpen={Boolean(state.adToDelete)}
        isArabic={isArabic}
        t={t}
        onConfirm={state.handleConfirmDelete}
        onCancel={() => state.setAdToDelete(null)}
      />
    </div>
  );
}
