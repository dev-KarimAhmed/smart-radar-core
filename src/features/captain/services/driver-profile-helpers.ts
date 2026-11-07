import { supabase } from '@/lib/supabase-client';

export type ProfileRow = Record<string, unknown>;
export type TFunction = (key: string, values?: Record<string, unknown>) => string;

export function inputToNumber(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function numberToInput(value: unknown) {
  const parsed = Number(value);
  return value === null || value === undefined || !Number.isFinite(parsed) ? '' : String(parsed);
}

export function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

export function firstNumber(...values: unknown[]) {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return 0;
}

export function getVehiclePlate(profile: ProfileRow | null) {
  const captainProfile = getCaptainProfile(profile);
  return firstString(profile?.vehicle_plate, profile?.plate_number, profile?.car_plate, captainProfile?.plate_number);
}

export function getVehicleMake(profile: ProfileRow | null) {
  const captainProfile = getCaptainProfile(profile);
  const captainVehicleName = [captainProfile?.vehicle_brand, captainProfile?.vehicle_model]
    .filter((value) => typeof value === 'string' && value.trim())
    .join(' ');
  return firstString(profile?.vehicle_make, profile?.vehicle_type, profile?.car_make, captainVehicleName, captainProfile?.vehicle_type);
}

export function getVehicleColor(profile: ProfileRow | null) {
  const captainProfile = getCaptainProfile(profile);
  return firstString(profile?.vehicle_color, profile?.car_color, captainProfile?.vehicle_color, captainProfile?.color);
}

export function getVehicleYear(profile: ProfileRow | null) {
  const captainProfile = getCaptainProfile(profile);
  const captainYear = captainProfile?.vehicle_year;
  return firstString(
    profile?.vehicle_year,
    profile?.model_year,
    typeof captainYear === 'number' ? String(captainYear) : captainYear,
  );
}

export function getCaptainProfile(profile: ProfileRow | null) {
  return isRecord(profile?.captain_profile) ? (profile.captain_profile as ProfileRow) : null;
}

export function getCaptainTier(profile: ProfileRow | null, rating: number, t: TFunction, userRank?: unknown) {
  const captainProfile = getCaptainProfile(profile);
  const explicitTier = firstString(
    profile?.tier,
    profile?.rank,
    profile?.driver_rank,
    profile?.captain_rank,
    profile?.membership_tier,
    captainProfile?.tier,
    captainProfile?.rank,
    captainProfile?.driver_rank,
    captainProfile?.captain_rank,
    captainProfile?.membership_tier,
    userRank,
  );
  const normalizedTier = normalizeTier(explicitTier);

  if (normalizedTier) {
    return { key: normalizedTier, label: tierLabel(normalizedTier, t) };
  }

  if (rating >= 4.9) return { key: 'platinum', label: tierLabel('platinum', t) };
  if (rating >= 4.7) return { key: 'gold', label: tierLabel('gold', t) };
  if (rating >= 4.4) return { key: 'bronze', label: tierLabel('bronze', t) };
  return { key: 'silver', label: tierLabel('silver', t) };
}

export function normalizeTier(value: string) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return '';
  if (normalized.includes('platinum') || normalized.includes('بلات')) return 'platinum';
  if (normalized.includes('gold') || normalized.includes('ذهب')) return 'gold';
  if (normalized.includes('silver') || normalized.includes('فض')) return 'silver';
  if (normalized.includes('bronze') || normalized.includes('برون')) return 'bronze';
  return normalized;
}

export function tierLabel(value: string, t: TFunction) {
  const key = normalizeTier(value);
  if (key === 'platinum' || key === 'gold' || key === 'silver' || key === 'bronze') {
    return t(`tierLabels.${key}`);
  }
  return value;
}

