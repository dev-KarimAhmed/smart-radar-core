import type { AuthError, Session, User } from '@supabase/supabase-js';
import {
  clearSupabaseAuthStorage,
  setSupabaseRememberSession,
  shouldRememberSupabaseSession,
  supabase,
} from './supabase-client';

const AUTH_TOKEN_STORAGE_KEY = 'radar_supabase_access_token';
const PHONE_REGEX = /^\+[1-9]\d{6,14}$/;

export interface RiderSupabaseSignUpInput {
  phone: string;
  password: string;
  fullName: string;
  countryId: number;
  governorateId: number;
  districtId: number;
  rememberMe?: boolean;
}

export interface RiderSupabaseSignInInput {
  phone: string;
  password: string;
  rememberMe?: boolean;
}


export interface RiderAuthMetadata {
  role: 'RIDER';
  full_name: string;
  phone: string;
  country_id: number;
  governorate_id: number;
  district_id: number;
}

export function normalizeInternationalPhone(phone: string) {
  return phone.trim().replace(/[\s()-]/g, '');
}

export function validatePhoneAndPassword(phone: string, password: string) {
  const normalizedPhone = normalizeInternationalPhone(phone);

  if (!PHONE_REGEX.test(normalizedPhone)) {
    return {
      ok: false as const,
      message: 'ÙŠØ±Ø¬Ù‰ ÙƒØªØ§Ø¨Ø© Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ Ù…Ø¹ Ø±Ù…Ø² Ø§Ù„Ø¯ÙˆÙ„Ø©ØŒ Ù…Ø«Ø§Ù„: +962790000000 Ø£Ùˆ +201000000000.',
    };
  }

  if (password.length < 6) {
    return {
      ok: false as const,
      message: 'ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø¶Ø¹ÙŠÙØ© Ø¬Ø¯Ø§Ù‹ØŒ ÙŠØ¬Ø¨ Ø£Ù„Ø§ ØªÙ‚Ù„ Ø¹Ù† 6 Ø®Ø§Ù†Ø§Øª.',
    };
  }

  return { ok: true as const, phone: normalizedPhone };
}

export function buildRiderSignUpMetadata(input: RiderSupabaseSignUpInput): RiderAuthMetadata {
  const validation = validatePhoneAndPassword(input.phone, input.password);
  if (!validation.ok) throw new Error(validation.message);

  const fullName = input.fullName.trim();
  if (!fullName) {
    throw new Error('ÙŠØ±Ø¬Ù‰ ÙƒØªØ§Ø¨Ø© Ø§Ù„Ø§Ø³Ù… Ø§Ù„ÙƒØ§Ù…Ù„.');
  }

  return {
    role: 'RIDER',
    full_name: fullName,
    phone: validation.phone,
    country_id: toStrictPositiveInteger(input.countryId, 'country_id'),
    governorate_id: toStrictPositiveInteger(input.governorateId, 'governorate_id'),
    district_id: toStrictPositiveInteger(input.districtId, 'district_id'),
  };
}

export async function signUpRiderWithPhone(input: RiderSupabaseSignUpInput) {
  const validation = validatePhoneAndPassword(input.phone, input.password);
  if (!validation.ok) throw new Error(validation.message);
  const metadata = buildRiderSignUpMetadata(input);

  setSupabaseRememberSession(input.rememberMe ?? shouldRememberSupabaseSession());

  const { data, error } = await supabase.auth.signUp({
    phone: validation.phone,
    password: input.password,
    options: {
      data: metadata,
    },
  });

  if (error) throw error;
  cacheSupabaseSession(data.session);
  return data;
}

export async function signInRiderWithPhone(input: RiderSupabaseSignInInput) {
  const validation = validatePhoneAndPassword(input.phone, input.password);
  if (!validation.ok) throw new Error(validation.message);

  setSupabaseRememberSession(input.rememberMe ?? shouldRememberSupabaseSession());

  const { data, error } = await supabase.auth.signInWithPassword({
    phone: validation.phone,
    password: input.password,
  });

  if (error) throw error;
  cacheSupabaseSession(data.session);
  return data;
}


