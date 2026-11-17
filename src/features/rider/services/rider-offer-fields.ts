import type { CaptainRank } from '../components/offer-card/offer-card-shared';
import { firstDisplayString } from './rider-view-format';

export interface OfferPresentationLabels {
  fallbackCaptainName: string;
  notAvailable: string;
  affiliationUber: string;
  affiliationIndrive: string;
  affiliationCareem: string;
  affiliationCompany: string;
  affiliationSelfEmployed: string;
  affiliationAppDriver: string;
}

export function getOfferCaptainName(offer: any, labels: Pick<OfferPresentationLabels, 'fallbackCaptainName'>) {
  return firstDisplayString(
    offer?.captain?.nickname,
    offer?.captain?.full_name,
    offer?.captain?.name,
    offer?.driverName,
    offer?.captain?.serial_id,
    labels.fallbackCaptainName,
  );
}

export function getOfferCaptainPhone(offer: any) {
  return firstDisplayString(
    offer?.driverAffiliation?.phone,
    offer?.captain?.phone,
    offer?.captain?.phone_number,
    offer?.driverVehicle?.phone,
  );
}

export function getOfferContactUrl(offer: any) {
  return firstDisplayString(
    offer?.captain?.contact_page_url,
    offer?.captain?.social_url,
    offer?.captain?.facebook_url,
    offer?.captain?.whatsapp_url,
    offer?.driverVehicle?.contact_page_url,
  );
}

export function getOfferAffiliationLabel(offer: any, labels: OfferPresentationLabels) {
  const rawType = firstDisplayString(offer?.driverAffiliation?.type, offer?.captain?.affiliation_type, offer?.captain?.employment_type);
  const rawName = firstDisplayString(offer?.driverAffiliation?.name, offer?.captain?.affiliation_name, offer?.captain?.company_name);
  const normalized = `${rawName || ''} ${rawType || ''}`.toLowerCase();

  if (normalized.includes('uber') || normalized.includes('أوبر')) {
    return labels.affiliationUber;
  }
  if (normalized.includes('indrive') || normalized.includes('in-drive') || normalized.includes('in drive') || normalized.includes('إن درايف') || normalized.includes('اندرايف')) {
    return labels.affiliationIndrive;
  }
  if (normalized.includes('careem') || normalized.includes('كريم')) {
    return labels.affiliationCareem;
  }
  if (normalized.includes('office') || normalized.includes('taxi') || normalized.includes('company') || normalized.includes('مكتب') || normalized.includes('شركة')) {
    return labels.affiliationCompany;
  }
  if (normalized.includes('self') || normalized.includes('independent') || normalized.includes('freelance') || normalized.includes('مستقل')) {
    return labels.affiliationSelfEmployed;
  }
  if (normalized.includes('smart') || normalized.includes('app')) {
    return labels.affiliationAppDriver;
  }

  return labels.affiliationSelfEmployed;
}

export function toCaptainOfferRank(value: unknown): CaptainRank {
  const normalized = String(value || '').trim().toUpperCase();
  if (normalized.includes('DIAMOND') || normalized.includes('ماس')) return 'DIAMOND';
  if (normalized.includes('PLATINUM') || normalized.includes('بلات')) return 'PLATINUM';
  if (normalized.includes('GOLD') || normalized.includes('ذهب')) return 'GOLD';
  if (normalized.includes('BRONZE') || normalized.includes('برون')) return 'BRONZE';
  if (normalized.includes('SILVER') || normalized.includes('فض')) return 'SILVER';
  // SILVER is the base rank (4th tier). Falling back to SILVER ensures an
  // unranked or unrecognised captain starts at the baseline tier.
  return 'SILVER';
}

const PLACEHOLDER_VEHICLE_VALUES = new Set([
  'غير متاح',
  'غير محدد',
  'غير معروف',
  'not available',
  'not specified',
  'unspecified',
  'unavailable',
  'n/a',
  'na',
  'none',
  'null',
  'undefined',
  '-',
  '--',
  '---',
  '—',
]);

export function sanitizeVehicleField(value?: string | null): string {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  if (PLACEHOLDER_VEHICLE_VALUES.has(trimmed.toLowerCase())) return '';
  return trimmed;
}

export function getOfferVehicleSummary(offer: any, labels: Pick<OfferPresentationLabels, 'notAvailable'>) {
  const parts = [
    sanitizeVehicleField(firstDisplayString(offer?.captain?.vehicle_color, offer?.driverVehicle?.color)),
    sanitizeVehicleField(firstDisplayString(offer?.captain?.vehicle_brand, offer?.driverVehicle?.brand)),
    sanitizeVehicleField(firstDisplayString(offer?.captain?.vehicle_model, offer?.driverVehicle?.model, offer?.driverVehicle?.make)),
    sanitizeVehicleField(firstDisplayString(offer?.captain?.vehicle_type, offer?.driverVehicle?.type)),
  ].filter(Boolean);

  return parts.length ? parts.join(' ') : labels.notAvailable;
}

export function getOfferPlate(offer: any, _labels?: Pick<OfferPresentationLabels, 'notAvailable'>) {
  return sanitizeVehicleField(
    firstDisplayString(
      offer?.captain?.plate_number,
      offer?.captain?.license_plate,
      offer?.driverVehicle?.plate,
    ),
  );
}
