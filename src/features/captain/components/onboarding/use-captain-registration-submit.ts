'use client';

import React from 'react';
import { mapSupabaseAuthError, signUpCaptainWithPhone, type CaptainProfileMetadata } from '@/features/auth/contract';
import type { AffiliationType } from '@/core/types';
import { recordLegalDeclaration } from '@/features/account/services/legal-log-service';
import { navigateAuth } from '@/lib/auth-routing';
import type { CaptainPersonalValues } from './captain-personal-step';
import type { CaptainVehicleValues } from './captain-vehicle-step';
import type { OnboardingStep } from './captain-onboarding-helpers';

interface UseCaptainRegistrationSubmitParams {
  personal: CaptainPersonalValues;
  vehicle: CaptainVehicleValues;
  affiliation: AffiliationType | null;
  rememberMe: boolean;
  isArabic: boolean;
  t: (key: string) => string;
  toast: (args: any) => void;
  setStep: (step: OnboardingStep) => void;
  setShowPwaInstallModal: (show: boolean) => void;
  setConfirmedEmail: (email: string) => void;
}

export function useCaptainRegistrationSubmit({
  personal,
  vehicle,
  affiliation,
  rememberMe,
  isArabic,
  t,
  toast,
  setStep,
  setShowPwaInstallModal,
  setConfirmedEmail,
}: UseCaptainRegistrationSubmitParams) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [vehicleErrors, setVehicleErrors] = React.useState<Record<string, string>>({});

  const submitCaptainRegistration = async () => {
    if (!personal.country || !personal.governorate || !personal.district || !affiliation) return;

    setVehicleErrors({});
    setIsSubmitting(true);

    try {
      const { supabase } = await import('@/lib/supabase-client');

      const trimmedNatId = vehicle.nationalIdNumber.trim();
      const trimmedLic = vehicle.licenseNumber.trim();
      const trimmedPlate = vehicle.plate.trim();
      const cleanEmail = personal.email?.trim().toLowerCase() || null;
      const cleanPhone = personal.phone?.trim() || null;

      if (trimmedNatId || trimmedLic || trimmedPlate || cleanEmail || cleanPhone) {
        const { data: availability, error: rpcError } = await supabase.rpc('check_captain_identity_available', {
          p_national_id: trimmedNatId || null,
          p_license_number: trimmedLic || null,
          p_plate_number: trimmedPlate || null,
          p_email: cleanEmail,
          p_phone: cleanPhone,
        });

        if (!rpcError && availability) {
          if (availability.phone_taken) {
            toast({
              variant: 'destructive',
              title: t('errorTitle'),
              description: isArabic
                ? 'رقم الهاتف مسجل بالفعل مسبقاً لحساب آخر. يرجى تسجيل الدخول أو استخدام رقم آخر.'
                : 'Phone number is already registered to another account. Please sign in or use another number.',
            });
            setStep(1);
            setIsSubmitting(false);
            return;
          }

          if (availability.email_taken) {
            toast({
              variant: 'destructive',
              title: t('errorTitle'),
              description: isArabic
                ? 'البريد الإلكتروني مسجل بالفعل مسبقاً لحساب آخر. يرجى استخدام بريد إلكتروني آخر.'
                : 'Email address is already registered to another account. Please use a different email.',
            });
            setStep(1);
            setIsSubmitting(false);
            return;
          }

          const newErrors: Record<string, string> = {};

          if (availability.national_id_taken) {
            newErrors.nationalIdNumber = isArabic
              ? 'رقم الهوية الوطنية مسجل بالفعل مسبقاً. يرجى التأكد من الرقم أو استخدام رقم آخر.'
              : 'National ID number is already registered. Please verify or use another number.';
          }
          if (availability.license_taken) {
            newErrors.licenseNumber = isArabic
              ? 'رقم رخصة القيادة مسجل بالفعل مسبقاً. يرجى التأكد من الرقم أو استخدام رقم آخر.'
              : 'Driver license number is already registered. Please verify or use another number.';
          }
          if (availability.plate_taken) {
            newErrors.plate = isArabic
              ? 'رقم لوحة المركبة مسجل بالفعل مسبقاً لمركبة أخرى. يرجى التأكد من اللوحة أو استخدام رقم آخر.'
              : 'Vehicle plate number is already registered to another vehicle. Please check or use another plate.';
          }

          if (Object.keys(newErrors).length > 0) {
            setVehicleErrors(newErrors);
            toast({
              variant: 'destructive',
              title: t('errorTitle'),
              description: newErrors.plate || newErrors.nationalIdNumber || newErrors.licenseNumber,
            });
            setIsSubmitting(false);
            return;
          }
        }
      }

      const isTaxi = affiliation === 'office-taxi';
      const isIndependent = affiliation === 'independent';
      const captainProfile: CaptainProfileMetadata = {
        vehicle_type: isTaxi ? 'TAXI' : 'PRIVATE',
        vehicle_brand: isTaxi ? null : vehicle.make.trim() || null,
        vehicle_model: vehicle.model.trim() || null,
        vehicle_color: isTaxi ? null : vehicle.color.trim() || null,
        vehicle_year: Number(vehicle.year) || null,
        plate_number: vehicle.plate.trim() || null,
        employment_type: isTaxi ? vehicle.officeName.trim() || null : isIndependent ? 'مستقل' : vehicle.companyName.trim() || null,
        affiliation_type: affiliation,
        office_phone: isTaxi ? vehicle.officePhone.trim() || null : null,
        side_id: isTaxi ? vehicle.sideId.trim() || null : null,
        company_code: isTaxi || isIndependent ? null : vehicle.companyCode.trim() || null,
        identity_url: null,
        contact_page_url: null,
        driving_license_url: null,
        national_id_number: trimmedNatId || null,
        license_number: trimmedLic || null,
        nickname: personal.nickname.trim() || null,
        facebook_url: vehicle.facebookUrl.trim() || null,
        instagram_url: vehicle.instagramUrl.trim() || null,
        verification_status: 'PENDING',
      };

      const result = await signUpCaptainWithPhone({
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

      if ((result as any).needsEmailConfirmation) {
        setConfirmedEmail(personal.email.trim());
        setStep('done');
        setShowPwaInstallModal(true);
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('radar_pending_pwa_install_prompt', 'true');
          } catch {}
        }
        const captainId = result.user?.id;
        if (captainId) {
          void recordLegalDeclaration({
            userId: captainId,
            userSerialId: (result.user as any)?.serial_id || `D-${captainId.slice(0, 6).toUpperCase()}`,
            actionType: 'NEW_ACCOUNT',
            actionLabel: isArabic ? 'تسجيل كابتن جديد' : 'New Captain Registration',
            isArabic,
          });
        }
        toast({
          title: isArabic ? 'تم إنشاء الحساب بنجاح! ✉️' : 'Account created successfully! ✉️',
          description: isArabic
            ? 'يرجى مراجعة بريدك الإلكتروني والضغط على رابط التفعيل لتأكيد الحساب.'
            : 'Please check your email and click the confirmation link to activate your account.',
        });
        return;
      }

      toast({
        title: t('successTitle'),
        description: t(result.session ? 'successDescription' : 'successNeedsLogin'),
      });

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('radar_pending_pwa_install_prompt', 'true');
        } catch {}
      }

      if (result.session) {
        if (personal.email?.trim().includes('@')) {
          const { getAuthRedirectUrl } = await import('@/lib/utils');
          const { error: emailError } = await supabase.auth.updateUser(
            { email: personal.email.trim() },
            { emailRedirectTo: getAuthRedirectUrl('/reset-password') },
          );
          if (emailError && (process.env.NODE_ENV !== 'production')) {
            console.warn('[Registration Email Update Error]', emailError);
          }
        }
        window.location.replace('/captain');
      } else {
        navigateAuth('login', 'driver');
      }
    } catch (error) {
      let errorMsg = mapSupabaseAuthError(error);
      const errText = `${errorMsg} ${JSON.stringify(error || '')}`.toLowerCase();
      const newVehicleErrors: Record<string, string> = {};

      if (errText.includes('national_id') || errText.includes('هوية')) {
        newVehicleErrors.nationalIdNumber = isArabic
          ? 'رقم الهوية الوطنية مسجل بالفعل مسبقاً.'
          : 'National ID number is already registered.';
      }
      if (errText.includes('license') || errText.includes('رخصة')) {
        newVehicleErrors.licenseNumber = isArabic
          ? 'رقم رخصة القيادة مسجل بالفعل مسبقاً.'
          : 'Driver license number is already registered.';
      }
      if (errText.includes('plate') || errText.includes('لوحة')) {
        newVehicleErrors.plate = isArabic
          ? 'رقم لوحة المركبة مسجل بالفعل مسبقاً لمركبة أخرى.'
          : 'Vehicle plate number is already registered.';
      }

      if (
        errText.includes('unique_email') ||
        errText.includes('missing_email') ||
        (errText.includes('email') && (errText.includes('مسجل') || errText.includes('مسبق') || errText.includes('already exists') || errText.includes('taken')))
      ) {
        errorMsg = isArabic
          ? 'البريد الإلكتروني مسجل بالفعل مسبقاً لحساب آخر. يرجى استخدام بريد إلكتروني آخر.'
          : 'Email address is already registered to another account. Please use a different email.';
        setStep(1);
      }

      if (Object.keys(newVehicleErrors).length === 0) {
        try {
          const { supabase } = await import('@/lib/supabase-client');
          const { data: availability } = await supabase.rpc('check_captain_identity_available', {
            p_national_id: vehicle.nationalIdNumber.trim() || null,
            p_license_number: vehicle.licenseNumber.trim() || null,
            p_plate_number: vehicle.plate.trim() || null,
            p_email: personal.email?.trim().toLowerCase() || null,
            p_phone: personal.phone?.trim() || null,
          });
          if (availability?.phone_taken) {
            errorMsg = isArabic
              ? 'رقم الهاتف مسجل بالفعل مسبقاً لحساب آخر. يرجى تسجيل الدخول بدلاً من إنشاء حساب جديد.'
              : 'Phone number is already registered. Please sign in instead of creating a new account.';
            setStep(1);
          }
          if (availability?.email_taken) {
            errorMsg = isArabic
              ? 'البريد الإلكتروني مسجل بالفعل مسبقاً لحساب آخر. يرجى استخدام بريد إلكتروني آخر.'
              : 'Email address is already registered to another account. Please use a different email.';
            setStep(1);
          }
          if (availability?.national_id_taken) {
            newVehicleErrors.nationalIdNumber = isArabic
              ? 'رقم الهوية الوطنية مسجل بالفعل مسبقاً.'
              : 'National ID number is already registered.';
            errorMsg = isArabic
              ? 'رقم الهوية الوطنية مسجل بالفعل مسبقاً. يرجى التأكد من الرقم أو استخدام رقم آخر.'
              : 'National ID number is already registered. Please verify or use another number.';
          }
          if (availability?.license_taken) {
            newVehicleErrors.licenseNumber = isArabic
              ? 'رقم رخصة القيادة مسجل بالفعل مسبقاً.'
              : 'Driver license number is already registered.';
            errorMsg = isArabic
              ? 'رقم رخصة القيادة مسجل بالفعل مسبقاً. يرجى التأكد من الرقم أو استخدام رقم آخر.'
              : 'Driver license number is already registered. Please verify or use another number.';
          }
          if (availability?.plate_taken) {
            newVehicleErrors.plate = isArabic
              ? 'رقم لوحة المركبة مسجل بالفعل مسبقاً لمركبة أخرى.'
              : 'Vehicle plate number is already registered.';
            errorMsg = isArabic
              ? 'رقم لوحة المركبة مسجل بالفعل مسبقاً لمركبة أخرى. يرجى التأكد من اللوحة أو استخدام رقم آخر.'
              : 'Vehicle plate number is already registered to another vehicle. Please check or use another plate.';
          }
        } catch {}
      }

      if (Object.keys(newVehicleErrors).length > 0) {
        setVehicleErrors(newVehicleErrors);
      }

      toast({
        variant: 'destructive',
        title: t('errorTitle'),
        description: errorMsg,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    vehicleErrors,
    setVehicleErrors,
    submitCaptainRegistration,
  };
}