export function buildVehicleColumnPayload(
  profile: ProfileRow | null,
  vehicle: { plate: string; make: string; color: string; year: string },
) {
  const payload: Record<string, unknown> = {};
  const plateKey = firstExistingKey(profile, ['vehicle_plate', 'plate_number', 'car_plate']);
  const makeKey = firstExistingKey(profile, ['vehicle_make', 'vehicle_type', 'car_make']);
  const colorKey = firstExistingKey(profile, ['vehicle_color', 'car_color']);
  const yearKey = firstExistingKey(profile, ['vehicle_year', 'model_year']);
  const vehicleJsonKey = firstExistingKey(profile, ['vehicle', 'driver_vehicle']);
  const metadataKey = firstExistingKey(profile, ['metadata', 'profile_metadata']);

  if (plateKey) payload[plateKey] = vehicle.plate || null;
  if (makeKey) payload[makeKey] = vehicle.make || null;
  if (colorKey) payload[colorKey] = vehicle.color || null;
  if (yearKey) payload[yearKey] = vehicle.year || null;

  if (vehicleJsonKey) {
    payload[vehicleJsonKey] = vehicle;
  }

  if (metadataKey) {
    const currentMetadata = isRecord(profile?.[metadataKey]) ? (profile?.[metadataKey] as Record<string, unknown>) : {};
    payload[metadataKey] = { ...currentMetadata, vehicle };
  }

  return payload;
}

export function firstExistingKey(record: ProfileRow | null, keys: string[]) {
  if (!record) return '';
  return keys.find((key) => Object.prototype.hasOwnProperty.call(record, key)) || '';
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}


export interface CaptainProfileBuildParams {
  userId: string;
  affiliationType: string;
  businessName: string;
  vehicle: { plate: string; make: string; color: string; year: string };
  vehicleModel: string;
  nickname: string;
  facebookUrl: string;
  instagramUrl: string;
  tariffTouched: boolean;
  baseFare: string;
  pricePerKm: string;
  pricePerMin: string;
  includedKm: string;
  officePhone: string;
  sideId: string;
  companyCode: string;
}

export function buildCaptainProfileDbPayload(params: CaptainProfileBuildParams): Record<string, unknown> {
  const isOfficeTaxi = params.affiliationType === 'office-taxi';
  const isSmartApp = params.affiliationType === 'smart-app';
  const isIndependent = params.affiliationType === 'independent' || (!isOfficeTaxi && !isSmartApp);

  const payload: Record<string, unknown> = {
    id: params.userId,
    vehicle_type: isOfficeTaxi ? 'TAXI' : 'PRIVATE',
    affiliation_type: isOfficeTaxi ? 'office-taxi' : isSmartApp ? 'smart-app' : 'independent',
    pricing_mode: isIndependent ? 'FREE' : isOfficeTaxi ? 'TAXI' : 'APP',
    plate_number: params.vehicle.plate || null,
    vehicle_brand: params.vehicle.make || null,
    vehicle_model: params.vehicleModel.trim() || null,
    vehicle_year: params.vehicle.year ? Number(params.vehicle.year) || null : null,
    employment_type: isIndependent
      ? 'مستقل'
      : (params.businessName.trim() || (isOfficeTaxi ? 'مكتب تاكسي' : 'تطبيق ذكي')),
    nickname: params.nickname.trim() || null,
    vehicle_color: params.vehicle.color || null,
    facebook_url: params.facebookUrl.trim() || null,
    instagram_url: params.instagramUrl.trim() || null,
  };

  if (params.tariffTouched) {
    payload.base_fare = inputToNumber(params.baseFare);
    payload.price_per_km = inputToNumber(params.pricePerKm);
    payload.price_per_min = inputToNumber(params.pricePerMin);
    payload.included_km = inputToNumber(params.includedKm) ?? 0;
  }

  if (isOfficeTaxi) {
    payload.office_phone = params.officePhone.trim() || null;
    payload.side_id = params.sideId.trim() || null;
    payload.company_code = null;
  } else if (isSmartApp) {
    payload.company_code = params.companyCode.trim() || null;
    payload.office_phone = null;
    payload.side_id = null;
  } else {
    payload.company_code = null;
    payload.office_phone = null;
    payload.side_id = null;
  }

  return payload;
}


