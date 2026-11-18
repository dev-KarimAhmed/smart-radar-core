import { supabase } from '@/lib/supabase-client';
import type { User } from '@/core/types';
import {
  isUuid,
  firstString,
  numberToInput,
  getVehiclePlate,
  getVehicleMake,
  getVehicleColor,
  getVehicleYear,
  type ProfileRow,
} from './driver-profile-helpers';

export interface DriverProfileLoadedData {
  profile: ProfileRow;
  fields: {
    fullName: string;
    nickname: string;
    phone: string;
    licenseNumber: string;
    vehiclePlate: string;
    vehicleMake: string;
    vehicleModel: string;
    vehicleColor: string;
    vehicleYear: string;
    businessName: string;
    officePhone: string;
    sideId: string;
    companyCode: string;
    facebookUrl: string;
    instagramUrl: string;
    baseFare: string;
    pricePerKm: string;
    pricePerMin: string;
    includedKm: string;
    affiliationType: string;
  };
  minBaseFare?: number;
}

export async function fetchDriverProfileData(user: User): Promise<DriverProfileLoadedData> {
  if (process.env.NODE_ENV !== 'production' && !isUuid(user.uid)) {
    const devFields = {
      fullName: firstString(user.name),
      nickname: '',
      phone: firstString(user.phone),
      licenseNumber: '',
      vehiclePlate: firstString(user.vehicle?.plate),
      vehicleMake: firstString(user.vehicle?.make),
      vehicleModel: '',
      vehicleColor: firstString(user.vehicle?.color),
      vehicleYear: firstString(user.vehicle?.year),
      businessName: '',
      officePhone: '',
      sideId: '',
      companyCode: '',
      facebookUrl: '',
      instagramUrl: '',
      baseFare: '',
      pricePerKm: '',
      pricePerMin: '',
      includedKm: '',
      affiliationType: (user.affiliation?.type as string) || 'independent',
    };
    return {
      profile: {
        id: user.uid,
        full_name: user.name,
        phone: user.phone,
        serial_id: user.serial_id,
      },
      fields: devFields,
    };
  }

  const { data, error } = await supabase.from('profiles').select('*').eq('id', user.uid).maybeSingle();
  if (error) throw error;

  let captainProfile: ProfileRow | null = null;
  try {
    const { data: captainData, error: captainError } = await supabase
      .from('captain_profiles')
      .select('*')
      .eq('id', user.uid)
      .maybeSingle();
    if (captainError) throw captainError;
    captainProfile = (captainData || null) as ProfileRow | null;
  } catch (captainProfileError) {
    if (process.env.NODE_ENV !== 'production') console.warn('[Driver captain profile]', captainProfileError);
  }

  let minBaseFare: number | undefined;
  try {
    const { data: tariffContext } = await supabase.rpc('get_captain_tariff_context');
    const floor = Number((tariffContext as Record<string, unknown> | null)?.minBaseFare);
    if (Number.isFinite(floor)) minBaseFare = floor;
  } catch (tariffContextError) {
    if (process.env.NODE_ENV !== 'production') console.warn('[Driver tariff context]', tariffContextError);
  }

  const mergedProfile = { ...(data || {}), captain_profile: captainProfile } as ProfileRow;
  const newBusinessName = firstString(captainProfile?.employment_type);
  const rawAffiliation = firstString(captainProfile?.affiliation_type, user.affiliation?.type);
  const isIndep = rawAffiliation === 'independent' || newBusinessName === 'مستقل' || newBusinessName.toLowerCase() === 'independent';
  const newAffiliationType = rawAffiliation || (captainProfile?.vehicle_type === 'TAXI' ? 'office-taxi' : isIndep ? 'independent' : newBusinessName ? 'smart-app' : 'independent');
  const cleanBusinessName = newAffiliationType === 'independent' || isIndep ? '' : newBusinessName;

  const fields = {
    fullName: firstString(mergedProfile.full_name, user.name),
    nickname: firstString(captainProfile?.nickname),
    phone: firstString(mergedProfile.phone, user.phone),
    licenseNumber: firstString(captainProfile?.license_number),
    vehiclePlate: firstString(getVehiclePlate(mergedProfile), user.vehicle?.plate),
    vehicleMake: firstString(getVehicleMake(mergedProfile), user.vehicle?.make),
    vehicleModel: firstString(captainProfile?.vehicle_model),
    vehicleColor: firstString(getVehicleColor(mergedProfile), user.vehicle?.color),
    vehicleYear: firstString(getVehicleYear(mergedProfile), user.vehicle?.year),
    businessName: cleanBusinessName,
    officePhone: firstString(captainProfile?.office_phone),
    sideId: firstString(captainProfile?.side_id),
    companyCode: firstString(captainProfile?.company_code),
    facebookUrl: firstString(captainProfile?.facebook_url),
    instagramUrl: firstString(captainProfile?.instagram_url),
    baseFare: numberToInput(captainProfile?.base_fare),
    pricePerKm: numberToInput(captainProfile?.price_per_km),
    pricePerMin: numberToInput(captainProfile?.price_per_min),
    includedKm: numberToInput(captainProfile?.included_km ?? 0),
    affiliationType: newAffiliationType,
  };

  return { profile: mergedProfile, fields, minBaseFare };
}
