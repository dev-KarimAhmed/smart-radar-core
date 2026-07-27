import type { Session } from '@supabase/supabase-js';
import {
  buildRiderSignUpMetadata,
  validatePhoneAndPassword,
  type RiderSupabaseSignInInput,
  type RiderSupabaseSignUpInput,
} from './supabase-auth-logic';
import {
  clearSupabaseAuthStorage,
  setSupabaseRememberSession,
  shouldRememberSupabaseSession,
} from './supabase-auth-storage';

export {
  buildRiderSignUpMetadata,
  buildUserFromSupabaseAuth,
  mapSupabaseAuthError,
  normalizeInternationalPhone,
  validatePhoneAndPassword,
  type RiderAuthMetadata,
  type RiderSupabaseSignInInput,
  type RiderSupabaseSignUpInput,
} from './supabase-auth-logic';

const AUTH_TOKEN_STORAGE_KEY = 'radar_supabase_access_token';

export async function signUpRiderWithPhone(input: RiderSupabaseSignUpInput) {
  const validation = validatePhoneAndPassword(input.phone, input.password);
  if (!validation.ok) throw new Error(validation.message);
  const metadata = buildRiderSignUpMetadata(input);

  setSupabaseRememberSession(input.rememberMe ?? shouldRememberSupabaseSession());

  const { supabase } = await import('@/lib/supabase-client');
  const { data, error } = await supabase.auth.signUp({
    phone: validation.phone,
    password: input.password,
    options: {
      data: metadata,
    },
  });

  if (error) throw error;
  cacheSupabaseSession(data.session);
  return data;
}

export async function signInRiderWithPhone(input: RiderSupabaseSignInInput) {
  const validation = validatePhoneAndPassword(input.phone, input.password);
  if (!validation.ok) throw new Error(validation.message);

  setSupabaseRememberSession(input.rememberMe ?? shouldRememberSupabaseSession());

  const { supabase } = await import('@/lib/supabase-client');
  const { data, error } = await supabase.auth.signInWithPassword({
    phone: validation.phone,
    password: input.password,
  });

  if (error) throw error;
  cacheSupabaseSession(data.session);
  return data;
}

export function cacheSupabaseSession(session: Session | null) {
  if (typeof window === 'undefined') return;

  if (session?.access_token) {
    const targetStorage = shouldRememberSupabaseSession() ? localStorage : sessionStorage;
    const otherStorage = shouldRememberSupabaseSession() ? sessionStorage : localStorage;
    targetStorage.setItem(AUTH_TOKEN_STORAGE_KEY, session.access_token);
    otherStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  } else {
    localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  }
}

export function clearSupabaseSessionCache() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  sessionStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  clearSupabaseAuthStorage();
}
