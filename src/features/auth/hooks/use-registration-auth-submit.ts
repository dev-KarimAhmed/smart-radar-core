import { useCallback, useRef, useState } from 'react';
import type { AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import {
  buildRiderSignUpMetadata,
  isInvalidPhoneOrPasswordError,
  mapSupabaseAuthError,
  signInRiderWithPhone,
  signUpRiderWithPhone,
} from '../services/supabase-auth';
import { supabase } from '@/lib/supabase-client';
import { getAuthRedirectUrl } from '@/lib/utils';
import {
  claimCaptainReferral,
  getPendingCaptainReferral,
  clearPendingCaptainReferral,
  removeReferralParamFromUrl,
} from '@/features/referral/services/captain-referral';
import { recordLegalDeclaration } from '@/shared/services/legal-log-service';
import { normalizePhoneForCountry, toSupabaseAuthRole } from '../utils/registration-helpers';
import type {
  AuthMode,
  PersonalRegistrationState,
  RegistrationRole,
} from '../types/registration-types';
import type { SupabaseCountryRow } from './use-supabase-countries';
import type {
  SupabaseGovernorateRow,
  SupabaseDistrictRow,
} from './use-supabase-locations';
import type { AffiliationType } from '@/core/types';

interface UseRegistrationAuthSubmitProps {
  personal: PersonalRegistrationState;
  authPassword: string;
  rememberMe: boolean;
  role: RegistrationRole;
  authMode: AuthMode;
  affiliation: AffiliationType | null;
  vehicle: any;
  selectedCountry: SupabaseCountryRow | null;
  governorateRows: SupabaseGovernorateRow[];
  districtRows: SupabaseDistrictRow[];
  router: AppRouterInstance;
  toast: (opts: any) => void;
  lang: 'ar' | 'en';
  tAuto: (key: string) => string;
  setAwaitingConfirmationEmail: (email: string | null) => void;
  setAuthMode: (mode: AuthMode) => void;
  setCreateAccountPulseKey: React.Dispatch<React.SetStateAction<number>>;
}

export function useRegistrationAuthSubmit({
  personal,
  authPassword,
  rememberMe,
  role,
  authMode,
  affiliation,
  vehicle,
  selectedCountry,
  governorateRows,
  districtRows,
  router,
  toast,
  lang,
  tAuto,
  setAwaitingConfirmationEmail,
  setAuthMode,
  setCreateAccountPulseKey,
}: UseRegistrationAuthSubmitProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  const submitSupabaseAuth = useCallback(async () => {
    if (isSubmittingRef.current) return;

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
      return;
    }

    const normalizedPhone = normalizePhoneForCountry(personal.phone, selectedCountry, tAuto);
    if (!normalizedPhone.ok) {
      toast({
        variant: 'destructive',
        title: tAuto('key_c4fdecb8'),
        description: normalizedPhone.message,
      });
      return;
    }

    if (
      authMode === 'register' &&
      (!personal.name.trim() ||
        !Number.isInteger(countryId) ||
        !Number.isInteger(governorateId) ||
        !Number.isInteger(districtId) ||
        !selectedCountry ||
        !selectedGovernorate ||
        !selectedDistrict)
    ) {
      toast({
        variant: 'destructive',
        title: tAuto('key_e1da8e5b'),
        description: tAuto('key_97c980d3'),
      });
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
      const queryRef = typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('ref') ||
          new URLSearchParams(window.location.search).get('captain')
        : null;
      const pendingRef = (getPendingCaptainReferral() || queryRef || '').trim();

      if (authMode === 'login') {
        clearPendingCaptainReferral();
        removeReferralParamFromUrl();
        if (typeof window !== 'undefined') {
          window.sessionStorage.removeItem('radar_newly_registered_referral');
        }

        await signInRiderWithPhone({
          phone: normalizedPhone.phone,
          password: authPassword,
          rememberMe,
          expectedRole: toSupabaseAuthRole(role),
        });

        toast({
          title: tAuto('key_93857427'),
          description: tAuto('key_79708394'),
        });
        router.replace('/');
        return;
      }

      // authMode === 'register'
      if (role === 'rider' && pendingRef && typeof window !== 'undefined') {
        window.sessionStorage.setItem('radar_newly_registered_referral', pendingRef);
      }

      const signUpInput = {
        phone: normalizedPhone.phone,
        password: authPassword,
        fullName: personal.name.trim(),
        email: personal.email?.trim() || undefined,
        role: toSupabaseAuthRole(role),
        countryId,
        governorateId,
        districtId,
        rememberMe,
      };

      if ((process.env.NODE_ENV !== 'production')) {
        console.info('[Supabase Auth Payload]', {
          mode: 'register',
          data: buildRiderSignUpMetadata(signUpInput),
        });
      }

      const signUpResult = await signUpRiderWithPhone(signUpInput);

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('radar_pending_pwa_install_prompt', 'true');
        } catch {}
      }

      if ((signUpResult as any).needsEmailConfirmation) {
        setAwaitingConfirmationEmail((signUpResult as any).email || personal.email.trim());
        toast({
          title: lang === 'ar' ? 'تم إنشاء الحساب بنجاح! ✉️' : 'Account created successfully! ✉️',
          description: lang === 'ar'
            ? 'يرجى مراجعة بريدك الإلكتروني والضغط على رابط التفعيل لتأكيد الحساب.'
            : 'Please check your email and click the confirmation link to activate your account.',
        });
        return;
      }

      const isExistingUser =
        Array.isArray(signUpResult.user?.identities) &&
        signUpResult.user.identities.length === 0;

      if (isExistingUser) {
        clearPendingCaptainReferral();
        removeReferralParamFromUrl();
        if (typeof window !== 'undefined') {
          window.sessionStorage.removeItem('radar_newly_registered_referral');
        }
        return;
      }

      if (role === 'rider' && pendingRef) {
        let hasActiveSession = Boolean(signUpResult.session);

        if (!hasActiveSession) {
          try {
            const signInRes = await signInRiderWithPhone({
              phone: normalizedPhone.phone,
              password: authPassword,
              rememberMe,
              expectedRole: 'RIDER',
            });
            if (signInRes.session) {
              hasActiveSession = true;
            }
          } catch (autoSignInErr) {
            if (process.env.NODE_ENV !== 'production') {
              console.warn('[Auto sign-in on registration]', autoSignInErr);
            }
          }
        }

        if (hasActiveSession) {
          try {
            const claimResult = await claimCaptainReferral(pendingRef);
            if (claimResult.success && typeof window !== 'undefined') {
              window.sessionStorage.setItem('radar_just_linked_captain_name', claimResult.captain_name || '');
            }
            if (process.env.NODE_ENV !== 'production') {
              console.info('[Referral on Signup Claimed]', claimResult);
            }
          } catch (referralErr) {
            if (process.env.NODE_ENV !== 'production') {
              console.warn('[Referral on Signup Error]', referralErr);
            }
          } finally {
            clearPendingCaptainReferral();
            removeReferralParamFromUrl();
            if (typeof window !== 'undefined') {
              window.sessionStorage.removeItem('radar_newly_registered_referral');
              window.dispatchEvent(new CustomEvent('radar_favorites_updated'));
            }
          }
        }
      }

      if (signUpResult.session && personal.email?.trim().includes('@')) {
        const { error: emailError } = await supabase.auth.updateUser(
          { email: personal.email.trim() },
          { emailRedirectTo: getAuthRedirectUrl('/reset-password') },
        );
        if (emailError && (process.env.NODE_ENV !== 'production')) {
          console.warn('[Registration Email Update Error]', emailError);
        }
      }

      if (role === 'driver') {
        const userId = signUpResult.user?.id;
        if (userId) {
          const isTaxi = affiliation === 'office-taxi';
          const { error: profileError } = await supabase.from('captain_profiles').upsert({
            id: userId,
            vehicle_type: isTaxi ? tAuto('key_0870671f') : tAuto('key_3e71cbbc'),
            vehicle_brand: isTaxi ? null : vehicle.make,
            vehicle_year: Number(vehicle.year) || null,
            plate_number: vehicle.plate,
            employment_type: isTaxi ? vehicle.officeName : vehicle.companyName,
            affiliation_type: affiliation,
            office_phone: isTaxi ? vehicle.officePhone : null,
            side_id: isTaxi ? vehicle.sideId : null,
            identity_url: personal.verificationDoc,
            verification_status: 'PENDING'
          });

          if (profileError) {
            console.error('[Captain Profile Insert Error]', profileError);
            throw new Error(profileError.message || tAuto('key_643f2795'));
          }

          try {
            const token = (signUpResult as any)?.session?.access_token;
            if (token) {
              void fetch('/api/captain/welcome-credit', {
                method: 'POST',
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'application/json',
                },
              }).catch((err) => console.warn('[Welcome Credit Hook] Async error:', err));
            }
          } catch (e) {
            console.warn('[Welcome Credit Trigger]', e);
          }
        }
      }

      const newUserId = signUpResult.user?.id;
      if (newUserId) {
        void recordLegalDeclaration({
          userId: newUserId,
          userSerialId: (signUpResult.user as any)?.serial_id || ('U-' + newUserId.slice(0, 6).toUpperCase()),
          actionType: 'NEW_ACCOUNT',
          actionLabel: lang === 'ar' ? 'تسجيل حساب جديد' : 'New Account Registration',
          isArabic: lang === 'ar',
        });
      }

      toast({
        title: tAuto('key_b4c64c00'),
        description: role === 'driver'
          ? tAuto('key_cd6703e6')
          : tAuto('key_7132f656'),
      });
      if (signUpResult.session) {
        router.replace('/');
      } else {
        setAuthMode('login');
        router.replace('/');
      }
    } catch (error) {
      if ((process.env.NODE_ENV !== 'production')) {
        const authError = error as { name?: string; code?: string; status?: number; message?: string };
        console.warn('[Supabase Auth]', {
          mode: authMode,
          role,
          name: authError?.name,
          code: authError?.code,
          status: authError?.status,
          message: authError?.message,
        });
      }

      const isAccountInUse = `${(error as any)?.message || ''}`.includes('account_in_use') || `${(error as any)?.message || ''}`.includes('قيد الاستخدام');
      if (isAccountInUse) {
        toast({
          variant: 'destructive',
          title: lang === 'ar' ? 'الحساب قيد الاستخدام حالياً' : 'Account Already In Use',
          description: lang === 'ar'
            ? 'هذا الحساب مفتوح حالياً على جهاز آخر. لا يمكنك تسجيل الدخول حتى يتم تسجيل الخروج من الجهاز الآخر.'
            : 'This account is currently active on another device. You cannot log in until it is logged out from the other device.',
          duration: 8000,
        });
        return;
      }

      const isUnconfirmed = (error as any)?.message === 'email_not_confirmed' || `${(error as any)?.message || ''}`.includes('email_not_confirmed');
      if (isUnconfirmed) {
        setAwaitingConfirmationEmail(personal.email?.trim() || (error as any)?.email || null);
        toast({
          variant: 'destructive',
          title: lang === 'ar' ? 'الحساب قيد الانتظار' : 'Account pending verification',
          description: lang === 'ar'
            ? 'يرجى تأكيد حسابك عبر الرابط المرسل إلى بريدك الإلكتروني أولاً لتفعيل الحساب.'
            : 'Please confirm your email using the link sent to your inbox before logging in.',
        });
        return;
      }

      const wrongCredentials = authMode === 'login' && isInvalidPhoneOrPasswordError(error);
      if (wrongCredentials) setCreateAccountPulseKey((key) => key + 1);

      toast({
        variant: 'destructive',
        title: authMode === 'register' ? tAuto('key_71272649') : tAuto('key_64bc4896'),
        description: wrongCredentials
          ? `${mapSupabaseAuthError(error)} يمكنك إنشاء حساب جديد إذا لم يكن لديك حساب بعد.`
          : mapSupabaseAuthError(error),
      });
    } finally {
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  }, [
    affiliation,
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
    personal.verificationDoc,
    rememberMe,
    role,
    router,
    selectedCountry,
    setAuthMode,
    setAwaitingConfirmationEmail,
    setCreateAccountPulseKey,
    tAuto,
    toast,
    vehicle,
  ]);

  return {
    isSubmitting,
    submitSupabaseAuth,
  };
}
