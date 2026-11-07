import { parsePhoneNumberFromString, getExampleNumber, type CountryCode } from 'libphonenumber-js';
import phoneNumberExamples from 'libphonenumber-js/mobile/examples';
import {
  getCountryIsoCode,
  type SupabaseCountryRow,
} from '../hooks/use-supabase-countries';
import type {
  SupabaseGovernorateRow,
  SupabaseDistrictRow,
} from '../hooks/use-supabase-locations';
import type { RegistrationRole } from '../types/registration-types';

export function getLocationLabel(
  row: SupabaseCountryRow | SupabaseGovernorateRow | SupabaseDistrictRow,
  lang: 'ar' | 'en'
) {
  const preferred = lang === 'ar' ? row.name_ar : row.name_en;
  return preferred || row.name_ar || row.name_en || row.name || String(row.id);
}

// Same libphonenumber-js validation the captain onboarding form uses (see
// src/features/captain/lib/captain-registration-schema.ts), so a phone that's
// valid in one flow is valid in the other. Local-format numbers (e.g. a
// leading "0") are accepted as long as a country is selected.
export function normalizePhoneForCountry(
  rawPhone: string,
  country: SupabaseCountryRow | null,
  tAuto?: (key: string) => string,
) {
  let trimmed = rawPhone.trim().replace(/[\s()-]/g, '');
  const getMsg = (key: string, fallback: string) => {
    try {
      return tAuto ? tAuto(key) : fallback;
    } catch {
      return fallback;
    }
  };

  if (!trimmed) {
    return { ok: false as const, message: getMsg('key_9a6b40b6', 'اكتب رقم الهاتف.') };
  }

  // Handle 00 international prefix -> +
  if (trimmed.startsWith('00')) {
    trimmed = '+' + trimmed.slice(2);
  }

  const isoCode = getCountryIsoCode(country) as CountryCode | undefined;

  try {
    // Strategy 1: Parse with given country ISO code if provided
    let parsed = parsePhoneNumberFromString(trimmed, isoCode || undefined);

    // Strategy 2: If invalid or unparsed, try parsing as a standalone international number
    if (!parsed || !parsed.isValid()) {
      const parsedIntl = parsePhoneNumberFromString(trimmed);
      if (parsedIntl && parsedIntl.isValid()) {
        parsed = parsedIntl;
      }
    }

    // Strategy 3: If still invalid and no + prefix, try fallback to common regional countries (JO, EG, SA)
    if (!parsed || !parsed.isValid()) {
      if (!trimmed.startsWith('+')) {
        for (const fallbackIso of ['JO', 'EG', 'SA'] as CountryCode[]) {
          if (fallbackIso === isoCode) continue;
          const candidate = parsePhoneNumberFromString(trimmed, fallbackIso);
          if (candidate && candidate.isValid()) {
            parsed = candidate;
            break;
          }
        }
      }
    }

    // Strategy 4: If starts with + and has 8-15 digits, accept directly
    if (!parsed || !parsed.isValid()) {
      if (/^\+[1-9]\d{7,14}$/.test(trimmed)) {
        return { ok: true as const, phone: trimmed };
      }
      return {
        ok: false as const,
        message: isoCode
          ? getMsg('key_9812501b', 'رقم الهاتف غير صحيح لهذه الدولة، اكتبه بالنسق المحلي أو الدولي.')
          : getMsg('key_af6d7dd9', 'اختر الدولة أولاً أو اكتب الرقم بالصيغة الدولية (+962 أو +20).'),
      };
    }

    return { ok: true as const, phone: parsed.number };
  } catch {
    if (/^\+[1-9]\d{7,14}$/.test(trimmed)) {
      return { ok: true as const, phone: trimmed };
    }
    return { ok: false as const, message: getMsg('key_286d6c55', 'رقم الهاتف غير صحيح.') };
  }
}

export function toSupabaseAuthRole(
  role: RegistrationRole
): 'RIDER' | 'CAPTAIN' | 'ADVERTISER' | 'DELEGATE' | 'ADMIN' {
  if (role === 'driver') return 'CAPTAIN';
  if (role === 'advertiser') return 'ADVERTISER';
  if (role === 'delegate') return 'DELEGATE';
  if (role === 'admin') return 'ADMIN';
  return 'RIDER';
}

export function getDemoPhoneForCountry(country: SupabaseCountryRow | null): string {
  const isoCode = getCountryIsoCode(country) as CountryCode | undefined;
  if (isoCode) {
    const example = getExampleNumber(isoCode, phoneNumberExamples);
    if (example) return example.number;
  }

  return '+962790000000';
}
