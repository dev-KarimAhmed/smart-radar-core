import { supabase } from '@/lib/supabase-client';
import {
  inputToNumber,
  buildVehicleColumnPayload,
  isUuid,
  type ProfileRow,
  type TFunction,
} from './driver-profile-helpers';

export interface DriverProfileSaveParams {
  userId: string;
  fullName: string;
  phone: string;
  nickname: string;
  affiliationType: string;
  businessName: string;
  officePhone: string;
  sideId: string;
  companyCode: string;
  facebookUrl: string;
  instagramUrl: string;
  vehiclePlate: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleColor: string;
  vehicleYear: string;
  baseFare: string;
  includedKm: string;
  pricePerKm: string;
  pricePerMin: string;
  tariffTouched: boolean;
  profile: ProfileRow | null;
}

export function validateTariffFields(
  baseFare: string,
  pricePerKm: string,
  pricePerMin: string,
  includedKm: string,
  t: TFunction,
): string {
  const parsedBaseFare = inputToNumber(baseFare);
  const parsedPerKm = inputToNumber(pricePerKm);
  const parsedPerMin = inputToNumber(pricePerMin);
  const parsedIncludedKm = inputToNumber(includedKm);

  if (parsedIncludedKm !== null && parsedIncludedKm < 0) return t('tariffIncludedKmInvalid');

  const filled = [parsedBaseFare, parsedPerKm, parsedPerMin].filter((val) => val !== null).length;
  if (filled === 0) return '';
  if (filled < 3) return t('tariffIncomplete');

  if (parsedBaseFare! <= 0) return t('tariffBaseFareInvalid');
  if (parsedPerKm! <= 0) return t('tariffPerKmInvalid');
  if (parsedPerMin! < 0) return t('tariffPerMinInvalid');
  return '';
}

export async function saveProfileToAuthMetadata(params: {
  fullName: string;
  phone: string;
  affiliationType: string;
  businessName: string;
  companyCode: string;
  officePhone: string;
  sideId: string;
  vehiclePlate: string;
  vehicleMake: string;
  vehicleColor: string;
  vehicleYear: string;
}): Promise<boolean> {
  try {
    const { error } = await supabase.auth.updateUser({
      data: {
        full_name: params.fullName.trim(),
        phone: params.phone.trim(),
        subRole: params.affiliationType === 'independent' ? 'independent' : 'captain',
        affiliation: {
          type: params.affiliationType,
          companyName: params.affiliationType === 'independent' ? '' : params.businessName.trim(),
          companyCode: params.affiliationType === 'smart-app' ? params.companyCode.trim() : '',
          officePhone: params.affiliationType === 'office-taxi' ? params.officePhone.trim() : '',
          sideId: params.affiliationType === 'office-taxi' ? params.sideId.trim() : '',
        },
        vehicle: {
          plate: params.vehiclePlate.trim(),
          make: params.vehicleMake.trim(),
          color: params.vehicleColor.trim(),
          year: params.vehicleYear.trim(),
        },
      },
    });
    return !error;
  } catch (metadataError) {
    if (process.env.NODE_ENV !== 'production') console.warn('[Driver profile metadata fallback]', metadataError);
    return false;
  }
}

export async function executeProfileDatabaseSave(params: DriverProfileSaveParams): Promise<void> {
  const { userId, profile, affiliationType, tariffTouched } = params;
  const vehicle = {
    plate: params.vehiclePlate.trim(),
    make: params.vehicleMake.trim(),
    color: params.vehicleColor.trim(),
    year: params.vehicleYear.trim(),
  };

  const payload: Record<string, unknown> = {
    full_name: params.fullName.trim(),
    phone: params.phone.trim(),
  };
  if (profile && Object.prototype.hasOwnProperty.call(profile, 'updated_at')) {
    payload.updated_at = new Date().toISOString();
  }
  const vehicleColumnPayload = buildVehicleColumnPayload(profile, vehicle);
  Object.assign(payload, vehicleColumnPayload);

  const { data: updatedRows, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', userId)
    .select('id');
  if (error) throw error;

  const profileWriteConfirmed = Array.isArray(updatedRows) && updatedRows.length > 0;
  if (!profileWriteConfirmed || Object.keys(vehicleColumnPayload).length === 0) {
    const metadataSaved = await saveProfileToAuthMetadata(params);
    if (!profileWriteConfirmed && !metadataSaved) {
      throw new Error('profile_update_not_confirmed');
    }
  }

  const isOfficeTaxi = affiliationType === 'office-taxi';
  const isSmartApp = affiliationType === 'smart-app';
  const isIndependent = affiliationType === 'independent' || (!isOfficeTaxi && !isSmartApp);

  const captainProfilePayload: Record<string, unknown> = {
    id: userId,
    vehicle_type: isOfficeTaxi ? 'TAXI' : 'PRIVATE',
    affiliation_type: isOfficeTaxi ? 'office-taxi' : isSmartApp ? 'smart-app' : 'independent',
    pricing_mode: isIndependent ? 'FREE' : isOfficeTaxi ? 'TAXI' : 'APP',
    plate_number: vehicle.plate || null,
    vehicle_brand: vehicle.make || null,
    vehicle_model: params.vehicleModel.trim() || null,
    vehicle_year: vehicle.year ? Number(vehicle.year) || null : null,
    employment_type: isIndependent
      ? 'مستقل'
      : (params.businessName.trim() || (isOfficeTaxi ? 'مكتب تاكسي' : 'تطبيق ذكي')),
    nickname: params.nickname.trim() || null,
    vehicle_color: vehicle.color || null,
    facebook_url: params.facebookUrl.trim() || null,
    instagram_url: params.instagramUrl.trim() || null,
  };

  if (tariffTouched) {
    captainProfilePayload.base_fare = inputToNumber(params.baseFare);
    captainProfilePayload.price_per_km = inputToNumber(params.pricePerKm);
    captainProfilePayload.price_per_min = inputToNumber(params.pricePerMin);
    captainProfilePayload.included_km = inputToNumber(params.includedKm) ?? 0;
  }

  if (isOfficeTaxi) {
    captainProfilePayload.office_phone = params.officePhone.trim() || null;
    captainProfilePayload.side_id = params.sideId.trim() || null;
    captainProfilePayload.company_code = null;
  } else if (isSmartApp) {
    captainProfilePayload.company_code = params.companyCode.trim() || null;
    captainProfilePayload.office_phone = null;
    captainProfilePayload.side_id = null;
  } else {
    captainProfilePayload.company_code = null;
    captainProfilePayload.office_phone = null;
    captainProfilePayload.side_id = null;
  }

  const { data: captainProfileRows, error: captainProfileError } = await supabase
    .from('captain_profiles')
    .upsert(captainProfilePayload, { onConflict: 'id' })
    .select('id');

  const captainProfileSynced = !captainProfileError && Array.isArray(captainProfileRows) && captainProfileRows.length > 0;
  if (!captainProfileSynced) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('[Driver profile save] captain_profiles sync failed:', captainProfileError || 'no rows affected');
    }
    throw Object.assign(
      new Error(captainProfileError?.message || 'captain_profile_update_not_confirmed'),
      { isCaptainProfileFailure: true },
    );
  }
}
