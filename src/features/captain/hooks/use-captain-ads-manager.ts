'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
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
  normalizeCaptainAdImageUrl,
  getCaptainAdPackage,
  getCaptainOperatingEligibility,
  type CaptainAdItem,
  type CaptainAdPackage,
  type CaptainOperatingEligibility,
} from '../services/captain-ads-service';
import { executeCaptainPackageActivation } from '../services/captain-package-activation-flow';
import { styles } from '../components/ads-seats/captain-ads-styles';

interface UseCaptainAdsManagerProps {
  user: User | null;
  t: (key: string, values?: any) => string;
  totalUsableMinutes?: number;
}

export function useCaptainAdsManager({ user, t, totalUsableMinutes = 0 }: UseCaptainAdsManagerProps) {
  const captainId = user?.uid || 'current_captain';

  const [ads, setAds] = useState<CaptainAdItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<CaptainAdItem | null>(null);
  const [selectedSeatNumber, setSelectedSeatNumber] = useState(1);
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [imageError, setImageError] = useState('');
  const [captionError, setCaptionError] = useState('');
  const [adToDelete, setAdToDelete] = useState<CaptainAdItem | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [adPackage, setAdPackage] = useState<CaptainAdPackage>(() => getCaptainAdPackage(captainId, user));
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [isAdsManagerModalOpen, setIsAdsManagerModalOpen] = useState(false);

  const operatingEligibility = useMemo(() => {
    return getCaptainOperatingEligibility({
      adPackage,
      totalUsableMinutes,
      language: (user as any)?.language === 'en' ? 'en' : 'ar',
    });
  }, [adPackage, totalUsableMinutes, user]);

  const isPackageActive = operatingEligibility.isEligible;

  const handleActivatePackage = async () => {
    const res = await executeCaptainPackageActivation({
      userId: captainId,
      isArabic: (user as any)?.language !== 'en',
    });
    setAdPackage(res.package);
  };
  const handleGoToPayment = () => {
    setIsPackageModalOpen(false);
    document.getElementById('captain-recharge-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const refreshAds = useCallback(async () => {
    const list = await fetchCaptainAds(captainId);
    setAds(list);
  }, [captainId]);

  useEffect(() => {
    setMounted(true);
    void refreshAds();

    const onUpdated = (e: any) => {
      if (!e?.detail?.captainId || e.detail.captainId === captainId) void refreshAds();
    };

    window.addEventListener(CAPTAIN_ADS_CONFIG.CUSTOM_EVENTS.ADS_UPDATED, onUpdated);
    const onPkgUpdated = () => setAdPackage(getCaptainAdPackage(captainId));
    window.addEventListener('radar_captain_ad_package_updated', onPkgUpdated);
    return () => {
      window.removeEventListener(CAPTAIN_ADS_CONFIG.CUSTOM_EVENTS.ADS_UPDATED, onUpdated);
      window.removeEventListener('radar_captain_ad_package_updated', onPkgUpdated);
    };
  }, [captainId, refreshAds]);

  const resetForm = (ad: CaptainAdItem | null = null, seatNum = 1) => {
    setEditingAd(ad);
    setSelectedSeatNumber(ad ? ad.seatNumber : seatNum);
    setImageUrl(ad ? ad.imageUrl : '');
    setCaption(ad ? ad.caption || '' : '');
    setImageError('');
    setCaptionError('');
    setIsModalOpen(true);
  };

  const handleOpenAddForSeat = (seatNum: number) => {
    if (ads.length >= CAPTAIN_ADS_CONFIG.MAX_ADS_LIMIT) return;
    if (!operatingEligibility.isEligible) {
      setIsPackageModalOpen(true);
      return;
    }
    resetForm(null, seatNum);
  };

  const handleOpenEdit = (ad: CaptainAdItem) => resetForm(ad);

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
    setCaptionError(validation.valid ? '' : validation.error || '');
  };

  const handleSaveAd = async () => {
    if (!operatingEligibility.isEligible) {
      setIsPackageModalOpen(true);
      return;
    }
    if (!editingAd && ads.length >= CAPTAIN_ADS_CONFIG.MAX_ADS_LIMIT) {
      setImageError(t('errAdsLimitReached') || 'الحد الأقصى لرفع الإعلانات هو 4 إعلانات');
      return;
    }
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
    const normalized = normalizeCaptainAdImageUrl(target.src);
    if (normalized && normalized !== target.src) target.src = normalized;
    else target.style.opacity = '0';
  };

  const usedSeats = new Set(ads.map((a) => a.seatNumber));
  let nextSeatNumber = 1;
  for (let i = 1; i <= CAPTAIN_ADS_CONFIG.MAX_ADS_LIMIT; i++) {
    if (!usedSeats.has(i)) { nextSeatNumber = i; break; }
  }
  const isLimitReached = ads.length >= CAPTAIN_ADS_CONFIG.MAX_ADS_LIMIT;
  const captionLength = caption.length;
  const isLimitNear = captionLength > CAPTAIN_ADS_CONFIG.MAX_CAPTION_LENGTH * 0.8;
  const charCountColorStyle = captionLength >= CAPTAIN_ADS_CONFIG.MAX_CAPTION_LENGTH ? styles.charCountLimit : isLimitNear ? styles.charCountWarn : styles.charCountOk;

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
    operatingEligibility,
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
    isLimitReached,
    captionLength,
    charCountColorStyle,
  };
}
