'use client';

import React, { useState } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { styles } from './rating/driver-rating-modal.styles';
import { driverRatingModalCopy } from './rating/driver-rating-modal.copy';
import {
  CriterionVerdict,
  DriverRatingModalProps,
  RiderRatingKey,
  initialRiderRatings,
} from './rating/driver-rating-modal.types';
import { DriverRatingCriteria } from './rating/driver-rating-criteria';
import { DriverRatingBlock } from './rating/driver-rating-block';
import { setCaptainFavoriteRider, isCaptainFavoriteRider } from '@/features/referral/services/captain-referral';

export type { CriterionVerdict, DriverRatingModalProps, RiderRatingKey };
export { driverRatingModalCopy };

export function DriverRatingModal({
  isOpen,
  onClose,
  language,
  tripId,
  riderId,
  captainId,
  supabase,
  onSuccess,
  riderName,
}: DriverRatingModalProps) {
  const { toast } = useToast();
  const isArabic = language === 'ar';
  const copy = driverRatingModalCopy[language];
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [comment, setComment] = useState('');
  const [saveFavorite, setSaveFavorite] = useState(false);
  const [isAlreadyFavorite, setIsAlreadyFavorite] = useState(false);
  const [rider, setRider] = useState(initialRiderRatings);

  React.useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setConfirmBlock(false);
    setComment('');
    setRider(initialRiderRatings);
    setSaveFavorite(false);
    setIsAlreadyFavorite(false);

    async function checkFavorite() {
      let resolvedCaptainId = captainId;
      if (!resolvedCaptainId) {
        const { data: authData } = await supabase.auth.getUser();
        resolvedCaptainId = authData?.user?.id || '';
      }

      let resolvedRiderId = riderId;
      if (!resolvedRiderId && tripId) {
        const { data: tripData } = await supabase
          .from('ride_requests')
          .select('rider_id')
          .eq('id', tripId)
          .maybeSingle();
        resolvedRiderId = tripData?.rider_id || '';
      }

      if (!resolvedCaptainId || !resolvedRiderId) return;

      try {
        const isFav = await isCaptainFavoriteRider(resolvedRiderId, resolvedCaptainId);

        if (!isMounted) return;
        if (isFav) {
          setIsAlreadyFavorite(true);
          setSaveFavorite(true);
        }
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[Driver Rating Modal] Check favorite error:', err);
        }
      }
    }

    void checkFavorite();

    return () => {
      isMounted = false;
    };
  }, [isOpen, tripId, riderId, captainId, supabase]);

  // Re-tapping the chosen verdict clears it back to "no opinion".
  const handleSelect = (key: RiderRatingKey, verdict: Exclude<CriterionVerdict, null>) => {
    setRider((previous) => ({ ...previous, [key]: previous[key] === verdict ? null : verdict }));
  };

  const isFavActive = saveFavorite || isAlreadyFavorite;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const detailedStarsPayload = {
        rider: Object.fromEntries(
          Object.entries(rider)
            .filter(([, verdict]) => verdict !== null)
            .map(([key, verdict]) => [key, verdict === 'up' ? 1 : 0]),
        ),
      };

      let resolvedCaptainId = captainId;
      if (!resolvedCaptainId) {
        const { data: authData } = await supabase.auth.getUser();
        resolvedCaptainId = authData?.user?.id || '';
      }

      let resolvedRiderId = riderId;
      if (!resolvedRiderId && tripId) {
        const { data: tripData } = await supabase
          .from('ride_requests')
          .select('rider_id')
          .eq('id', tripId)
          .maybeSingle();
        resolvedRiderId = tripData?.rider_id || '';
      }

      const { error } = await supabase.from('reviews').insert({
        trip_id: tripId,
        reviewer_id: resolvedCaptainId,
        reviewee_id: resolvedRiderId,
        detailed_stars: detailedStarsPayload,
        comment: comment.trim() || null,
        gave_heart: saveFavorite,
      });

      if (error) throw error;

      if (saveFavorite && !isAlreadyFavorite && resolvedCaptainId && resolvedRiderId) {
        try {
          await setCaptainFavoriteRider(
            resolvedRiderId,
            true,
            { name: riderName },
            resolvedCaptainId,
          );
        } catch (favErr) {
          if (process.env.NODE_ENV !== 'production') {
            console.warn('[Driver Rating Modal] Favorite insert exception:', favErr);
          }
        }
      }

      toast({
        title: saveFavorite && !isAlreadyFavorite
          ? copy.submitAndFavoriteSuccessTitle
          : copy.submitSuccessTitle,
        description: saveFavorite && !isAlreadyFavorite
          ? copy.submitAndFavoriteSuccessDescription
          : copy.submitSuccessDescription,
      });

      onSuccess();
    } catch (error: any) {
      if ((process.env.NODE_ENV !== 'production')) console.error('[Driver Rating Modal] Submit rating error:', error);
      toast({
        variant: 'destructive',
        title: copy.submitErrorTitle,
        description: error?.message || copy.submitErrorDescription,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBlockRider = async () => {
    setIsBlocking(true);
    try {
      const { error: rpcError } = await supabase.rpc('block_user', {
        p_blocked_id: riderId,
      });

      if (rpcError) {
        const { error: insertError } = await supabase.from('user_blocks').insert({
          blocker_id: captainId,
          blocked_id: riderId,
        });
        if (insertError) throw insertError;
      }

      toast({
        title: copy.blockSuccessTitle,
        description: copy.blockSuccessDescription,
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('radar-user-blocked', { detail: { riderId } }));
      }

      onSuccess();
    } catch (error: any) {
      if ((process.env.NODE_ENV !== 'production')) console.error('[Driver Rating Modal] Block rider error:', error);
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

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={styles.content}
        dir={isArabic ? 'rtl' : 'ltr'}
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className={cn(styles.headerRtl, isArabic ? styles.headerTextRtl : styles.headerTextLtr)}>
          <div>
            <DialogTitle className={styles.title}>{copy.title}</DialogTitle>
            <DialogDescription className={styles.description}>{copy.description}</DialogDescription>
          </div>
        </DialogHeader>

        <div className={styles.body}>
          <DriverRatingCriteria rider={rider} onSelect={handleSelect} copy={copy} />

          {/* Favorite Rider (إضافة الراكب للمفضلة) */}
          <button
            type="button"
            onClick={() => {
              if (isAlreadyFavorite) return;
              setSaveFavorite((prev) => !prev);
            }}
            disabled={isAlreadyFavorite}
            className={cn(
              "flex w-full items-center justify-between gap-3 rounded-2xl border p-3.5 text-start transition-all active:scale-[0.99]",
              isFavActive
                ? "border-emerald-500/60 bg-emerald-500/15 shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                : "border-white/10 bg-white/5 hover:border-emerald-500/30 hover:bg-emerald-500/5",
              isAlreadyFavorite && "cursor-default border-emerald-500/40 bg-emerald-500/10"
            )}
          >
            <div className="flex flex-col min-w-0">
              <span className={cn("text-xs font-black", isFavActive ? "text-emerald-300" : "text-white")}>
                {isAlreadyFavorite
                  ? copy.favoriteAlreadySaved
                  : saveFavorite
                    ? copy.favoriteWillSave
                    : copy.favoriteSave}
              </span>
              <span className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                {isAlreadyFavorite
                  ? copy.favoriteAlreadySavedDesc
                  : riderName
                    ? copy.favoriteDescription.replace('{name}', riderName)
                    : copy.favoriteFallbackDescription}
              </span>
            </div>
            <div className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border transition-all",
              isFavActive ? "border-emerald-500 bg-emerald-500 text-[#0A0F1D]" : "border-white/10 bg-black/40 text-slate-400"
            )}>
              <Heart className={cn("w-4 h-4", isFavActive ? "fill-current text-white" : "")} />
            </div>
          </button>

          <div className={styles.commentWrap}>
            <Label className={styles.commentLabel}>{copy.commentLabel}</Label>
            <textarea
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder={copy.commentPlaceholder}
              rows={3}
              className={styles.commentInput}
            />
          </div>
        </div>

        <div className={styles.actions}>
          {!confirmBlock ? (
            <>
              <Button
                className={styles.submitButton}
                disabled={isSubmitting || isBlocking}
                onClick={handleSubmit}
              >
                {isSubmitting ? copy.submitting : copy.submit}
              </Button>
              <Button
                variant="ghost"
                type="button"
                className="w-full text-slate-400 hover:text-white hover:bg-white/5 font-bold text-xs h-9 rounded-xl transition-all"
                disabled={isSubmitting || isBlocking}
                onClick={onClose}
              >
                {isArabic ? 'تخطي التقييم الآن' : 'Skip for now'}
              </Button>
            </>
          ) : null}

          <DriverRatingBlock
            confirmBlock={confirmBlock}
            onSetConfirmBlock={setConfirmBlock}
            isSubmitting={isSubmitting}
            isBlocking={isBlocking}
            onBlockRider={handleBlockRider}
            copy={copy}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
