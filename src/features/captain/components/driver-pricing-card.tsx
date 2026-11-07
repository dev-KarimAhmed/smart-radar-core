'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { usePricingMatrix, PricingMatrix } from '@/hooks/use-pricing-matrix';
import { useToast } from '@/hooks/use-toast';
import { RadarBundleIntegrityKernel, GlobalPulseDoc, RadarSovereignIntegrationKernel, AdSovereignPass } from '@/core/logic/sovereign-market-kernel';
import { useAuth } from '@/hooks/use-auth';
import { usePromoStream } from '@/hooks/use-promo-stream';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { useTranslations } from "next-intl";
import { type PricingCardProps } from './pricing/driver-pricing-styles';
import { PricingInput } from './pricing/pricing-input';
import { DriverPricingSetupModal } from './pricing/driver-pricing-setup-modal';
import { DriverPricingOfferModal } from './pricing/driver-pricing-offer-modal';

export { PricingInput };

export function DriverPricingCard({
  mode,
  tripDistance = 0,
  tripDuration = 0,
  pricingPreference = null,
  onConfirm,
  onCancel,
  isSubmitting = false,
}: PricingCardProps) {
  const tAuto = useTranslations('auto');
  const t = useTranslations('auto');
  const { isArabic } = useDashboardLanguage();
  const { matrix: savedMatrix, saveMatrix, isSaving } = usePricingMatrix();
  const { toast } = useToast();
  const [matrix, setMatrix] = useState<Omit<PricingMatrix, 'isOperatorLinked'>>(savedMatrix);
  const [isOperatorLinked, setIsOperatorLinked] = useState(savedMatrix.isOperatorLinked || false);
  const [error, setError] = useState('');

  const [pulseData, setPulseData] = useState<{ trend: 'up' | 'down', msg: string, change: string } | null>(null);

  const { user } = useAuth();
  const { activeAds } = usePromoStream(user?.district || tAuto('key_161b5e38'), user?.governorate || tAuto('key_20a48924'), 'captain');

  const currentRating = useMemo(() => {
    if (!user) return 5.0;
    const ratingCandidates = [user.rating, (user as any).trust_score, (user as any).trust_rating];
    const valid = ratingCandidates.filter(val => typeof val === 'number' && !isNaN(val) && val > 0);
    return valid.length > 0 ? valid[0] : 5.0;
  }, [user]);

  const dynamicDeviationRatio = useMemo(() => {
    const TEST_KM = 5;
    const TEST_MIN = 10;
    const marketRefPrice = 1.00 + (0.25 * TEST_KM) + (0.05 * TEST_MIN);
    const driverFareTest = (matrix.shortTripFare || 0) + ((matrix.longTripKmRate || 0) * TEST_KM) + ((matrix.minuteRate || 0) * TEST_MIN);
    return Math.abs(driverFareTest - marketRefPrice) / marketRefPrice;
  }, [matrix]);

  const isBlocked = useMemo(() => {
    return dynamicDeviationRatio >= 0.15 || (matrix.shortTripFare || 0) < 1.00;
  }, [dynamicDeviationRatio, matrix.shortTripFare]);

  const isWarned = useMemo(() => {
    return dynamicDeviationRatio >= 0.10 && dynamicDeviationRatio < 0.15 && (matrix.shortTripFare || 0) >= 1.00;
  }, [dynamicDeviationRatio, matrix.shortTripFare]);

  const isImmuneRisk = useMemo(() => {
    return currentRating <= 4.3;
  }, [currentRating]);

  const professionalAd = useMemo(() => {
    const defaultProfessionalAd = {
      id: 'default-driver-aid',
      title: isArabic ? tAuto('key_e046a6f0') : "Exclusive Offer: Specialized Maintenance & Inspection Center",
      description: isArabic ? tAuto('key_f29f0e13') : "Direct discounts for captains on regular inspections and vehicle parts to maintain vehicle quality and service continuity.",
      bannerUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&q=80&w=600',
      actionUrl: 'tel:0790000000',
      buttonText: isArabic ? tAuto('key_d50fc2f1') : "Direct Contact via Call",
      views: 0,
      clicks: 0,
      targetH3Index: 'all',
      advertiserId: 'official-partner'
    };

    const passAds: AdSovereignPass[] = activeAds.map(ad => ({
      adId: ad.id,
      title: ad.title,
      bannerUrl: ad.bannerUrl || '',
      actionUrl: ad.actionUrl || '',
      advertiserId: ad.advertiserId || 'sponsor',
      targetH3Index: ad.targetH3Index || 'global',
      buttonText: ad.buttonText || (isArabic ? tAuto('key_8bb8b2bb') : 'Contact Advertiser'),
      description: ad.description || '',
      category: (ad as any).category || 'SERVICES',
      views: ad.views || 0,
      clicks: ad.clicks || 0,
    }));

    if (passAds.length > 0) {
      const matchedPass = RadarSovereignIntegrationKernel.triggerContextualAdStream(
        'mock-current-h3',
        'MAINTENANCE',
        passAds
      );

      if (matchedPass) {
        const realAd = activeAds.find(ad => ad.id === matchedPass.adId);
        if (realAd) {
          return {
            ...realAd,
            bannerUrl: realAd.bannerUrl || defaultProfessionalAd.bannerUrl,
            actionUrl: realAd.actionUrl || defaultProfessionalAd.actionUrl,
            buttonText: realAd.buttonText || defaultProfessionalAd.buttonText
          };
        }
      }
    }

    return defaultProfessionalAd;
  }, [activeAds, isArabic, tAuto]);

  useEffect(() => {
    const defaultPulse = RadarSovereignIntegrationKernel.readActiveMarketPulse('mock-district-id');
    setPulseData({
      trend: defaultPulse.marketVelocityFactor >= 1.0 ? 'up' : 'down',
      msg: defaultPulse.marketVelocityFactor >= 1.0 ? tAuto('key_33504e9a') : tAuto('key_8e461877'),
      change: `${((defaultPulse.marketVelocityFactor - 1.0) * 100).toFixed(0)}%`
    });
  }, [tAuto]);

  const handleSetupSave = useCallback(async () => {
    const matrixToSave: PricingMatrix = { ...matrix, isOperatorLinked };

    if (!isOperatorLinked) {
      if (!matrix.shortTripFare || matrix.shortTripFare < 1.0) {
        setError(tAuto('key_ee3280c2'));
        return;
      }

      const bundle = {
        baseFare: matrix.shortTripFare,
        tariffPerKm: matrix.longTripKmRate,
        tariffPerMin: matrix.minuteRate,
        isSovereignRuleCompliant: true
      };

      const defaultPulseDoc: GlobalPulseDoc = {
        h3Resolution9Index: '891f1d488ffffff',
        baseFareFloor: 1.0,
        averagePricePerKm: 0.25,
        averagePricePerMin: 0.05,
        marketBalanceIndicator: 1.0,
        networkTimeDelta: 0
      };

      const evaluation = RadarBundleIntegrityKernel.validateBundleIntegrity(bundle, defaultPulseDoc);
      if (evaluation.action === 'crimson-block') {
        setError(evaluation.reason);
        toast({
          title: tAuto('key_7e4526d7'),
          description: evaluation.reason,
          variant: "destructive"
        });
        return;
      }
      if (evaluation.action === 'amber-warning') {
        toast({
          title: tAuto('key_f29f045c'),
          description: evaluation.reason,
          className: "bg-yellow-950 border-yellow-600 text-yellow-200"
        });
      }

      if (!matrix.longTripKmRate || matrix.longTripKmRate < 0.1) {
        setError(tAuto('key_db485d93'));
        return;
      }
    }

    const result = await saveMatrix(matrixToSave);
    if (result.success) {
      toast({
        title: tAuto('key_97762692'),
        description: tAuto('key_01c9b68a'),
      });
      onConfirm(matrixToSave);
    } else {
      setError(result.error || tAuto('key_d8d17237'));
    }
  }, [matrix, isOperatorLinked, saveMatrix, toast, onConfirm, tAuto]);

  const officialRateFare = useMemo(() => {
    const GAMMA = 1.35;
    const baseFare = 1.20;
    const additionalDistance = Math.max(0, tripDistance - 1);
    const distanceCost = additionalDistance * 0.25;
    const timeCost = 0.05 * tripDuration;
    return (baseFare + distanceCost + timeCost) * GAMMA;
  }, [tripDistance, tripDuration]);

  const calculatedOffers = useMemo(() => {
    if (tripDistance <= 0) return null;

    const additionalDistance = Math.max(0, tripDistance - 1);
    const calculatedBaseFare = savedMatrix.shortTripFare + (savedMatrix.longTripKmRate * additionalDistance);

    const timeSovereigntyCharge = savedMatrix.minuteRate * tripDuration;
    const finalCalculatedFare = calculatedBaseFare + timeSovereigntyCharge;

    const floorFare = Math.max(1.0, finalCalculatedFare);

    return {
      min: Number((floorFare * 0.95).toFixed(2)),
      avg: Number(floorFare.toFixed(2)),
      peak: Number((floorFare * 1.15).toFixed(2))
    };
  }, [tripDistance, tripDuration, savedMatrix]);

  if (mode === 'setup') {
    return (
      <DriverPricingSetupModal
        isBlocked={isBlocked}
        isArabic={isArabic}
        professionalAd={professionalAd}
        pulseData={pulseData}
        isOperatorLinked={isOperatorLinked}
        setIsOperatorLinked={setIsOperatorLinked}
        isWarned={isWarned}
        isImmuneRisk={isImmuneRisk}
        matrix={matrix}
        setMatrix={setMatrix as any}
        error={error}
        setError={setError}
        isSaving={isSaving}
        handleSetupSave={handleSetupSave}
        onCancel={onCancel}
        tAuto={tAuto}
      />
    );
  }

  if (mode === 'offer') {
    return (
      <DriverPricingOfferModal
        pricingPreference={pricingPreference}
        officialRateFare={officialRateFare}
        calculatedOffers={calculatedOffers}
        isOperatorLinked={savedMatrix.isOperatorLinked || false}
        tripDistance={tripDistance}
        isSubmitting={isSubmitting}
        onConfirm={onConfirm}
        onCancel={onCancel}
        tAuto={tAuto}
      />
    );
  }

  return null;
}
