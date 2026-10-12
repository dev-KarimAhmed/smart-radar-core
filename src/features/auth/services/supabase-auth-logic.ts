import type { AuthError, User } from '@supabase/supabase-js';

const PHONE_REGEX = /^\+[1-9]\d{6,14}$/;

export interface RiderSupabaseSignUpInput {
  phone: string;
  password: string;
  fullName: string;
  email?: string;
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
  company_code?: string | null;
  nickname?: string | null;
  identity_url?: string | null;
  contact_page_url?: string | null;
  driving_license_url?: string | null;
  national_id_number?: string | null;
  license_number?: string | null;
  facebook_url?: string | null;
  instagram_url?: string | null;
  verification_status: string;
}

export interface RiderSupabaseSignInInput {
  phone: string;
  password: string;
  rememberMe?: boolean;
  expectedRole?: 'RIDER' | 'CAPTAIN' | 'ADVERTISER' | 'DELEGATE';
}

export interface RiderAuthMetadata {
  role: 'RIDER' | 'CAPTAIN' | 'ADVERTISER' | 'DELEGATE';
  full_name: string;
  phone: string;
  email?: string;
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
    ...(input.email?.trim() ? { email: input.email.trim().toLowerCase() } : {}),
    ...(input.captainProfile ? { captain_profile: input.captainProfile } : {}),
  };
}

// Narrower than the "invalid credentials" branch inside mapSupabaseAuthError
// below — this excludes the otp/token-expired cases (those aren't "wrong
// phone or password", so they shouldn't nudge someone toward registering).
// Used to decide when a failed login should suggest creating a new account.
export function isInvalidPhoneOrPasswordError(error: unknown) {
  const authError = error as Partial<AuthError> & { message?: string; code?: string };
  const message = `${authError?.message || error || ''}`.toLowerCase();
  const code = `${authError?.code || ''}`.toLowerCase();

  const isInvalidCredentials =
    code.includes('invalid_credentials') ||
    message.includes('invalid login') ||
    message.includes('invalid credentials') ||
    message.includes('role_mismatch');

  return isInvalidCredentials && !code.includes('otp') && !message.includes('token');
}

