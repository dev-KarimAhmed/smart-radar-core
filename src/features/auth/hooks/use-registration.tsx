'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { AffiliationType } from '@/core/types';
import { shouldRememberSupabaseSession } from '@/lib/supabase-client';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import type { RegistrationRole } from '../utils/registration-helpers';
import { useTranslations } from 'next-intl';

import type {
  RegistrationStep,
  AuthMode,
  LocationOption,
  PersonalRegistrationState,
  RegistrationContextType,
} from '../types/registration-context-types';
import { useRegistrationLocations } from './registration/use-registration-locations';
import { useRegistrationValidation } from './registration/use-registration-validation';
import {
  useRegistrationDevMocks,
  isStrictDevelopment,
} from './registration/use-registration-dev-mocks';
import { useRegistrationEmailVerification } from './registration/use-registration-email-verification';
import { useRegistrationSubmit } from './registration/use-registration-submit';

export type {
  RegistrationStep,
  AuthMode,
  LocationOption,
  PersonalRegistrationState,
  RegistrationContextType,
};

const RegistrationContext = createContext<RegistrationContextType | undefined>(undefined);

export function RegistrationProvider({ children }: { children: ReactNode }) {
  const tAuto = useTranslations('auto');
  const [step, setStep] = useState<RegistrationStep>('role');
  const [role, setRole] = useState<RegistrationRole>(null);
  const [authMode, setAuthMode] = useState<AuthMode>('register');
  const { language: lang, setLanguage: setLang } = useDashboardLanguage();
  const [personal, setPersonal] = useState<PersonalRegistrationState>({
    name: '',
    phone: '',
    email: '',
    country: '',
    gov: '',
    district: '',
    verificationDoc: '',
  });
  const [authPassword, setAuthPassword] = useState('');
  const [awaitingConfirmationEmail, setAwaitingConfirmationEmail] = useState<string | null>(null);
  const registeredAuthRef = useRef<{ phone: string; password: string; role: RegistrationRole; email?: string } | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [advertiserProfile, setAdvertiserProfile] = useState({ companyName: '', commercialRegister: '', adLicense: '', businessType: 'commercial' });
  const [affiliation, setAffiliation] = useState<AffiliationType | null>(null);
  const [vehicle, setVehicle] = useState({ year: '', plate: '', sideId: '', make: '', color: '', officeName: '', officePhone: '', companyName: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createAccountPulseKey, setCreateAccountPulseKey] = useState(0);
  const [adminCreds, setAdminCreds] = useState({ email: '', password: '' });
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    setRememberMe(shouldRememberSupabaseSession());
  }, []);

  const {
    selectedCountry,
    countryRows,
    governorateRows,
    districtRows,
    locationDataLoading,
    countries,
    governorates,
    districts,
    phonePlaceholder,
    phoneValidationHint,
  } = useRegistrationLocations({
    personal,
    setPersonal,
    authMode,
    lang,
    tAuto,
  });

  const { validateAuthFields, validateBeforeAccuracyConfirm } = useRegistrationValidation({
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
  });

  const { fillRandomRegistrationData, fillCaptainRegistrationData } = useRegistrationDevMocks({
    selectedCountry,
    countryRows,
    governorateRows,
    districtRows,
    personal,
    setPersonal,
    setAuthMode,
    setAuthPassword,
    setRole,
    setAffiliation,
    affiliation,
    setVehicle,
    tAuto,
  });

  const { verifyEmailCode, resendConfirmationEmail } = useRegistrationEmailVerification({
    registeredAuthRef,
    awaitingConfirmationEmail,
    setAwaitingConfirmationEmail,
    personal,
    selectedCountry,
    authPassword,
    role,
    rememberMe,
    lang,
    setAuthMode,
    tAuto,
  });

  const {
    handlePersonalSubmit,
    handleVehicleSubmit,
    handleAdvertiserSubmit,
    handleLogoTap,
    handleAdminSubmit,
  } = useRegistrationSubmit({
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
  });

  const value: RegistrationContextType = {
    step,
    setStep,
    role,
    setRole,
    authMode,
    setAuthMode,
    lang,
    setLang,
    personal,
    setPersonal,
    authPassword,
    setAuthPassword,
    rememberMe,
    setRememberMe,
    advertiserProfile,
    setAdvertiserProfile,
    affiliation,
    setAffiliation,
    vehicle,
    setVehicle,
    isSubmitting,
    locationDataLoading,
    countries,
    selectedCountry,
    phonePlaceholder,
    phoneValidationHint,
    governorates,
    districts,
    canUseDevMockData: isStrictDevelopment,
    fillRandomRegistrationData,
    fillCaptainRegistrationData,
    validateBeforeAccuracyConfirm,
    handlePersonalSubmit,
    handleVehicleSubmit,
    handleAdvertiserSubmit,
    adminCreds,
    setAdminCreds,
    handleAdminSubmit,
    handleLogoTap,
    createAccountPulseKey,
    awaitingConfirmationEmail,
    setAwaitingConfirmationEmail,
    resendConfirmationEmail,
    verifyEmailCode,
  };

  return <RegistrationContext.Provider value={value}>{children}</RegistrationContext.Provider>;
}

export function useRegistration() {
  const context = useContext(RegistrationContext);
  if (!context) {
    throw new Error('useRegistration must be used within a RegistrationProvider');
  }
  return context;
}
