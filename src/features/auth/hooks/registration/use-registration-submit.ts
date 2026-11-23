'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { signInRiderWithPhone } from '../../services/supabase-auth';
import {
  clearPendingCaptainReferral,
  removeReferralParamFromUrl,
} from '@/features/referral/services/captain-referral';
import { toSupabaseAuthRole, type RegistrationRole } from '../../utils/registration-helpers';
import type { AffiliationType } from '@/core/types';
import type {
  AuthMode,
  PersonalRegistrationState,
  RegistrationStep,
} from '../../types/registration-context-types';
import { handleAuthSubmitError } from './registration-auth-error-handler';
import { executeRegistrationSignUp } from './registration-signup-flow';

interface UseRegistrationSubmitParams {
  authMode: AuthMode;
  authPassword: string;
  role: RegistrationRole;
  personal: PersonalRegistrationState;
  rememberMe: boolean;
  affiliation: AffiliationType | null;
  vehicle: any;
  lang: 'ar' | 'en';
  setAwaitingConfirmationEmail: (email: string | null) => void;
  registeredAuthRef: React.MutableRefObject<{
    phone: string;
    password: string;
    role: RegistrationRole;
    email?: string;
  } | null>;
  setCreateAccountPulseKey: React.Dispatch<React.SetStateAction<number>>;
  setAuthMode: (mode: AuthMode) => void;
  setStep: (step: RegistrationStep) => void;
  validateAuthFields: () => {
    countryId: number;
    governorateId: number;
    districtId: number;
    normalizedPhone: { ok: true; phone: string; message?: string };
  } | null;
  isSubmittingRef: React.MutableRefObject<boolean>;
  setIsSubmitting: (submitting: boolean) => void;
  tAuto: (key: string) => string;
}

export function useRegistrationSubmit({
  authMode,
  authPassword,
  role,
  personal,
  rememberMe,
  affiliation,
  vehicle,
  lang,
  setAwaitingConfirmationEmail,
  registeredAuthRef,
  setCreateAccountPulseKey,
  setAuthMode,
  setStep,
  validateAuthFields,
  isSubmittingRef,
  setIsSubmitting,
  tAuto,
}: UseRegistrationSubmitParams) {
  const router = useRouter();
  const { toast } = useToast();
  const [logoTapCount, setLogoTapCount] = useState(0);

  const submitSupabaseAuth = useCallback(async (forceTakeover = false) => {
    if (isSubmittingRef.current) return;

    const validated = validateAuthFields();
    if (!validated) return;
    const { countryId, governorateId, districtId, normalizedPhone } = validated;

    isSubmittingRef.current = true;
    setIsSubmitting(true);

    try {
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
          forceTakeover,
        });

        toast({
          title: tAuto('key_93857427'),
          description: tAuto('key_79708394'),
        });
        router.replace('/');
        return;
      }

      await executeRegistrationSignUp({
        normalizedPhone,
        authPassword,
        role,
        personal,
        countryId,
        governorateId,
        districtId,
        rememberMe,
        lang,
        affiliation,
        vehicle,
        registeredAuthRef,
        setAwaitingConfirmationEmail,
        setAuthMode,
        router,
        toast,
        tAuto,
      });
    } catch (error) {
      handleAuthSubmitError({
        error,
        authMode,
        role,
        personal,
        lang,
        tAuto,
        toast,
        setAwaitingConfirmationEmail,
        setCreateAccountPulseKey,
        onForceTakeover: authMode === 'login' ? () => void submitSupabaseAuth(true) : undefined,
      });
    } finally {
      setIsSubmitting(false);
      isSubmittingRef.current = false;
    }
  }, [
    affiliation,
    authMode,
    authPassword,
    isSubmittingRef,
    lang,
    personal,
    registeredAuthRef,
    rememberMe,
    role,
    router,
    setAuthMode,
    setAwaitingConfirmationEmail,
    setCreateAccountPulseKey,
    setIsSubmitting,
    tAuto,
    toast,
    validateAuthFields,
    vehicle,
  ]);

  const handlePersonalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submitSupabaseAuth();
  };

  const handleVehicleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void submitSupabaseAuth();
  };

  const handleAdvertiserSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      variant: 'destructive',
      title: tAuto('key_002904c4'),
      description: tAuto('key_dea165fb'),
    });
  };

  const handleLogoTap = () => {
    const newCount = logoTapCount + 1;
    setLogoTapCount(newCount);
    if (newCount >= 5) {
      setStep('admin');
      setLogoTapCount(0);
    }
  };

  const handleAdminSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      variant: 'destructive',
      title: tAuto('key_002904c4'),
      description: tAuto('key_91e1ce75'),
    });
  };

  return {
    submitSupabaseAuth,
    handlePersonalSubmit,
    handleVehicleSubmit,
    handleAdvertiserSubmit,
    handleLogoTap,
    handleAdminSubmit,
  };
}
