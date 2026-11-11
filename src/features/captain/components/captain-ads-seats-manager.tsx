'use client';

import React, { useState, useEffect, useCallback, useId } from 'react';
import { Sparkles, Tv } from 'lucide-react';
import type { User } from '@/core/types';
import { CAPTAIN_ADS_CONFIG } from '../config/captain-ads-config';
import {
  fetchCaptainAds,
  saveCaptainAd,
  updateCaptainAd,
  deleteCaptainAd,
  toggleCaptainAdStatus,
  validateAdCaption,
  validateAdImageFile,
  convertImageFileToDataUrl,
  getCaptainAdPackage,
  subscribeCaptainAdPackage,
  type CaptainAdItem,
  type CaptainAdPackage,
} from '../services/captain-ads-service';
import { CaptainAdPackageModal } from './ads/captain-ad-package-modal';
import { CaptainAdDeleteModal } from './ads/captain-ad-delete-modal';
import { CaptainAdFormModal } from './ads/captain-ad-form-modal';
import { CaptainAdsSeatsModal } from './ads/captain-ads-seats-modal';

interface CaptainAdsSeatsManagerProps {
  user: User | null;
  language?: 'ar' | 'en';
}

export function CaptainAdsSeatsManager({ user, language = 'ar' }: CaptainAdsSeatsManagerProps) {
  const isArabic = language === 'ar';
  const captainId = user?.uid || 'current_captain';
  const fileInputId = useId();

  const [ads, setAds] = useState<CaptainAdItem[]>([]);
  const [editingAd, setEditingAd] = useState<CaptainAdItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdsManagerModalOpen, setIsAdsManagerModalOpen] = useState(false);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [adPackage, setAdPackage] = useState<CaptainAdPackage | null>(null);
  const [adToDelete, setAdToDelete] = useState<CaptainAdItem | null>(null);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [imageError, setImageError] = useState<string | null>(null);
  const [captionError, setCaptionError] = useState<string | null>(null);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const refreshAds = useCallback(async () => {
    try {
      const list = await fetchCaptainAds(captainId);
      setAds(list);
    } catch (err) {
      console.warn('[CaptainAdsSeatsManager] fetch error:', err);
    }
    const pkg = getCaptainAdPackage(captainId);
    setAdPackage(pkg);
  }, [captainId]);

  const handleActivatePackage = () => {
    subscribeCaptainAdPackage(captainId, 'PACKAGE_A', 30);
    refreshAds();
    setIsPackageModalOpen(false);
    setIsAdsManagerModalOpen(true);
  };

  const handleGoToPayment = () => {
    subscribeCaptainAdPackage(captainId, 'PACKAGE_A', 30);
    refreshAds();
    setIsPackageModalOpen(false);
    try {
      window.dispatchEvent(
        new CustomEvent('radar-wallet-tab-switch', {
          detail: { tab: 'topup', channel: 'payment-methods' },
        }),
      );
    } catch (err) {
      console.warn('[CaptainAdsSeatsManager] tab switch dispatch error:', err);
    }
  };

  useEffect(() => {
    refreshAds();
    const handleStorage = (e: StorageEvent) => {
      if (
        e.key === CAPTAIN_ADS_CONFIG.STORAGE_KEY ||
        e.key === CAPTAIN_ADS_CONFIG.PACKAGE_STORAGE_KEY
      ) {
        refreshAds();
      }
    };
    const handleCustomEvent = () => refreshAds();
    window.addEventListener('storage', handleStorage);
    window.addEventListener('captain-ads-updated', handleCustomEvent);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('captain-ads-updated', handleCustomEvent);
    };
  }, [refreshAds]);

  const handleOpenAddForSeat = (seatNum: number) => {
    setEditingAd(null);
    setImageUrl(null);
    setCaption('');
    setImageError(null);
    setCaptionError(null);
    setIsAdsManagerModalOpen(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ad: CaptainAdItem) => {
    setEditingAd(ad);
    setImageUrl(ad.imageUrl);
    setCaption(ad.caption || '');
    setImageError(null);
    setCaptionError(null);
    setIsAdsManagerModalOpen(false);
    setIsModalOpen(true);
  };

  const handleImageFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateAdImageFile(file);
    if (!validation.valid) {
      setImageError(validation.error || (isArabic ? 'ملف غير صالح' : 'Invalid file'));
      return;
    }

    try {
      const dataUrl = await convertImageFileToDataUrl(file);
      setImageUrl(dataUrl);
      setImageError(null);
    } catch {
      setImageError(isArabic ? 'فشل قراءة ملف الصورة' : 'Failed to read image file');
    }
  };

  const handleCaptionChange = (val: string) => {
    setCaption(val);
    const validation = validateAdCaption(val);
    if (!validation.valid) {
      setCaptionError(validation.error || null);
    } else {
      setCaptionError(null);
    }
  };

  const handleSaveAd = async () => {
    if (!imageUrl) {
      setImageError(isArabic ? 'يرجى اختيار صورة للإعلان' : 'Please select an ad image');
      return;
    }

    const captionVal = validateAdCaption(caption);
    if (!captionVal.valid) {
      setCaptionError(captionVal.error || null);
      return;
    }

    if (editingAd) {
      await updateCaptainAd(captainId, editingAd.id, {
        imageUrl,
        caption: caption.trim() || undefined,
      });
    } else {
      await saveCaptainAd(captainId, {
        seatNumber: ads.length + 1,
        imageUrl,
        caption: caption.trim() || undefined,
        status: 'ACTIVE',
      });
    }

    refreshAds();
    setIsModalOpen(false);
    setIsAdsManagerModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!adToDelete) return;
    await deleteCaptainAd(captainId, adToDelete.id);
    setAdToDelete(null);
    refreshAds();
    setIsAdsManagerModalOpen(true);
  };

  const handleToggleStatus = async (ad: CaptainAdItem) => {
    await toggleCaptainAdStatus(captainId, ad.id);
    refreshAds();
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget;
    const src = target.src || '';
    if (src.includes('/storage/v1/object/public/captain-documents/')) {
      const path = src.split('/storage/v1/object/public/captain-documents/')[1]?.replace(/^\/+/, '');
      if (path && !src.includes('/api/storage/file/')) {
        target.src = `/api/storage/file/captain-documents/${path}`;
        return;
      }
    }
    target.style.display = 'none';
  };

  const isPackageActive = Boolean(adPackage && adPackage.status === 'ACTIVE');
  const nextSeatNumber = ads.length > 0 ? Math.max(...ads.map((a) => a.seatNumber)) + 1 : 1;

  return (
    <div className="w-full pt-3.5 border-t border-white/10" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* شريط زري باقة الإعلانات وإدارة الإعلانات */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <button
          type="button"
          onClick={() => setIsPackageModalOpen(true)}
          className="flex-1 flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-teal-500 via-[#14F5D5] to-emerald-400 p-3 sm:p-3.5 text-xs sm:text-sm font-black text-slate-950 shadow-lg shadow-teal-500/20 hover:brightness-110 active:scale-95 transition-all cursor-pointer"
        >
          <Sparkles className="h-4.5 w-4.5 shrink-0 text-slate-950" />
          <span>{isArabic ? 'اختار باقة اعلانك' : 'Choose Ad Package'}</span>
          <span className="px-2 py-0.5 rounded-lg bg-black/20 text-slate-950 text-[11px] font-bold">
            {isArabic ? (isPackageActive ? 'مفعلة ✓' : 'الدخول') : (isPackageActive ? 'Active ✓' : 'Enter')}
          </span>
        </button>

        {isPackageActive ? (
          <button
            type="button"
            onClick={() => setIsAdsManagerModalOpen(true)}
            className="flex-1 flex items-center justify-center gap-2.5 rounded-2xl border border-[#14F5D5]/80 bg-[#061F22]/90 hover:bg-[#14F5D5]/20 p-3 sm:p-3.5 text-xs sm:text-sm font-black text-[#14F5D5] shadow-lg shadow-cyan-500/10 active:scale-95 transition-all cursor-pointer group"
          >
            <Tv className="h-4.5 w-4.5 shrink-0 text-[#14F5D5] group-hover:scale-110 transition-transform" />
            <span>{isArabic ? 'ارفع وعدل اعلانك' : 'Upload & Edit Ads'}</span>
            <span className="px-2 py-0.5 rounded-lg bg-[#14F5D5]/20 text-[#14F5D5] text-[11px] font-bold">
              {ads.length}/3
            </span>
          </button>
        ) : null}
      </div>

      {/* 1. نافذة إدارة النشر وترويج الإعلانات */}
      <CaptainAdsSeatsModal
        isOpen={mounted && isAdsManagerModalOpen}
        ads={ads}
        nextSeatNumber={nextSeatNumber}
        isArabic={isArabic}
        onClose={() => setIsAdsManagerModalOpen(false)}
        onOpenEdit={handleOpenEdit}
        onToggleStatus={handleToggleStatus}
        onRequestDelete={(ad) => {
          setIsAdsManagerModalOpen(false);
          setAdToDelete(ad);
        }}
        onOpenAddForSeat={handleOpenAddForSeat}
        onImageError={handleImageError}
      />

      {/* 2. نافذة نموذج إضافة / تعديل إعلان */}
      <CaptainAdFormModal
        isOpen={mounted && isModalOpen}
        editingAd={editingAd}
        imageUrl={imageUrl}
        caption={caption}
        imageError={imageError}
        captionError={captionError}
        fileInputId={fileInputId}
        isArabic={isArabic}
        onClose={() => {
          setIsModalOpen(false);
          setIsAdsManagerModalOpen(true);
        }}
        onImageFileChange={handleImageFileChange}
        onCaptionChange={handleCaptionChange}
        onSaveAd={handleSaveAd}
        onImageError={handleImageError}
      />

      {/* 3. نافذة تأكيد حذف الإعلان */}
      <CaptainAdDeleteModal
        adToDelete={mounted ? adToDelete : null}
        isArabic={isArabic}
        onCancel={() => {
          setAdToDelete(null);
          setIsAdsManagerModalOpen(true);
        }}
        onConfirm={handleConfirmDelete}
      />

      {/* 4. نافذة شاشة اختار باقة اعلانك - باقة الخدمات / A */}
      <CaptainAdPackageModal
        isOpen={mounted && isPackageModalOpen}
        isArabic={isArabic}
        onClose={() => setIsPackageModalOpen(false)}
        onGoToPayment={handleGoToPayment}
        onActivatePackage={handleActivatePackage}
      />
    </div>
  );
}
