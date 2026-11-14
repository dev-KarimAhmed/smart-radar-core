import {
  firstHistoryString,
  firstHistoryNumber,
  normalizeCaptainRank,
  isPlainRecord,
  formatVehicleInfo,
  UNAVAILABLE_FALLBACK,
  type HistoricalTrip,
} from './history-types-utils';

export function getCaptainIdFromTrip(trip: any): string {
  return firstHistoryString(
    trip?.captain_id,
    trip?.accepted_captain_id,
    trip?.driver_id,
    trip?.captain?.id,
    trip?.captain_profile?.id,
    trip?.metadata?.captain_id,
    trip?.metadata?.captainId,
    trip?.acceptedOffer?.captain_id,
    trip?.acceptedOffer?.captain?.id,
    trip?.acceptedOffer?.driverId
  );
}

export function getHistoryCaptainName(trip: any, acceptedOffer?: any): string {
  return firstHistoryString(
    trip?.captain?.full_name,
    trip?.captain?.name,
    trip?.captain_profile?.full_name,
    trip?.metadata?.captain_name,
    trip?.metadata?.captainName,
    acceptedOffer?.driverName,
    acceptedOffer?.captain?.full_name,
    trip?.driver_name,
    trip?.captain_name,
    trip?.driverName
  ) || 'Captain';
}

export function getHistoryCaptainPhone(trip: any, acceptedOffer?: any): string {
  return firstHistoryString(
    trip?.captain?.phone,
    trip?.captain?.phone_number,
    trip?.captain_profile?.phone,
    trip?.metadata?.captain_phone,
    trip?.metadata?.captainPhone,
    acceptedOffer?.driverVehicle?.phone,
    acceptedOffer?.captain?.phone,
    trip?.driver_phone,
    trip?.captain_phone,
    trip?.driverPhone
  );
}

export function getHistoryCaptainRank(trip: any, acceptedOffer?: any): HistoricalTrip['captainRank'] {
  return normalizeCaptainRank(
    firstHistoryString(
      trip?.captain_rank,
      trip?.captainRank,
      trip?.captain?.rank,
      trip?.captain?.tier,
      trip?.captain_profile?.rank,
      trip?.captain_profile?.tier,
      trip?.captain_profile?.membership_tier,
      trip?.metadata?.captain_rank,
      trip?.metadata?.captainRank,
      acceptedOffer?.driverRank,
      acceptedOffer?.tier,
      trip?.driver_rank,
      trip?.driverRank
    ) || firstHistoryNumber(trip?.captain?.rating, trip?.captain?.trust_score, acceptedOffer?.driverRating, 5)
  );
}

export function getHistoryVehicleInfo(trip: any, acceptedOffer?: any): string {
  const metadata = isPlainRecord(trip?.metadata) ? trip.metadata : {};
  const vehicle = acceptedOffer?.driverVehicle || trip?.driver_vehicle || trip?.vehicle || {};
  const captainProfile = trip?.captain_profile || {};
  const captain = trip?.captain || {};
  const parts = [
    firstHistoryString(
      metadata.vehicle_make,
      metadata.vehicle_brand,
      captainProfile.vehicle_make,
      captainProfile.vehicle_brand,
      captain.vehicle_make,
      captain.vehicle_brand,
      vehicle.make,
      vehicle.vehicle_make,
      vehicle.brand,
      vehicle.vehicle_brand
    ),
    firstHistoryString(
      metadata.vehicle_model,
      captainProfile.vehicle_model,
      captain.vehicle_model,
      vehicle.model,
      vehicle.vehicle_model
    ),
    firstHistoryString(
      metadata.vehicle_color,
      captainProfile.vehicle_color,
      captain.vehicle_color,
      vehicle.color,
      vehicle.vehicle_color
    ),
    firstHistoryString(
      metadata.vehicle_year,
      captainProfile.vehicle_year,
      captain.vehicle_year,
      vehicle.year,
      vehicle.vehicle_year
    ),
    firstHistoryString(
      metadata.vehicle_plate,
      metadata.plate_number,
      captainProfile.vehicle_plate,
      captainProfile.plate_number,
      captain.vehicle_plate,
      captain.plate_number,
      vehicle.plate,
      vehicle.plate_number,
      vehicle.vehicle_plate
    ),
  ].filter(Boolean);

  return parts.length > 0
    ? parts.join(' - ')
    : firstHistoryString(metadata.vehicle_info, metadata.vehicleInfo, trip?.vehicleInfo, formatVehicleInfo(vehicle));
}
