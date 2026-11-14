import type { CaptainOffer } from './offer-card-types';
import { premiumFactors } from './offer-card-types';

export function getCaptainOfferPricing(offer: CaptainOffer) {
  const baseFare = Math.max(0, Number(offer.server_fare) || 0);
  const premiumFactor = premiumFactors[offer.captain.rank] ?? 0;
  const submittedFare = Math.max(0, Number(offer.submitted_fare) || 0);
  const fallbackFinalFare = baseFare + baseFare * premiumFactor;
  const finalFare = submittedFare > 0 ? submittedFare : fallbackFinalFare;
  const rankPremiumValue = Math.max(0, finalFare - baseFare);
  const actualPremiumFactor = baseFare > 0 ? rankPremiumValue / baseFare : 0;

  return {
    baseFare,
    premiumFactor,
    actualPremiumFactor,
    rankPremiumValue,
    finalFare,
  };
}

export function roundMoney(value: number) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

export function money(value: number | null | undefined) {
  return (Number(value) || 0).toFixed(2);
}

export function num(value: number | null | undefined) {
  const parsed = Number(value) || 0;
  return Number.isInteger(parsed) ? String(parsed) : parsed.toFixed(1);
}

export function formatMinutes(minutes: number, language: 'ar' | 'en') {
  const value = Math.max(1, Math.round(Number(minutes) || 1));
  if (value < 60) return language === 'ar' ? `${value} دقيقة` : `${value} min`;
  const hours = Math.floor(value / 60);
  const rest = value % 60;
  if (language === 'ar') return rest ? `${hours} س ${rest} د` : `${hours} س`;
  return rest ? `${hours}h ${rest}m` : `${hours}h`;
}
