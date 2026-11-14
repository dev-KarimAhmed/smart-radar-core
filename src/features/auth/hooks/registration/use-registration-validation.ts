'use client';

import { useCallback } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';
import { normalizePhoneForCountry } from '../../utils/registration-helpers';
import type { SupabaseCountryRow } from '../use-supabase-countries';
import type { SupabaseGovernorateRow, SupabaseDistrictRow } from '../use-supabase-locations';
import type { AuthMode, PersonalRegistrationState } from '../../types/registration-context-types';

interface UseRegistrationValidationParams {
  personal: PersonalRegistrationState;
  authPassword: string;
  authMode: AuthMode;
  selectedCountry: SupabaseCountryRow | null;
  governorateRows: SupabaseGovernorateRow[];
  districtRows: SupabaseDistrictRow[];
  lang: 'ar' | 'en';
  tAuto: (key: string) => string;
  isSubmittingRef: React.MutableRefObject<boolean>;
  setIsSubmitting: (submitting: boolean) => void;
}

export function useRegistrationValidation({
  personal,
  authPassword,
  authMode,
  selectedCountry,
  governorateRows,
  districtRows,
  lang,
  tAuto,
  isSubmittingRef,
  setIsSubmitting,
}: UseRegistrationValidationParams) {
  const { toast } = useToast();

  const validateAuthFields = useCallback(() => {
    const countryId = Number(personal.country);
    const governorateId = Number(personal.gov);
    const districtId = Number(personal.district);
    const selectedGovernorate = governorateRows.find(
      (governorate) => governorate.id === governorateId && governorate.country_id === countryId,
    );
    const selectedDistrict = districtRows.find(
      (district) => district.id === districtId && district.governorate_id === governorateId,
    );

    if (!personal.phone || !authPassword) {
      toast({
        variant: 'destructive',
        title: tAuto('key_e1da8e5b'),
        description: tAuto('key_48c653a4'),
      });
      return null;
    }

    const normalizedPhone = normalizePhoneForCountry(personal.phone, selectedCountry, tAuto);
    if (!normalizedPhone.ok) {
      toast({
        variant: 'destructive',
        title: tAuto('key_c4fdecb8'),
        description: normalizedPhone.message,
      });
      return null;
    }

    if (authMode === 'register') {
      if (
        !personal.name.trim() ||
        !Number.isInteger(countryId) ||
        !Number.isInteger(governorateId) ||
        !Number.isInteger(districtId) ||
        !selectedCountry ||
        !selectedGovernorate ||
        !selectedDistrict
      ) {
        toast({
          variant: 'destructive',
          title: tAuto('key_e1da8e5b'),
          description: tAuto('key_97c980d3'),
        });
        return null;
      }

      const cleanEmail = personal.email?.trim() || '';
      if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
        toast({
          variant: 'destructive',
          title: tAuto('key_e1da8e5b'),
          description: lang === 'ar' ? 'يرجى إدخال بريد إلكتروني صحيح لتفعيل الحساب.' : 'Please enter a valid email address.',
        });
        return null;
      }

      if (authPassword.length < 6) {
        toast({
          variant: 'destructive',
          title: tAuto('key_e1da8e5b'),
          description: lang === 'ar' ? 'كلمة المرور ضعيفة. يجب ألا تقل عن 6 أحرف.' : 'Password must be at least 6 characters.',
        });
        return null;
      }
    }

    return { countryId, governorateId, districtId, normalizedPhone };
  }, [
    authMode,
    authPassword,
    districtRows,
    governorateRows,
    lang,
    personal.country,
    personal.district,
    personal.email,
    personal.gov,
    personal.name,
    personal.phone,
    selectedCountry,
    tAuto,
    toast,
  ]);

  const validateBeforeAccuracyConfirm = useCallback(async (): Promise<boolean> => {
    const validated = validateAuthFields();
    if (!validated) return false;
    if (authMode !== 'register') return true;

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      const cleanEmail = personal.email?.trim().toLowerCase() || null;
      const { data: availability, error: rpcError } = await supabase.rpc('check_captain_identity_available', {
        p_national_id: null,
        p_license_number: null,
        p_plate_number: null,
        p_email: cleanEmail,
        p_phone: validated.normalizedPhone.phone,
      });

      if (!rpcError && availability) {
        if (availability.phone_taken) {
          toast({
            variant: 'destructive',
            title: tAuto('key_71272649'),
            description: lang === 'ar'
              ? 'رقم الهاتف مسجل بالفعل مسبقاً. يرجى تسجيل الدخول بدلاً من إنشاء حساب جديد.'
              : 'This phone number is already registered. Please log in instead.',
          });
          return false;
        }
        if (availability.email_taken) {
          toast({
            variant: 'destructive',
            title: tAuto('key_71272649'),
            description: lang === 'ar'
              ? 'البريد الإلكتروني مسجل بالفعل مسبقاً لحساب آخر. يرجى استخدام بريد إلكتروني آخر.'
              : 'This email address is already registered to another account.',
          });
          return false;
        }
      }
      return true;
    } catch {
      return true;
    } finally {
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  }, [authMode, isSubmittingRef, lang, personal.email, setIsSubmitting, tAuto, toast, validateAuthFields]);

  return {
    validateAuthFields,
    validateBeforeAccuracyConfirm,
  };
}
