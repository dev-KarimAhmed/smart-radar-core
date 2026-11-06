import React from 'react';
import {
  ChevronDown,
  Clock,
  ExternalLink,
  Loader2,
  MapPin,
  Minus,
  Plus,
  Route,
  Star,
  TrendingUp,
  X,
} from 'lucide-react';
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

  const isFavorite = Boolean(request.riderFavoritedMe || (request as any).isFavoriteCaptain);
  const [isCoordsOpen, setIsCoordsOpen] = React.useState(true);
  const [isBroadcastOpen, setIsBroadcastOpen] = React.useState(false);
  const [isPricingOpen, setIsPricingOpen] = React.useState(true);
  const [broadcastSeconds, setBroadcastSeconds] = React.useState(120);

  return (
    <article
      className={cn(
        styles.style219_32,
        isOwnPendingOffer ? styles.cardPendingOffer : '',
        isFavorite && !isOwnPendingOffer && 'border-amber-400/50 shadow-[0_0_20px_rgba(251,191,36,0.18)] bg-gradient-to-b from-[#131b2e] to-[#070c18]'
      )}
    >
      {/* Favorite Captain Prominent Banner (Page 9) */}
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
          {/* Accordion 1: إحداثيات الرحلة (Page 9 & 10) */}
          <div className="rounded-2xl border border-slate-800 bg-[#070c18]/90 overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => setIsCoordsOpen((prev) => !prev)}
              className="w-full flex items-center justify-between p-3 text-xs font-black text-slate-200 hover:bg-white/5 transition cursor-pointer"
            >
              <span className="flex items-center gap-2 text-cyan-300">
                <MapPin className="h-4 w-4 text-[#14F5D5]" />
                <span>{copy.coordinatesAccordion || 'إحداثيات الرحلة'}</span>
              </span>
              <div className="flex items-center gap-2">
                {request.estimatedDistance != null && (
                  <span className="font-mono text-[11px] font-bold text-slate-400">
                    {request.estimatedDistance} {language === 'ar' ? 'كم' : 'km'}
                  </span>
                )}
                <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform duration-200", isCoordsOpen && "rotate-180")} />
              </div>
            </button>
            {isCoordsOpen && (
              <div className="p-3 pt-0 border-t border-slate-800/60 animate-in fade-in duration-150">
                <RadarCardDetailsSection
                  request={request}
                  language={language}
                  currency={currency}
                  copy={copy}
                  driverLocation={driverLocation}
                  passengersCount={passengersCount}
                />
                {routeGoogleMapsUrl && (
                  <a
                    href={routeGoogleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 px-3.5 py-2.5 text-xs font-black text-cyan-300 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
                  >
                    <ExternalLink className="h-4 w-4" />
                    <span>{copy.verifyCoordinatesBtn || 'تحقق من الإحداثيات إذا رغبت'}</span>
                  </a>
                )}
              </div>
            )}
          </div>

          {/* Accordion 2: تعديل وقت الانتشار (Page 9 & 10) */}
          <div className="rounded-2xl border border-slate-800 bg-[#070c18]/90 overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => setIsBroadcastOpen((prev) => !prev)}
              className="w-full flex items-center justify-between p-3 text-xs font-black text-slate-200 hover:bg-white/5 transition cursor-pointer"
            >
              <span className="flex items-center gap-2 text-amber-300">
                <Clock className="h-4 w-4 text-amber-400" />
                <span>{copy.broadcastTimeAccordion || 'تعديل وقت الانتشار'}</span>
              </span>
              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] font-bold text-amber-300 bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 rounded-md">
                  {broadcastSeconds} {language === 'ar' ? 'ثانية' : 's'} ({Math.ceil(broadcastSeconds / 60)} {language === 'ar' ? 'دقيقة' : 'min'})
                </span>
                <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform duration-200", isBroadcastOpen && "rotate-180")} />
              </div>
            </button>
            {isBroadcastOpen && (
              <div className="p-3 pt-0 border-t border-slate-800/60 animate-in fade-in duration-150 space-y-2.5">
                <p className="text-[11px] text-slate-400 leading-relaxed font-sans pt-1">
                  {language === 'ar'
                    ? 'مدة صلاحية عرضك في المحيط ومهلة انتظار الراكب للرد قبل انتهاء الطلب.'
                    : 'Offer broadcast duration and rider response wait window before expiry.'}
                </p>
                <div className="flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setBroadcastSeconds((prev) => Math.max(30, prev - 30))}
                    className="flex h-10 w-12 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold transition cursor-pointer"
                    title="-30s"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <div className="flex-1 text-center py-2 px-3 rounded-xl border border-amber-500/30 bg-amber-950/20 font-mono font-black text-base text-amber-300">
                    {broadcastSeconds} {language === 'ar' ? 'ثانية' : 's'}
                  </div>
                  <button
                    type="button"
                    onClick={() => setBroadcastSeconds((prev) => Math.min(300, prev + 30))}
                    className="flex h-10 w-12 items-center justify-center rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 font-bold transition cursor-pointer"
                    title="+30s"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Accordion 3: تعديل الأسعار (Page 9 & 10) */}
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
                <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform duration-200", isPricingOpen && "rotate-180")} />
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
                    {copy.ownPendingOffer}
                  </span>
                </div>
                {lastSubmittedPrice != null && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-500/20 px-2 py-0.5 text-[10px] font-mono font-bold text-amber-300 shrink-0">
                    {language === 'ar' ? `السعر المقدم: ${lastSubmittedPrice.toFixed(2)} ${currency}` : `Offered: ${lastSubmittedPrice.toFixed(2)} ${currency}`}
                  </span>
                )}
              </div>
            </div>
          )}

          <div className={styles.style231_39} dir={language === 'ar' ? 'rtl' : 'ltr'}>
            {isOwnPendingOffer ? (
              onCancelOffer ? (
                <button
                  type="button"
                  onClick={() => void onCancelOffer(request.id)}
                  disabled={isCancelling}
                  className={styles.cancelOfferBtnFull}
                  title={copy.cancelOfferTitle}
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                >
                  {isCancelling ? (
                    <Loader2 className="h-4 w-4 animate-spin shrink-0" />
                  ) : (
                    <X className="h-4 w-4 shrink-0" />
                  )}
                  <span className="truncate">
                    {isCancelling ? copy.cancellingOffer : copy.cancelOffer}
                  </span>
                </button>
              ) : null
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => onInitiateOffer(request)}
                  disabled={isSubmitting}
                  className={cn(
                    styles.style232_40,
                    isSubmitting ? styles.pendingOfferDisabled : '',
                    isDumpingCrimson ? '!border-rose-500/80' : isDumpingAmber ? '!border-amber-500/80' : '',
                  )}
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                >
                  {isSubmitting ? (
                    <Loader2 className={styles.submitSpinner} />
                  ) : (
                    <Route className={styles.style233_41} />
                  )}
                  <span className="truncate">
                    {copy.submitDirect}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => onIgnoreRequest(request.id)}
                  className={styles.style236_42}
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                >
                  {copy.ignore}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </article>
  );
}
