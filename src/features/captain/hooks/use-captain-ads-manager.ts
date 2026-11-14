'use client';

import { useState, useEffect, useCallback } from 'react';
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
import { styles } from '../components/ads-seats/captain-ads-styles';

interface UseCaptainAdsManagerProps {
  user: User | null;
  t: (key: string, values?: any) => string;
}

export function useCaptainAdsManager({ user, t }: UseCaptainAdsManagerProps) {
  const captainId = user?.uid || 'current_captain';

  const [ads, setAds] = useState<CaptainAdItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<CaptainAdItem | null>(null);
  const [selectedSeatNumber, setSelectedSeatNumber] = useState<number>(1);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [caption, setCaption] = useState<string>('');
  const [imageError, setImageError] = useState<string>('');
  const [captionError, setCaptionError] = useState<string>('');
  const [adToDelete, setAdToDelete] = useState<CaptainAdItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [adPackage, setAdPackage] = useState<CaptainAdPackage>(() => getCaptainAdPackage(captainId));
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [isAdsManagerModalOpen, setIsAdsManagerModalOpen] = useState(false);

  const isPackageActive =
    adPackage.status === 'ACTIVE' ||
    (user as any)?.ad_package_active === true ||
    (user as any)?.ad_package_status === 'ACTIVE';

  const handleActivatePackage = () => {
    const updated = subscribeCaptainAdPackage(captainId);
    setAdPackage(updated);
    setIsPackageModalOpen(false);
  };

  const handleGoToPayment = () => {
    setIsPackageModalOpen(false);
    if (typeof window !== 'undefined') {
      const el = document.getElementById('captain-recharge-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        window.dispatchEvent(new CustomEvent('radar_select_wallet_payment'));
      }
    }
  };

  const refreshAds = useCallback(async () => {
    const list = await fetchCaptainAds(captainId);
    setAds(list);
  }, [captainId]);

  useEffect(() => {
    setMounted(true);
    void refreshAds();

    const onUpdated = (e: any) => {
      if (!e?.detail?.captainId || e.detail.captainId === captainId) {
        void refreshAds();
      }
    };

    window.addEventListener(CAPTAIN_ADS_CONFIG.CUSTOM_EVENTS.ADS_UPDATED, onUpdated);
    const onPkgUpdated = () => setAdPackage(getCaptainAdPackage(captainId));
    window.addEventListener('radar_captain_ad_package_updated', onPkgUpdated);
    return () => {
      window.removeEventListener(CAPTAIN_ADS_CONFIG.CUSTOM_EVENTS.ADS_UPDATED, onUpdated);
      window.removeEventListener('radar_captain_ad_package_updated', onPkgUpdated);
    };
  }, [captainId, refreshAds]);

  const handleOpenAddForSeat = (seatNum: number) => {
    setEditingAd(null);
    setSelectedSeatNumber(seatNum);
    setImageUrl('');
    setCaption('');
    setImageError('');
    setCaptionError('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (ad: CaptainAdItem) => {
    setEditingAd(ad);
    setSelectedSeatNumber(ad.seatNumber);
    setImageUrl(ad.imageUrl);
    setCaption(ad.caption || '');
    setImageError('');
    setCaptionError('');
    setIsModalOpen(true);
  };

  const handleImageFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setImageError('');
    const file = event.target.files?.[0];
    if (!file) return;

    const validation = validateAdImageFile(file);
    if (!validation.valid) {
      setImageError(validation.error || t('errInvalidFile'));
      return;
    }

    try {
      const dataUrl = await convertImageFileToDataUrl(file);
      setImageUrl(dataUrl);
    } catch {
      setImageError(t('errReadImage'));
    }
  };

  const handleCaptionChange = (val: string) => {
    const trimmedVal = val.slice(0, CAPTAIN_ADS_CONFIG.MAX_CAPTION_LENGTH);
    setCaption(trimmedVal);
    const validation = validateAdCaption(trimmedVal);
    if (!validation.valid) {
      setCaptionError(validation.error || '');
    } else {
      setCaptionError('');
    }
  };

  const handleSaveAd = async () => {
    if (!imageUrl) {
      setImageError(t('errUploadImage'));
      return;
    }

    const captionVal = validateAdCaption(caption);
    if (!captionVal.valid) {
      setCaptionError(captionVal.error || '');
      return;
    }

    setIsSaving(true);
    try {
      if (editingAd) {
        await updateCaptainAd(captainId, editingAd.id, {
          seatNumber: selectedSeatNumber,
          imageUrl,
          caption: caption.trim() || undefined,
        });
      } else {
        await saveCaptainAd(captainId, {
          seatNumber: selectedSeatNumber,
          imageUrl,
          caption: caption.trim() || undefined,
        });
      }

      setIsModalOpen(false);
      await refreshAds();
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (adToDelete) {
      await deleteCaptainAd(captainId, adToDelete.id);
      setAdToDelete(null);
      await refreshAds();
    }
  };

  const handleToggleStatus = async (ad: CaptainAdItem) => {
    await toggleCaptainAdStatus(captainId, ad.id);
    await refreshAds();
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const target = e.currentTarget;
    const src = target.src || '';
    if (src.includes('/storage/v1/object/public/captain-documents/')) {
      const path = src.split('/storage/v1/object/public/captain-documents/')[1]?.replace(/^\/+/, '');
      if (path) {
        target.src = `/api/captain/ads/image?bucket=captain-documents&path=${encodeURIComponent(path)}`;
        return;
      }
    }
    target.style.opacity = '0';
  };

  const nextSeatNumber = ads.length > 0 ? Math.max(...ads.map((a) => a.seatNumber)) + 1 : 1;
  const captionLength = caption.length;
  const charCountColorStyle =
    captionLength >= CAPTAIN_ADS_CONFIG.MAX_CAPTION_LENGTH
      ? styles.charCountLimit
      : captionLength > CAPTAIN_ADS_CONFIG.MAX_CAPTION_LENGTH * 0.8
      ? styles.charCountWarn
      : styles.charCountOk;

  return {
    ads,
    mounted,
    isModalOpen,
    setIsModalOpen,
    editingAd,
    imageUrl,
    caption,
    imageError,
    captionError,
    adToDelete,
    setAdToDelete,
    isSaving,
    isPackageModalOpen,
    setIsPackageModalOpen,
    isAdsManagerModalOpen,
    setIsAdsManagerModalOpen,
    isPackageActive,
    handleActivatePackage,
    handleGoToPayment,
    handleOpenAddForSeat,
    handleOpenEdit,
    handleImageFileChange,
    handleCaptionChange,
    handleSaveAd,
    handleConfirmDelete,
    handleToggleStatus,
    handleImageError,
    nextSeatNumber,
    captionLength,
    charCountColorStyle,
  };
}
