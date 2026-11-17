import type { SupabaseClient } from '@supabase/supabase-js';

function pickStr(...values: unknown[]): string {
  for (const val of values) {
    if (typeof val === 'string') {
      const trimmed = val.trim();
      if (trimmed) return trimmed;
    }
  }
  return '';
}

export interface HydratedCaptainCard {
  id: string;
  full_name: string | null;
  nickname: string | null;
  serial_id: string | null;
  phone: string | null;
  tier: string | null;
  rating: number | null;
  behavior_rating: number | null;
  vehicle_rating: number | null;
  rating_count: number | null;
  heart_count: number | null;
  vehicle_type: string | null;
  vehicle_brand: string | null;
  vehicle_model: string | null;
  vehicle_color: string | null;
  vehicle_year: number | null;
  plate_number: string | null;
  affiliation_type: string | null;
  employment_type: string | null;
  base_fare: number | null;
  price_per_km: number | null;
  price_per_min: number | null;
  flag_fall_fee: number | null;
  included_km: number | null;
  verification_status: string | null;
  facebook_url: string | null;
  instagram_url: string | null;
}

export function buildHydratedCaptainCard(
  captainId: string,
  profileRow?: Record<string, unknown> | null,
  captainRow?: Record<string, unknown> | null,
  authMetaCaptain?: Record<string, unknown> | null,
): HydratedCaptainCard {
  const p = profileRow ?? {};
  const c = captainRow ?? {};
  const m = authMetaCaptain ?? {};

  const vehicleType = pickStr(c.vehicle_type, m.vehicle_type, p.vehicle_type) || null;
  const isTaxi =
    vehicleType?.toUpperCase() === 'TAXI' ||
    pickStr(c.affiliation_type, m.affiliation_type, p.affiliation_type).toLowerCase() === 'office-taxi';

  const plate =
    pickStr(
      c.plate_number,
      c.vehicle_plate,
      m.plate_number,
      m.plate,
      p.vehicle_plate,
      p.plate_number,
      p.car_plate,
    ) || null;

  const rawColor = pickStr(
    c.vehicle_color,
    c.color,
    m.vehicle_color,
    m.color,
    p.vehicle_color,
    p.car_color,
  );
  const vehicleColor = rawColor || (isTaxi ? 'أصفر' : null);

  const vehicleBrand =
    pickStr(c.vehicle_brand, c.make, m.vehicle_brand, m.make, p.vehicle_make, p.car_make) || null;
  const vehicleModel =
    pickStr(c.vehicle_model, c.model, m.vehicle_model, m.model, p.vehicle_model, p.car_model) || null;

  const rawYear = c.vehicle_year ?? m.vehicle_year ?? p.vehicle_year;
  const vehicleYear = rawYear != null && Number.isFinite(Number(rawYear)) ? Number(rawYear) : null;

  return {
    id: captainId,
    full_name: pickStr(p.full_name, p.name) || null,
    nickname: pickStr(c.nickname, m.nickname, p.nickname) || null,
    serial_id: pickStr(p.serial_id, p.serial_number) || null,
    phone: pickStr(p.phone, p.phone_number) || null,
    tier: pickStr(p.tier, p.rank) || null,
    rating: p.rating != null ? Number(p.rating) : (p.trust_score != null ? Number(p.trust_score) : null),
    behavior_rating: p.behavior_rating != null ? Number(p.behavior_rating) : null,
    vehicle_rating: p.vehicle_rating != null ? Number(p.vehicle_rating) : null,
    rating_count: p.rating_count != null ? Number(p.rating_count) : null,
    heart_count: p.heart_count != null ? Number(p.heart_count) : null,
    vehicle_type: vehicleType,
    vehicle_brand: vehicleBrand,
    vehicle_model: vehicleModel,
    vehicle_color: vehicleColor,
    vehicle_year: vehicleYear,
    plate_number: plate,
    affiliation_type: pickStr(c.affiliation_type, m.affiliation_type, p.affiliation_type) || null,
    employment_type: pickStr(c.employment_type, m.employment_type) || null,
    base_fare: c.base_fare != null ? Number(c.base_fare) : null,
    price_per_km: c.price_per_km != null ? Number(c.price_per_km) : null,
    price_per_min: c.price_per_min != null ? Number(c.price_per_min) : null,
    flag_fall_fee: c.flag_fall_fee != null ? Number(c.flag_fall_fee) : null,
    included_km: c.included_km != null ? Number(c.included_km) : null,
    verification_status: pickStr(c.verification_status) || null,
    facebook_url: pickStr(c.facebook_url, m.facebook_url) || null,
    instagram_url: pickStr(c.instagram_url, m.instagram_url) || null,
  };
}

export async function fetchCaptainCardsMapAdmin(
  adminClient: SupabaseClient,
  captainIds: string[],
  includeAuthMetadataFallback = false,
): Promise<Map<string, HydratedCaptainCard>> {
  const uniqueIds = Array.from(new Set(captainIds.filter(Boolean)));
  const result = new Map<string, HydratedCaptainCard>();
  if (uniqueIds.length === 0) return result;

  const [profilesRes, captainProfilesRes] = await Promise.all([
    adminClient.from('profiles').select('*').in('id', uniqueIds),
    adminClient.from('captain_profiles').select('*').in('id', uniqueIds),
  ]);

  const profileMap = new Map<string, Record<string, unknown>>();
  for (const row of (profilesRes.data ?? []) as Record<string, unknown>[]) {
    if (row.id) profileMap.set(String(row.id), row);
  }

  const captainMap = new Map<string, Record<string, unknown>>();
  for (const row of (captainProfilesRes.data ?? []) as Record<string, unknown>[]) {
    if (row.id) captainMap.set(String(row.id), row);
  }

  for (const capId of uniqueIds) {
    let authMetaCaptain: Record<string, unknown> | null = null;
    const initial = buildHydratedCaptainCard(capId, profileMap.get(capId), captainMap.get(capId));

    if (includeAuthMetadataFallback && (!initial.plate_number || !initial.vehicle_color)) {
      try {
        const { data: authData } = await adminClient.auth.admin.getUserById(capId);
        const meta = (authData?.user?.user_metadata ?? {}) as Record<string, unknown>;
        authMetaCaptain = (meta.captain_profile && typeof meta.captain_profile === 'object')
          ? (meta.captain_profile as Record<string, unknown>)
          : meta;
      } catch {
        // Non-blocking fallback
      }
    }

    result.set(
      capId,
      authMetaCaptain
        ? buildHydratedCaptainCard(capId, profileMap.get(capId), captainMap.get(capId), authMetaCaptain)
        : initial,
    );
  }

  return result;
}
