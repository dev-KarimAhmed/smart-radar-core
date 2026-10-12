import { supabase } from '@/lib/supabase-client';

export const styles = {
  recoveryEmailSlot: "mt-1",
  style549_1: "mx-auto w-full max-w-xl pb-24 font-sans text-start",
  style550_2: "border border-[#14B8A6]/20 bg-[#0B0F19]/90 text-white shadow-2xl backdrop-blur-xl",
  style551_3: "p-6 text-sm text-gray-300",
  style558_4: "mx-auto w-full max-w-xl space-y-6 pb-24 text-start font-sans",
  style559_5: "rounded-2xl border border-[#14B8A6]/20 bg-[#0B0F19]/90 text-white shadow-xl backdrop-blur-xl",
  style560_6: "flex items-center justify-between gap-4 p-4",
  style561_7: "text-start",
  style562_8: "text-sm font-black text-white",
  style563_9: "mt-1 text-xs text-slate-400",
  style568_10: "h-11 shrink-0 gap-2 rounded-2xl border border-[#14B8A6]/25 bg-[#14B8A6]/10 px-4 text-sm font-black text-[#14F5D5] hover:bg-[#14B8A6]/20 transition-all",
  style570_11: "h-4 w-4",
  style576_12: "relative overflow-hidden rounded-2xl border border-[#14B8A6]/20 bg-[#0B0F19]/90 text-white shadow-2xl backdrop-blur-xl",
  style577_13: "absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-transparent via-[#14F5D5]/60 to-transparent",
  style578_14: "space-y-5 p-6",
  style579_15: "flex items-center justify-between gap-4",
  style580_16: "flex items-center gap-3",
  style581_17: "flex h-14 w-14 items-center justify-center rounded-2xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 text-xl font-black text-[#14F5D5] shadow-lg shadow-[#14B8A6]/5",
  style582_18: "h-6 w-6",
  style585_19: "text-xl font-black text-white",
  style586_20: "mt-1 flex flex-wrap items-center gap-2",
  style587_21: "border-[#14B8A6]/30 bg-[#14B8A6]/10 text-[10px] font-bold text-[#14F5D5]",
  style591_22: "border-[#14B8A6]/30 bg-black/40 font-mono text-[10px] text-[#14F5D5]",
  style599_23: "text-left font-mono",
  style600_24: "block text-[10px] font-bold text-gray-500",
  style601_25: "mt-1 rounded-xl border border-[#14B8A6]/20 bg-[#14B8A6]/10 px-3 py-1.5 text-[#14F5D5]",
  style602_26: "text-base font-black",
  style603_27: "text-xs text-gray-500",
  style608_28: "grid gap-3 border-t border-white/5 pt-4 sm:grid-cols-2",
  style609_29: "rounded-xl border border-white/5 bg-black/30 p-3",
  style610_30: "flex items-center gap-1 text-[10px] font-bold text-[#14F5D5]",
  style611_31: "h-3.5 w-3.5",
  style614_32: "mt-1 block text-sm text-white",
  style619_33: "rounded-xl border border-white/5 bg-black/30 p-3",
  style620_34: "flex items-center gap-1 text-[10px] font-bold text-[#14F5D5]",
  style621_35: "h-3.5 w-3.5",
  style624_36: "mt-1 block text-sm text-white",
  style625_37: "mt-1 block text-[11px] text-gray-400",
  style631_38: "relative overflow-hidden rounded-2xl border border-[#14B8A6]/20 bg-[#0B0F19]/90 text-white shadow-2xl backdrop-blur-xl",
  style632_39: "pb-3",
  style633_40: "flex items-center gap-2 text-base font-extrabold text-[#14F5D5]",
  style634_41: "h-5 w-5 text-[#14B8A6]",
  style637_42: "text-xs text-gray-400",
  style644_43: "flex items-center justify-center gap-2 rounded-xl border border-[#14B8A6]/20 bg-black/30 p-5 text-sm text-gray-300",
  style645_44: "h-4 w-4 animate-spin text-[#14F5D5]",
  style649_45: "space-y-4",
  style650_46: "space-y-1.5",
  style651_47: "block text-xs font-bold text-gray-400",
  style655_48: "rounded-xl border-[#14B8A6]/25 bg-black/40 text-white text-start focus-visible:border-[#14B8A6] focus-visible:ring-1 focus-visible:ring-[#14B8A6]",
  style661_49: "space-y-1.5",
  style662_50: "block text-xs font-bold text-gray-400",
  style667_51: "rounded-xl border-[#14B8A6]/25 bg-black/40 text-white text-start focus-visible:border-[#14B8A6] focus-visible:ring-1 focus-visible:ring-[#14B8A6]",
  style673_52: "space-y-1.5",
  style674_53: "flex items-center gap-2 text-xs font-bold text-gray-400",
  style675_54: "h-4 w-4 text-[#14F5D5]",
  style678_55: "flex gap-2",
  style682_56: "rounded-xl border-[#14B8A6]/25 bg-black/40 text-white text-start focus-visible:border-[#14B8A6] focus-visible:ring-1 focus-visible:ring-[#14B8A6]",
  style690_57: "h-11 shrink-0 rounded-xl border-red-500/20 bg-red-950/20 px-3 text-red-300 hover:bg-red-500 hover:text-white",
  style693_58: "h-4 w-4",
  style699_59: "grid gap-3 sm:grid-cols-3",
  style700_60: "space-y-1.5",
  style701_61: "block text-xs font-bold text-gray-400",
  style703_62: "h-11 rounded-xl border-[#14B8A6]/25 bg-black/40 text-white focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6]",
  style706_63: "border-[#14B8A6]/30 bg-[#0B0F19] text-white shadow-2xl",
  style708_64: "justify-end text-start",
  style716_65: "space-y-1.5",
  style717_66: "block text-xs font-bold text-gray-400",
  style719_67: "h-11 rounded-xl border-[#14B8A6]/25 bg-black/40 text-white focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6]",
  style722_68: "border-[#14B8A6]/30 bg-[#0B0F19] text-white shadow-2xl",
  style724_69: "justify-end text-start",
  style732_70: "space-y-1.5",
  style733_71: "block text-xs font-bold text-gray-400",
  style735_72: "h-11 rounded-xl border-[#14B8A6]/25 bg-black/40 text-white focus:border-[#14B8A6] focus:ring-1 focus:ring-[#14B8A6]",
  style738_73: "border-[#14B8A6]/30 bg-[#0B0F19] text-white shadow-2xl",
  style740_74: "justify-end text-start",
  style750_75: "flex items-center gap-2 text-xs text-[#14F5D5]",
  style751_76: "h-3.5 w-3.5 animate-spin",
  style759_77: "h-12 w-full rounded-xl bg-[#14B8A6] text-sm font-extrabold text-[#0B0F19] shadow-lg shadow-[#14B8A6]/20 hover:bg-[#0fa596] transition-all",
  style763_78: "ml-2 h-4 w-4 animate-spin text-[#0B0F19]",
  style768_79: "ml-2 h-4 w-4 text-[#0B0F19]",
  style779_80: "border border-red-950/40 bg-[#0B0F19]/90 text-white shadow-xl",
  style780_81: "pb-3",
  style781_82: "flex items-center gap-2 text-base font-extrabold text-red-400",
  style782_83: "h-5 w-5 text-red-500",
  style785_84: "text-xs text-gray-400",
  style793_85: "flex items-center justify-center gap-2 py-4 text-sm text-gray-400",
  style794_86: "h-4 w-4 animate-spin text-red-400",
  style798_87: "text-center py-4 text-sm text-gray-500",
  style802_88: "space-y-3",
  style806_89: "flex flex-col gap-2 rounded-xl border border-white/5 bg-white/5 p-4",
  style808_90: "flex items-center justify-between gap-4",
  style810_91: "block text-sm text-white",
  style812_92: "text-[10px] text-slate-400 mt-0.5 block",
  style818_93: "flex gap-2",
  style826_94: "h-8 rounded-lg text-[10px] font-bold bg-red-600 hover:bg-red-500 text-white px-3",
  style834_95: "h-8 rounded-lg text-[10px] font-bold border-white/15 bg-white/5 hover:bg-white/10 text-white px-3",
  style844_96: "h-8 rounded-lg border-red-500/30 bg-red-500/10 text-xs font-bold text-red-400 hover:bg-red-500 hover:text-white transition-colors px-3",
  style851_97: "grid grid-cols-2 gap-2 border-t border-white/5 pt-2 mt-1 text-[11px] text-slate-400",
  style854_98: "text-amber-400 font-bold",
  style858_99: "text-white font-mono",
  style873_100: "h-11 w-full border border-red-500/15 bg-red-950/40 text-xs font-bold text-red-400 transition-all hover:bg-red-500 hover:text-white rounded-xl",
} as const;

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
  return (language === 'ar' ? row.name_ar || row.name_en : row.name_en || row.name_ar) || row.name || String(row.id);
}

export function numberOrEmpty(value: unknown) {
  const numberValue = Number(value);
  return Number.isInteger(numberValue) && numberValue > 0 ? String(numberValue) : '';
}

export function normalizeRows<T extends LocationRow>(rows: unknown): T[] {
  return Array.isArray(rows)
    ? rows
        .map((row) => row as Partial<T>)
        .filter((row): row is T => Number.isInteger(row.id))
    : [];
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
