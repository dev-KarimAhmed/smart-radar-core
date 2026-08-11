import type { AuthError, User } from '@supabase/supabase-js';

const PHONE_REGEX = /^\+[1-9]\d{6,14}$/;

export interface RiderSupabaseSignUpInput {
  phone: string;
  password: string;
  fullName: string;
  role?: 'RIDER' | 'CAPTAIN' | 'ADVERTISER' | 'DELEGATE';
  countryId: number;
  governorateId: number;
  districtId: number;
  rememberMe?: boolean;
  captainProfile?: CaptainProfileMetadata;
}

export interface CaptainProfileMetadata {
  vehicle_type: string | null;
  vehicle_brand: string | null;
  vehicle_model: string | null;
  vehicle_color: string | null;
  vehicle_year: number | null;
  plate_number: string | null;
  employment_type: string | null;
  affiliation_type: string | null;
  office_phone: string | null;
  side_id: string | null;
  identity_url?: string | null;
  contact_page_url?: string | null;
  driving_license_url?: string | null;
  verification_status: string;
}

export interface RiderSupabaseSignInInput {
  phone: string;
  password: string;
  rememberMe?: boolean;
}

export interface RiderAuthMetadata {
  role: 'RIDER' | 'CAPTAIN' | 'ADVERTISER' | 'DELEGATE';
  full_name: string;
  phone: string;
  country_id: number;
  governorate_id: number;
  district_id: number;
  captain_profile?: CaptainProfileMetadata;
}

export function normalizeInternationalPhone(phone: string) {
  return phone.trim().replace(/[\s()-]/g, '');
}

export function validatePhoneAndPassword(phone: string, password: string) {
  const normalizedPhone = normalizeInternationalPhone(phone);

  if (!PHONE_REGEX.test(normalizedPhone)) {
    return {
      ok: false as const,
      message: 'يرجى كتابة رقم الهاتف بصيغة دولية، مثل +962790000000 أو +201000000000.',
    };
  }

  if (password.length < 6) {
    return {
      ok: false as const,
      message: 'كلمة المرور ضعيفة. يجب ألا تقل عن 6 أحرف.',
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
    role: input.role || 'RIDER',
    full_name: fullName,
    phone: validation.phone,
    country_id: toStrictPositiveInteger(input.countryId, 'country_id'),
    governorate_id: toStrictPositiveInteger(input.governorateId, 'governorate_id'),
    district_id: toStrictPositiveInteger(input.districtId, 'district_id'),
    ...(input.captainProfile ? { captain_profile: input.captainProfile } : {}),
  };
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
    return 'رقم الهاتف مسجل بالفعل. يرجى تسجيل الدخول.';
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
    return 'تسجيل الهاتف غير مفعّل حالياً في إعدادات الخدمة.';
  }

  if (code.includes('weak_password') || message.includes('weak password') || message.includes('password')) {
    return 'كلمة المرور ضعيفة. يجب ألا تقل عن 6 أحرف.';
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
    return 'تعذر الاتصال بالخدمة. تحقق من الإنترنت وحاول مرة أخرى.';
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
      return 'تعذر إنشاء الحساب لأن الدولة أو المحافظة أو المنطقة غير موجودة. حدّث الاختيارات ثم حاول مرة أخرى.';
    }

    return 'تعذر إنشاء الحساب من قاعدة البيانات. راجع البيانات وحاول مرة أخرى.';
  }

  if (code.includes('validation_failed') || message.includes('invalid phone')) {
    return 'رقم الهاتف غير صحيح. اكتبه مع رمز الدولة مثل +962 أو +20.';
  }

  if (error instanceof Error && /^(يرجى|كلمة المرور|قيمة)/.test(error.message)) return error.message;

  return 'تعذر إكمال العملية. يرجى المحاولة مرة أخرى.';
}

export function buildUserFromSupabaseAuth(authUser: User) {
  const metadata = authUser.user_metadata || {};
  const vehicle = metadata.vehicle && typeof metadata.vehicle === 'object' ? metadata.vehicle as Record<string, unknown> : {};
  const rawRole = String(metadata.role || 'RIDER').toLowerCase();
  const role = rawRole === 'captain' ? 'driver' : rawRole;

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
    vehicle: {
      plate: String(vehicle.plate || ''),
      make: String(vehicle.make || ''),
      color: String(vehicle.color || ''),
      year: Number(vehicle.year) || 0,
    },
    isBufferActive: false,
  };
}

function toStrictPositiveInteger(value: number, fieldName: string) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`قيمة ${fieldName} غير صحيحة.`);
  }

  return value;
}
