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
  isInvalidPhoneOrPasswordError,
  mapSupabaseAuthError,
  normalizeInternationalPhone,
  validatePhoneAndPassword,
  type RiderAuthMetadata,
  type RiderSupabaseSignInInput,
  type RiderSupabaseSignUpInput,
  type CaptainProfileMetadata,
} from './supabase-auth-logic';

const AUTH_TOKEN_STORAGE_KEY = 'radar_supabase_access_token';

export async function signUpRiderWithPhone(input: RiderSupabaseSignUpInput) {
  const validation = validatePhoneAndPassword(input.phone, input.password);
  if (!validation.ok) throw new Error(validation.message);
  const metadata = buildRiderSignUpMetadata(input);

  setSupabaseRememberSession(input.rememberMe ?? shouldRememberSupabaseSession());

  const response = await fetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: validation.phone,
      password: input.password,
      fullName: input.fullName,
      email: input.email?.trim().toLowerCase(),
      role: input.role || 'RIDER',
      countryId: input.countryId,
      governorateId: input.governorateId,
      districtId: input.districtId,
      captainProfile: input.captainProfile || null,
    }),
  });

  let resData: any = null;
  try {
    resData = await response.json();
  } catch {
    throw new Error('حدث خطأ في استجابة الخادم أثناء إنشاء الحساب. حاول مرة أخرى.');
  }
  if (!response.ok || !resData?.success) {
    throw new Error(resData?.error || 'فشل إنشاء الحساب. حاول مرة أخرى.');
  }

  return {
    user: {
      id: resData.userId,
      email: resData.email,
      phone: validation.phone,
      user_metadata: metadata as unknown as Record<string, unknown>,
      email_confirmed_at: null,
      identities: [{ id: resData.userId }],
    },
    session: null,
    needsEmailConfirmation: true,
    email: resData.email,
    message: resData.message,
  };
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

export async function checkAccountInUseByPhone(_supabase: any, _phone: string, _currentDeviceId: string): Promise<boolean> {
  // Always return false: Login is never blocked beforehand. Active session takeover is handled gracefully post-login.
  return false;
}

export async function signInRiderWithPhone(input: RiderSupabaseSignInInput) {
  const validation = validatePhoneAndPassword(input.phone, input.password);
  if (!validation.ok) throw new Error(validation.message);

  const { supabase } = await import('@/lib/supabase-client');

  let currentDeviceId = '';
  if (typeof window !== 'undefined') {
    currentDeviceId = window.localStorage.getItem('radar_device_id') || '';
    if (!currentDeviceId) {
      currentDeviceId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString();
      window.localStorage.setItem('radar_device_id', currentDeviceId);
    }
  }

  setSupabaseRememberSession(input.rememberMe ?? shouldRememberSupabaseSession());

  const { data, error } = await supabase.auth.signInWithPassword({
    phone: validation.phone,
    password: input.password,
  });

  if (error) throw error;

  // Grandfathering: Accounts created before the email verification rollout (or legacy phone-only accounts)
  // are permanently exempt from email confirmation blocking to prevent existing users from being locked out.
  const userEmail = data.user?.email || (data.user?.user_metadata?.email as string | undefined);
  const userCreatedAtMs = data.user?.created_at ? new Date(data.user.created_at).getTime() : 0;
  // Cutoff timestamp for email verification rollout: Oct 23, 2026 15:30:00 UTC (1792769400000 ms)
  const isPreFeatureAccount = userCreatedAtMs > 0 && userCreatedAtMs < 1792769400000;
  const isPhoneOnlyAccount = !userEmail || !userEmail.includes('@');
  const requiresEmailConfirmation = !isPreFeatureAccount && !isPhoneOnlyAccount;

  if (data.user && requiresEmailConfirmation && !data.user.email_confirmed_at) {
    await supabase.auth.signOut();
    clearSupabaseSessionCache();
    const unconfirmedErr = new Error('email_not_confirmed');
    (unconfirmedErr as any).email = userEmail;
    (unconfirmedErr as any).phone = validation.phone;
    throw unconfirmedErr;
  }

  if (input.expectedRole && data.user) {
    const rawRole = (data.user.user_metadata?.role as string) || 'RIDER';
    const userRole = rawRole.toUpperCase();
    if (userRole !== input.expectedRole) {
      await supabase.auth.signOut();
      clearSupabaseSessionCache();
      throw new Error(`role_mismatch:${userRole}:${input.expectedRole}`);
    }
  }

  await syncCaptainProfileFromAuthUser(data.user);
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


export async function verifyEmailOtpCode(params: {
  code: string;
  email?: string;
  phone?: string;
  userId?: string;
}): Promise<{ success: boolean; error?: string; message?: string }> {
  const response = await fetch('/api/auth/verify-code', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });

  let resData: any = null;
  try {
    resData = await response.json();
  } catch {
    throw new Error('حدث خطأ في استجابة الخادم أثناء التحقق من الكود.');
  }

  if (!response.ok || !resData?.success) {
    throw new Error(resData?.error || 'كود التفعيل غير صحيح أو انتهت صلاحيته.');
  }

  return resData;
}
