'use client';

import React, { useState } from 'react';
import { AlertOctagon, Heart, Star, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { useToast } from '@/hooks/use-toast';
import { dexieDb } from '@/lib/dexie-db';
import type { AppLanguage } from '@/lib/i18n/simple-copy';

import { cn } from '@/lib/utils';
const styles = {
  style215_1: "max-h-[92vh] w-[95%] overflow-y-auto rounded-3xl border-white/[0.06] bg-[#0A0F1D]/95 px-6 pb-8 pt-10 text-white backdrop-blur-xl sm:max-w-md",
  style218_2: "mt-2 flex flex-row items-center justify-between border-b border-white/5 pb-2",
  style218_3: "text-right",
  style218_4: "text-left",
  style220_5: "text-xl font-black text-white",
  style221_6: "mt-1 text-gray-400",
  style223_7: "rounded-full p-1 text-slate-400 transition-colors hover:bg-white/5 hover:text-white",
  style224_8: "h-5 w-5",
  style228_9: "space-y-6 py-4",
  style247_10: "flex w-full items-center justify-between gap-3 rounded-2xl border p-4 text-start transition-all",
  style249_11: "border-[#14B8A6]/70 bg-[#14B8A6]/15 shadow-[0_0_18px_rgba(20,184,166,0.22)]",
  style250_12: "border-white/10 bg-white/[0.04] hover:border-[#14B8A6]/40 hover:bg-[#14B8A6]/10",
  style254_13: "flex min-w-0 flex-col",
  style255_14: "text-sm font-black text-white",
  style258_15: "mt-1 text-xs leading-relaxed text-slate-400",
  style263_16: "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border transition-all",
  style265_17: "border-[#14B8A6] bg-[#14B8A6] text-[#0A0F1D]",
  style266_18: "border-white/10 bg-black/20 text-slate-400",
  style269_19: "h-5 w-5",
  style269_20: "fill-current",
  style273_21: "space-y-2",
  style274_22: "text-sm font-bold text-white",
  style280_23: "w-full resize-none rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white placeholder-slate-500 backdrop-blur-sm transition-all focus:border-[#14B8A6] focus:outline-none focus:ring-1 focus:ring-[#14B8A6]",
  style285_24: "space-y-3 pt-2",
  style288_25: "h-12 w-full rounded-xl bg-[#14B8A6] text-base font-black text-[#0A0F1D] transition-all hover:bg-[#2DD4BF]",
  style301_26: "mb-2 flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 py-3 text-sm font-bold text-red-400 transition-colors hover:bg-red-500/20",
  style303_27: "h-4 w-4",
  style307_28: "mb-2 space-y-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4",
  style308_29: "text-center text-xs font-bold leading-relaxed text-red-200",
  style309_30: "flex gap-2.5",
  style312_31: "h-10 flex-1 rounded-lg text-xs font-bold",
  style320_32: "h-10 flex-1 rounded-lg border-white/10 bg-white/5 text-xs font-bold text-white hover:bg-white/10",
  style349_33: "space-y-3",
  style350_34: "text-sm font-bold text-white",
  style351_35: "grid grid-cols-5 gap-2 rounded-2xl border border-white/10 bg-white/5 p-3.5",
  style359_36: "flex flex-col items-center justify-start text-center",
  style363_37: "cursor-pointer p-1 transition-transform duration-200 active:scale-90",
  style366_38: "h-8 w-8 transition-all duration-300",
  style366_39: "fill-none text-slate-600/40",
  style368_40: "mt-2 line-clamp-3 max-w-[64px] text-[10px] font-medium leading-tight text-slate-400",
  activeAmber: "fill-amber-400 text-amber-400 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]",
  activeTeal: "fill-[#14B8A6] text-[#14B8A6] drop-shadow-[0_0_8px_rgba(20,245,213,0.6)]",
} as const;


interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripId: string;
  captainId: string;
  reviewerId: string;
  supabase: any;
  onSuccess: () => void;
  captainName?: string;
  captainPhone?: string;
  captainRank?: 'PLATINUM' | 'GOLD' | 'SILVER' | 'BRONZE';
  vehicleInfo?: string;
  finalPrice?: number;
}

type VehicleRatingKey = 'cleanliness' | 'ac' | 'comfort' | 'quietness' | 'safety';
type CaptainRatingKey = 'behavior' | 'driving' | 'punctuality' | 'routing' | 'communication';

const initialVehicleRatings: Record<VehicleRatingKey, boolean> = {
  cleanliness: false,
  ac: false,
  comfort: false,
  quietness: false,
  safety: false,
};

const initialCaptainRatings: Record<CaptainRatingKey, boolean> = {
  behavior: false,
  driving: false,
  punctuality: false,
  routing: false,
  communication: false,
};

