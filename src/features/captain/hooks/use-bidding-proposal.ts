'use client';

import React from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useCaptainProfessionalAd } from './use-captain-professional-ad';
import { usePricePerKmSetup } from './use-price-per-km-setup';
import { DEFAULT_OFFER_WAIT_SECONDS, MIN_OFFER_WAIT_SECONDS, MAX_OFFER_WAIT_SECONDS } from './use-driver-transactions';
import { estimateHaversineDistanceKm } from '../services/ride-location';
import { estimatePickupMinutes } from '@/shared/services/trip-duration';
import {
  type CaptainOfferQuote,
  type UseBiddingProposalProps,
  roundMoney,
} from './bidding-proposal/bidding-proposal-types';
import { useQuoteLoader } from './bidding-proposal/use-quote-loader';
import {
  resolveDefaultPricingMode,
  evaluateProposalBands,
} from './bidding-proposal/bidding-proposal-eval';
import { computeTariffBreakdown } from './bidding-proposal/bidding-proposal-tariff';

export type { CaptainOfferQuote, UseBiddingProposalProps };
export { roundMoney };

export function useBiddingProposal({
  request,
  driverLocation,
  initialOfferPrice = null,
  initialPricingMode = null,
  captainPricingMode = null,
  currentTariffProp,
  isSubmitting,
}: UseBiddingProposalProps) {
  const { user } = useAuth();
  const existingOffer = React.useMemo(
    () => request.offers?.find((o) => o.driverId === user?.uid),
    [request.offers, user?.uid],
  );

  const pickupDistanceKm = driverLocation && request.pickupCoords
    ? estimateHaversineDistanceKm(driverLocation.lat, driverLocation.lng, request.pickupCoords.lat, request.pickupCoords.lng)
    : null;
  const pickupEtaMinutes = estimatePickupMinutes(pickupDistanceKm);

  const [waitSecondsInput, setWaitSecondsInput] = React.useState(String(DEFAULT_OFFER_WAIT_SECONDS));
  const parsedWaitSeconds = Number(waitSecondsInput);
  const isWaitSecondsValid = Number.isInteger(parsedWaitSeconds)
    && parsedWaitSeconds >= MIN_OFFER_WAIT_SECONDS
    && parsedWaitSeconds <= MAX_OFFER_WAIT_SECONDS;

  const isIndependent = user?.subRole === 'independent' || user?.affiliation?.type === 'independent';
  const isSmartApp = user?.affiliation?.type === 'smart-app';
  const isOfficeTaxi = user?.affiliation?.type === 'office-taxi';

  const { currentTariff: hookTariff } = usePricePerKmSetup(user);
  const currentTariff = currentTariffProp ?? hookTariff;

  const { quote } = useQuoteLoader({
    requestId: request.id,
    baseFare: currentTariff?.baseFare,
    pricePerKm: currentTariff?.pricePerKm,
    pricePerMin: currentTariff?.pricePerMin,
  });

  const { riderPreference, resolvedMode: resolvedDefaultPricingMode } = React.useMemo(
    () => resolveDefaultPricingMode({
      pricingPreference: request.pricingPreference,
      initialPricingMode,
      captainPricingMode,
      isOfficeTaxi,
      isSmartApp,
      isIndependent,
    }),
    [request.pricingPreference, initialPricingMode, isOfficeTaxi, captainPricingMode, isSmartApp, isIndependent],
  );

  const [pricingMode, setPricingMode] = React.useState<'FREE' | 'APP' | 'TAXI' | null>(resolvedDefaultPricingMode);
  React.useEffect(() => {
    setPricingMode(resolvedDefaultPricingMode);
  }, [resolvedDefaultPricingMode]);

  const [increaseAmount, setIncreaseAmount] = React.useState<string | number>(0);
  const [appPrice, setAppPrice] = React.useState<string>(
    initialOfferPrice && initialOfferPrice > 0 ? String(initialOfferPrice) : '',
  );

  React.useEffect(() => {
    if (initialOfferPrice && initialOfferPrice > 0) {
      setAppPrice(String(initialOfferPrice));
    }
  }, [initialOfferPrice]);

  const parsedIncrease = parseFloat(String(increaseAmount));
  const normalizedIncreaseAmount = Number.isFinite(parsedIncrease) ? parsedIncrease : 0;
  const parsedAppPrice = parseFloat(appPrice);
  const normalizedAppPrice = Number.isFinite(parsedAppPrice) ? parsedAppPrice : 0;

  const tempMarketFare = quote?.marketFare ?? Number(request.offerPrice || 0);
  const tempBaseFare = quote?.suggestedFare ?? tempMarketFare;

  let finalOfferPrice = roundMoney(tempBaseFare + normalizedIncreaseAmount);
  if (pricingMode === 'APP') {
    finalOfferPrice = normalizedAppPrice > 0 ? roundMoney(normalizedAppPrice) : 0;
  } else if (pricingMode === 'TAXI') {
    finalOfferPrice = normalizedAppPrice > 0 ? roundMoney(normalizedAppPrice) : roundMoney(tempBaseFare);
  }

  const band = evaluateProposalBands({
    quote,
    requestOfferPrice: request.offerPrice,
    finalOfferPrice,
    normalizedIncreaseAmount,
    normalizedAppPrice,
    pricingMode,
  });

  const tariffBreakdown = computeTariffBreakdown({
    currentTariff,
    meterDetails: band.meterDetails,
    finalOfferPrice,
    existingOfferPrice: existingOffer?.price,
    captainMeterFare: band.captainMeterFare,
    tier: band.tier,
    rankIncreaseFactor: band.rankIncreaseFactor,
  });

  React.useEffect(() => {
    if (existingOffer) {
      if (pricingMode === 'FREE') {
        const diff = existingOffer.price - band.baseFare;
        setIncreaseAmount(diff !== 0 ? roundMoney(diff) : 0);
        setAppPrice('');
      } else if (pricingMode === 'APP' || pricingMode === 'TAXI') {
        setAppPrice(String(existingOffer.price));
        setIncreaseAmount(0);
      }
      setWaitSecondsInput(String(existingOffer.wait_seconds || DEFAULT_OFFER_WAIT_SECONDS));
    } else {
      setIncreaseAmount(0);
      setAppPrice(initialOfferPrice && initialOfferPrice > 0 ? String(initialOfferPrice) : '');
      setWaitSecondsInput(String(DEFAULT_OFFER_WAIT_SECONDS));
    }
  }, [request.id, existingOffer?.id, existingOffer?.price, existingOffer?.wait_seconds, band.baseFare, pricingMode, initialOfferPrice]);

  React.useEffect(() => {
    if (pricingMode === 'TAXI' || (pricingMode === 'APP' && isOfficeTaxi)) {
      setIncreaseAmount(0);
    }
  }, [pricingMode, isOfficeTaxi]);

  const step = Math.max(0.25, roundMoney(Math.max(band.bandHeadroom, band.baseFare * 0.01, 1) / 10));
  const professionalAd = useCaptainProfessionalAd(band.dumpingDeviationRatio, band.isDumpingBlocked);
  const canSubmit = pricingMode !== null && Number.isFinite(finalOfferPrice) && finalOfferPrice > 0 && !isSubmitting && isWaitSecondsValid;

  const handleApplyFloorPrice = React.useCallback(() => {
    if (band.floorPrice <= 0) return;
    if (pricingMode === 'TAXI' || pricingMode === 'APP') {
      setAppPrice(band.floorPrice.toFixed(2));
    } else {
      setIncreaseAmount(band.minIncreaseAmount);
    }
  }, [pricingMode, band.floorPrice, band.minIncreaseAmount]);

  const isPricingControlDisabled = pricingMode === 'TAXI' || (pricingMode === 'APP' && isOfficeTaxi) || pricingMode === null;

  return {
    existingOffer,
    pickupEtaMinutes,
    waitSecondsInput,
    setWaitSecondsInput,
    parsedWaitSeconds,
    isWaitSecondsValid,
    quote,
    pricingMode,
    setPricingMode,
    increaseAmount,
    setIncreaseAmount,
    appPrice,
    setAppPrice,
    normalizedIncreaseAmount,
    normalizedAppPrice,
    finalOfferPrice,
    currentTariff,
    step,
    professionalAd,
    isBlockedDeviation: false,
    canSubmit,
    handleApplyFloorPrice,
    isPlusDisabled: isPricingControlDisabled,
    isMinusDisabled: isPricingControlDisabled,
    riderPreference,
    ...band,
    ...tariffBreakdown,
  };
}
