import type { Trip } from '@/core/types';
import { RadarAntiCheatKernel } from '@/core/RadarAntiCheatKernel';
import { calculateCaptainTripPrice } from './radar-map.helpers';

export function resolveCardPricingContext(params: {
  request: Trip;
  activeTariff: any;
  captainPricingMode?: 'FREE' | 'APP' | 'TAXI' | null;
  subRole?: string | null;
  isOfficeTaxi?: boolean;
  driverLocation: { lat: number; lng: number } | null;
  directPrice?: string;
}) {
  const {
    request,
    activeTariff,
    captainPricingMode,
    subRole,
    isOfficeTaxi,
    driverLocation,
    directPrice,
  } = params;

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

  return {
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
  };
}

