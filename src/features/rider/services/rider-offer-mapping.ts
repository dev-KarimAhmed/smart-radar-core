import type { Offer } from '@/core/types';

export function parseDriverRank(value: string | null): Offer['driverRank'] {
  const normalized = `${value || ''}`.toLowerCase();
  if (normalized.includes('platinum')) return 'Platinum';
  if (normalized.includes('gold')) return 'Gold';
  if (normalized.includes('silver')) return 'Silver';
  return 'Bronze';
}

export function mapRideOfferRow(row: Record<string, unknown>): Offer | null {
  const offerId = firstString(row.id, row.offer_id, row.offerId);
  const driverId = firstString(row.driver_id, row.captain_id, row.driverId, row.captainId, row.id);
  const price = firstNumber(row.offer_price, row.price, row.fare, row.server_estimated_fare);

  if (!offerId || !driverId || price === null) return null;

  const profile = (isRecord(row.captain) ? row.captain : {}) as Record<string, unknown>;
  const captainProfile = (isRecord(row.captain_profile) ? row.captain_profile : {}) as Record<string, unknown>;
  const vehicle = (
    isRecord(row.driver_vehicle)
      ? row.driver_vehicle
      : isRecord(row.vehicle)
        ? row.vehicle
        : captainProfile
  ) as Record<string, unknown>;
  const vehicleBrand = firstString(vehicle.brand, vehicle.vehicle_brand, vehicle.make, vehicle.vehicle_make, row.vehicle_brand, row.vehicle_make);
  const vehicleModel = firstString(vehicle.model, vehicle.vehicle_model, row.vehicle_model);
  const vehicleType = firstString(vehicle.type, vehicle.vehicle_type, row.vehicle_type, vehicle.make, row.vehicle_make);
  const vehicleColor = firstString(vehicle.color, vehicle.vehicle_color, row.vehicle_color);
  const vehicleYear = firstNumber(vehicle.year, vehicle.vehicle_year, row.vehicle_year);
  const plate = firstString(vehicle.plate, vehicle.plate_number, vehicle.vehicle_plate, row.plate_number, row.vehicle_plate);
  const rawAffiliationType = firstString(
    captainProfile.affiliation_type,
    row.affiliation_type,
    profile.affiliation_type,
    (profile.affiliation as any)?.type
  );
  const isTaxiVehicle = vehicleType === 'TAXI' || captainProfile.vehicle_type === 'TAXI';
  const rawCompany = firstString(
    captainProfile.company_name,
    captainProfile.employment_type,
    row.affiliation_name,
    vehicle.company_name,
    vehicle.companyName,
    vehicle.company,
    vehicle.officeName,
    vehicle.office_name,
    profile.company_name,
    profile.company,
    (profile.affiliation as any)?.name
  );
  const isIndependentDriver = rawAffiliationType === 'independent'
    || rawCompany === 'مستقل'
    || rawCompany === 'كابتن مستقل'
    || rawCompany === 'كابتن معلن مستقل'
    || rawCompany?.toLowerCase() === 'independent';
  const resolvedAffiliationType = isIndependentDriver
    ? 'independent'
    : (rawAffiliationType || (isTaxiVehicle ? 'office-taxi' : rawCompany ? 'smart-app' : 'independent'));
  const resolvedAffiliationName = (resolvedAffiliationType === 'independent' || isIndependentDriver ? '' : rawCompany) || '';
  const captainPhone = firstString(row.driver_phone, row.captain_phone, row.phone, profile.phone, profile.phone_number);
  const pricingMode = firstString(row.pricing_mode, row.pricingMode) as 'FREE' | 'APP' | 'TAXI' | undefined;

  const offer: Offer = {
    id: offerId,
    driverId,
    price,
    pricing_mode: pricingMode,
    pricingMode,
    driverName: firstString(row.driver_name, row.captain_name, profile.full_name, profile.name, row.driver_serial, row.captain_serial, profile.serial_id) || 'سائق',
    driverRating: firstNumber(row.driver_rating, row.captain_rating, row.rating, profile.trust_score, profile.rating, profile.trust_rating) ?? 5,
    driverRank: parseDriverRank(firstString(row.driver_rank, row.captain_rank, row.rank, profile.tier, profile.rank)),
    driverVehicle: {
      make: [vehicleBrand, vehicleModel].filter(Boolean).join(' ') || vehicleType || 'سيارة',
      brand: vehicleBrand || '',
      model: vehicleModel || '',
      color: vehicleColor || '',
      year: vehicleYear ?? undefined,
      plate: plate || 'غير متاح',
      type: vehicleType || 'سيارة',
    },
    driverAffiliation: {
      type: resolvedAffiliationType,
      name: resolvedAffiliationName,
      phone: captainPhone || undefined,
    },
    silencePreference: 'neutral',
    distance_to_rider: firstNumber(row.pickup_distance_km, row.distance_to_rider, row.distance) ?? undefined,
    pickup_eta_minutes: (
      firstNumber(row.pickup_distance_km) != null
        ? firstNumber(row.eta_minutes)
        : firstNumber(row.pickup_eta_minutes, row.eta, row.pickup_eta)
    ) ?? undefined,
    estimated_duration_minutes: firstNumber(row.estimated_duration_minutes, row.duration, row.estimated_duration) ?? undefined,
    wait_seconds: firstNumber(row.wait_seconds) ?? undefined,
    created_at: firstString(row.created_at) || undefined,
    fare_breakdown: (row.fare_breakdown ?? null) as Record<string, unknown> | null,
    captain: {
      ...captainProfile,
      ...profile,
      full_name: firstString(profile.full_name, profile.name, row.driver_name, row.captain_name) || undefined,
      phone: captainPhone || undefined,
      tier: firstString(profile.tier, row.driver_rank, row.captain_rank, row.rank) || undefined,
      trust_rating: firstNumber(profile.trust_score, profile.rating, profile.trust_rating, row.driver_rating, row.captain_rating) ?? undefined,
      vehicle_type: vehicleType || undefined,
      vehicle_brand: vehicleBrand || undefined,
      vehicle_model: vehicleModel || undefined,
      vehicle_color: vehicleColor || undefined,
      vehicle_year: vehicleYear ?? undefined,
      plate_number: plate || undefined,
      affiliation_type: resolvedAffiliationType,
      affiliation_name: resolvedAffiliationName,
      company_name: resolvedAffiliationName || undefined,
    },
  };

  return offer;
}

