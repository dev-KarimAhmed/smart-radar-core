import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/hooks/use-toast';
import { setFavoriteCaptain, fetchFavoriteCaptainIds } from '@/features/account/services/favorite-captains';
import {
  AdComplianceVerdict,
  RatingModalProps,
  VehicleCriterionKey,
  VehicleRatings,
  CaptainRatings,
  initialVehicleRatings,
  initialCaptainRatings,
  buildDetailedStarsPayload,
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
  captainRank,
  vehicleInfo,
}: RatingModalProps) {
  const { toast } = useToast();
  const tAuto = useTranslations('auto');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [comment, setComment] = useState('');
  const [saveFavorite, setSaveFavorite] = useState(false);
  const [isAlreadyFavorite, setIsAlreadyFavorite] = useState(false);
  const [vehicle, setVehicle] = useState<VehicleRatings>(initialVehicleRatings);
  const [captain, setCaptain] = useState<CaptainRatings>(initialCaptainRatings);

  useEffect(() => {
    if (!isOpen) return;
    let isMounted = true;
    setConfirmBlock(false);
    setComment('');
    setVehicle(initialVehicleRatings);
    setCaptain(initialCaptainRatings);

    async function checkCaptainFavorite() {
      let resolvedCaptainId = captainId;
      if (!resolvedCaptainId && tripId) {
        const { data: tripData } = await supabase
          .from('ride_requests')
          .select('captain_id')
          .eq('id', tripId)
          .maybeSingle();
        resolvedCaptainId = tripData?.captain_id || '';
      }

      if (!resolvedCaptainId) {
        if (isMounted) {
          setIsAlreadyFavorite(false);
          setSaveFavorite(false);
        }
        return;
      }

      let synchronousIsFav = false;
      if (typeof window !== 'undefined') {
        try {
          synchronousIsFav = Boolean(window.localStorage.getItem(`radar_preferred_captain_${resolvedCaptainId}`));
        } catch {}
      }
      if (!isMounted) return;
      setIsAlreadyFavorite(synchronousIsFav);
      setSaveFavorite(synchronousIsFav);

      void fetchFavoriteCaptainIds().then((favIds) => {
        if (!isMounted) return;
        const isFav = favIds.has(String(resolvedCaptainId));
        setIsAlreadyFavorite(isFav);
        if (isFav) {
          setSaveFavorite(true);
        }
      });
    }

    void checkCaptainFavorite();

    return () => {
      isMounted = false;
    };
  }, [isOpen, tripId, captainId, supabase]);

  const handleSetAdCompliance = (verdict: AdComplianceVerdict) => {
    setCaptain((prev) => ({ ...prev, adCompliance: verdict }));
  };

  const handleSetCommunication = (stars: number) => {
    setCaptain((prev) => ({ ...prev, communication: stars }));
  };

  const handleSetVehicleRating = (key: VehicleCriterionKey, stars: number) => {
    setVehicle((prev) => ({ ...prev, [key]: stars }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const detailedStarsPayload = buildDetailedStarsPayload({
        captain,
        vehicle,
        isFavorite: saveFavorite,
      });

      let resolvedReviewerId = reviewerId;
      if (!resolvedReviewerId) {
        const { data: authData } = await supabase.auth.getUser();
        resolvedReviewerId = authData?.user?.id || '';
      }

      let resolvedCaptainId = captainId;
      if (!resolvedCaptainId && tripId) {
        const { data: tripData } = await supabase
          .from('ride_requests')
          .select('captain_id')
          .eq('id', tripId)
          .maybeSingle();
        resolvedCaptainId = tripData?.captain_id || '';
      }

      const { error } = await supabase.from('reviews').insert({
        trip_id: tripId,
        reviewer_id: resolvedReviewerId,
        reviewee_id: resolvedCaptainId,
        detailed_stars: detailedStarsPayload,
        comment: comment.trim() || null,
        gave_heart: saveFavorite,
      });

      if (error) throw error;

      if (saveFavorite && resolvedCaptainId) {
        try {
          await setFavoriteCaptain(String(resolvedCaptainId), true, {
            name: captainName,
            phone: captainPhone,
            rank: captainRank,
            vehicle: vehicleInfo,
          });
        } catch (favoriteError) {
          if (process.env.NODE_ENV !== 'production') console.warn('[Rating] favourite write failed:', favoriteError);
        }
      }

      if (saveFavorite && resolvedCaptainId) {
        try {
          window.localStorage.setItem(
            `radar_preferred_captain_${resolvedCaptainId}`,
            JSON.stringify({
              captainId: resolvedCaptainId,
              driverId: resolvedCaptainId,
              captainName: captainName?.trim() || tAuto('ratingModal_defaultCaptainName'),
              fullName: captainName?.trim() || tAuto('ratingModal_defaultCaptainName'),
              captainPhone: captainPhone || '',
              phoneNumber: captainPhone || '',
              vehicleSpecs: vehicleInfo || tAuto('ratingModal_notAvailable'),
              savedTimestamp: Date.now(),
            }),
          );
        } catch {}
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
    isAlreadyFavorite,
    vehicle,
    captain,
    handleSetAdCompliance,
    handleSetCommunication,
    handleSetVehicleRating,
    handleSubmit,
    handleBlockDriver,
  };
}
