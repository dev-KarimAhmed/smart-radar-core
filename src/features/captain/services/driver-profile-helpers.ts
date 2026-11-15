export type ProfileRow = Record<string, unknown>;

export type TFunction = (key: string) => string;

export function inputToNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function numberToInput(value: unknown): string {
  const parsed = Number(value);
  return value === null || value === undefined || !Number.isFinite(parsed) ? '' : String(parsed);
}

export function firstString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return '';
}

export function firstNumber(...values: unknown[]): number {
  for (const value of values) {
    const number = Number(value);
    if (Number.isFinite(number)) return number;
  }
  return 0;
}

export function getCaptainProfile(profile: ProfileRow | null): ProfileRow | null {
  return isRecord(profile?.captain_profile) ? (profile.captain_profile as ProfileRow) : null;
}

export function getVehiclePlate(profile: ProfileRow | null): string {
  const captainProfile = getCaptainProfile(profile);
  return firstString(profile?.vehicle_plate, profile?.plate_number, profile?.car_plate, captainProfile?.plate_number);
}

export function getVehicleMake(profile: ProfileRow | null): string {
  const captainProfile = getCaptainProfile(profile);
  const captainVehicleName = [captainProfile?.vehicle_brand, captainProfile?.vehicle_model]
    .filter((value) => typeof value === 'string' && value.trim())
    .join(' ');
  return firstString(profile?.vehicle_make, profile?.vehicle_type, profile?.car_make, captainVehicleName, captainProfile?.vehicle_type);
}

export function getVehicleColor(profile: ProfileRow | null): string {
  const captainProfile = getCaptainProfile(profile);
  return firstString(profile?.vehicle_color, profile?.car_color, captainProfile?.vehicle_color, captainProfile?.color);
}

export function getVehicleYear(profile: ProfileRow | null): string {
  const captainProfile = getCaptainProfile(profile);
  const captainYear = captainProfile?.vehicle_year;
  return firstString(
    profile?.vehicle_year,
    profile?.model_year,
    typeof captainYear === 'number' ? String(captainYear) : captainYear,
  );
}

export function normalizeTier(value: string): string {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return '';
  if (normalized.includes('diamond') || normalized.includes('ماس')) return 'diamond';
  if (normalized.includes('platinum') || normalized.includes('بلات')) return 'platinum';
  if (normalized.includes('gold') || normalized.includes('ذهب')) return 'gold';
  if (normalized.includes('silver') || normalized.includes('فض')) return 'silver';
  if (normalized.includes('bronze') || normalized.includes('برون')) return 'bronze';
  return normalized;
}

export function tierLabel(value: string, t: TFunction): string {
  const key = normalizeTier(value);
  if (key === 'diamond' || key === 'platinum' || key === 'gold' || key === 'silver' || key === 'bronze') {
    return t(`tierLabels.${key}`);
  }
  return value;
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

  if (rating >= 4.95) return { key: 'diamond', label: tierLabel('diamond', t) };
  if (rating >= 4.8) return { key: 'platinum', label: tierLabel('platinum', t) };
  if (rating >= 4.5) return { key: 'gold', label: tierLabel('gold', t) };
  if (rating >= 4.0) return { key: 'silver', label: tierLabel('silver', t) };
  return { key: 'bronze', label: tierLabel('bronze', t) };
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

export function firstExistingKey(record: ProfileRow | null, keys: string[]): string {
  if (!record) return '';
  return keys.find((key) => Object.prototype.hasOwnProperty.call(record, key)) || '';
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

export function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}
