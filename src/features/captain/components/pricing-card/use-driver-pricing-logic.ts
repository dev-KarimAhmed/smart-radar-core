import { useState, useEffect, useMemo, useCallback } from 'react';
import { usePricingMatrix, PricingMatrix } from '@/hooks/use-pricing-matrix';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { usePromoStream } from '@/hooks/use-promo-stream';
import { RadarBundleIntegrityKernel, GlobalPulseDoc, RadarSovereignIntegrationKernel } from '@/core/logic/sovereign-market-kernel';

interface UseDriverPricingLogicProps {
  mode: 'setup' | 'offer';
  tripDistance: number;
  tripDuration: number;
  onConfirm: (data: PricingMatrix | number) => void;
  tAuto: (key: string) => string;
}

export function useDriverPricingLogic({
  mode,
  tripDistance,
  tripDuration,
  onConfirm,
  tAuto,
}: UseDriverPricingLogicProps) {
  const { matrix: savedMatrix, saveMatrix, isSaving } = usePricingMatrix();
  const { toast } = useToast();
  const [matrix, setMatrix] = useState<Omit<PricingMatrix, 'isOperatorLinked'>>(savedMatrix);
  const [isOperatorLinked, setIsOperatorLinked] = useState(savedMatrix.isOperatorLinked || false);
  const [error, setError] = useState('');
  const [pulseData, setPulseData] = useState<{ trend: 'up' | 'down'; msg: string; change: string } | null>(null);

  const { user } = useAuth();
  const { activeAds } = usePromoStream(user?.district || tAuto('key_161b5e38'), user?.governorate || tAuto('key_20a48924'), 'captain');

  const currentRating = useMemo(() => {
    if (!user) return 5.0;
    if (user.rating !== undefined) return user.rating;
    if (user.ratingSum && user.ratingCount) return user.ratingSum / user.ratingCount;
    return 5.0;
  }, [user]);

  const dynamicDeviationRatio = useMemo(() => {
    const TEST_KM = 5;
    const TEST_MIN = 10;
    const marketRefPrice = 1.00 + (0.25 * TEST_KM) + (0.05 * TEST_MIN);
    const driverFareTest = (matrix.shortTripFare || 0) + ((matrix.longTripKmRate || 0) * TEST_KM) + ((matrix.minuteRate || 0) * TEST_MIN);
    return marketRefPrice ? (marketRefPrice - driverFareTest) / marketRefPrice : 0;
  }, [matrix.shortTripFare, matrix.longTripKmRate, matrix.minuteRate]);

  const isBlocked = useMemo(() => {
    return dynamicDeviationRatio >= 0.15 || (matrix.shortTripFare || 0) < 1.0;
  }, [dynamicDeviationRatio, matrix.shortTripFare]);

  const isWarned = useMemo(() => {
    return dynamicDeviationRatio >= 0.10 && dynamicDeviationRatio < 0.15 && (matrix.shortTripFare || 0) >= 1.0;
  }, [dynamicDeviationRatio, matrix.shortTripFare]);

  const isImmuneRisk = useMemo(() => currentRating <= 4.3, [currentRating]);

  const professionalAd = useMemo(() => {
    const defaultProfessionalAd = {
      adId: 'promo-captain-professional-default',
      title: tAuto('key_fd9fc253'),
      description: tAuto('key_acbd8f5c'),
      actionUrl: 'https://wa.me/962790000000',
      buttonText: tAuto('key_9071994f'),
      bannerUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=1200'
    };

    if (!isBlocked) return defaultProfessionalAd;

    const passAds = activeAds.map(ad => ({
      adId: ad.id,
      targetScale: (ad.targetDistrict ? 'District' : 'Governorate') as any,
      targetLocationName: ad.targetDistrict || ad.targetGovernorate || tAuto('key_161b5e38'),
      adType: ad.adType as any,
      bannerUrl: ad.content?.posterUrl || ''
    })).filter(ad => ad.adType === 'CAPTAIN_PROFESSIONAL');

    if (passAds.length === 0) {
      return {
        adId: 'promo-captain-professional-default',
        title: tAuto('key_d80d3b93'),
        description: tAuto('key_220e34d8'),
        actionUrl: 'https://wa.me/962790000000',
        buttonText: tAuto('key_4ae32a46'),
        bannerUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=1200'
      };
    }

    const matchedPass = RadarSovereignIntegrationKernel.triggerContextualAdStream(
      dynamicDeviationRatio,
      { role: 'captain', district: user?.district || tAuto('key_161b5e38'), governorate: user?.governorate || tAuto('key_20a48924') },
      passAds as any
    );

    if (matchedPass) {
      const realAd = activeAds.find(ad => ad.id === matchedPass.adId);
      return {
        adId: matchedPass.adId,
        title: realAd?.content?.title || tAuto('key_4a1fdada'),
        description: realAd?.content?.description || tAuto('key_49572be0'),
        actionUrl: realAd?.action?.actionUrl || realAd?.actionUrl || 'https://wa.me/962790000000',
        buttonText: realAd?.action?.buttonText || realAd?.buttonText || tAuto('key_9071994f'),
        bannerUrl: realAd?.content?.posterUrl || 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=1200'
      };
    }

    return defaultProfessionalAd;
  }, [isBlocked, activeAds, user, dynamicDeviationRatio, tAuto]);

  useEffect(() => {
    setPulseData({
      trend: 'up',
      msg: tAuto('key_6e4eea43'),
      change: '+5.2%'
    });
  }, [mode, tAuto]);

  const handleSetupSave = useCallback(async () => {
    const matrixToSave: PricingMatrix = { ...matrix, isOperatorLinked };

    if (!isOperatorLinked) {
      if (matrixToSave.shortTripFare <= 0 || matrixToSave.longTripKmRate <= 0) {
        setError(tAuto('key_e4a99cfa'));
        return;
      }

      const bundle = {
        basePrice: matrixToSave.shortTripFare,
        perKmPrice: matrixToSave.longTripKmRate,
        perMinPrice: matrixToSave.minuteRate
      };

      const defaultPulseDoc: GlobalPulseDoc = {
        market_base_avg: 1.00,
        market_km_avg: 0.25,
        market_min_avg: 0.05,
        last_updated: Date.now()
      };

      const evaluation = RadarBundleIntegrityKernel.validateBundleIntegrity(bundle, defaultPulseDoc);

      if (evaluation.status === 'REJECTED') {
        setError(evaluation.message);
        toast({
          variant: 'destructive',
          title: tAuto('key_6041d7f0'),
          description: evaluation.message,
        });
        return;
      }

      if (evaluation.status === 'APPROVED_WITH_WARNING') {
        toast({
          variant: 'default',
          title: tAuto('key_5540ce43'),
          description: evaluation.message
        });
      }
    }

    setError('');
    const result = await saveMatrix(matrixToSave);

    if (result.success) {
      onConfirm(matrixToSave);
    } else if (result.error && result.error !== 'User cancelled.') {
      setError(result.error);
    }
  }, [matrix, isOperatorLinked, saveMatrix, onConfirm, toast, tAuto]);

  const officialRateFare = useMemo(() => {
    if (!tripDistance) return 0;
    const GAMMA = 1.35;
    const baseFare = 1.20;
    const additionalDistance = Math.max(0, tripDistance - 1);
    const distanceCost = additionalDistance * 0.25;
    const timeCost = 0.05 * tripDuration;
    return Math.max(1.00, Number(((baseFare + distanceCost + timeCost) * GAMMA).toFixed(2)));
  }, [tripDistance, tripDuration]);

  const calculatedOffers = useMemo(() => {
    if (mode !== 'offer' || !tripDistance || !tripDuration) return null;
    const additionalDistance = Math.max(0, tripDistance - 1);
    const calculatedBaseFare = savedMatrix.shortTripFare + (savedMatrix.longTripKmRate * additionalDistance);
    const timeSovereigntyCharge = savedMatrix.minuteRate * tripDuration;
    const finalCalculatedFare = calculatedBaseFare + timeSovereigntyCharge;

    return {
      min: Number((finalCalculatedFare * 0.85).toFixed(2)),
      avg: Number(finalCalculatedFare.toFixed(2)),
      peak: Number((finalCalculatedFare * 1.30).toFixed(2)),
    };
  }, [mode, tripDistance, tripDuration, savedMatrix]);

  return {
    matrix,
    setMatrix,
    savedMatrix,
    isOperatorLinked,
    setIsOperatorLinked,
    error,
    setError,
    pulseData,
    isSaving,
    isBlocked,
    isWarned,
    isImmuneRisk,
    professionalAd,
    handleSetupSave,
    officialRateFare,
    calculatedOffers
  };
}
