import React from 'react';
import { Clock, Loader2, Plus, Route, X } from 'lucide-react';
import type { Trip } from '@/core/types';
import { cn } from '@/lib/utils';
import { RadarAntiCheatKernel } from '@/core/RadarAntiCheatKernel';
import { styles } from './radar-map.styles';
import { calculateCaptainTripPrice } from './radar-map.helpers';
import type { RadarCopyType } from './radar-copy';
import { RadarCardHeaderSection } from './radar-card-header-section';
import { RadarCardDetailsSection } from './radar-card-details-section';
import { RadarCardPricingSection } from './radar-card-pricing-section';

interface RadarRequestCardProps {
  request: Trip;
  language: 'ar' | 'en';
  currency: string;
  copy: RadarCopyType;
  driverLocation: { lat: number; lng: number } | null;
  activeTariff: any;
  captainPricingMode?: 'FREE' | 'APP' | 'TAXI' | null;
  subRole?: string | null;
  isOfficeTaxi?: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  offerCount: number;
  lastSubmittedPrice?: number;
  directPrice?: string;
  priceError?: boolean;
  isSubmitting: boolean;
  isCancelling: boolean;
  onInitiateOffer: (trip: Trip) => void;
  onCancelOffer?: (tripId: string) => Promise<boolean | void>;
  onIgnoreRequest: (tripId: string) => void;
  onPastePrice: (tripId: string) => Promise<void>;
  onUpdateDirectPrice: (tripId: string, value: string) => void;
  onClearPriceError: (tripId: string) => void;
  onEditTariff?: () => void;
}

