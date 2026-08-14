import type { Session } from '@supabase/supabase-js';
import {
  buildRiderSignUpMetadata,
  validatePhoneAndPassword,
  type CaptainProfileMetadata,
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
  type CaptainProfileMetadata,
} from './supabase-auth-logic';

const AUTH_TOKEN_STORAGE_KEY = 'radar_supabase_access_token';
const AUTH_SESSION_CREATED_EVENT = 'radar-auth-session-created';

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
  notifyAuthSessionCreated();
  return data;
}

export interface CaptainSignUpInput extends Omit<RiderSupabaseSignUpInput, 'role' | 'captainProfile'> {
  captainProfile: CaptainProfileMetadata;
  identityFile?: File | null;
  drivingLicenseFile?: File | null;
}

export async function signUpCaptainWithPhone(input: CaptainSignUpInput) {
  const data = await signUpRiderWithPhone({
    ...input,
    role: 'CAPTAIN',
  });

  // Phone confirmation can return a user without a session. Defer the
  // protected profile upsert until the first successful sign-in in that case.
  if (data.session) {
    await syncCaptainProfileFromAuthUser(data.user, input.captainProfile, {
      identityFile: input.identityFile,
      drivingLicenseFile: input.drivingLicenseFile,
    });
  }
  return data;
}

async function uploadCaptainDocument(userId: string, file: File, kind: 'identity' | 'driving-license') {
  const { supabase } = await import('@/lib/supabase-client');
  const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'bin';
  const token = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : `${Date.now()}`;
  const path = `${userId}/${kind}-${token}.${extension}`;
  const { error } = await supabase.storage.from('captain-documents').upload(path, file, {
    upsert: true,
    contentType: file.type || undefined,
  });

  if (error) throw error;
  return path;
}

async function syncCaptainProfileFromAuthUser(
  authUser: { id: string; user_metadata?: Record<string, unknown> } | null,
  explicitProfile?: CaptainProfileMetadata,
  documents?: { identityFile?: File | null; drivingLicenseFile?: File | null },
) {
  if (!authUser?.id) return;

  const metadata = authUser.user_metadata || {};
  const role = String(metadata.role || '').toUpperCase();
  const metadataProfile = metadata.captain_profile;
  const captainProfile = explicitProfile || (
    metadataProfile && typeof metadataProfile === 'object'
      ? metadataProfile as CaptainProfileMetadata
      : undefined
  );

  if (role !== 'CAPTAIN' || !captainProfile) return;

  const { supabase } = await import('@/lib/supabase-client');
  const identityPath = documents?.identityFile
    ? await uploadCaptainDocument(authUser.id, documents.identityFile, 'identity')
    : captainProfile.identity_url || null;
  const drivingLicensePath = documents?.drivingLicenseFile
    ? await uploadCaptainDocument(authUser.id, documents.drivingLicenseFile, 'driving-license')
    : captainProfile.driving_license_url || null;
  const documentFields = documents
    ? { identity_url: identityPath, driving_license_url: drivingLicensePath }
    : {};
  const { error } = await supabase.from('captain_profiles').upsert(
    {
      id: authUser.id,
      ...captainProfile,
      ...documentFields,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  );

  if (error) throw error;
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
  await syncCaptainProfileFromAuthUser(data.user);
  cacheSupabaseSession(data.session);
  notifyAuthSessionCreated();
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

function notifyAuthSessionCreated() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(AUTH_SESSION_CREATED_EVENT));
  }
}

export { AUTH_SESSION_CREATED_EVENT };
