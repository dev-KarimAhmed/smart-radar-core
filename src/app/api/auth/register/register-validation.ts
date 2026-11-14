import { isSaudiPhoneNumber, isSaudiCountryCode, SAUDI_RESTRICTION_MESSAGES } from '@/core/logic/saudi-restriction';

const PHONE_REGEX = /^\+[1-9]\d{6,14}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizePhone(phone: string) {
  return phone.trim().replace(/[\s()-]/g, '');
}

export interface RegistrationInput {
  rawPhone: string;
  normalizedPhone: string;
  password: string;
  fullName: string;
  rawEmail: string;
  role: string;
  countryId: number;
  governorateId: number;
  districtId: number;
  captainProfile: any;
}

export function validateRegistrationInput(body: any): { error?: string; input?: RegistrationInput } {
  const rawPhone = String(body.phone || '');
  const normalizedPhone = normalizePhone(rawPhone);
  const password = String(body.password || '');
  const fullName = String(body.fullName || body.name || '').trim();
  const rawEmail = String(body.email || '').trim().toLowerCase();
  const role = String(body.role || 'RIDER').toUpperCase();
  const countryId = Number(body.countryId || 1);
  const governorateId = Number(body.governorateId || 1);
  const districtId = Number(body.districtId || 1);
  const captainProfile = body.captainProfile || null;

  if (isSaudiPhoneNumber(normalizedPhone) || isSaudiPhoneNumber(rawPhone) || isSaudiCountryCode(body.countryCode || body.isoCode)) {
    return { error: SAUDI_RESTRICTION_MESSAGES.ar.phoneRejected };
  }

  if (!PHONE_REGEX.test(normalizedPhone)) {
    return { error: 'يرجى كتابة رقم الهاتف بصيغة دولية، مثل +962790000000 أو +201000000000.' };
  }

  if (password.length < 6) {
    return { error: 'كلمة المرور ضعيفة. يجب ألا تقل عن 6 أحرف.' };
  }

  if (!fullName) {
    return { error: 'يرجى كتابة الاسم الكامل.' };
  }

  if (role === 'CAPTAIN' || role === 'DRIVER') {
    const parts = fullName.split(/\s+/).filter(Boolean);
    if (parts.length < 4 || !parts.every((p) => p.length >= 2 && /^[؀-ۿa-zA-Z]+$/.test(p))) {
      return { error: 'يرجى كتابة الاسم الرباعي كاملاً (الاسم، الأب، الجد، العائلة) بحروف صحيحة دون أرقام أو رموز.' };
    }
  }

  if (!rawEmail || !EMAIL_REGEX.test(rawEmail)) {
    return { error: 'البريد الإلكتروني مطلوب وصحيح لتأكيد وتفعيل الحساب.' };
  }

  return {
    input: {
      rawPhone,
      normalizedPhone,
      password,
      fullName,
      rawEmail,
      role,
      countryId,
      governorateId,
      districtId,
      captainProfile,
    },
  };
}