export async function fetchCaptainFullProfileData(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) throw error;

  let captainProfile: ProfileRow | null = null;
  try {
    const { data: captainData, error: captainError } = await supabase
      .from('captain_profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();
    if (captainError) throw captainError;
    captainProfile = (captainData || null) as ProfileRow | null;
  } catch (captainProfileError) {
    if ((process.env.NODE_ENV !== 'production')) console.warn('[Driver captain profile]', captainProfileError);
  }

  let floor: number | null = null;
  try {
    const { data: tariffContext } = await supabase.rpc('get_captain_tariff_context');
    const f = Number((tariffContext as Record<string, unknown> | null)?.minBaseFare);
    if (Number.isFinite(f)) floor = f;
  } catch (tariffContextError) {
    if ((process.env.NODE_ENV !== 'production')) console.warn('[Driver tariff context]', tariffContextError);
  }

  return {
    profile: data as ProfileRow | null,
    captainProfile,
    floor,
  };
}

export function extractDriverProfileInitialValues(
  data: ProfileRow | null,
  captainProfile: ProfileRow | null,
  user: any,
) {
  const mergedProfile = {
    ...(data || {}),
    captain_profile: captainProfile,
  } as ProfileRow;

  const fullName = firstString(mergedProfile.full_name, user?.name);
  const phone = firstString(mergedProfile.phone, user?.phone);
  const vehiclePlate = firstString(getVehiclePlate(mergedProfile), user?.vehicle?.plate);
  const vehicleMake = firstString(getVehicleMake(mergedProfile), user?.vehicle?.make);
  const vehicleColor = firstString(getVehicleColor(mergedProfile), user?.vehicle?.color);
  const vehicleYear = firstString(getVehicleYear(mergedProfile), user?.vehicle?.year);
  const baseFare = numberToInput(captainProfile?.base_fare);
  const pricePerKm = numberToInput(captainProfile?.price_per_km);
  const pricePerMin = numberToInput(captainProfile?.price_per_min);
  const includedKm = numberToInput(captainProfile?.included_km ?? 0);
  const vehicleModel = firstString(captainProfile?.vehicle_model);
  const rawBusinessName = firstString(captainProfile?.employment_type);
  const officePhone = firstString(captainProfile?.office_phone);
  const sideId = firstString(captainProfile?.side_id);
  const companyCode = firstString(captainProfile?.company_code);
  const facebookUrl = firstString(captainProfile?.facebook_url);
  const instagramUrl = firstString(captainProfile?.instagram_url);
  const nickname = firstString(captainProfile?.nickname);
  const nationalIdNumber = firstString(captainProfile?.national_id_number);
  const licenseNumber = firstString(captainProfile?.license_number);

  const rawAffiliation = firstString(captainProfile?.affiliation_type, user?.affiliation?.type);
  const isIndep = rawAffiliation === 'independent' || rawBusinessName === 'مستقل' || rawBusinessName.toLowerCase() === 'independent';
  const affiliationType = rawAffiliation || (captainProfile?.vehicle_type === 'TAXI' ? 'office-taxi' : isIndep ? 'independent' : (rawBusinessName ? 'smart-app' : 'independent'));
  const businessName = (affiliationType === 'independent' || isIndep) ? '' : rawBusinessName;

  return {
    mergedProfile,
    fullName,
    phone,
    vehiclePlate,
    vehicleMake,
    vehicleColor,
    vehicleYear,
    baseFare,
    pricePerKm,
    pricePerMin,
    includedKm,
    vehicleModel,
    businessName,
    officePhone,
    sideId,
    companyCode,
    facebookUrl,
    instagramUrl,
    nickname,
    nationalIdNumber,
    licenseNumber,
    affiliationType,
  };
}


export async function saveProfileToAuthMetadata(params: {
  fullName: string;
  phone: string;
  affiliationType: string;
  businessName: string;
  companyCode: string;
  officePhone: string;
  sideId: string;
  vehicle: { plate: string; make: string; color: string; year: string };
}) {
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
          plate: params.vehicle.plate.trim(),
          make: params.vehicle.make.trim(),
          color: params.vehicle.color.trim(),
          year: params.vehicle.year.trim(),
        },
      },
    });
    return !error;
  } catch (metadataError) {
    if ((process.env.NODE_ENV !== 'production')) console.warn('[Driver profile metadata fallback]', metadataError);
    return false;
  }
}