export function RadarRequestCard({
  request,
  language,
  currency,
  copy,
  driverLocation,
  activeTariff,
  captainPricingMode,
  subRole,
  isOfficeTaxi,
  isExpanded,
  onToggleExpand,
  offerCount,
  lastSubmittedPrice,
  directPrice,
  priceError,
  isSubmitting,
  isCancelling,
  onInitiateOffer,
  onCancelOffer,
  onIgnoreRequest,
  onPastePrice,
  onUpdateDirectPrice,
  onClearPriceError,
  onEditTariff,
}: RadarRequestCardProps) {
  const isOwnPendingOffer = offerCount > 0;
  const isTaxiMode = isOfficeTaxi || request.pricingPreference === 'TAXI';
  const isAppMode = !isTaxiMode && (captainPricingMode === 'APP' || request.pricingPreference === 'APP');
  const isIndependentMode = !isTaxiMode && !isAppMode && (subRole === 'independent' || subRole === 'المستقل');
  const isRadarFreeMode = !isTaxiMode && !isAppMode && !isIndependentMode;

  const pickupCoords = request.exactPickupCoords || request.obfuscatedPickupCoords || request.pickupCoords;
  const passengersCount = request.seats || (request as any).number_of_riders || (request as any).passengers || 1;
  const dropoffCoords = request.dropoffCoords;
  const destinationQuery = dropoffCoords?.lat && dropoffCoords?.lng
    ? `${dropoffCoords.lat},${dropoffCoords.lng}`
    : request.dropoff
      ? encodeURIComponent(request.dropoff)
      : null;

  const routeGoogleMapsUrl = destinationQuery
    ? `https://www.google.com/maps/dir/?api=1&destination=${destinationQuery}${driverLocation?.lat && driverLocation?.lng ? `&origin=${driverLocation.lat},${driverLocation.lng}` : ''}`
    : (request.pickupGoogleMapsUrl || (pickupCoords?.lat && pickupCoords?.lng ? `https://www.google.com/maps/search/?api=1&query=${pickupCoords.lat},${pickupCoords.lng}` : null));

  const baseMarketPrice = request.offerPrice != null && request.offerPrice > 0 ? request.offerPrice : null;
  const calculatedCaptainPrice = calculateCaptainTripPrice(activeTariff, request);
  const defaultPriceValue = calculatedCaptainPrice != null
    ? calculatedCaptainPrice.toFixed(2)
    : (baseMarketPrice != null ? baseMarketPrice.toFixed(2) : '');
  const captainPriceForCard = defaultPriceValue || '0.00';

  const rawPriceStr = directPrice ?? defaultPriceValue;
  const rawPriceNum = rawPriceStr != null && rawPriceStr.trim() !== '' ? parseFloat(rawPriceStr) : null;
  const currentPrice = rawPriceNum != null && !isNaN(rawPriceNum) && rawPriceNum > 0
    ? rawPriceNum
    : (calculatedCaptainPrice ?? baseMarketPrice ?? 0);

  const marketBrake = (baseMarketPrice && baseMarketPrice > 0 && currentPrice > 0)
    ? RadarAntiCheatKernel.enforceMarketBrakes(currentPrice, baseMarketPrice)
    : { status: 'NORMAL' as const };

  const isDumpingCrimson = !isTaxiMode && (marketBrake.status === 'CRIMSON_BLOCK' || (Boolean(baseMarketPrice) && currentPrice > 0 && currentPrice < (baseMarketPrice! * 0.85)));
  const isDumpingAmber = !isTaxiMode && !isDumpingCrimson && marketBrake.status === 'AMBER_WARNING';
  const isUpperWarn = !isTaxiMode && !isDumpingCrimson && !isDumpingAmber && Boolean(baseMarketPrice) && currentPrice > 0 && currentPrice > (baseMarketPrice! * 1.15);
  const floorPrice = baseMarketPrice ? Math.round(baseMarketPrice * 0.85 * 100) / 100 : 0;

  return (
    <article className={cn(styles.style219_32, isOwnPendingOffer ? styles.cardPendingOffer : '')}>
      <RadarCardHeaderSection
        dropoff={request.dropoff}
        copy={copy}
        language={language}
        currency={currency}
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
        captainPriceForCard={captainPriceForCard}
        routeGoogleMapsUrl={routeGoogleMapsUrl}
      />

      {isExpanded && (
        <div className="mt-3.5 pt-3 border-t border-slate-800/80 animate-in fade-in duration-150">
          <RadarCardDetailsSection
            request={request}
            language={language}
            currency={currency}
            copy={copy}
            driverLocation={driverLocation}
            passengersCount={passengersCount}
          />

          {!isOwnPendingOffer && (
            <RadarCardPricingSection
              request={request}
              language={language}
              currency={currency}
              copy={copy}
              isAppMode={isAppMode}
              isIndependentMode={isIndependentMode}
              isRadarFreeMode={isRadarFreeMode}
              isTaxiMode={isTaxiMode}
              isBlockedByOtherPendingOffer={false}
              lastSubmittedPrice={lastSubmittedPrice}
              directPrice={directPrice}
              defaultPriceValue={defaultPriceValue}
              currentPrice={currentPrice}
              priceError={priceError}
              isDumpingCrimson={isDumpingCrimson}
              isDumpingAmber={isDumpingAmber}
              isUpperWarn={isUpperWarn}
              floorPrice={floorPrice}
              onInitiateOffer={onInitiateOffer}
              onPastePrice={onPastePrice}
              onUpdateDirectPrice={onUpdateDirectPrice}
              onClearPriceError={onClearPriceError}
              onEditTariff={onEditTariff}
            />
          )}

          {isOwnPendingOffer && (
            <div className="mt-3 flex flex-col gap-1.5 rounded-xl border border-amber-400/40 bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-amber-500/15 p-2.5 text-xs text-amber-200 shadow-[0_0_16px_rgba(251,191,36,0.12)] backdrop-blur-sm" dir={language === 'ar' ? 'rtl' : 'ltr'}>
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className={styles.ownPendingPulseWrap}>
                    <span className={styles.ownPendingPing} />
                    <span className={styles.ownPendingDot} />
                  </span>
                  <Clock className={styles.ownPendingIcon} />
                  <span className={styles.ownPendingText}>
                    {offerCount > 1
                      ? copy.ownPendingOffersCount.replace('{count}', String(offerCount))
                      : copy.ownPendingOffer}
                  </span>
                </div>
                {lastSubmittedPrice != null && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300 shrink-0">
                    {language === 'ar' ? `آخر عرض: ${lastSubmittedPrice.toFixed(2)} ${currency}` : `Last: ${lastSubmittedPrice.toFixed(2)} ${currency}`}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className={styles.style231_39} dir={language === 'ar' ? 'rtl' : 'ltr'}>
            <button
              type="button"
              onClick={() => onInitiateOffer(request)}
              disabled={isSubmitting}
              className={cn(
                styles.style232_40,
                isSubmitting ? styles.pendingOfferDisabled : '',
                isDumpingCrimson ? '!border-rose-500/80' : isDumpingAmber ? '!border-amber-500/80' : '',
                isOwnPendingOffer ? '!border-amber-400/60 !bg-gradient-to-r !from-amber-500/25 !via-emerald-500/20 !to-[#14B8A6]/25 !text-amber-200' : '',
              )}
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            >
              {isSubmitting ? (
                <Loader2 className={styles.submitSpinner} />
              ) : isOwnPendingOffer ? (
                <Plus className={styles.style233_41} />
              ) : (
                <Route className={styles.style233_41} />
              )}
              <span className="truncate">
                {isOwnPendingOffer ? copy.submitAnotherOffer : copy.submitDirect}
              </span>
            </button>

            {isOwnPendingOffer && onCancelOffer ? (
              <button
                type="button"
                onClick={() => void onCancelOffer(request.id)}
                disabled={isCancelling}
                className={cn(styles.style236_42, "!border-rose-500/40 !bg-rose-500/10 !text-rose-300 hover:!bg-rose-500/20")}
                title={copy.cancelOfferTitle}
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              >
                {isCancelling ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
                <span className="truncate">
                  {isCancelling
                    ? copy.cancellingOffer
                    : (offerCount > 1 ? copy.cancelOffers : copy.cancelOffer)}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onIgnoreRequest(request.id)}
                className={styles.style236_42}
                dir={language === 'ar' ? 'rtl' : 'ltr'}
              >
                {copy.ignore}
              </button>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
