import { supabase } from '@/lib/supabase-client';
import {
  resolveLocationLabel,
  canonicalizeGovernorateRows,
  canonicalizeDistrictRows,
} from '@/shared/utils/location-translator';
import { styles } from './profile-styles';

export { styles };

export type LocationRow = {
  id: number;
  name_ar?: string | null;
  name_en?: string | null;
  name?: string | null;
};

export type CountryRow = LocationRow & {
  currency_ar?: string | null;
  currency_en?: string | null;
  currency_code?: string | null;
};

export type GovernorateRow = LocationRow & {
  country_id: number;
};

export type DistrictRow = LocationRow & {
  governorate_id: number;
};

export type ProfileRow = Record<string, unknown> & {
  id?: string;
  user_id?: string;
  auth_user_id?: string;
  serial_id?: string | null;
  full_name?: string | null;
  name?: string | null;
  phone?: string | null;
  emergency_whatsapp_contact?: string | null;
  role?: string | null;
  country_id?: number | string | null;
  governorate_id?: number | string | null;
  district_id?: number | string | null;
  rating?: number | string | null;
  rating_sum?: number | string | null;
  rating_count?: number | string | null;
};

export type ProfileKey = {
  field: 'id';
  value: string;
};

export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function labelFor(row?: LocationRow | null, language: 'ar' | 'en' = 'ar') {
  if (!row) return '';
  return resolveLocationLabel(row, language);
}

export function numberOrEmpty(value: unknown) {
  const numberValue = Number(value);
  return Number.isInteger(numberValue) && numberValue > 0 ? String(numberValue) : '';
}

export function normalizeRows<T extends LocationRow>(rows: unknown): T[] {
  if (!Array.isArray(rows)) return [];
  const valid = rows
    .map((row) => row as Partial<T>)
    .filter((row): row is T => Number.isInteger(row.id));

  // If these are governorate rows (they contain country_id)
  if (valid.length > 0 && 'country_id' in valid[0]) {
    return canonicalizeGovernorateRows(valid as unknown as GovernorateRow[]) as unknown as T[];
  }
  // If these are district rows (they contain governorate_id)
  if (valid.length > 0 && 'governorate_id' in valid[0]) {
    return canonicalizeDistrictRows(valid as unknown as DistrictRow[]) as unknown as T[];
  }

  return valid;
}

export function getProfileName(profile: ProfileRow | null, fallbackName: string) {
  return String(profile?.full_name || profile?.name || fallbackName || '').trim();
}

export function getProfileRating(profile: ProfileRow | null, fallbackRating?: number) {
  const direct = Number(profile?.rating);
  if (Number.isFinite(direct) && direct > 0) return direct;

  const sum = Number(profile?.rating_sum);
  const count = Number(profile?.rating_count);
  if (Number.isFinite(sum) && Number.isFinite(count) && count > 0) return sum / count;

  return fallbackRating || 5;
}

export async function fetchProfileByUserId(userId: string): Promise<{ profile: ProfileRow | null; key: ProfileKey | null }> {
  if (!UUID_REGEX.test(userId)) {
    return { profile: null, key: null };
  }

  const key: ProfileKey = { field: 'id', value: userId };
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq(key.field, key.value)
    .maybeSingle();

  if (error) {
    if ((process.env.NODE_ENV !== 'production')) console.warn('[Supabase Profile Fetch:id]', error);
    return { profile: null, key: null };
  }

  return { profile: (data as ProfileRow | null) || null, key: data ? key : null };
}

export async function saveProfile(profileKey: ProfileKey | null, userId: string, payload: Record<string, unknown>) {
  if (!UUID_REGEX.test(userId)) {
    return;
  }

  if (profileKey) {
    const { error } = await supabase.from('profiles').update(payload).eq(profileKey.field, profileKey.value);
    if (!error) return;
    throw error;
  }

  const { error } = await supabase.from('profiles').upsert({ id: userId, ...payload }, { onConflict: 'id' });
  if (error) throw error;
}

export function mapProfileSaveError(error: unknown) {
  const supabaseError = error as { code?: string; message?: string; details?: string; hint?: string };
  const code = String(supabaseError?.code || '').toLowerCase();
  const message = [supabaseError?.message, supabaseError?.details, supabaseError?.hint, String(error || '')]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (code === '42501' || message.includes('row-level security') || message.includes('permission denied')) {
    return 'profileTab.errors.permissionDenied';
  }

  if (code === 'pgrst204' || message.includes('could not find') || message.includes('schema cache') || message.includes('column')) {
    return 'profileTab.errors.missingFields';
  }

  if (
    code === '23503' ||
    message.includes('foreign key') ||
    message.includes('country_id') ||
    message.includes('governorate_id') ||
    message.includes('district_id')
  ) {
    return 'profileTab.errors.invalidLocation';
  }

  if (code === '23505' || message.includes('duplicate')) {
    return 'profileTab.errors.duplicateProfile';
  }

  if (message.includes('failed to fetch') || message.includes('network')) {
    return 'profileTab.errors.networkError';
  }

  return 'profileTab.errors.genericUpdateError';
}

export function normalizeInternationalPhone(value: string) {
  const compact = value.trim().replace(/\s+/g, '').replace(/[^\d+]/g, '');
  if (!compact) return '';

  const international = compact.startsWith('+')
    ? compact
    : `+${compact.replace(/^00/, '').replace(/^0+/, '')}`;

  return /^\+[1-9]\d{7,14}$/.test(international) ? international : '';
}
