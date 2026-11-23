import {
  buildRiderSignUpMetadata,
  buildUserFromSupabaseAuth,
  validatePhoneAndPassword,
  type RiderSupabaseSignInInput,
  type RiderSupabaseSignUpInput,
} from './supabase-auth-logic';
import {
  setSupabaseRememberSession,
  shouldRememberSupabaseSession,
} from './supabase-auth-storage';
import {
  cacheSupabaseSession,
  clearSupabaseSessionCache,
  checkAccountInUse,
  checkAccountInUseByPhone,
  broadcastSessionTakeover,
  verifyEmailOtpCode,
  AUTH_TOKEN_STORAGE_KEY,
} from './supabase-auth-session';
import {
  syncCaptainProfileFromAuthUser,
  uploadCaptainDocument,
  type CaptainSignUpInput,
} from './supabase-captain-sync';

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

export {
  cacheSupabaseSession,
  clearSupabaseSessionCache,
  checkAccountInUse,
  checkAccountInUseByPhone,
  verifyEmailOtpCode,
  AUTH_TOKEN_STORAGE_KEY,
} from './supabase-auth-session';

export {
  syncCaptainProfileFromAuthUser,
  uploadCaptainDocument,
  type CaptainSignUpInput,
} from './supabase-captain-sync';

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
      lang: input.lang || (typeof window !== 'undefined' ? (window.localStorage.getItem('radar_dashboard_language') === 'en' ? 'en' : 'ar') : 'ar'),
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

export async function signInRiderWithPhone(input: RiderSupabaseSignInInput) {
  const validation = validatePhoneAndPassword(input.phone, input.password);
  if (!validation.ok) throw new Error(validation.message);

  setSupabaseRememberSession(input.rememberMe ?? shouldRememberSupabaseSession());

  const { supabase } = await import('@/lib/supabase-client');

  let currentDeviceId = '';
  if (typeof window !== 'undefined') {
    try {
      currentDeviceId = window.localStorage.getItem('radar_device_id') || '';
      if (!currentDeviceId) {
        currentDeviceId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString();
        window.localStorage.setItem('radar_device_id', currentDeviceId);
      }
    } catch {
      currentDeviceId = 'dev-' + Math.random().toString(36).slice(2);
    }
  }

  // 1. Strict single-session check: reject login if account is already active on another device/browser
  if (!input.forceTakeover && currentDeviceId && typeof window !== 'undefined') {
    const isPhoneActive = await checkAccountInUse(supabase, validation.phone, currentDeviceId);
    const isEmailActive = input.email ? await checkAccountInUse(supabase, input.email, currentDeviceId) : false;

    if (isPhoneActive || isEmailActive) {
      const isAr = typeof window !== 'undefined'
        ? (window.localStorage.getItem('radar_dashboard_language') !== 'en')
        : true;
      const errorMsg = isAr
        ? 'هذا الحساب مسجل دخول حالياً على جهاز أو متصفح آخر. لا يمكنك تسجيل الدخول حتى يتم تسجيل الخروج من الجهاز المفتوح أولاً.'
        : 'This account is currently active on another device or browser. You cannot log in until it is logged out from the other device first.';
      const err = new Error(errorMsg);
      (err as any).code = 'account_in_use';
      throw err;
    }
  }

  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      phone: validation.phone,
      password: input.password,
      expectedRole: input.expectedRole,
      email: input.email,
      deviceId: currentDeviceId,
      forceTakeover: Boolean(input.forceTakeover),
    }),
  });

  let resData: any = null;
  try {
    resData = await response.json();
  } catch {
    throw new Error('حدث خطأ في استجابة الخادم أثناء تسجيل الدخول. حاول مرة أخرى.');
  }

  if (!response.ok || !resData?.success || !resData?.session?.access_token || !resData?.session?.refresh_token) {
    if (resData?.code === 'account_in_use' || response.status === 409) {
      const isAr = typeof window !== 'undefined'
        ? (window.localStorage.getItem('radar_dashboard_language') !== 'en')
        : true;
      const errorMsg = resData?.error || (isAr
        ? 'هذا الحساب مسجل دخول حالياً على جهاز أو متصفح آخر. لا يمكنك تسجيل الدخول حتى يتم تسجيل الخروج من الجهاز المفتوح أولاً.'
        : 'This account is currently active on another device or browser. You cannot log in until it is logged out from the other device first.');
      const err = new Error(errorMsg);
      (err as any).code = 'account_in_use';
      throw err;
    }

    if (resData?.code === 'email_not_confirmed' || resData?.error === 'email_not_confirmed') {
      const unconfirmedErr = new Error('email_not_confirmed');
      (unconfirmedErr as any).email = resData?.email;
      (unconfirmedErr as any).phone = resData?.phone || validation.phone;
      throw unconfirmedErr;
    }

    const err = new Error(resData?.error || 'رقم الهاتف أو كلمة المرور غير صحيحة.');
    if (resData?.code) {
      (err as any).code = resData.code;
    }
    throw err;
  }

  const { data, error: sessionErr } = await supabase.auth.setSession({
    access_token: resData.session.access_token,
    refresh_token: resData.session.refresh_token,
  });

  if (sessionErr) throw sessionErr;

  const authenticatedUser = data.user || resData.user;
  await syncCaptainProfileFromAuthUser(authenticatedUser);
  cacheSupabaseSession(data.session);

  // 2. Broadcast takeover to terminate any stale or reconnected foreign session
  if (currentDeviceId && authenticatedUser) {
    broadcastSessionTakeover(
      supabase,
      authenticatedUser.id,
      validation.phone,
      input.email || authenticatedUser.email,
      currentDeviceId,
    );
  }

  // Sync sovereign user cache so route guards (/rider, /captain) hydrate instantly on mount without flicker
  if (typeof window !== 'undefined' && authenticatedUser) {
    const sovereignUser = buildUserFromSupabaseAuth(authenticatedUser);
    if (sovereignUser) {
      const storage = shouldRememberSupabaseSession() ? window.localStorage : window.sessionStorage;
      try {
        storage.setItem('radar_sovereign_mock_user', JSON.stringify(sovereignUser));
      } catch {}
    }
  }

  return {
    user: authenticatedUser,
    session: data.session,
  };
}
