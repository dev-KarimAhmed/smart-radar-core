import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import { setFavoriteCaptain } from '@/features/account/services/favorite-captains';
import {
  CriterionVerdict,
  RatingModalProps,
  VehicleRatingKey,
  CaptainRatingKey,
  initialVehicleRatings,
  initialCaptainRatings,
  toScoredCriteria,
} from './rating-types';

export function useRatingModal({
  isOpen,
  tripId,
  captainId,
  reviewerId,
  supabase,
  onSuccess,
  captainName,
  captainPhone,
  vehicleInfo,
}: RatingModalProps) {
  const { toast } = useToast();
  const tAuto = useTranslations('auto');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [comment, setComment] = useState('');
  const [saveFavorite, setSaveFavorite] = useState(false);
  const [vehicle, setVehicle] = useState(initialVehicleRatings);
  const [captain, setCaptain] = useState(initialCaptainRatings);

  useEffect(() => {
    if (!isOpen) return;
    setSaveFavorite(false);
    setConfirmBlock(false);
    setComment('');
    setVehicle(initialVehicleRatings);
    setCaptain(initialCaptainRatings);
  }, [isOpen, tripId]);

  const handleSetVehicle = (key: VehicleRatingKey, verdict: Exclude<CriterionVerdict, null>) => {
    setVehicle((previous) => ({ ...previous, [key]: previous[key] === verdict ? null : verdict }));
  };

  const handleSetCaptain = (key: CaptainRatingKey, verdict: Exclude<CriterionVerdict, null>) => {
    setCaptain((previous) => ({ ...previous, [key]: previous[key] === verdict ? null : verdict }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const detailedStarsPayload = {
        vehicle: toScoredCriteria(vehicle),
        captain: toScoredCriteria(captain),
      };

      const { error } = await supabase.from('reviews').insert({
        trip_id: tripId,
        reviewer_id: reviewerId,
        reviewee_id: captainId,
        detailed_stars: detailedStarsPayload,
        comment: comment.trim() || null,
        gave_heart: saveFavorite,
      });

      if (error) throw error;

      if (saveFavorite && captainId) {
        try {
          await setFavoriteCaptain(String(captainId), true);
        } catch (favoriteError) {
          if (process.env.NODE_ENV !== 'production') console.warn('[Rating] favourite write failed:', favoriteError);
        }
      }

      if (saveFavorite) {
        window.localStorage.setItem(
          `radar_preferred_captain_${captainId}`,
          JSON.stringify({
            captainId,
            driverId: captainId,
            captainName: captainName?.trim() || tAuto('ratingModal_defaultCaptainName'),
            fullName: captainName?.trim() || tAuto('ratingModal_defaultCaptainName'),
            captainPhone: captainPhone || '',
            phoneNumber: captainPhone || '',
            vehicleSpecs: vehicleInfo || tAuto('ratingModal_notAvailable'),
            savedTimestamp: Date.now(),
          }),
        );
      }

      toast({
        title: saveFavorite ? tAuto('ratingModal_submitAndFavoriteSuccessTitle') : tAuto('ratingModal_submitSuccessTitle'),
        description: saveFavorite ? tAuto('ratingModal_submitAndFavoriteSuccessDescription') : tAuto('ratingModal_submitSuccessDescription'),
      });

      onSuccess();
    } catch (error: any) {
      if (process.env.NODE_ENV !== 'production') console.error('[Rating Modal] Submit rating error:', error);
      toast({
        variant: 'destructive',
        title: tAuto('ratingModal_submitErrorTitle'),
        description: error?.message || tAuto('ratingModal_submitErrorDescription'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBlockDriver = async () => {
    setIsBlocking(true);
    try {
      const { error: rpcError } = await supabase.rpc('block_user', {
        p_blocked_id: captainId,
      });

      if (rpcError) {
        const { error: insertError } = await supabase.from('user_blocks').insert({
          blocker_id: reviewerId,
          blocked_id: captainId,
        });
        if (insertError) throw insertError;
      }

      toast({
        title: tAuto('ratingModal_blockSuccessTitle'),
        description: tAuto('ratingModal_blockSuccessDescription'),
      });

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('radar-user-blocked', { detail: { captainId } }));
      }

      onSuccess();
    } catch (error: any) {
      if (process.env.NODE_ENV !== 'production') console.error('[Rating Modal] Block driver error:', error);
      toast({
        variant: 'destructive',
        title: tAuto('ratingModal_blockErrorTitle'),
        description: error?.message || tAuto('ratingModal_blockErrorDescription'),
      });
    } finally {
      setIsBlocking(false);
      setConfirmBlock(false);
    }
  };

  return {
    isSubmitting,
    isBlocking,
    confirmBlock,
    setConfirmBlock,
    comment,
    setComment,
    saveFavorite,
    setSaveFavorite,
    vehicle,
    captain,
    handleSetVehicle,
    handleSetCaptain,
    handleSubmit,
    handleBlockDriver,
  };
}
