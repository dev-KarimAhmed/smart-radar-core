'use client';

import React, { useState, useEffect, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
import {
  Sparkles,
  Plus,
  Pencil,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Eye,
  Tv,
  X,
  Upload,
  Play,
  Pause,
  Radio,
  Clock,
  BarChart3,
  Users2,
  Database,
  MapPin,
  ShieldCheck,
  CreditCard,
  Lock,
  Star,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import type { User } from '@/core/types';
import {
  CAPTAIN_ADS_CONFIG,
} from '../config/captain-ads-config';
import {
  getCaptainAds,
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
  AD_PACKAGE_A_DETAILS,
} from '../services/captain-ads-service';

const styles = {
  container: "overflow-hidden rounded-3xl border border-[#14B8A6]/30 bg-[#070D19]/90 shadow-2xl backdrop-blur-xl p-5 sm:p-7 space-y-6",
  headerWrapper: "flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/10 pb-5",
  titleRow: "flex items-center gap-3",
  headerIconBox: "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-[#00ffcc]/40 bg-[#00ffcc]/10 text-[#00ffcc] shadow-[0_0_15px_rgba(0,255,204,0.2)]",
  titleIcon: "h-6 w-6 text-[#00ffcc]",
  titleText: "text-lg sm:text-xl font-black text-white",
  subtitleText: "text-xs text-slate-400 mt-0.5",
  seatSummaryBadge: "inline-flex items-center gap-1.5 rounded-full border border-[#00ffcc]/30 bg-[#00ffcc]/10 px-3 py-1 text-xs font-bold text-[#00ffcc]",
  conceptInfoBox: "rounded-2xl border border-teal-500/25 bg-teal-950/20 p-4 text-xs leading-relaxed text-teal-200/90 flex items-start gap-3",
  conceptInfoIcon: "h-5 w-5 text-[#00ffcc] shrink-0 mt-0.5",
  seatsGrid: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4",
  seatCardOccupied: "relative flex flex-col justify-between overflow-hidden rounded-2xl border border-[#00ffcc]/30 bg-[#0C1527] p-3.5 shadow-lg transition-all duration-300 hover:border-[#00ffcc]/60 hover:shadow-[0_0_20px_rgba(0,255,204,0.15)]",
  seatCardVacant: "relative flex flex-col items-center justify-center min-h-[220px] rounded-2xl border-2 border-dashed border-slate-700 bg-slate-900/40 p-5 text-center transition-all duration-300 hover:border-[#00ffcc]/50 hover:bg-slate-900/70",
  seatBadgeRow: "flex items-center justify-between w-full mb-2.5",
  seatNumberBadge: "font-mono text-[11px] font-black uppercase tracking-wider text-[#00ffcc] bg-[#00ffcc]/10 border border-[#00ffcc]/20 rounded-md px-2 py-0.5",
  seatStatusActive: "inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/50 border border-emerald-500/30 rounded-full px-2 py-0.5",
  seatStatusPaused: "inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-950/50 border border-amber-500/30 rounded-full px-2 py-0.5",
  adImageThumbnailWrapper: "relative w-full aspect-video overflow-hidden rounded-xl border border-white/10 bg-black/60 mb-2.5 group",
  adImageThumbnail: "h-full w-full object-cover transition-transform duration-500 group-hover:scale-105",
  captionBox: "text-xs text-slate-300 font-medium leading-relaxed line-clamp-2 min-h-[36px] mb-3 text-right",
  captionFallback: "text-xs text-slate-500 italic min-h-[36px] mb-3 text-right",
  actionsBar: "flex items-center justify-between border-t border-white/10 pt-2.5 gap-1.5",
  actionBtnEdit: "flex-1 flex items-center justify-center gap-1 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 text-xs font-bold transition active:scale-95 cursor-pointer",
  actionBtnDelete: "flex items-center justify-center h-8 w-8 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-xs font-bold transition active:scale-95 cursor-pointer",
  actionBtnToggle: "flex items-center justify-center h-8 w-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/10 text-xs font-bold transition active:scale-95 cursor-pointer",
  vacantIconBox: "flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-800/80 text-slate-400 mb-3",
  vacantTitle: "text-sm font-bold text-slate-300 mb-1",
  vacantSubtitle: "text-[11px] text-slate-500 max-w-[180px] mb-4",
  vacantAddBtn: "inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-teal-500 to-[#00ffcc] px-3.5 py-2 text-xs font-black text-slate-950 shadow-md shadow-teal-500/20 transition hover:brightness-110 active:scale-95 cursor-pointer",
  modalOverlay: "fixed inset-0 z-[9999] flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-md animate-in fade-in duration-200",
  modalBox: "relative flex flex-col max-h-[90vh] w-full max-w-lg rounded-3xl border border-[#00ffcc]/35 bg-[#070D19] shadow-2xl text-right overflow-hidden",
  modalHeader: "flex items-center justify-between border-b border-white/10 p-5 pb-4 shrink-0 bg-[#070D19]",
  modalBody: "overflow-y-auto p-5 space-y-4 flex-1 overscroll-contain",
  modalTitleText: "text-base sm:text-lg font-black text-white flex items-center gap-2",
  modalCloseBtn: "rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer",
  formGroup: "space-y-1.5",
  formLabel: "block text-xs font-black uppercase tracking-wider text-slate-300",
  formHelper: "text-[11px] text-slate-400",
  seatSelectGrid: "grid grid-cols-4 gap-2",
  seatSelectBtnActive: "py-2 px-1 text-center rounded-xl border border-[#00ffcc] bg-[#00ffcc]/15 text-[#00ffcc] font-black text-xs transition cursor-pointer shadow-sm",
  seatSelectBtnInactive: "py-2 px-1 text-center rounded-xl border border-white/10 bg-white/5 text-slate-300 font-bold text-xs hover:bg-white/10 transition cursor-pointer",
  uploadDropzone: "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-700 hover:border-[#00ffcc]/50 bg-black/30 p-4 text-center cursor-pointer transition",
  uploadIcon: "h-8 w-8 text-[#00ffcc] mb-2",
  uploadTextMain: "text-xs font-bold text-white mb-0.5",
  uploadTextSub: "text-[10px] text-slate-500",
  imagePreviewWrapper: "relative w-full h-44 sm:h-52 rounded-2xl overflow-hidden border border-[#00ffcc]/30 bg-black/90 flex items-center justify-center",
  imagePreviewImg: "h-full w-full object-contain",
  imagePreviewChangeBtn: "absolute bottom-2 right-2 flex items-center gap-1 rounded-lg bg-black/80 px-2.5 py-1 text-[11px] font-bold text-white border border-white/20 hover:bg-black transition cursor-pointer shadow-md",
  captionTextarea: "w-full rounded-2xl border border-slate-800 bg-black/50 px-4 py-2.5 text-xs sm:text-sm font-medium text-white placeholder-slate-500 outline-none transition focus:border-[#00ffcc] focus:ring-1 focus:ring-[#00ffcc] resize-none min-h-[72px]",
  charCounterRow: "flex items-center justify-between text-[11px] text-slate-400 pt-1",
  charCountOk: "font-mono font-bold text-emerald-400",
  charCountWarn: "font-mono font-bold text-amber-400",
  charCountLimit: "font-mono font-bold text-rose-400",
  previewCardWrapper: "rounded-2xl border border-white/10 bg-black/40 p-3",
  previewTitle: "text-[10px] font-black text-[#00ffcc] uppercase tracking-wider mb-2 flex items-center gap-1",
  modalActionsRow: "flex items-center gap-3 p-4 sm:p-5 pt-3 border-t border-white/10 shrink-0 bg-[#070D19]/95 backdrop-blur-sm",
  submitBtn: "flex-1 flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-500 to-[#00ffcc] px-4 py-3 text-xs sm:text-sm font-black text-slate-950 shadow-lg shadow-teal-500/20 transition hover:brightness-110 active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed",
  cancelBtn: "flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-3 text-xs sm:text-sm font-bold text-slate-300 transition cursor-pointer",
  deleteConfirmBox: "rounded-2xl border border-rose-500/40 bg-rose-950/20 p-4 text-center space-y-3",
  deleteConfirmTitle: "text-sm font-black text-rose-300",
  deleteConfirmDesc: "text-xs text-rose-200/80 leading-relaxed",
  deleteConfirmActions: "flex items-center justify-center gap-3 pt-2",
  deleteConfirmBtn: "rounded-xl bg-rose-600 hover:bg-rose-500 px-4 py-2 text-xs font-black text-white transition cursor-pointer",
  deleteCancelBtn: "rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-xs font-bold text-slate-300 transition cursor-pointer",
  seatInputBox: "w-full rounded-2xl border border-slate-800 bg-black/50 px-4 py-2.5 text-xs sm:text-sm font-bold text-white placeholder-slate-500 outline-none transition focus:border-[#00ffcc] focus:ring-1 focus:ring-[#00ffcc]",
  addNewHeaderBtn: "inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-teal-500 to-[#00ffcc] px-3.5 py-1.5 text-xs font-black text-slate-950 shadow-md shadow-teal-500/20 transition hover:brightness-110 active:scale-95 cursor-pointer",
  headerActionsRight: "flex items-center gap-2",
  sparklesIcon: "h-3.5 w-3.5",
  plusIcon: "h-3.5 w-3.5",
  plusIconLarge: "h-6 w-6 text-[#00ffcc]",
  conceptTitleText: "block text-white font-bold mb-0.5",
  statusDot: "h-1.5 w-1.5 rounded-full bg-current",
  pencilIcon: "h-3.5 w-3.5",
  pauseIconAmber: "h-3.5 w-3.5 text-amber-400",
  playIconEmerald: "h-3.5 w-3.5 text-emerald-400",
  trashIcon: "h-3.5 w-3.5",
  trashIconLarge: "h-8 w-8 text-rose-400 mx-auto",
  modalTitleIcon: "h-5 w-5 text-[#00ffcc]",
  modalCloseIcon: "h-5 w-5",
  seatInputRow: "flex items-center gap-2",
  seatNumberPreviewBadge: "text-xs font-mono text-[#00ffcc] font-bold shrink-0",
  uploadMiniIcon: "h-3 w-3",
  hiddenFileInput: "hidden",
  errorMessageText: "text-xs text-rose-400 font-bold mt-1",
  captionHeaderRow: "flex items-center justify-between",
  previewEyeIcon: "h-3 w-3",
  previewContentRow: "flex items-center gap-3",
  previewThumbWrapper: "h-14 w-20 shrink-0 rounded-lg overflow-hidden border border-white/20",
  previewThumbImg: "h-full w-full object-cover",
  previewInfoCol: "min-w-0 flex-1 text-right",
  previewSeatText: "text-[10px] font-mono text-[#00ffcc] block",
  previewCaptionText: "text-xs text-white font-bold truncate",
  submitBtnIcon: "h-4 w-4",
  deleteConfirmModalBox: "relative w-full max-w-sm rounded-3xl border border-rose-500/40 bg-[#070D19] p-5 shadow-2xl text-center",
} as const;

interface CaptainAdsSeatsManagerProps {
  user: User | null;
  language?: 'ar' | 'en';
}

export function CaptainAdsSeatsManager({ user, language = 'ar' }: CaptainAdsSeatsManagerProps) {
  const t = useTranslations('captainAds');
  const isArabic = language === 'ar';
  const captainId = user?.uid || 'current_captain';
  const fileInputId = useId();

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

  // حالة باقة الإعلانات (باقة الخدمات / A per Page 5 & 6)
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

  // تحديث قائمة الإعلانات من السيرفر (Backend API)
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

  // فتح نافذة الإضافة لمقعد شاغر
  const handleOpenAddForSeat = (seatNum: number) => {
    setEditingAd(null);
    setSelectedSeatNumber(seatNum);
    setImageUrl('');
    setCaption('');
    setImageError('');
    setCaptionError('');
    setIsModalOpen(true);
  };

  // فتح نافذة التعديل لإعلان موجود
  const handleOpenEdit = (ad: CaptainAdItem) => {
    setEditingAd(ad);
    setSelectedSeatNumber(ad.seatNumber);
    setImageUrl(ad.imageUrl);
    setCaption(ad.caption || '');
    setImageError('');
    setCaptionError('');
    setIsModalOpen(true);
  };

  // معالجة اختيار ملف صورة
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

  // معالجة تغيير نص الإعلان والتحقق من الحد (100 حرف)
  const handleCaptionChange = (val: string) => {
    // تقييد الحروف بمتغير الحد الأقصى
    const trimmedVal = val.slice(0, CAPTAIN_ADS_CONFIG.MAX_CAPTION_LENGTH);
    setCaption(trimmedVal);
    const validation = validateAdCaption(trimmedVal);
    if (!validation.valid) {
      setCaptionError(validation.error || '');
    } else {
      setCaptionError('');
    }
  };

  // حفظ الإعلان في الباك إند
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

  // تنفيذ الحذف من الباك إند
  const handleConfirmDelete = async () => {
    if (adToDelete) {
      await deleteCaptainAd(captainId, adToDelete.id);
      setAdToDelete(null);
      await refreshAds();
    }
  };

  // تبديل حالة التفعيل في الباك إند
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

  return (
    <div className="w-full pt-3.5 border-t border-white/10" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* شريط زري باقة الإعلانات وإدارة الإعلانات (داخل القائمة المنسدلة للرصيد) */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* 1. زر اختار باقة اعلانك (متاح دائماً ويفتح نافذة الباقة وحصص النشر) */}
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

        {/* 2. زر ارفع وعدل اعلانك - لا يكون موجوداً إلا بعد اختيار باقة ودفعها وتفعيلها تماماً من الأدمن */}
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

      {/* 1. نافذة منبثقة (Popup): "إدارة النشر وترويج إعلاناتك المعروضة للمستخدمين في المحيط" */}
      {mounted && isAdsManagerModalOpen
        ? createPortal(
            <div className={styles.modalOverlay} role="dialog" aria-modal="true" dir={isArabic ? 'rtl' : 'ltr'}>
              <div className="relative flex flex-col max-h-[92vh] w-full max-w-4xl rounded-3xl border border-[#00ffcc]/40 bg-[#070D19] shadow-2xl text-start overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-white/10 p-5 pb-4 bg-[#070D19] shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-teal-500/30 bg-teal-500/10 text-[#00ffcc] shadow-[0_0_15px_rgba(0,255,204,0.15)]">
                      <Tv className="h-5 w-5 text-[#00ffcc]" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-white">
                        {isArabic ? 'إدارة النشر وترويج إعلاناتك المعروضة للمستخدمين في المحيط' : 'Manage & Promote Your Ads in Area'}
                      </h3>
                      <p className="text-xs text-slate-400 font-sans mt-0.5 leading-relaxed">
                        {isArabic
                          ? 'تظهر إعلاناتك الترويجية على بطاقتك على شاشة تفاصيل الرحلة فور قبول عرضك، تلقائياً'
                          : 'Your promotional ads appear on your card on the trip details screen upon accepting your offer, automatically'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#00ffcc]/30 bg-[#00ffcc]/10 px-3 py-1 text-xs font-bold text-[#00ffcc]">
                      <Sparkles className="h-3.5 w-3.5" />
                      <span>{ads.length} / 3</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAdsManagerModalOpen(false)}
                      className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                      title={isArabic ? 'إغلاق' : 'Close'}
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Modal Body: Seats Grid */}
                <div className="overflow-y-auto p-5 space-y-4 flex-1 overscroll-contain">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
                              onError={handleImageError}
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

                        {/* Actions bar */}
                        <div className={styles.actionsBar}>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(ad)}
                            className={styles.actionBtnEdit}
                            title={t('editAd')}
                          >
                            <Pencil className={styles.pencilIcon} />
                            <span>{t('edit')}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleStatus(ad)}
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
                            onClick={() => setAdToDelete(ad)}
                            className={styles.actionBtnDelete}
                            title={t('deleteAd')}
                          >
                            <Trash2 className={styles.trashIcon} />
                          </button>
                        </div>
                      </div>
                    ))}

                    {/* Vacant seats (up to 3) */}
                    {ads.length < 3 && (
                      <div className={styles.seatCardVacant}>
                        <div className={styles.vacantIconBox}>
                          <Plus className={styles.plusIconLarge} />
                        </div>
                        <h3 className={styles.vacantTitle}>
                          {t('newAd')} ({ads.length + 1} / 3)
                        </h3>
                        <p className={styles.vacantSubtitle}>
                          {isArabic ? 'مساحة متاحة ضمن باقة الخدمات / A' : t('availableSlot')}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleOpenAddForSeat(nextSeatNumber)}
                          className={styles.vacantAddBtn}
                        >
                          <Plus className={styles.plusIcon} />
                          <span>{isArabic ? 'ارفع وعدل اعلانك' : t('addNewAd')}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-4 sm:p-5 border-t border-white/10 bg-[#070D19]/95 flex items-center justify-between shrink-0">
                  <div className="text-xs text-slate-400 font-sans">
                    {isArabic
                      ? 'الحد الأقصى 3 إعلانات ترويجية نشطة ضمن باقة الخدمات / A'
                      : 'Max 3 promotional ads within Services Package A'}
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsAdsManagerModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 transition cursor-pointer"
                  >
                    {isArabic ? 'إغلاق' : 'Close'}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {/* نافذة إنشاء / تعديل الإعلان خارج البوكس بالكامل */}
      {mounted && isModalOpen
        ? createPortal(
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
                    onClick={() => setIsModalOpen(false)}
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
                          onError={handleImageError}
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
                      onChange={handleImageFileChange}
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
                      onChange={(e) => handleCaptionChange(e.target.value)}
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
                    onClick={handleSaveAd}
                    disabled={!imageUrl || Boolean(captionError)}
                    className={styles.submitBtn}
                  >
                    <CheckCircle2 className={styles.submitBtnIcon} />
                    <span>{editingAd ? t('updateAdBtn') : t('savePublishBtn')}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className={styles.cancelBtn}
                  >
                    {t('cancelBtn')}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {/* نافذة تأكيد الحذف خارج البوكس بالكامل */}
      {mounted && adToDelete
        ? createPortal(
            <div className={styles.modalOverlay} role="dialog" aria-modal="true" dir={isArabic ? 'rtl' : 'ltr'}>
              <div className={styles.deleteConfirmModalBox}>
                <div className={styles.deleteConfirmBox}>
                  <Trash2 className={styles.trashIconLarge} />
                  <h4 className={styles.deleteConfirmTitle}>
                    {t('deleteConfirmTitle')}
                  </h4>
                  <p className={styles.deleteConfirmDesc}>
                    {t('deleteConfirmDesc')}
                  </p>
                  <div className={styles.deleteConfirmActions}>
                    <button
                      type="button"
                      onClick={handleConfirmDelete}
                      className={styles.deleteConfirmBtn}
                    >
                      {t('deleteConfirmYes')}
                    </button>
                    <button
                      type="button"
                      onClick={() => setAdToDelete(null)}
                      className={styles.deleteCancelBtn}
                    >
                      {t('deleteConfirmNo')}
                    </button>
                  </div>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}

      {/* 3. نافذة "شاشة اختار باقة اعلانك - باقة الخدمات / A" (Page 6) */}
      {mounted && isPackageModalOpen
        ? createPortal(
            <div className={styles.modalOverlay} role="dialog" aria-modal="true" dir={isArabic ? 'rtl' : 'ltr'}>
              <div className="relative flex flex-col max-h-[92vh] w-full max-w-lg rounded-3xl border border-[#00ffcc]/40 bg-[#070D19] shadow-2xl text-start overflow-hidden">
                {/* Modal Header */}
                <div className="flex items-center justify-between border-b border-white/10 p-5 pb-4 bg-[#070D19] shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-teal-500/30 bg-teal-500/10 text-[#00ffcc] shadow-[0_0_15px_rgba(0,255,204,0.15)]">
                      <Sparkles className="h-5 w-5 text-[#00ffcc]" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base sm:text-lg font-black text-white">
                          {isArabic ? 'اشتري حصص النشر في محيطك وعلن عن نفسك' : 'Buy Ad Quotas in Your Area'}
                        </h3>
                        <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full border border-teal-500/30 bg-teal-500/10 text-[#00ffcc] text-[11px] font-bold">
                          {isArabic ? 'باقة الخدمات / A' : 'Services Package A'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 font-sans mt-0.5">
                        {isArabic ? 'عند زر الدخول يختار الباقة ثم ينتقل الى وسيلة الدفع واختيار وسيلة' : 'Choose package then proceed to payment channel'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPackageModalOpen(false)}
                    className="rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Modal Body: 8 Exact Specs from Page 6 */}
                <div className="overflow-y-auto p-5 space-y-2.5 flex-1 overscroll-contain">
                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                    <Radio className="h-5 w-5 text-[#00ffcc] shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block font-black text-xs sm:text-sm">
                        {isArabic ? 'الانتشار:' : 'Coverage:'}
                      </strong>
                      <span className="text-slate-300 text-xs font-medium leading-relaxed font-sans">
                        {isArabic ? 'عرض البطاقة الإعلانية والتعريفية 500 متر بالمحيط، إدارة الاختيار تصفية فرص.' : 'Display ad card in 500m perimeter, opportunity filter.'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                    <Clock className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block font-black text-xs sm:text-sm">
                        {isArabic ? 'مدة البث الإعلاني:' : 'Duration & Quota:'}
                      </strong>
                      <span className="text-slate-300 text-xs font-medium leading-relaxed font-sans">
                        {isArabic ? '30 يوم / بوست إعلاني العدد 3 (قياس).' : '30 days broadcast / 3 ad posts (standard).'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                    <BarChart3 className="h-5 w-5 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block font-black text-xs sm:text-sm">
                        {isArabic ? 'مؤشرات السوق الاسترشادية:' : 'Market Indicators:'}
                      </strong>
                      <span className="text-slate-300 text-xs font-medium leading-relaxed font-sans">
                        {isArabic ? 'إظهار قيم العروض ومؤشرات توازن السوق الحية.' : 'Display live offer values and market trends.'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                    <Star className="h-5 w-5 text-yellow-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block font-black text-xs sm:text-sm">
                        {isArabic ? 'التقييم المتبادل:' : 'Mutual Rating:'}
                      </strong>
                      <span className="text-slate-300 text-xs font-medium leading-relaxed font-sans">
                        {isArabic ? 'تقييم الإعلان والخدمة المعلنة لتعزيز الموثوقية.' : 'Rating for the advertisement and advertised service.'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                    <Users2 className="h-5 w-5 text-blue-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block font-black text-xs sm:text-sm">
                        {isArabic ? 'للتعامل:' : 'Interactions:'}
                      </strong>
                      <span className="text-slate-300 text-xs font-medium leading-relaxed font-sans">
                        {isArabic ? 'قوائم الكباتن المفضلين وبناء قاعدة عملاء دائمين.' : 'Favorite captain lists and permanent customer base.'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                    <ShieldCheck className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block font-black text-xs sm:text-sm">
                        {isArabic ? 'إدارة الاختيار والرفض المستقل:' : 'Independent Control:'}
                      </strong>
                      <span className="text-slate-300 text-xs font-medium leading-relaxed font-sans">
                        {isArabic ? 'تصفية فرص التواصل والطلبات بحرية تامة دون قيود.' : 'Filter contact and request opportunities independently.'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                    <Database className="h-5 w-5 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block font-black text-xs sm:text-sm">
                        {isArabic ? 'توفير ذاكرة إحصائية:' : 'Statistical Memory:'}
                      </strong>
                      <span className="text-slate-300 text-xs font-medium leading-relaxed font-sans">
                        {isArabic ? 'سجل إحصائي كامل للنشاط والتفاعل المحيطي.' : 'Precise activity and engagement records.'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                    <MapPin className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                    <div>
                      <strong className="text-white block font-black text-xs sm:text-sm">
                        {isArabic ? 'الظهور الإعلاني المكاني:' : 'Geographical Coverage:'}
                      </strong>
                      <span className="text-slate-300 text-xs font-medium leading-relaxed font-sans">
                        {isArabic ? 'اللواء خارج المحافظة (مكان التواجد الفعلي للكابتن).' : 'District coverage outside the governorate.'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="p-4 sm:p-5 border-t border-white/10 bg-[#070D19]/95 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleGoToPayment}
                    className="flex-1 inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-teal-500 to-[#00ffcc] px-4 py-3 text-xs sm:text-sm font-black text-slate-950 shadow-lg shadow-teal-500/20 hover:brightness-110 active:scale-95 transition cursor-pointer"
                  >
                    <CreditCard className="h-4 w-4" />
                    <span>{isArabic ? 'الانتقال الى وسيلة الدفع واختيار وسيلة' : 'Proceed to Payment Channel'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleActivatePackage}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/15 hover:bg-emerald-500/25 px-4 py-3 text-xs sm:text-sm font-black text-emerald-300 transition cursor-pointer"
                    title={isArabic ? 'تفعيل فوري للباقة' : 'Activate now'}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{isArabic ? 'تأكيد وتفعيل الباقة' : 'Activate Package'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPackageModalOpen(false)}
                    className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-3 text-xs sm:text-sm font-bold text-slate-300 transition cursor-pointer"
                  >
                    {isArabic ? 'رجوع' : 'Back'}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
