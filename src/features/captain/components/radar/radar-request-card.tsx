import React from 'react';
import { ChevronDown, Star, TrendingUp } from 'lucide-react';
import type { Trip } from '@/core/types';
import { cn } from '@/lib/utils';
import { styles } from './radar-map.styles';
import type { RadarCopyType } from './radar-copy';
import { RadarCardHeaderSection } from './radar-card-header-section';
import { RadarCardPricingSection } from './radar-card-pricing-section';
import { resolveCardPricingContext } from './radar-request-card-helpers';
import { RadarCoordsAccordion } from './radar-coords-accordion';
import { RadarBroadcastAccordion } from './radar-broadcast-accordion';
import { RadarCardActions } from './radar-card-actions';

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
  const isFavorite = Boolean(request.riderFavoritedMe || (request as any).isFavoriteCaptain);

  const [isCoordsOpen, setIsCoordsOpen] = React.useState(true);
  const [isBroadcastOpen, setIsBroadcastOpen] = React.useState(false);
  const [isPricingOpen, setIsPricingOpen] = React.useState(true);
  const [broadcastSeconds, setBroadcastSeconds] = React.useState(120);

  const pricingContext = resolveCardPricingContext({
    request,
    activeTariff,
    captainPricingMode,
    subRole,
    isOfficeTaxi,
    driverLocation,
    directPrice,
  });

  const {
    isTaxiMode,
    isAppMode,
    isIndependentMode,
    isRadarFreeMode,
    passengersCount,
    routeGoogleMapsUrl,
    defaultPriceValue,
    captainPriceForCard,
    currentPrice,
    isDumpingCrimson,
    isDumpingAmber,
    isUpperWarn,
    floorPrice,
  } = pricingContext;

  return (
    <article
      className={cn(
        styles.style219_32,
        isOwnPendingOffer ? styles.cardPendingOffer : '',
        isFavorite && !isOwnPendingOffer && 'border-amber-400/50 shadow-[0_0_20px_rgba(251,191,36,0.18)] bg-gradient-to-b from-[#131b2e] to-[#070c18]',
      )}
    >
      {/* Favorite Captain Prominent Banner */}
      {isFavorite && (
        <div className="mb-3 flex items-center justify-center gap-2 rounded-2xl border border-amber-400/40 bg-gradient-to-r from-amber-500/25 via-yellow-500/20 to-amber-500/25 px-4 py-2 text-xs sm:text-sm font-black text-amber-200 shadow-[0_0_16px_rgba(251,191,36,0.2)]">
          <Star className="h-4 w-4 fill-amber-300 text-amber-300 animate-pulse shrink-0" />
          <span>{copy.favoriteCaptainNotice || '⭐ أنت كابتن مفضل لدى المستخدم ⭐'}</span>
          <Star className="h-4 w-4 fill-amber-300 text-amber-300 animate-pulse shrink-0" />
        </div>
      )}

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
        <div className="mt-3.5 pt-3 border-t border-slate-800/80 animate-in fade-in duration-150 space-y-3">
          {/* Accordion 1: إحداثيات الرحلة */}
          <RadarCoordsAccordion
            request={request}
            language={language}
            currency={currency}
            copy={copy}
            isOpen={isCoordsOpen}
            onToggle={() => setIsCoordsOpen((prev) => !prev)}
            driverLocation={driverLocation}
            passengersCount={passengersCount}
            routeGoogleMapsUrl={routeGoogleMapsUrl}
          />

          {/* Accordion 2: تعديل وقت الانتشار */}
          <RadarBroadcastAccordion
            language={language}
            copy={copy}
            isOpen={isBroadcastOpen}
            onToggle={() => setIsBroadcastOpen((prev) => !prev)}
            broadcastSeconds={broadcastSeconds}
            onUpdateSeconds={setBroadcastSeconds}
          />

          {/* Accordion 3: تعديل الأسعار */}
          <div className="rounded-2xl border border-slate-800 bg-[#070c18]/90 overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => setIsPricingOpen((prev) => !prev)}
              className="w-full flex items-center justify-between p-3 text-xs font-black text-slate-200 hover:bg-white/5 transition cursor-pointer"
            >
              <span className="flex items-center gap-2 text-emerald-300">
                <TrendingUp className="h-4 w-4 text-[#14F5D5]" />
                <span>{copy.priceAdjustmentAccordion || 'تعديل الأسعار'}</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] font-bold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-md">
                  {currentPrice ? currentPrice.toFixed(2) : captainPriceForCard} {currency}
                </span>
                <ChevronDown className={cn('h-4 w-4 text-slate-400 transition-transform duration-200', isPricingOpen && 'rotate-180')} />
              </div>
            </button>
            {isPricingOpen && (
              <div className="p-3 pt-0 border-t border-slate-800/60 animate-in fade-in duration-150">
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
                    isBlockedByOtherPendingOffer={isOwnPendingOffer}
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
              </div>
            )}
          </div>

          <RadarCardActions
            request={request}
            language={language}
            currency={currency}
            copy={copy}
            isOwnPendingOffer={isOwnPendingOffer}
            lastSubmittedPrice={lastSubmittedPrice}
            isSubmitting={isSubmitting}
            isCancelling={isCancelling}
            isDumpingCrimson={isDumpingCrimson}
            isDumpingAmber={isDumpingAmber}
            onInitiateOffer={onInitiateOffer}
            onCancelOffer={onCancelOffer}
            onIgnoreRequest={onIgnoreRequest}
          />
        </div>
      )}
    </article>
  );
}
