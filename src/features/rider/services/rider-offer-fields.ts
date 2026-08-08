import type { CaptainRank } from '../components/captain-offer-card';
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
  if (normalized.includes('PLATINUM') || normalized.includes('بلات')) return 'PLATINUM';
  if (normalized.includes('GOLD') || normalized.includes('ذهب')) return 'GOLD';
  if (normalized.includes('BRONZE') || normalized.includes('برون')) return 'BRONZE';
  return 'SILVER';
}

export function getOfferVehicleSummary(offer: any, labels: Pick<OfferPresentationLabels, 'notAvailable'>) {
  const parts = [
    firstDisplayString(offer?.captain?.vehicle_color, offer?.driverVehicle?.color),
    firstDisplayString(offer?.captain?.vehicle_brand, offer?.driverVehicle?.brand),
    firstDisplayString(offer?.captain?.vehicle_model, offer?.driverVehicle?.model, offer?.driverVehicle?.make),
    firstDisplayString(offer?.captain?.vehicle_type, offer?.driverVehicle?.type),
  ].filter(Boolean);

  return parts.length ? parts.join(' ') : labels.notAvailable;
}

export function getOfferPlate(offer: any, labels: Pick<OfferPresentationLabels, 'notAvailable'>) {
  return firstDisplayString(
    offer?.captain?.plate_number,
    offer?.captain?.license_plate,
    offer?.driverVehicle?.plate,
    labels.notAvailable,
  );
}
