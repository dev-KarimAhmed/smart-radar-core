import { isSaudiPhoneNumber, SAUDI_RESTRICTION_MESSAGES } from '@/core/logic/saudi-restriction';
import {
  RiderSupabaseSignUpInput,
  RiderAuthMetadata,
} from './supabase-auth-types';

export * from './supabase-auth-types';
export * from './supabase-auth-errors';
export * from './supabase-auth-user-mapper';

const PHONE_REGEX = /^\+[1-9]\d{6,14}$/;

export function normalizeInternationalPhone(phone: string) {
  let cleaned = String(phone || '').trim().replace(/[\s()\-]/g, '');
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.slice(2);
  } else if (!cleaned.startsWith('+') && /^[1-9]\d{7,14}$/.test(cleaned)) {
    cleaned = '+' + cleaned;
  }
  return cleaned;
}

export function validatePhoneAndPassword(phone: string, password: string) {
  const normalizedPhone = normalizeInternationalPhone(phone);

  if (isSaudiPhoneNumber(normalizedPhone) || isSaudiPhoneNumber(phone)) {
    return {
      ok: false as const,
      message: SAUDI_RESTRICTION_MESSAGES.ar.phoneRejected,
    };
  }

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

  const cleanEmail = (input.email || '').replace(/[\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, ' ').trim().toLowerCase();
  if (!cleanEmail) {
    throw new Error('البريد الإلكتروني مطلوب لتأكيد وتفعيل الحساب.');
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    throw new Error('يرجى إدخال بريد إلكتروني صحيح لتصلك رسالة التأكيد.');
  }

  if (input.role === 'CAPTAIN') {
    const parts = fullName.split(/\s+/).filter(Boolean);
    if (parts.length < 4 || !parts.every((p) => p.length >= 2 && /^[؀-ۿa-zA-Z]+$/.test(p))) {
      throw new Error('يرجى كتابة الاسم الرباعي كاملاً (الاسم، الأب، الجد، العائلة) بحروف صحيحة دون أرقام أو رموز.');
    }
  }

  const countryId = toStrictPositiveInteger(input.countryId, 'country_id');
  const isEgypt = countryId === 2 || validation.phone.startsWith('+20');

  return {
    role: input.role || 'RIDER',
    full_name: fullName,
    phone: validation.phone,
    country_id: countryId,
    currency_ar: isEgypt ? 'ج.م' : 'د.أ',
    currency_en: isEgypt ? 'EGP' : 'JOD',
    governorate_id: toStrictPositiveInteger(input.governorateId, 'governorate_id'),
    district_id: toStrictPositiveInteger(input.districtId, 'district_id'),
    ...(input.email?.trim() ? { email: input.email.trim().toLowerCase() } : {}),
    ...(input.captainProfile ? { captain_profile: input.captainProfile } : {}),
  };
}

export function toStrictPositiveInteger(value: number, fieldName: string) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`قيمة ${fieldName} غير صحيحة.`);
  }

  return value;
}
