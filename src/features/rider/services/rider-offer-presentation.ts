import type { Offer } from '@/core/types';
import type { AppLanguage } from '@/lib/i18n/simple-copy';
import type { CaptainOffer } from '../components/captain-offer-card';
import type { CaptainPresencePoint } from './rider-server-marketplace';
import { mapRiderMarketplaceError } from './rider-server-marketplace';
import { firstDisplayString } from './rider-view-format';
import { firstNumber } from './rider-destination-normalizers';
import {
  getOfferAffiliationLabel,
  getOfferCaptainName,
  getOfferCaptainPhone,
  getOfferContactUrl,
  getOfferPlate,
  getOfferVehicleSummary,
  toCaptainOfferRank,
  type OfferPresentationLabels,
} from './rider-offer-fields';
import { isPreferredOffer } from './rider-offer-ranking';
import type { RiderDestination } from '../state/rider-state-machine';
import type { RiderLocation } from '../components/rider-map';

export interface MarketplaceErrorLabels {
  permissionDenied: string;
  authRequired: string;
  network: string;
  fareCalculation: string;
  missingColumns: string;
  invalidStatus: string;
  foreignKeyMismatch: string;
  duplicateActive: string;
  generic: string;
}

export function getLocalizedMarketplaceError(error: unknown, language: AppLanguage, labels: MarketplaceErrorLabels) {
  if (language === 'ar') return mapRiderMarketplaceError(error);

  const typedError = error as { message?: string; code?: string; details?: string; hint?: string };
  const message = [
    typedError?.code,
    typedError?.message,
    typedError?.details,
    typedError?.hint,
    error,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (message.includes('42501') || message.includes('row-level security') || message.includes('permission denied')) {
    return labels.permissionDenied;
  }

  if (message.includes('jwt') || message.includes('auth') || message.includes('rider_id')) {
    return labels.authRequired;
  }

  if (message.includes('network') || message.includes('fetch') || message.includes('timeout') || message.includes('gateway')) {
    return labels.network;
  }

  if (message.includes('calculate_server_fare') || message.includes('server_estimated_fare')) {
    return labels.fareCalculation;
  }

  if (message.includes('42703') || message.includes('column') || message.includes('origin_h3') || message.includes('destination_h3')) {
    return labels.missingColumns;
  }

  if (message.includes('22p02') || message.includes('invalid input value for enum') || message.includes('ride_request_status')) {
    return labels.invalidStatus;
  }

  if (message.includes('23503') || message.includes('foreign key') || message.includes('country_id')) {
    return labels.foreignKeyMismatch;
  }

  if (message.includes('23505') || message.includes('duplicate') || message.includes('active request')) {
    return labels.duplicateActive;
  }

  return labels.generic;
}

function haversineKm(a: RiderLocation, b: RiderLocation) {
  const R = 6371;
  const dLat = (b.lat - a.lat) * (Math.PI / 180);
  const dLon = (b.lng - a.lng) * (Math.PI / 180);
  const sinLat = Math.sin(dLat / 2);
  const sinLon = Math.sin(dLon / 2);
  const h = sinLat * sinLat + Math.cos(a.lat * (Math.PI / 180)) * Math.cos(b.lat * (Math.PI / 180)) * sinLon * sinLon;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

/**
 * Builds the `CaptainOfferCard` view model from a raw marketplace offer,
 * estimating pickup distance/ETA and trip distance from known coordinates
 * when the server hasn't supplied them yet.
 */
export function buildCaptainOfferFromOffer(
  offer: Offer,
  context: {
    captainLocations: CaptainPresencePoint[];
    riderLocation: RiderLocation;
    destination: RiderDestination | null | undefined;
    preferredCaptainIds: string[];
    language: AppLanguage;
    serverEstimatedFare: number | undefined;
  },
  labels: OfferPresentationLabels,
): { offer: CaptainOffer; isPreferred: boolean } {
  const { captainLocations, riderLocation, destination, preferredCaptainIds, serverEstimatedFare } = context;
  const captain = captainLocations.find((c) => c.id === offer.driverId || c.serial === offer.driverName);
  let realDistance = (offer as unknown as Record<string, any>).distance_to_rider as number | null | undefined;

  if (realDistance == null && captain && riderLocation) {
    realDistance = haversineKm(riderLocation, captain.coordinates);
  }

  let tripDistance: number | null = null;
  if (riderLocation && destination?.coords) {
    tripDistance = haversineKm(riderLocation, destination.coords);
  }

  const distanceDisplay = realDistance != null ? (realDistance < 0.1 ? 0 : realDistance).toFixed(1) : '---';
  const etaDisplay = (offer as unknown as Record<string, any>).pickup_eta_minutes ?? (realDistance != null ? Math.max(1, Math.round(realDistance * 3)) : '---');
  const rawDuration = (offer as unknown as Record<string, any>).estimated_duration_minutes ?? (tripDistance != null ? Math.max(5, Math.round(tripDistance * 1.2)) : null);

  const captainName = getOfferCaptainName(offer, labels);
  const vehicleSummary = getOfferVehicleSummary(offer, labels);
  const plateValue = getOfferPlate(offer, labels);
  const offerRecord = offer as unknown as Record<string, any>;
  const rawOfferIsPreferred =
    Boolean(offerRecord.__isPreferredCaptain) ||
    isPreferredOffer(offer, preferredCaptainIds);

  const captainOffer: CaptainOffer = {
    id: offer.id || offer.driverId,
    captain: {
      id: offer.driverId || offer.captain?.id || '',
      name: captainName,
      avatar_url: offer.captain?.avatar_url || offerRecord.driverAvatar,
      trust_rating: Number(offer.captain?.trust_rating || offerRecord.driverRating || 5),
      rank: toCaptainOfferRank(offer.captain?.tier || offerRecord.driverRank || offerRecord.tier),
      vehicle_model: firstDisplayString(
        offer.captain?.vehicle_model,
        offer.captain?.vehicle_name,
        offerRecord.driverVehicle?.model,
        offerRecord.driverVehicle?.make,
        vehicleSummary,
      ),
      vehicle_color: firstDisplayString(offer.captain?.vehicle_color, offerRecord.driverVehicle?.color),
      plate_number: plateValue,
      completed_trips: firstNumber(
        offer.captain?.completed_trips,
        offer.captain?.completedTrips,
        offerRecord.completed_trips,
        offerRecord.completedTrips,
        offerRecord.driverCompletedTrips,
      ) || 0,
      company_name: firstDisplayString(
        offer.captain?.company_name,
        offer.captain?.company,
        offerRecord.driverAffiliation?.company_name,
        offerRecord.driverAffiliation?.name,
      ),
      affiliation_label: getOfferAffiliationLabel(offer, labels),
      is_verified: Boolean(
        offer.captain?.is_verified ||
        offer.captain?.verified ||
        offerRecord.driverVerified ||
        offerRecord.is_verified,
      ),
      phone: getOfferCaptainPhone(offer),
      contact_url: getOfferContactUrl(offer),
      vehicle_year: firstDisplayString(offer.captain?.vehicle_year, offerRecord.driverVehicle?.year),
      vehicle_category: firstDisplayString(offer.captain?.vehicle_category, offerRecord.driverVehicle?.category),
    },
    server_fare: Number(serverEstimatedFare || offer.price || 0),
    submitted_fare: Number(offer.price || 0),
    eta_minutes: Number(etaDisplay) || 1,
    distance_km: Number(distanceDisplay) || 0,
    estimated_duration_minutes: rawDuration || undefined,
    trip_distance_km: tripDistance || undefined,
    additional_info: firstDisplayString(offer.captain?.bio, offer.captain?.notes, offerRecord.additional_info),
  };

  const isPreferred =
    rawOfferIsPreferred ||
    isPreferredOffer(captainOffer as unknown as Record<string, any>, preferredCaptainIds);

  return { offer: captainOffer, isPreferred };
}
