import type { AppLanguage } from '@/lib/i18n/simple-copy';
import type { RiderActiveTrip } from '../state/rider-state-machine';
import type { HistoricalTrip } from '../components/rider-dashboard';
import { toCaptainOfferRank } from './rider-offer-fields';

export function firstDisplayString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return '';
}

interface CountryCurrencyConfig {
  currency_ar?: string | null;
  currency_en?: string | null;
  currency_code?: string | null;
}

export function getCurrencyLabel(
  countryConfig: CountryCurrencyConfig | null,
  user: { currencyAr?: string; currencyEn?: string } | null | undefined,
  language: AppLanguage = 'ar',
) {
  if (language === 'en') {
    return (
      countryConfig?.currency_en ||
      user?.currencyEn ||
      countryConfig?.currency_code ||
      countryConfig?.currency_ar ||
      user?.currencyAr ||
      ''
    );
  }

  return countryConfig?.currency_ar || user?.currencyAr || countryConfig?.currency_en || user?.currencyEn || countryConfig?.currency_code || '';
}

export function formatMoney(value: number, currencyLabel: string) {
  return currencyLabel ? `${value.toFixed(2)} ${currencyLabel}` : value.toFixed(2);
}

export interface DurationLabels {
  minutes: (count: number) => string;
  hoursMinutes: (hours: number, minutes: number) => string;
  hoursOnly: (hours: number) => string;
}

export function formatDurationLabel(minutes: number, labels: DurationLabels) {
  const safeMinutes = Math.max(1, Math.round(minutes));
  if (safeMinutes < 60) {
    return labels.minutes(safeMinutes);
  }

  const hours = Math.floor(safeMinutes / 60);
  const remainingMinutes = safeMinutes % 60;
  return remainingMinutes ? labels.hoursMinutes(hours, remainingMinutes) : labels.hoursOnly(hours);
}

export function normalizeWhatsappContact(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return '';

  const compact = trimmed.replace(/\s+/g, '').replace(/[^\d+]/g, '');
  const international = compact.startsWith('+')
    ? compact
    : `+${compact.replace(/^00/, '').replace(/^0+/, '')}`;

  if (!/^\+[1-9]\d{7,14}$/.test(international)) return '';
  return international.replace(/[^\d]/g, '');
}

export function isTripStartedStatus(status: string) {
  return status === 'STARTED'
    || status === 'TRIP_ACTIVE'
    || status === 'ACTIVE'
    || status === 'IN_PROGRESS';
}

export function toHistoricalTrip(trip: RiderActiveTrip): HistoricalTrip {
  return {
    tripId: trip.tripId,
    captainId: trip.captainId,
    captainName: trip.captainName || trip.captainSerial,
    captainRank: toCaptainOfferRank(trip.captain?.tier || trip.captain?.rank || trip.captain?.captain_rank),
    captainPhone: trip.captainPhone,
    vehicleInfo: `${trip.vehicleType} - ${trip.vehiclePlate}`,
    finalPrice: trip.finalPrice,
    timestamp: Date.now(),
  };
}