export function cacheSupabaseSession(session: Session | null) {
  if (typeof window === 'undefined') return;

  if (session?.access_token) {
    const targetStorage = shouldRememberSupabaseSession() ? localStorage : sessionStorage;
    const otherStorage = shouldRememberSupabaseSession() ? sessionStorage : localStorage;
    targetStorage.setItem(AUTH_TOKEN_STORAGE_KEY, session.access_token);
    otherStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  } else {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  }
}

export function clearSupabaseSessionCache() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  clearSupabaseAuthStorage();
}

export function mapSupabaseAuthError(error: unknown) {
  const authError = error as Partial<AuthError> & { message?: string; code?: string; status?: number };
  const name = `${(authError as { name?: string })?.name || ''}`.toLowerCase();
  const message = `${authError?.message || error || ''}`.toLowerCase();
  const code = `${authError?.code || ''}`.toLowerCase();

  if (
    code.includes('phone_exists') ||
    code.includes('user_already_exists') ||
    message.includes('already registered') ||
    message.includes('already exists')
  ) {
    return 'Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ Ù…Ø³Ø¬Ù„ Ø¨Ø§Ù„ÙØ¹Ù„ØŒ ÙŠØ±Ø¬Ù‰ ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ø¯Ø®ÙˆÙ„.';
  }

  if (
    code.includes('invalid_credentials') ||
    code.includes('otp_expired') ||
    code.includes('otp_disabled') ||
    message.includes('invalid login') ||
    message.includes('invalid credentials') ||
    message.includes('token has expired') ||
    message.includes('invalid token') ||
    message.includes('authentication')
  ) {
    return code.includes('otp') || message.includes('token')
      ? 'Ø±Ù…Ø² Ø§Ù„ØªØ­Ù‚Ù‚ ØºÙŠØ± ØµØ­ÙŠØ­ Ø£Ùˆ Ø§Ù†ØªÙ‡Øª ØµÙ„Ø§Ø­ÙŠØªÙ‡.'
      : 'Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ Ø£Ùˆ ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± ØºÙŠØ± ØµØ­ÙŠØ­Ø©.';
  }

  if (
    code.includes('phone_provider_disabled') ||
    message.includes('phone provider') ||
    message.includes('phone signups are disabled')
  ) {
    return 'ØªØ³Ø¬ÙŠÙ„ Ø§Ù„Ù‡Ø§ØªÙ ØºÙŠØ± Ù…ÙØ¹Ù‘Ù„ Ø­Ø§Ù„ÙŠØ§Ù‹ ÙÙŠ Ø¥Ø¹Ø¯Ø§Ø¯Ø§Øª Ø§Ù„Ø®Ø¯Ù…Ø©. ÙŠØ±Ø¬Ù‰ ØªÙØ¹ÙŠÙ„Ù‡ Ù…Ù† Supabase.';
  }

  if (code.includes('weak_password') || message.includes('weak password') || message.includes('password')) {
    return 'ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ± Ø¶Ø¹ÙŠÙØ© Ø¬Ø¯Ø§Ù‹ØŒ ÙŠØ¬Ø¨ Ø£Ù„Ø§ ØªÙ‚Ù„ Ø¹Ù† 6 Ø®Ø§Ù†Ø§Øª.';
  }

  if (
    name.includes('authretryablefetcherror') ||
    code.includes('request_timeout') ||
    code.includes('hook_timeout') ||
    code.includes('hook_timeout_after_retry') ||
    authError?.status === 504 ||
    authError?.status === 502 ||
    message.includes('network') ||
    message.includes('timeout') ||
    message.includes('failed to fetch') ||
    message.includes('gateway')
  ) {
    return 'ÙØ´Ù„ Ø§Ù„Ø§ØªØµØ§Ù„ Ø¨Ø®ÙˆØ§Ø¯Ù… Ø§Ù„Ø®Ø¯Ù…Ø©ØŒ ÙŠØ±Ø¬Ù‰ Ø§Ù„ØªØ­Ù‚Ù‚ Ù…Ù† Ø¬ÙˆØ¯Ø© Ø§Ù„Ø¥Ù†ØªØ±Ù†Øª.';
  }

  if (
    code.includes('unexpected_failure') ||
    code.includes('hook_payload_invalid_content_type') ||
    code.includes('hook_payload_over_size_limit') ||
    message.includes('database error saving new user') ||
    message.includes('error saving new user') ||
    message.includes('database error') ||
    message.includes('trigger') ||
    authError?.status === 500
  ) {
    if (
      message.includes('foreign key') ||
      message.includes('governorate') ||
      message.includes('district') ||
      message.includes('country')
    ) {
      return 'تعذر إنشاء الحساب لأن الدولة أو المحافظة أو المنطقة غير موجودة في قاعدة البيانات. حدّث الاختيارات ثم حاول مرة أخرى.';
    }

    return 'ØªØ¹Ø°Ø± Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ø­Ø³Ø§Ø¨ Ù…Ù† Ù‚Ø§Ø¹Ø¯Ø© Ø§Ù„Ø¨ÙŠØ§Ù†Ø§Øª. ÙŠØ±Ø¬Ù‰ Ù…Ø±Ø§Ø¬Ø¹Ø© Ø¯Ø§Ù„Ø© Ø¥Ù†Ø´Ø§Ø¡ Ø§Ù„Ù…Ù„Ù Ø§Ù„Ø´Ø®ØµÙŠ ÙÙŠ Supabase Ø«Ù… Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø© Ù…Ø±Ø© Ø£Ø®Ø±Ù‰.';
  }

  if (code.includes('validation_failed') || message.includes('invalid phone')) {
    return 'Ø±Ù‚Ù… Ø§Ù„Ù‡Ø§ØªÙ ØºÙŠØ± ØµØ­ÙŠØ­. Ø§ÙƒØªØ¨ Ø§Ù„Ø±Ù‚Ù… Ù…Ø¹ Ø±Ù…Ø² Ø§Ù„Ø¯ÙˆÙ„Ø© Ù…Ø«Ù„ +962 Ø£Ùˆ +20.';
  }

  if (error instanceof Error && error.message.startsWith('ÙŠØ±Ø¬Ù‰')) return error.message;
  if (error instanceof Error && error.message.startsWith('ÙƒÙ„Ù…Ø© Ø§Ù„Ù…Ø±ÙˆØ±')) return error.message;
  if (error instanceof Error && error.message.startsWith('Ù‚ÙŠÙ…Ø©')) return error.message;

  return 'ØªØ¹Ø°Ø± Ø¥ÙƒÙ…Ø§Ù„ Ø§Ù„Ø¹Ù…Ù„ÙŠØ©. ÙŠØ±Ø¬Ù‰ Ø§Ù„Ù…Ø­Ø§ÙˆÙ„Ø© Ù…Ø±Ø© Ø£Ø®Ø±Ù‰.';
}

function toStrictPositiveInteger(value: number, fieldName: string) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Ù‚ÙŠÙ…Ø© ${fieldName} ØºÙŠØ± ØµØ­ÙŠØ­Ø©.`);
  }

  return value;
}

export function buildUserFromSupabaseAuth(authUser: User) {
  const metadata = authUser.user_metadata || {};
  const role = String(metadata.role || 'RIDER').toLowerCase();

  return {
    uid: authUser.id,
    phone: String(metadata.phone || authUser.phone || ''),
    role: role === 'rider' ? 'rider' : role,
    name: String(metadata.full_name || metadata.name || authUser.phone || ''),
    countryId: metadata.country_id !== undefined ? Number(metadata.country_id) : undefined,
    currencyAr: metadata.currency_ar !== undefined ? String(metadata.currency_ar) : undefined,
    currencyEn: metadata.currency_en !== undefined ? String(metadata.currency_en) : undefined,
    governorate: metadata.governorate_id !== undefined ? String(metadata.governorate_id) : '',
    district: metadata.district_id !== undefined ? String(metadata.district_id) : '',
    status: 'active',
    rating: 5,
    isBufferActive: false,
  };
}
