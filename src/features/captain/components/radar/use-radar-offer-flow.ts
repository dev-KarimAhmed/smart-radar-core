import React from 'react';
import type { Trip } from '@/core/types';
import { calculateCaptainTripPrice } from './radar-map.helpers';
import type { ConfirmModalTripState } from './radar-map.types';

interface UseRadarOfferFlowProps {
  activeTariff: any;
  captainPricingMode?: 'FREE' | 'APP' | 'TAXI' | null;
  isOfficeTaxi?: boolean;
  subRole?: string | null;
  pendingOffersCount?: Record<string, number>;
  pendingOfferRequestId?: string | null;
  onSubmitDirectBid?: (request: Trip, price: number, waitSeconds?: number, pricingMode?: 'FREE' | 'APP' | 'TAXI') => Promise<void> | void;
}

export function useRadarOfferFlow({
  activeTariff,
  captainPricingMode,
  isOfficeTaxi,
  pendingOffersCount,
  pendingOfferRequestId,
  onSubmitDirectBid,
}: UseRadarOfferFlowProps) {
  const [directPrices, setDirectPrices] = React.useState<Record<string, string>>({});
  const [lastSubmittedPrices, setLastSubmittedPrices] = React.useState<Record<string, number[]>>({});
  const [priceErrors, setPriceErrors] = React.useState<Record<string, boolean>>({});
  const [submittingRequestId, setSubmittingRequestId] = React.useState<string | null>(null);

  const [confirmModalTrip, setConfirmModalTrip] = React.useState<ConfirmModalTripState | null>(null);
  const [modalPrice, setModalPrice] = React.useState<string>('');
  const [waitSeconds, setWaitSeconds] = React.useState<string>('120');

  const handlePastePrice = React.useCallback(async (requestId: string) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard?.readText) {
        const text = await navigator.clipboard.readText();
        const cleaned = text.replace(/,/g, '.');
        const match = cleaned.match(/\d+(?:\.\d+)?/);
        if (match) {
          setDirectPrices((prev) => ({ ...prev, [requestId]: match[0] }));
          setPriceErrors((prev) => ({ ...prev, [requestId]: false }));
        }
      }
    } catch {
      // Clipboard access denied or unsupported
    }
  }, []);

  const handleInitiateOffer = React.useCallback((request: Trip) => {
    const isTaxi = isOfficeTaxi || captainPricingMode === 'TAXI' || request.pricingPreference === 'TAXI';
    const isApp = !isTaxi && (captainPricingMode === 'APP' || request.pricingPreference === 'APP');
    const cardPricingMode: 'FREE' | 'APP' | 'TAXI' = isTaxi ? 'TAXI' : isApp ? 'APP' : 'FREE';

    const calculatedCaptainPrice = calculateCaptainTripPrice(activeTariff, request);
    const defaultPriceValue = calculatedCaptainPrice != null
      ? calculatedCaptainPrice.toFixed(2)
      : (request.offerPrice != null && request.offerPrice > 0 ? request.offerPrice.toFixed(2) : '');

    let priceNum: number | null = null;
    const priceStr = (directPrices[request.id] ?? defaultPriceValue)?.trim();
    const parsed = priceStr ? parseFloat(priceStr) : NaN;

    if (isTaxi) {
      priceNum = request.offerPrice != null && request.offerPrice > 0 ? request.offerPrice : null;
    } else if (isApp) {
      if (priceStr && !isNaN(parsed) && parsed > 0) {
        priceNum = parsed;
      }
    } else {
      if (priceStr && !isNaN(parsed) && parsed > 0) {
        priceNum = parsed;
      } else if (calculatedCaptainPrice != null && calculatedCaptainPrice > 0) {
        priceNum = calculatedCaptainPrice;
      } else if (request.offerPrice != null && request.offerPrice > 0) {
        priceNum = request.offerPrice;
      }
    }

    if (priceNum == null || priceNum <= 0) {
      setPriceErrors((prev) => ({ ...prev, [request.id]: true }));
      return;
    }

    const modalTripId = request.id;
    const modalHistory = lastSubmittedPrices[modalTripId];
    const modalLastPrice = modalHistory && modalHistory.length > 0
      ? modalHistory[modalHistory.length - 1]
      : (directPrices[modalTripId] ? parseFloat(directPrices[modalTripId]) : undefined);

    const isAdditionalOffer = Boolean(
      (pendingOffersCount?.[modalTripId] || 0) > 0 ||
      pendingOfferRequestId === modalTripId ||
      (modalHistory && modalHistory.length > 0)
    );

    setPriceErrors((prev) => ({ ...prev, [request.id]: false }));
    setConfirmModalTrip({
      trip: request,
      price: priceNum,
      pricingMode: cardPricingMode,
      isAdditional: isAdditionalOffer,
      previousPrice: modalLastPrice,
    });
    setModalPrice(priceNum.toFixed(2));
    setWaitSeconds('120');
  }, [activeTariff, captainPricingMode, directPrices, isOfficeTaxi, lastSubmittedPrices, pendingOfferRequestId, pendingOffersCount]);

  const handleConfirmSubmitBid = React.useCallback(async () => {
    if (!confirmModalTrip || !onSubmitDirectBid) return;
    const { trip, pricingMode } = confirmModalTrip;
    const parsedPrice = parseFloat(modalPrice);
    const finalPrice = !isNaN(parsedPrice) && parsedPrice > 0 ? parsedPrice : confirmModalTrip.price;
    if (!finalPrice || finalPrice <= 0) return;

    setSubmittingRequestId(trip.id);
    try {
      const finalWaitSeconds = Math.max(30, Math.min(900, parseInt(waitSeconds, 10) || 120));
      await onSubmitDirectBid(trip, finalPrice, finalWaitSeconds, pricingMode);
      setDirectPrices((prev) => ({ ...prev, [trip.id]: finalPrice.toFixed(2) }));
      setLastSubmittedPrices((prev) => ({
        ...prev,
        [trip.id]: [...(prev[trip.id] || []), finalPrice],
      }));
      setConfirmModalTrip(null);
    } finally {
      setSubmittingRequestId(null);
    }
  }, [confirmModalTrip, modalPrice, onSubmitDirectBid, waitSeconds]);

  return {
    directPrices,
    setDirectPrices,
    lastSubmittedPrices,
    setLastSubmittedPrices,
    priceErrors,
    setPriceErrors,
    submittingRequestId,
    confirmModalTrip,
    setConfirmModalTrip,
    modalPrice,
    setModalPrice,
    waitSeconds,
    setWaitSeconds,
    handlePastePrice,
    handleInitiateOffer,
    handleConfirmSubmitBid,
  };
}