export async function enrichRideOfferRows(client: { from: (table: string) => any }, rows: Record<string, unknown>[]) {
  const captainIds = Array.from(
    new Set(rows.map((row) => firstString(row.captain_id, row.driver_id, row.captainId, row.driverId)).filter(Boolean) as string[])
  );

  if (captainIds.length === 0) return rows;

  const [profileRows, captainProfileRows] = await Promise.all([
    fetchRowsByIds(client, 'profiles', 'id', captainIds),
    fetchRowsByIds(client, 'captain_profiles', 'id', captainIds),
  ]);

  const profileMap = new Map(profileRows.map((row) => [String(row.id), row]));
  const captainProfileMap = new Map(captainProfileRows.map((row) => [String(row.id), row]));

  return rows.map((row) => {
    const captainId = firstString(row.captain_id, row.driver_id, row.captainId, row.driverId);
    return {
      ...row,
      captain: captainId ? profileMap.get(captainId) || row.captain : row.captain,
      captain_profile: captainId ? captainProfileMap.get(captainId) || row.captain_profile : row.captain_profile,
    };
  });
}

export async function fetchRowsByIds(
  client: { from: (table: string) => any },
  tableName: string,
  idColumn: string,
  ids: string[]
): Promise<Record<string, unknown>[]> {
  try {
    const { data, error } = await client
      .from(tableName)
      .select('*')
      .in(idColumn, ids);

    if (error) throw error;
    return Array.isArray(data) ? (data as Record<string, unknown>[]) : [];
  } catch (error) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(`[Rider offers] Could not enrich ${tableName}:`, error);
    }
    return [];
  }
}

export function firstString(...values: unknown[]) {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
}

export function firstNumber(...values: unknown[]) {
  for (const value of values) {
    const numberValue = Number(value);
    if (Number.isFinite(numberValue)) return numberValue;
  }
  return null;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}
