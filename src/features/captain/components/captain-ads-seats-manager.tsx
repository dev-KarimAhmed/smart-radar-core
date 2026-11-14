'use client';

import React, { useId } from 'react';
import { Sparkles, Tv } from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { User } from '@/core/types';
import { useCaptainAdsManager } from '../hooks/use-captain-ads-manager';
import { CaptainAdsManagerModal } from './ads-seats/captain-ads-manager-modal';
import { CaptainAdEditModal } from './ads-seats/captain-ad-edit-modal';
import { CaptainAdDeleteModal } from './ads-seats/captain-ad-delete-modal';
import { CaptainAdPackageModal } from './ads-seats/captain-ad-package-modal';

export * from './ads-seats/captain-ads-styles';
export * from '../hooks/use-captain-ads-manager';
export * from './ads-seats/captain-ads-manager-modal';
export * from './ads-seats/captain-ad-edit-modal';
export * from './ads-seats/captain-ad-delete-modal';
export * from './ads-seats/captain-ad-package-modal';

export interface CaptainAdsSeatsManagerProps {
  user: User | null;
  language?: 'ar' | 'en';
}

export function CaptainAdsSeatsManager({ user, language = 'ar' }: CaptainAdsSeatsManagerProps) {
  const t = useTranslations('captainAds');
  const isArabic = language === 'ar';
  const fileInputId = useId();

  const state = useCaptainAdsManager({ user, t });

  return (
    <div className="w-full pt-3.5 border-t border-white/10" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* شريط زري باقة الإعلانات وإدارة الإعلانات (داخل القائمة المنسدلة للرصيد) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* 1. زر اختار باقة اعلانك (متاح دائماً ويفتح نافذة الباقة وحصص النشر) */}
        <button
          type="button"
          onClick={() => state.setIsPackageModalOpen(true)}
          className="flex-1 flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-teal-500 via-[#14F5D5] to-emerald-400 p-3 sm:p-3.5 text-xs sm:text-sm font-black text-slate-950 shadow-lg shadow-teal-500/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
        >
          <Sparkles className="h-4.5 w-4.5 shrink-0 text-slate-950" />
          <span>{isArabic ? 'اختار باقة اعلانك' : 'Choose Ad Package'}</span>
          <span className="px-2 py-0.5 rounded-lg bg-black/20 text-slate-950 text-[11px] font-bold">
            {isArabic ? (state.isPackageActive ? 'مفعلة ✓' : 'الدخول') : (state.isPackageActive ? 'Active ✓' : 'Enter')}
          </span>
        </button>

        {/* 2. زر ارفع وعدل اعلانك - لا يكون موجوداً إلا بعد اختيار باقة ودفعها وتفعيلها تماماً من الأدمن */}
        {state.isPackageActive ? (
          <button
            type="button"
            onClick={() => state.setIsAdsManagerModalOpen(true)}
            className="flex-1 flex items-center justify-center gap-2.5 rounded-2xl border border-[#14F5D5]/80 bg-[#061F22]/90 hover:bg-[#14F5D5]/20 p-3 sm:p-3.5 text-xs sm:text-sm font-black text-[#14F5D5] shadow-lg shadow-cyan-500/10 active:scale-95 transition-all cursor-pointer group"
          >
            <Tv className="h-4.5 w-4.5 shrink-0 text-[#14F5D5] group-hover:scale-110 transition-transform" />
            <span>{isArabic ? 'ارفع وعدل اعلانك' : 'Upload & Edit Ads'}</span>
            <span className="px-2 py-0.5 rounded-lg bg-[#14F5D5]/20 text-[#14F5D5] text-[11px] font-bold">
              {state.ads.length}/3
            </span>
          </button>
        ) : null}
      </div>

      {/* 1. نافذة إدارة النشر وترويج الإعلانات */}
      <CaptainAdsManagerModal
        mounted={state.mounted}
        isOpen={state.isAdsManagerModalOpen}
        isArabic={isArabic}
        ads={state.ads}
        nextSeatNumber={state.nextSeatNumber}
        t={t}
        onClose={() => state.setIsAdsManagerModalOpen(false)}
        onOpenEdit={state.handleOpenEdit}
        onToggleStatus={state.handleToggleStatus}
        onDeleteClick={(ad) => state.setAdToDelete(ad)}
        onOpenAddForSeat={state.handleOpenAddForSeat}
        onImageError={state.handleImageError}
      />

      {/* 2. نافذة إنشاء / تعديل الإعلان */}
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

      {/* 3. نافذة تأكيد الحذف */}
      <CaptainAdDeleteModal
        mounted={state.mounted}
        isOpen={Boolean(state.adToDelete)}
        isArabic={isArabic}
        t={t}
        onConfirm={state.handleConfirmDelete}
        onCancel={() => state.setAdToDelete(null)}
      />

      {/* 4. نافذة شاشة باقة الخدمات / A */}
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
