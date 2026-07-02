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
  governorateId: number;
  districtId: number;
  rememberMe?: boolean;
}

export interface RiderSupabaseSignInInput {
  phone: string;
  password: string;
  rememberMe?: boolean;
}

export interface RiderPhonePasswordResetInput {
  phone: string;
  token: string;
  newPassword: string;
}

export interface RiderAuthMetadata {
  role: 'RIDER';
  full_name: string;
  phone: string;
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
      message: 'يرجى كتابة رقم الهاتف مع رمز الدولة، مثال: +962790000000 أو +201000000000.',
    };
  }

  if (password.length < 6) {
    return {
      ok: false as const,
      message: 'كلمة المرور ضعيفة جداً، يجب ألا تقل عن 6 خانات.',
    };
  }

  return { ok: true as const, phone: normalizedPhone };
}

export function buildRiderSignUpMetadata(input: RiderSupabaseSignUpInput): RiderAuthMetadata {
  const validation = validatePhoneAndPassword(input.phone, input.password);
  if (!validation.ok) throw new Error(validation.message);

  const fullName = input.fullName.trim();
  if (!fullName) {
    throw new Error('يرجى كتابة الاسم الكامل.');
  }

  return {
    role: 'RIDER',
    full_name: fullName,
    phone: validation.phone,
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

export async function requestRiderPasswordResetCode(phone: string) {
  const normalizedPhone = normalizeInternationalPhone(phone);

  if (!PHONE_REGEX.test(normalizedPhone)) {
    throw new Error('يرجى كتابة رقم الهاتف مع رمز الدولة، مثال: +962790000000 أو +201000000000.');
  }

  const { error } = await supabase.auth.signInWithOtp({
    phone: normalizedPhone,
    options: {
      shouldCreateUser: false,
    },
  });

  if (error) throw error;
  return normalizedPhone;
}

export async function confirmRiderPasswordReset(input: RiderPhonePasswordResetInput) {
  const normalizedPhone = normalizeInternationalPhone(input.phone);

  if (!PHONE_REGEX.test(normalizedPhone)) {
    throw new Error('يرجى كتابة رقم الهاتف مع رمز الدولة، مثال: +962790000000 أو +201000000000.');
  }

  if (!input.token.trim()) {
    throw new Error('يرجى كتابة رمز التحقق المرسل إلى الهاتف.');
  }

  if (input.newPassword.length < 6) {
    throw new Error('كلمة المرور ضعيفة جداً، يجب ألا تقل عن 6 خانات.');
  }

  const { error: verifyError } = await supabase.auth.verifyOtp({
    phone: normalizedPhone,
    token: input.token.trim(),
    type: 'sms',
  });

  if (verifyError) throw verifyError;

  const { error: updateError } = await supabase.auth.updateUser({
    password: input.newPassword,
  });

  if (updateError) throw updateError;
  await supabase.auth.signOut();
  clearSupabaseSessionCache();
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
    return 'رقم الهاتف مسجل بالفعل، يرجى تسجيل الدخول.';
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
      ? 'رمز التحقق غير صحيح أو انتهت صلاحيته.'
      : 'رقم الهاتف أو كلمة المرور غير صحيحة.';
  }

  if (
    code.includes('phone_provider_disabled') ||
    message.includes('phone provider') ||
    message.includes('phone signups are disabled')
  ) {
    return 'تسجيل الهاتف غير مفعّل حالياً في إعدادات الخدمة. يرجى تفعيله من Supabase.';
  }

  if (code.includes('weak_password') || message.includes('weak password') || message.includes('password')) {
    return 'كلمة المرور ضعيفة جداً، يجب ألا تقل عن 6 خانات.';
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
    return 'فشل الاتصال بخوادم الخدمة، يرجى التحقق من جودة الإنترنت.';
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
    return 'تعذر إنشاء الحساب من قاعدة البيانات. يرجى مراجعة دالة إنشاء الملف الشخصي في Supabase ثم المحاولة مرة أخرى.';
  }

  if (code.includes('validation_failed') || message.includes('invalid phone')) {
    return 'رقم الهاتف غير صحيح. اكتب الرقم مع رمز الدولة مثل +962 أو +20.';
  }

  if (error instanceof Error && error.message.startsWith('يرجى')) return error.message;
  if (error instanceof Error && error.message.startsWith('كلمة المرور')) return error.message;
  if (error instanceof Error && error.message.startsWith('قيمة')) return error.message;

  return 'تعذر إكمال العملية. يرجى المحاولة مرة أخرى.';
}

function toStrictPositiveInteger(value: number, fieldName: string) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`قيمة ${fieldName} غير صحيحة.`);
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
    governorate: metadata.governorate_id !== undefined ? String(metadata.governorate_id) : '',
    district: metadata.district_id !== undefined ? String(metadata.district_id) : '',
    status: 'active',
    rating: 5,
    isBufferActive: false,
  };
}
