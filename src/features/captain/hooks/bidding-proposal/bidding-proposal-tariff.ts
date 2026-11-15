export function computeTariffBreakdown(params: {
  currentTariff: any;
  meterDetails: any;
  finalOfferPrice: number;
  existingOfferPrice?: number;
  captainMeterFare: number;
  tier: string;
  rankIncreaseFactor: number;
}) {
  const {
    currentTariff,
    meterDetails,
    finalOfferPrice,
    existingOfferPrice,
    captainMeterFare,
    tier,
    rankIncreaseFactor,
  } = params;

  const marketAverage = currentTariff?.marketAverage;
  const isWithinBaseFare = (meterDetails?.billableKm ?? 0) <= 0;
  const marketBaseFare = marketAverage?.baseFare ?? (meterDetails?.baseFare ?? 0);
  const currentBaseFare = currentTariff?.baseFare ?? (meterDetails?.baseFare ?? 0);
  const marketPerKm = marketAverage?.perKm ?? (meterDetails?.perKm ?? 0);
  const marketPerMin = marketAverage?.perMin ?? (meterDetails?.perMin ?? 0);
  const currentPerKm = currentTariff?.pricePerKm ?? (meterDetails?.perKm ?? 0);
  const currentPerMin = currentTariff?.pricePerMin ?? (meterDetails?.perMin ?? 0);

  const effectiveOfferPrice = finalOfferPrice > 0 ? finalOfferPrice : (existingOfferPrice ?? captainMeterFare);
  const offerRatio = captainMeterFare > 0 ? effectiveOfferPrice / captainMeterFare : 1;
  const offerBaseFare = currentBaseFare * offerRatio;
  const offerPerKm = currentPerKm * offerRatio;
  const offerPerMin = currentPerMin * offerRatio;

  const isGoldOrPlatinum = (tier === 'DIAMOND' || tier === 'GOLD' || tier === 'PLATINUM') && rankIncreaseFactor > 0;
  const isSilver = tier === 'SILVER';

  return {
    isWithinBaseFare,
    marketBaseFare,
    currentBaseFare,
    marketPerKm,
    marketPerMin,
    currentPerKm,
    currentPerMin,
    offerBaseFare,
    offerPerKm,
    offerPerMin,
    isGoldOrPlatinum,
    isSilver,
  };
}