export function parseProfileSaveError(error: unknown): { isDuplicatePhone?: boolean; isDuplicatePlate?: boolean } {
  const errText = `${error instanceof Error ? error.message : ''} ${JSON.stringify(error || '')}`.toLowerCase();
  const isDuplicatePhone = errText.includes('unique_profiles_phone') || (errText.includes('phone') && errText.includes('duplicate'));
  const isDuplicatePlate = errText.includes('unique_plate_number') || errText.includes('unique_profiles_vehicle_plate') || (errText.includes('plate') && errText.includes('duplicate'));
  return { isDuplicatePhone, isDuplicatePlate };
}


export function mergeSavedProfileState(current: ProfileRow | null, state: {
  fullName: string;
  phone: string;
  vehiclePlate: string;
  vehicleMake: string;
  vehicleColor: string;
  vehicleYear: string;
  affiliationType: string;
  vehicleModel: string;
  businessName: string;
  nickname: string;
  officePhone: string;
  sideId: string;
  companyCode: string;
  facebookUrl: string;
  instagramUrl: string;
}): ProfileRow {
  return {
    ...(current || {}),
    full_name: state.fullName.trim(),
    phone: state.phone.trim(),
    vehicle_plate: state.vehiclePlate.trim(),
    vehicle_make: state.vehicleMake.trim(),
    vehicle_color: state.vehicleColor.trim(),
    vehicle_year: state.vehicleYear.trim(),
    captain_profile: {
      ...(getCaptainProfile(current || null) || {}),
      affiliation_type: state.affiliationType,
      vehicle_model: state.vehicleModel.trim(),
      employment_type: state.affiliationType === 'independent' ? 'مستقل' : state.businessName.trim(),
      nickname: state.nickname.trim(),
      office_phone: state.affiliationType === 'office-taxi' ? state.officePhone.trim() : '',
      side_id: state.affiliationType === 'office-taxi' ? state.sideId.trim() : '',
      company_code: state.affiliationType === 'smart-app' ? state.companyCode.trim() : '',
      facebook_url: state.facebookUrl.trim(),
      instagram_url: state.instagramUrl.trim(),
    },
  };
}

export function validateDriverTariff(
  baseFare: string,
  pricePerKm: string,
  pricePerMin: string,
  minBaseFare: number,
  t: TFunction,
): string {
  const parsedBaseFare = inputToNumber(baseFare);
  const parsedPerKm = inputToNumber(pricePerKm);
  const parsedPerMin = inputToNumber(pricePerMin);

  const filled = [parsedBaseFare, parsedPerKm, parsedPerMin].filter((value) => value !== null).length;
  if (filled === 0) return '';
  if (filled < 3) return t('tariffIncomplete');

  if (parsedBaseFare! < minBaseFare) return t('tariffBaseFareTooLow', { min: minBaseFare.toFixed(2) });
  if (parsedPerKm! <= 0) return t('tariffPerKmInvalid');
  if (parsedPerMin! < 0) return t('tariffPerMinInvalid');
  return '';
}


export function getDevMockDriverProfile(user: any) {
  const devFullName = firstString(user?.name);
  const devPhone = firstString(user?.phone);
  const devVehiclePlate = firstString(user?.vehicle?.plate);
  const devVehicleMake = firstString(user?.vehicle?.make);
  const devVehicleColor = firstString(user?.vehicle?.color);
  const devVehicleYear = firstString(user?.vehicle?.year);

  return {
    profile: {
      id: user?.uid,
      full_name: user?.name,
      phone: user?.phone,
      serial_id: user?.serial_id,
    },
    devFullName,
    devPhone,
    devVehiclePlate,
    devVehicleMake,
    devVehicleColor,
    devVehicleYear,
  };
}
