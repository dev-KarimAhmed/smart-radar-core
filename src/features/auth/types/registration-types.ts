import type React from 'react';
import type { AffiliationType } from '@/core/types';
import type { SupabaseCountryRow } from '../hooks/use-supabase-countries';

export type RegistrationStep = 'role' | 'personal' | 'affiliation' | 'vehicle' | 'admin' | 'advertiser' | 'ProfessionalStep';
export type RegistrationRole = 'rider' | 'driver' | 'advertiser' | 'delegate' | 'admin' | null;
export type AuthMode = 'register' | 'login';
export type LocationOption = { id: string; label: string; labelEn: string; value: string };

export interface PersonalRegistrationState {
  name: string;
  phone: string;
  email: string;
  country: string;
  gov: string;
  district: string;
  verificationDoc: string;
}

export interface RegistrationContextType {
  step: RegistrationStep;
  setStep: (step: RegistrationStep) => void;
  role: RegistrationRole;
  setRole: (role: RegistrationRole) => void;
  authMode: AuthMode;
  setAuthMode: (mode: AuthMode) => void;
  lang: 'ar' | 'en';
  setLang: (lang: 'ar' | 'en') => void;
  personal: PersonalRegistrationState;
  setPersonal: (personal: PersonalRegistrationState | ((current: PersonalRegistrationState) => PersonalRegistrationState)) => void;
  authPassword: string;
  setAuthPassword: (password: string) => void;
  rememberMe: boolean;
  setRememberMe: (remember: boolean) => void;
  advertiserProfile: { companyName: string; commercialRegister: string; adLicense: string; businessType: string };
  setAdvertiserProfile: (profile: any) => void;
  affiliation: AffiliationType | null;
  setAffiliation: (affiliation: any) => void;
  vehicle: any;
  setVehicle: (vehicle: any) => void;
  isSubmitting: boolean;
  locationDataLoading: boolean;
  countries: LocationOption[];
  selectedCountry: SupabaseCountryRow | null;
  phonePlaceholder: string;
  phoneValidationHint: string;
  governorates: LocationOption[];
  districts: LocationOption[];
  canUseDevMockData: boolean;
  fillRandomRegistrationData: () => void;
  fillCaptainRegistrationData: () => void;
  handlePersonalSubmit: (e: React.FormEvent) => void;
  handleVehicleSubmit: (e: React.FormEvent) => void;
  handleAdvertiserSubmit: (e: React.FormEvent) => void;
  adminCreds: any;
  setAdminCreds: (creds: any) => void;
  handleAdminSubmit: (e: React.FormEvent) => void;
  handleLogoTap: () => void;
  createAccountPulseKey: number;
  awaitingConfirmationEmail: string | null;
  setAwaitingConfirmationEmail: (email: string | null) => void;
  resendConfirmationEmail: (overrideEmail?: string) => Promise<boolean>;
  verifyEmailCode: (code: string) => Promise<boolean>;
}
