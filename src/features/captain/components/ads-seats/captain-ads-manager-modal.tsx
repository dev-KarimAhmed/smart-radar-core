'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import {
  Tv,
  Sparkles,
  X,
  Pencil,
  Pause,
  Play,
  Trash2,
  Plus,
} from 'lucide-react';
import type { CaptainAdItem } from '../../services/captain-ads-service';
import { styles } from './captain-ads-styles';
import { TIER_CAPABILITIES, normalizeTierRank } from '@/core/logic/driver-tier';

interface CaptainAdsManagerModalProps {
  mounted: boolean;
  isOpen: boolean;
  isArabic: boolean;
  ads: CaptainAdItem[];
  nextSeatNumber: number;
  captainRank?: string;
  t: (key: string) => string;
  onClose: () => void;
  onOpenEdit: (ad: CaptainAdItem) => void;
  onToggleStatus: (ad: CaptainAdItem) => void;
  onDeleteClick: (ad: CaptainAdItem) => void;
  onOpenAddForSeat: (seatNum: number) => void;
  onImageError: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
}

export function CaptainAdsManagerModal({
  mounted,
  isOpen,
  isArabic,
  ads,
  nextSeatNumber,
  captainRank,
  t,
  onClose,
  onOpenEdit,
  onToggleStatus,
  onDeleteClick,
  onOpenAddForSeat,
  onImageError,
}: CaptainAdsManagerModalProps) {
  if (!mounted || !isOpen) return null;

  const rankTier = normalizeTierRank(captainRank);
  const capability = TIER_CAPABILITIES[rankTier];
  const maxCapStr = capability.isFlexibleCapacity ? (isArabic ? 'مرنة' : 'Flex') : `${capability.adCapacityMax}`;

  return createPortal(
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
                {isArabic ? 'ارفع وانشر إعلاناتك الترويجية في محيطك' : 'Upload & Promote Your Local Ads'}
              </h3>
              <p className="text-xs text-slate-400 font-sans mt-0.5 leading-relaxed">
                {isArabic
                  ? `سعة المحفظة الإعلانية لرتبة ${capability.nameAr} (${capability.adCapacityMin}–${capability.isFlexibleCapacity ? 'سعة مرنة' : capability.adCapacityMax} إعلانات نشطة)`
                  : `Ad vault capacity for ${capability.nameEn} tier (${capability.adCapacityMin}–${capability.isFlexibleCapacity ? 'Flexible' : capability.adCapacityMax} ads)`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#00ffcc]/30 bg-[#00ffcc]/10 px-3 py-1 text-xs font-bold text-[#00ffcc]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>{ads.length} / {maxCapStr}</span>
            </span>
            <button
              type="button"
              onClick={onClose}
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

            {ads.length < 3 && (
              <div className={styles.seatCardVacant}>
                <div className={styles.vacantIconBox}>
                  <Plus className={styles.plusIconLarge} />
                </div>
                <h3 className={styles.vacantTitle}>
                  {t('newAd')} ({ads.length + 1} / 3)
                </h3>
                <p className={styles.vacantSubtitle}>
                  {isArabic ? 'مساحة متاحة لإعلانك الترويجي' : t('availableSlot')}
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
            )}
          </div>
        </div>

        <div className="p-4 sm:p-5 border-t border-white/10 bg-[#070D19]/95 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400 font-sans">
            {isArabic
              ? 'الحد الأقصى 3 إعلانات ترويجية نشطة'
              : 'Max 3 active promotional ads'}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 text-xs font-bold text-slate-300 transition cursor-pointer"
          >
            {isArabic ? 'إغلاق' : 'Close'}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
