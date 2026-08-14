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
