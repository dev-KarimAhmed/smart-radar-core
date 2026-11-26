'use client';

import React, { useId } from 'react';
import { Sparkles, Tv, Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { User } from '@/core/types';
import { CAPTAIN_ADS_CONFIG } from '../config/captain-ads-config';
import { useCaptainAdsManager } from '../hooks/use-captain-ads-manager';
import { styles } from './ads-seats/captain-ads-styles';
import { CaptainAdsSeatsGrid } from './ads-seats/captain-ads-seats-grid';
import { CaptainAdEditModal } from './ads-seats/captain-ad-edit-modal';
import { CaptainAdDeleteModal } from './ads-seats/captain-ad-delete-modal';
import { CaptainAdPackageModal } from './ads-seats/captain-ad-package-modal';

export * from './ads-seats/captain-ads-styles';
export * from '../hooks/use-captain-ads-manager';
export * from './ads-seats/captain-ads-seats-grid';
export * from './ads-seats/captain-ad-edit-modal';
export * from './ads-seats/captain-ad-delete-modal';

export interface CaptainAdsSeatsManagerProps {
  user: User | null;
  language?: 'ar' | 'en';
  totalUsableMinutes?: number;
}

export const SHOW_CAPTAIN_AD_PACKAGES = true;

export function CaptainAdsSeatsManager({ user, language = 'ar', totalUsableMinutes = 0 }: CaptainAdsSeatsManagerProps) {
  const t = useTranslations('captainAds');
  const isArabic = language === 'ar';
  const fileInputId = useId();

  const maxCap = CAPTAIN_ADS_CONFIG.MAX_ADS_LIMIT;
  const state = useCaptainAdsManager({ user, t, totalUsableMinutes });
  const isLimitReached = state.ads.length >= maxCap;
  const isLocked = !state.operatingEligibility.isEligible;

  return (
    <div className={styles.container} dir={isArabic ? 'rtl' : 'ltr'}>
      {/* الترويسة الرئيسية للنظام الإعلاني (الحد الأقصى: 4 إعلانات) */}
      <div className={styles.headerWrapper}>
        <div className={styles.titleRow}>
          <div className={styles.headerIconBox}>
            <Tv className={styles.titleIcon} />
          </div>
          <div>
            <h2 className={styles.titleText}>
              {isArabic ? 'ارفع وانشر إعلاناتك الترويجية في محيطك' : t('title')}
            </h2>
            <p className={styles.subtitleText}>
              {isArabic
                ? `الحد الأقصى المسموح: ${maxCap} إعلانات ترويجية نشطة · اشتراك موحد وثابت`
                : `Maximum allowed: ${maxCap} active promotional ads · Unified Subscription`}
            </p>
          </div>
        </div>

        <div className={styles.headerActionsRight}>
          <div className={styles.seatSummaryBadge}>
            <Sparkles className={styles.sparklesIcon} />
            <span>
              {state.ads.length} / {maxCap}
            </span>
          </div>

          <button
            type="button"
            disabled={isLimitReached}
            onClick={() => state.handleOpenAddForSeat(state.nextSeatNumber)}
            className={styles.addNewHeaderBtn}
            style={isLimitReached ? { opacity: 0.4, cursor: 'not-allowed' } : undefined}
            title={isLimitReached ? (isArabic ? 'وصلت للحد الأقصى (4 إعلانات)' : 'Maximum 4 ads reached') : undefined}
          >
            {isLocked ? <Sparkles className={styles.plusIcon} /> : <Plus className={styles.plusIcon} />}
            <span>
              {isLocked
                ? (isArabic ? 'تفعيل الباقة للرفع' : 'Activate to Upload')
                : (isArabic ? 'ارفع وعدل اعلانك' : t('addNewAd'))}
            </span>
          </button>
        </div>
      </div>

      {/* شبكة المقاعد الإعلانية (حد أقصى 4 إعلانات) */}
      <CaptainAdsSeatsGrid
        ads={state.ads}
        nextSeatNumber={state.nextSeatNumber}
        isArabic={isArabic}
        maxAds={maxCap}
        isLocked={isLocked}
        lockReason={state.operatingEligibility.lockReason}
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

      {/* نافذة الباقة الافتتاحية */}
      <CaptainAdPackageModal
        mounted={state.mounted}
        isOpen={state.isPackageModalOpen}
        isArabic={isArabic}
        onClose={() => state.setIsPackageModalOpen(false)}
        onGoToPayment={state.handleGoToPayment}
        onActivatePackage={state.handleActivatePackage}
      />
    </div>
  );
}