export function RatingModal({
  isOpen,
  onClose,
  tripId,
  captainId,
  reviewerId,
  supabase,
  onSuccess,
  captainName,
  captainPhone,
  captainRank = 'BRONZE',
  vehicleInfo,
  finalPrice = 0,
}: RatingModalProps) {
  const { toast } = useToast();
  const { language, isArabic } = useDashboardLanguage();
  const copy = ratingModalCopy[language] as typeof ratingModalCopy.en;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [comment, setComment] = useState('');
  const [saveFavorite, setSaveFavorite] = useState(false);
  const [vehicle, setVehicle] = useState(initialVehicleRatings);
  const [captain, setCaptain] = useState(initialCaptainRatings);

  React.useEffect(() => {
    if (!isOpen) return;
    setSaveFavorite(false);
    setConfirmBlock(false);
    setComment('');
    setVehicle(initialVehicleRatings);
    setCaptain(initialCaptainRatings);
  }, [isOpen, tripId]);

  const handleToggleVehicle = (key: VehicleRatingKey) => {
    setVehicle((previous) => ({ ...previous, [key]: !previous[key] }));
  };

  const handleToggleCaptain = (key: CaptainRatingKey) => {
    setCaptain((previous) => ({ ...previous, [key]: !previous[key] }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const detailedStarsPayload = {
        vehicle: Object.fromEntries(Object.entries(vehicle).map(([key, value]) => [key, value ? 1 : 0])),
        captain: Object.fromEntries(Object.entries(captain).map(([key, value]) => [key, value ? 1 : 0])),
      };

      const { error } = await supabase.from('reviews').insert({
        trip_id: tripId,
        reviewer_id: reviewerId,
        reviewee_id: captainId,
        detailed_stars: detailedStarsPayload,
        comment: comment.trim() || null,
      });

      if (error) throw error;

      if (saveFavorite) {
        const favoritePayload = {
          tripId,
          captainId,
          driverId: captainId,
          captainName: captainName?.trim() || copy.defaultCaptainName,
          captainRank,
          captainPhone: captainPhone || '',
          vehicleInfo: vehicleInfo || copy.notAvailable,
          finalPrice: Number(finalPrice) || 0,
          timestamp: Date.now(),
          heartedAt: Date.now(),
        };

        const existing = await dexieDb.favoriteCaptains.where('tripId').equals(tripId).first();
        if (existing?.id !== undefined) {
          await dexieDb.favoriteCaptains.update(existing.id, favoritePayload as any);
        } else {
          await dexieDb.favoriteCaptains.add(favoritePayload as any);
        }

        window.localStorage.setItem(
          `radar_preferred_captain_${captainId}`,
          JSON.stringify({
            captainId,
            driverId: captainId,
            captainName: favoritePayload.captainName,
            fullName: favoritePayload.captainName,
            captainPhone: favoritePayload.captainPhone,
            phoneNumber: favoritePayload.captainPhone,
            vehicleSpecs: favoritePayload.vehicleInfo,
            savedTimestamp: Date.now(),
          }),
        );
      }

      toast({
        title: saveFavorite ? copy.submitAndFavoriteSuccessTitle : copy.submitSuccessTitle,
        description: saveFavorite ? copy.submitAndFavoriteSuccessDescription : copy.submitSuccessDescription,
      });

      onSuccess();
    } catch (error: any) {
      if ((process.env.NODE_ENV !== 'production')) console.error('[Rating Modal] Submit rating error:', error);
      toast({
        variant: 'destructive',
        title: copy.submitErrorTitle,
        description: error?.message || copy.submitErrorDescription,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBlockDriver = async () => {
    setIsBlocking(true);
    try {
      const { error } = await supabase.from('user_blocks').insert({
        blocker_id: reviewerId,
        blocked_id: captainId,
      });

      if (error) throw error;

      toast({
        title: copy.blockSuccessTitle,
        description: copy.blockSuccessDescription,
      });

      onSuccess();
    } catch (error: any) {
      if ((process.env.NODE_ENV !== 'production')) console.error('[Rating Modal] Block driver error:', error);
      toast({
        variant: 'destructive',
        title: copy.blockErrorTitle,
        description: error?.message || copy.blockErrorDescription,
      });
    } finally {
      setIsBlocking(false);
      setConfirmBlock(false);
    }
  };

  const vehicleCriteria = [
    { key: 'cleanliness' as const, label: copy.vehicleCleanliness },
    { key: 'ac' as const, label: copy.vehicleAc },
    { key: 'comfort' as const, label: copy.vehicleComfort },
    { key: 'quietness' as const, label: copy.vehicleQuietness },
    { key: 'safety' as const, label: copy.vehicleSafety },
  ];

  const captainCriteria = [
    { key: 'behavior' as const, label: copy.captainBehavior },
    { key: 'driving' as const, label: copy.captainDriving },
    { key: 'punctuality' as const, label: copy.captainPunctuality },
    { key: 'routing' as const, label: copy.captainRouting },
    { key: 'communication' as const, label: copy.captainCommunication },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={styles.style215_1}
        dir={isArabic ? 'rtl' : 'ltr'}
      >
        <DialogHeader className={cn(styles.style218_2, isArabic ? styles.style218_3 : styles.style218_4)}>
          <div>
            <DialogTitle className={styles.style220_5}>{copy.title}</DialogTitle>
            <DialogDescription className={styles.style221_6}>{copy.description}</DialogDescription>
          </div>
          <button onClick={onClose} className={styles.style223_7}>
            <X className={styles.style224_8} />
          </button>
        </DialogHeader>

        <div className={styles.style228_9}>
          <RatingCriteriaSection
            title={copy.vehicleSection}
            items={vehicleCriteria}
            values={vehicle}
            accent="amber"
            onToggle={handleToggleVehicle}
          />
          <RatingCriteriaSection
            title={copy.captainSection}
            items={captainCriteria}
            values={captain}
            accent="teal"
            onToggle={handleToggleCaptain}
          />

          <button
            type="button"
            onClick={() => setSaveFavorite((value) => !value)}
            className={cn(styles.style247_10, saveFavorite
                ? styles.style249_11
                : styles.style250_12)}
            aria-pressed={saveFavorite}
          >
            <div className={styles.style254_13}>
              <span className={styles.style255_14}>
                {saveFavorite ? copy.favoriteWillSave : copy.favoriteSave}
              </span>
              <span className={styles.style258_15}>
                {captainName ? copy.favoriteDescription(captainName) : copy.favoriteFallbackDescription}
              </span>
            </div>
            <span
              className={cn(styles.style263_16, saveFavorite
                  ? styles.style265_17
                  : styles.style266_18)}
            >
              <Heart className={cn(styles.style269_19, saveFavorite ? styles.style269_20 : '')} />
            </span>
          </button>

          <div className={styles.style273_21}>
            <Label className={styles.style274_22}>{copy.commentLabel}</Label>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder={copy.commentPlaceholder}
              rows={3}
              className={styles.style280_23}
            />
          </div>
        </div>

        <div className={styles.style285_24}>
          {!confirmBlock ? (
            <Button
              className={styles.style288_25}
              disabled={isSubmitting || isBlocking}
              onClick={handleSubmit}
            >
              {isSubmitting ? copy.submitting : copy.submit}
            </Button>
          ) : null}

          {!confirmBlock ? (
            <button
              type="button"
              disabled={isSubmitting || isBlocking}
              onClick={() => setConfirmBlock(true)}
              className={styles.style301_26}
            >
              <AlertOctagon className={styles.style303_27} />
              {copy.blockDriver}
            </button>
          ) : (
            <div className={styles.style307_28}>
              <p className={styles.style308_29}>{copy.blockConfirm}</p>
              <div className={styles.style309_30}>
                <Button
                  variant="destructive"
                  className={styles.style312_31}
                  disabled={isBlocking}
                  onClick={handleBlockDriver}
                >
                  {isBlocking ? copy.blocking : copy.confirmBlock}
                </Button>
                <Button
                  variant="outline"
                  className={styles.style320_32}
                  disabled={isBlocking}
                  onClick={() => setConfirmBlock(false)}
                >
                  {copy.back}
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function RatingCriteriaSection<T extends string>({
  title,
  items,
  values,
  accent,
  onToggle,
}: {
  title: string;
  items: Array<{ key: T; label: string }>;
  values: Record<T, boolean>;
  accent: 'amber' | 'teal';
  onToggle: (key: T) => void;
}) {
  return (
    <div className={styles.style349_33}>
      <Label className={styles.style350_34}>{title}</Label>
      <div className={styles.style351_35}>
        {items.map((item) => {
          const isActive = values[item.key];
          const activeClass = accent === 'amber' ? styles.activeAmber : styles.activeTeal;

          return (
            <div key={item.key} className={styles.style359_36}>
              <button
                type="button"
                onClick={() => onToggle(item.key)}
                className={styles.style363_37}
                aria-pressed={isActive}
              >
                <Star className={cn(styles.style366_38, isActive ? activeClass : styles.style366_39)} />
              </button>
              <span className={styles.style368_40}>
                {item.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const ratingModalCopy = {
  ar: {
    title: 'قيّم الرحلة',
    description: 'يساعدنا تقييمك على تحسين الخدمة.',
    vehicleSection: 'تقييم المركبة والسيارة',
    captainSection: 'تقييم السائق',
    vehicleCleanliness: 'نظافة السيارة',
    vehicleAc: 'التكييف',
    vehicleComfort: 'راحة المقاعد',
    vehicleQuietness: 'هدوء المركبة',
    vehicleSafety: 'السلامة',
    captainBehavior: 'الاحترام',
    captainDriving: 'القيادة الآمنة',
    captainPunctuality: 'الالتزام بالوقت',
    captainRouting: 'اختيار المسار',
    captainCommunication: 'التواصل',
    favoriteSave: 'حفظ السائق في المفضلين',
    favoriteWillSave: 'سيتم حفظ السائق في المفضلين',
    favoriteDescription: (name: string) => `احفظ ${name} لتفضيله في الرحلات القادمة.`,
    favoriteFallbackDescription: 'احفظ هذا السائق لتفضيله في الرحلات القادمة.',
    commentLabel: 'ملاحظات إضافية (اختياري)',
    commentPlaceholder: 'اكتب رأيك في السائق والرحلة...',
    submit: 'إرسال التقييم',
    submitting: 'جاري إرسال التقييم...',
    blockDriver: 'حظر هذا السائق',
    blockConfirm: 'هل أنت متأكد من حظر هذا السائق؟ لن تظهر لك عروضه مرة أخرى.',
    blocking: 'جاري الحظر...',
    confirmBlock: 'نعم، تأكيد الحظر',
    back: 'تراجع',
    submitSuccessTitle: 'تم إرسال التقييم بنجاح',
    submitSuccessDescription: 'شكراً لك. يساعدنا تقييمك على تحسين الخدمة.',
    submitAndFavoriteSuccessTitle: 'تم إرسال التقييم وحفظ السائق',
    submitAndFavoriteSuccessDescription: 'تم حفظ السائق في قائمتك المفضلة للرحلات القادمة.',
    submitErrorTitle: 'تعذر حفظ التقييم',
    submitErrorDescription: 'حدث خطأ غير متوقع أثناء حفظ تقييمك.',
    blockSuccessTitle: 'تم حظر السائق',
    blockSuccessDescription: 'لن تظهر لك عروض هذا السائق مرة أخرى.',
    blockErrorTitle: 'تعذر حظر السائق',
    blockErrorDescription: 'حدث خطأ غير متوقع أثناء حظر السائق.',
    defaultCaptainName: 'سائق',
    notAvailable: 'غير متاح',
  },
  en: {
    title: 'Rate your trip',
    description: 'Your feedback helps us improve the service.',
    vehicleSection: 'Vehicle rating',
    captainSection: 'Captain rating',
    vehicleCleanliness: 'Cleanliness',
    vehicleAc: 'Air conditioning',
    vehicleComfort: 'Seat comfort',
    vehicleQuietness: 'Quiet ride',
    vehicleSafety: 'Safety',
    captainBehavior: 'Respect',
    captainDriving: 'Safe driving',
    captainPunctuality: 'Punctuality',
    captainRouting: 'Route choice',
    captainCommunication: 'Communication',
    favoriteSave: 'Save captain as preferred',
    favoriteWillSave: 'Captain will be saved as preferred',
    favoriteDescription: (name: string) => `Save ${name} for future trips.`,
    favoriteFallbackDescription: 'Save this captain for future trips.',
    commentLabel: 'Additional notes (optional)',
    commentPlaceholder: 'Write your feedback about the captain and trip...',
    submit: 'Submit rating',
    submitting: 'Submitting rating...',
    blockDriver: 'Block this captain',
    blockConfirm: 'Are you sure you want to block this captain? Their offers will not appear again.',
    blocking: 'Blocking...',
    confirmBlock: 'Yes, block captain',
    back: 'Back',
    submitSuccessTitle: 'Rating submitted',
    submitSuccessDescription: 'Thank you. Your feedback helps us improve the service.',
    submitAndFavoriteSuccessTitle: 'Rating submitted and captain saved',
    submitAndFavoriteSuccessDescription: 'The captain was saved as preferred for future trips.',
    submitErrorTitle: 'Could not save rating',
    submitErrorDescription: 'An unexpected error occurred while saving your rating.',
    blockSuccessTitle: 'Captain blocked',
    blockSuccessDescription: 'This captain’s offers will not appear again.',
    blockErrorTitle: 'Could not block captain',
    blockErrorDescription: 'An unexpected error occurred while blocking this captain.',
    defaultCaptainName: 'Captain',
    notAvailable: 'Not available',
  },
} satisfies Record<AppLanguage, Record<string, string | ((value: string) => string)>>;
