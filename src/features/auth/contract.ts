export { AuthProvider, useAuth } from '@/hooks/use-auth';
export {
  useSupabaseCountries,
  getCountryLabel,
  getCountryDialCode,
  getCountryIsoCode,
  type SupabaseCountryRow,
} from './hooks/use-supabase-countries';
export {
  useSupabaseGovernorates,
  useSupabaseDistricts,
  getLocationLabel as getGovernorateOrDistrictLabel,
  type SupabaseGovernorateRow,
  type SupabaseDistrictRow,
} from './hooks/use-supabase-locations';
export { useDetectedCountryCode } from './hooks/use-detected-country-code';
export {
  mapSupabaseAuthError,
  signUpCaptainWithPhone,
  type CaptainProfileMetadata,
} from './services/supabase-auth';

// Password recovery. The admin queue screen lives in features/admin, so these have to be
// public surface rather than a direct reach into features/auth internals.
export {
  requestPasswordRecovery,
  issuePasswordResetToken,
  listPasswordResetRequests,
  rejectPasswordResetRequest,
  setRecoveryEmail,
  type PasswordResetRequestRow,
} from './services/password-recovery';
export { RecoveryEmailField } from './components/recovery-email-field';
export { RecoveryEmailBanner } from './components/recovery-email-banner';
