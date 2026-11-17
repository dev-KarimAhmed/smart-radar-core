import { signUpCaptainWithPhone, type CaptainProfileMetadata } from '@/features/auth/contract';
import { normalizePhoneForCountry } from '@/features/auth/utils/registration-helpers';
import type { AffiliationType } from '@/core/types';
import type { CaptainPersonalValues } from './captain-personal-step';
import type { CaptainVehicleValues } from './captain-vehicle-step';

export interface AvailabilityCheckResult {
  isAvailable: boolean;
  fieldErrors: Record<string, string>;
  errorMessage?: string;
  stepToReset?: number;
}

export async function checkCaptainIdentityAvailable(
  personal: CaptainPersonalValues,
  vehicle: CaptainVehicleValues,
): Promise<AvailabilityCheckResult> {
  const trimmedNatId = vehicle.nationalIdNumber.trim();
  const trimmedLic = vehicle.licenseNumber.trim();
  const trimmedPlate = vehicle.plate.trim();
  const cleanEmail = personal.email?.trim().toLowerCase() || null;
  const cleanPhone = personal.phone?.trim() || null;

  if (!trimmedNatId && !trimmedLic && !trimmedPlate && !cleanEmail && !cleanPhone) {
    return { isAvailable: true, fieldErrors: {} };
  }

  try {
    const { supabase } = await import('@/lib/supabase-client');
    const { data: availability, error: rpcError } = await supabase.rpc('check_captain_identity_available', {
      p_national_id: trimmedNatId || null,
      p_license_number: trimmedLic || null,
      p_plate_number: trimmedPlate || null,
      p_email: cleanEmail,
      p_phone: cleanPhone,
    });

    if (!rpcError && availability) {
      if (availability.phone_taken) {
        return {
          isAvailable: false,
          fieldErrors: {},
          errorMessage: 'رقم الهاتف مسجل بالفعل مسبقاً لحساب آخر. يرجى تسجيل الدخول أو استخدام رقم آخر.',
          stepToReset: 1,
        };
      }

      if (availability.email_taken) {
        return {
          isAvailable: false,
          fieldErrors: {},
          errorMessage: 'البريد الإلكتروني مسجل بالفعل مسبقاً لحساب آخر. يرجى استخدام بريد إلكتروني آخر.',
          stepToReset: 1,
        };
      }

      const newErrors: Record<string, string> = {};
      if (availability.national_id_taken) {
        newErrors.nationalIdNumber = 'رقم الهوية الوطنية مسجل بالفعل مسبقاً. يرجى التأكد من الرقم أو استخدام رقم آخر.';
      }
      if (availability.license_taken) {
        newErrors.licenseNumber = 'رقم رخصة القيادة مسجل بالفعل مسبقاً. يرجى التأكد من الرقم أو استخدام رقم آخر.';
      }
      if (availability.plate_taken) {
        newErrors.plate = 'رقم لوحة المركبة مسجل بالفعل مسبقاً لمركبة أخرى. يرجى التأكد من اللوحة أو استخدام رقم آخر.';
      }

      if (Object.keys(newErrors).length > 0) {
        return {
          isAvailable: false,
          fieldErrors: newErrors,
          errorMessage: newErrors.plate || newErrors.nationalIdNumber || newErrors.licenseNumber,
        };
      }
    }
    return { isAvailable: true, fieldErrors: {} };
  } catch {
    return { isAvailable: true, fieldErrors: {} };
  }
}

export function buildCaptainProfile(
  personal: CaptainPersonalValues,
  vehicle: CaptainVehicleValues,
  affiliation: AffiliationType,
): CaptainProfileMetadata {
  const isTaxi = affiliation === 'office-taxi';
  const isIndependent = affiliation === 'independent';

  return {
    vehicle_type: isTaxi ? 'TAXI' : 'PRIVATE',
    vehicle_brand: vehicle.make.trim() || null,
    vehicle_model: vehicle.model.trim() || null,
    vehicle_color: isTaxi ? (vehicle.color.trim() || 'أصفر') : (vehicle.color.trim() || null),
    vehicle_year: Number(vehicle.year) || null,
    plate_number: vehicle.plate.trim() || null,
    employment_type: isTaxi
      ? vehicle.officeName.trim() || null
      : isIndependent
      ? 'مستقل'
      : vehicle.companyName.trim() || null,
    affiliation_type: affiliation,
    office_phone: isTaxi
      ? (() => {
          const res = normalizePhoneForCountry(vehicle.officePhone.trim(), personal.countryIso);
          return (res.ok ? res.phone : vehicle.officePhone.trim()) || null;
        })()
      : null,
    side_id: isTaxi ? vehicle.sideId.trim() || null : null,
    company_code: isTaxi || isIndependent ? null : vehicle.companyCode.trim() || null,
    identity_url: null,
    contact_page_url: null,
    driving_license_url: null,
    national_id_number: vehicle.nationalIdNumber.trim() || null,
    license_number: vehicle.licenseNumber.trim() || null,
    nickname: personal.nickname.trim() || null,
    facebook_url: vehicle.facebookUrl.trim() || null,
    instagram_url: vehicle.instagramUrl.trim() || null,
    verification_status: 'PENDING',
  };
}

export async function submitCaptainSignUp(
  personal: CaptainPersonalValues,
  vehicle: CaptainVehicleValues,
  affiliation: AffiliationType,
  rememberMe: boolean,
) {
  const captainProfile = buildCaptainProfile(personal, vehicle, affiliation);

  return signUpCaptainWithPhone({
    phone: personal.phone,
    password: personal.password,
    fullName: personal.name,
    email: personal.email?.trim() || undefined,
    countryId: Number(personal.country),
    governorateId: Number(personal.governorate),
    districtId: Number(personal.district),
    rememberMe,
    captainProfile,
  });
}
