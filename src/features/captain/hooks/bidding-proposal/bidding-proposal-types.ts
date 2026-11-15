import type { Trip } from '@/core/types';
import type { CaptainTier } from '../../services/offer-band';

export type CaptainOfferQuote = {
  captainFare: number;
  marketFare: number | null;
  floorPrice: number | null;
  ceilingPrice: number | null;
  suggestedFare: number;
  isOutsideBand: boolean;
  tier: CaptainTier;
  roadKm: number | null;
  billableKm: number | null;
  estimatedMinutes: number | null;
  tariff: {
    baseFare: number;
    perKm: number;
    perMin: number;
    includedKm: number;
  } | null;
};

export interface UseBiddingProposalProps {
  request: Trip;
  driverLocation: { lat: number; lng: number } | null;
  initialOfferPrice?: number | null;
  initialPricingMode?: 'FREE' | 'APP' | 'TAXI' | null;
  captainPricingMode?: 'FREE' | 'APP' | 'TAXI' | null;
  currentTariffProp?: {
    baseFare: number | null;
    pricePerKm: number | null;
    pricePerMin: number | null;
    includedKm?: number;
    pricingMode?: 'FREE' | 'APP' | 'TAXI' | null;
    marketAverage?: any;
  } | null;
  isSubmitting: boolean;
}

export function roundMoney(value: number) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

export function toFiniteNumberOrNull(value: unknown) {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : null;
}

export function normalizeCaptainTier(value: unknown, rating = 5): CaptainTier {
  const normalized = String(value || '').trim().toUpperCase();
  if (normalized.includes('DIAMOND') || normalized.includes('ماس')) return 'DIAMOND';
  if (normalized.includes('PLATINUM') || normalized.includes('بلات')) return 'PLATINUM';
  if (normalized.includes('GOLD') || normalized.includes('ذهب')) return 'GOLD';
  if (normalized.includes('BRONZE') || normalized.includes('برون')) return 'BRONZE';
  if (normalized.includes('SILVER') || normalized.includes('فض')) return 'SILVER';
  if (rating >= 4.95) return 'DIAMOND';
  if (rating >= 4.8) return 'PLATINUM';
  if (rating >= 4.5) return 'GOLD';
  if (rating >= 4.0) return 'SILVER';
  return 'BRONZE';
}

