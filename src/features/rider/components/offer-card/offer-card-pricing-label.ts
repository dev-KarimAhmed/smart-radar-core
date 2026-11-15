import type { CaptainOffer } from './offer-card-types';

export function resolveOfferAffiliationAndPricing(
  offer: CaptainOffer,
  t: (k: string) => string,
  isArabic: boolean,
) {
  const captain = offer.captain;
  const pricingMode = (offer.pricing_mode || (offer as any).pricingMode || '').toUpperCase();
  const rawAffiliation = (
    captain.affiliation_type ||
    (offer as any).affiliation_type ||
    (offer as any).driverAffiliation?.type ||
    ''
  ).toLowerCase();

  const rawCompany = (
    captain.company_name ||
    (captain as any).employment_type ||
    (offer as any).driverAffiliation?.company_name ||
    (offer as any).driverAffiliation?.name ||
    ''
  ).trim();

  const isTaxiVehicle =
    rawAffiliation === 'office-taxi' ||
    rawAffiliation.includes('taxi') ||
    (captain.vehicle_category || '').toLowerCase().includes('taxi');

  const isIndependentCaptain =
    rawAffiliation === 'independent' ||
    (!isTaxiVehicle && rawAffiliation === '' && !rawCompany) ||
    (!isTaxiVehicle && rawCompany === 'مستقل') ||
    captain.company_name === 'مستقل';

  const isSmartAppCaptain =
    !isTaxiVehicle && !isIndependentCaptain && (rawAffiliation === 'smart-app' || rawAffiliation.includes('app') || Boolean(rawCompany));

  const isFreeOffer = isIndependentCaptain || pricingMode === 'FREE';
  const isTaxiOffer = !isFreeOffer && (pricingMode === 'TAXI' || isTaxiVehicle);
  const isAppOffer = !isFreeOffer && !isTaxiOffer && (pricingMode === 'APP' || isSmartAppCaptain);

  const cleanCompany =
    isIndependentCaptain ||
    rawCompany === t('independentCaptain') ||
    rawCompany.toLowerCase() === 'independent' ||
    rawCompany === 'مستقل' ||
    rawCompany === 'كابتن مستقل'
      ? ''
      : rawCompany;

  const displayCompany = cleanCompany
    ? cleanCompany.toLowerCase() === 'uber'
      ? isArabic
        ? 'اوبر'
        : 'Uber'
      : cleanCompany.toLowerCase() === 'careem'
      ? isArabic
        ? 'كريم'
        : 'Careem'
      : cleanCompany
    : '';

  let pricingLabel = isArabic ? 'سعر حر' : 'Direct Fare';
  if (isFreeOffer) {
    pricingLabel = isArabic ? 'سعر حر' : 'Direct Fare';
  } else if (isTaxiOffer) {
    pricingLabel = displayCompany
      ? isArabic
        ? `سعر تكسي / ${displayCompany}`
        : `Taxi Fare / ${displayCompany}`
      : isArabic
      ? 'سعر تكسي'
      : 'Taxi Fare';
  } else if (isAppOffer) {
    pricingLabel = displayCompany
      ? isArabic
        ? `سعر تطبيق / ${displayCompany}`
        : `App Fare / ${displayCompany}`
      : isArabic
      ? 'سعر تطبيق'
      : 'App Fare';
  }

  return {
    pricingLabel,
    displayCompany,
    isFreeOffer,
    isTaxiOffer,
    isAppOffer,
  };
}