export function mapSupabaseAuthError(error: unknown) {
  const authError = typeof error === 'object' && error !== null
    ? (error as Partial<AuthError> & { message?: string; code?: string; status?: number; details?: string; error_description?: string })
    : {};
  const name = `${(authError as { name?: string })?.name || ''}`.toLowerCase();
  const message = `${authError?.message || authError?.details || authError?.error_description || error || ''}`.toLowerCase();
  const code = `${authError?.code || ''}`.toLowerCase();
  const details = `${authError?.details || ''}`.toLowerCase();
  const fullText = `${code} ${message} ${details}`;

  if (
    fullText.includes('account_in_use') ||
    fullText.includes('قيد الاستخدام')
  ) {
    return 'الحساب قيد الاستخدام حالياً على جهاز آخر. لا يمكنك تسجيل الدخول حتى يتم الخروج من الجهاز الآخر.';
  }

  if (
    fullText.includes('unique_national_id_number') ||
    fullText.includes('national_id_number') ||
    fullText.includes('national_id') ||
    fullText.includes('nationalidnumber')
  ) {
    return 'رقم الهوية الوطنية مسجل بالفعل مسبقاً. يرجى التأكد من الرقم أو استخدام رقم آخر.';
  }

  if (
    fullText.includes('unique_license_number') ||
    fullText.includes('license_number') ||
    fullText.includes('licensenumber') ||
    (fullText.includes('license') && (fullText.includes('unique') || fullText.includes('duplicate') || fullText.includes('exists')))
  ) {
    return 'رقم رخصة القيادة مسجل بالفعل مسبقاً. يرجى التأكد من الرقم أو استخدام رقم آخر.';
  }

  if (
    code.includes('phone_exists') ||
    code.includes('user_already_exists') ||
    fullText.includes('already registered') ||
    fullText.includes('already exists') ||
    fullText.includes('user_already_exists') ||
    fullText.includes('phone_exists')
  ) {
    return 'رقم الهاتف مسجل بالفعل مسبقاً. يرجى تسجيل الدخول بدلاً من إنشاء حساب جديد.';
  }

  if (
    code.includes('invalid_credentials') ||
    code.includes('otp_expired') ||
    code.includes('otp_disabled') ||
    fullText.includes('invalid login') ||
    fullText.includes('invalid credentials') ||
    fullText.includes('token has expired') ||
    fullText.includes('invalid token') ||
    fullText.includes('authentication')
  ) {
    return code.includes('otp') || fullText.includes('token')
      ? 'رمز التحقق غير صحيح أو انتهت صلاحيته.'
      : 'رقم الهاتف أو كلمة المرور غير صحيحة.';
  }

  if (
    code.includes('phone_provider_disabled') ||
    fullText.includes('phone provider') ||
    fullText.includes('phone signups are disabled')
  ) {
    return 'تسجيل الهاتف غير مفعّل حالياً في إعدادات الخدمة.';
  }

  if (code.includes('weak_password') || fullText.includes('weak password') || fullText.includes('password')) {
    return 'كلمة المرور ضعيفة. يجب ألا تقل عن 6 أحرف.';
  }

  if (
    name.includes('authretryablefetcherror') ||
    code.includes('request_timeout') ||
    code.includes('hook_timeout') ||
    code.includes('hook_timeout_after_retry') ||
    authError?.status === 504 ||
    authError?.status === 502 ||
    fullText.includes('network') ||
    fullText.includes('timeout') ||
    fullText.includes('failed to fetch') ||
    fullText.includes('gateway')
  ) {
    return 'تعذر الاتصال بالخدمة. تحقق من الإنترنت وحاول مرة أخرى.';
  }

  if (
    code.includes('unexpected_failure') ||
    code.includes('hook_payload_invalid_content_type') ||
    code.includes('hook_payload_over_size_limit') ||
    fullText.includes('database error saving new user') ||
    fullText.includes('error saving new user') ||
    fullText.includes('database error') ||
    fullText.includes('trigger') ||
    authError?.status === 500
  ) {
    if (
      fullText.includes('foreign key') ||
      fullText.includes('governorate') ||
      fullText.includes('district') ||
      fullText.includes('country')
    ) {
      return 'تعذر إنشاء الحساب لأن الدولة أو المحافظة أو المنطقة غير موجودة. حدّث الاختيارات ثم حاول مرة أخرى.';
    }

    if (code === '23505' || fullText.includes('duplicate key')) {
      if (fullText.includes('national_id') || fullText.includes('unique_national_id_number')) {
        return 'رقم الهوية الوطنية مسجل بالفعل مسبقاً. يرجى التأكد من الرقم أو استخدام رقم آخر.';
      }
      if (fullText.includes('license') || fullText.includes('unique_license_number')) {
        return 'رقم رخصة القيادة مسجل بالفعل مسبقاً. يرجى التأكد من الرقم أو استخدام رقم آخر.';
      }
      return 'بعض البيانات المدخلة (الهوية أو الرخصة أو رقم الهاتف) مسجلة بالفعل مسبقاً.';
    }

    return 'تعذر إنشاء الحساب من قاعدة البيانات. راجع البيانات وحاول مرة أخرى.';
  }

  if (code.includes('validation_failed') || fullText.includes('invalid phone')) {
    return 'رقم الهاتف غير صحيح. اكتبه مع رمز الدولة مثل +962 أو +20.';
  }

  if (fullText.startsWith('role_mismatch:')) {
    return 'رقم الهاتف أو كلمة المرور غير صحيحة.';
  }

  if (error instanceof Error && /^(يرجى|كلمة المرور|قيمة|هذه|رقم)/.test(error.message)) return error.message;

  return 'تعذر إكمال العملية. يرجى المحاولة مرة أخرى.';
}

export function buildUserFromSupabaseAuth(authUser: User) {
  const metadata = authUser.user_metadata || {};
  const vehicle = metadata.vehicle && typeof metadata.vehicle === 'object' ? metadata.vehicle as Record<string, unknown> : {};
  const rawRole = String(metadata.role || 'RIDER').toLowerCase();
  const role = rawRole === 'captain' ? 'driver' : rawRole;
  const metadataStatus = String(metadata.status || 'idle').toLowerCase();
  const status = ['active', 'idle', 'busy', 'rating'].includes(metadataStatus)
    ? metadataStatus as 'active' | 'idle' | 'busy' | 'rating'
    : 'idle';

  const affiliation = metadata.affiliation && typeof metadata.affiliation === 'object'
    ? metadata.affiliation as Record<string, unknown>
    : {};
  const affiliationType = String(affiliation.type || metadata.affiliation_type || '').toLowerCase();
  const affiliationName = String(affiliation.name || affiliation.companyName || metadata.company_name || '');
  const subRole = (metadata.subRole || (affiliationType === 'independent' ? 'independent' : 'captain')) as 'independent' | 'captain' | undefined;

  return {
    uid: authUser.id,
    phone: String(metadata.phone || authUser.phone || ''),
    role: role === 'rider' ? 'rider' : role,
    subRole,
    name: String(metadata.full_name || metadata.name || authUser.phone || ''),
    countryId: metadata.country_id !== undefined ? Number(metadata.country_id) : undefined,
    currencyAr: metadata.currency_ar !== undefined ? String(metadata.currency_ar) : undefined,
    currencyEn: metadata.currency_en !== undefined ? String(metadata.currency_en) : undefined,
    governorate: metadata.governorate_id !== undefined ? String(metadata.governorate_id) : '',
    district: metadata.district_id !== undefined ? String(metadata.district_id) : '',
    status,
    rating: 5,
    affiliation: {
      type: affiliationType,
      name: affiliationName,
    },
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
