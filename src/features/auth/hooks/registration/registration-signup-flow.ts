import { supabase } from '@/lib/supabase-client';
import { getAuthRedirectUrl } from '@/lib/utils';
import {
  buildRiderSignUpMetadata,
  signInRiderWithPhone,
  signUpRiderWithPhone,
} from '../../services/supabase-auth';
import {
  getPendingCaptainReferral,
  clearPendingCaptainReferral,
  removeReferralParamFromUrl,
} from '@/features/referral/services/captain-referral';
import { toSupabaseAuthRole, type RegistrationRole } from '../../utils/registration-helpers';
import { recordLegalDeclaration } from '@/features/account/services/legal-log-service';
import type { AffiliationType } from '@/core/types';
import type { AuthMode, PersonalRegistrationState } from '../../types/registration-context-types';
import { claimPendingRiderReferralIfNeeded } from './registration-referral-helper';
import { createCaptainProfileAndWelcomeCredit } from './registration-captain-signup-service';

export interface ExecuteRegistrationSignUpParams {
  normalizedPhone: { phone: string };
  authPassword: string;
  role: RegistrationRole;
  personal: PersonalRegistrationState;
  countryId: number;
  governorateId: number;
  districtId: number;
  rememberMe: boolean;
  lang: 'ar' | 'en';
  affiliation: AffiliationType | null;
  vehicle: any;
  registeredAuthRef: React.MutableRefObject<{
    phone: string;
    password: string;
    role: RegistrationRole;
    email?: string;
  } | null>;
  setAwaitingConfirmationEmail: (email: string | null) => void;
  setAuthMode: (mode: AuthMode) => void;
  router: { replace: (url: string) => void };
  toast: (opts: any) => void;
  tAuto: (key: string) => string;
}

export async function executeRegistrationSignUp({
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
}: ExecuteRegistrationSignUpParams): Promise<void> {
  const queryRef = typeof window !== 'undefined'
    ? new URLSearchParams(window.location.search).get('ref') ||
      new URLSearchParams(window.location.search).get('captain')
    : null;
  const pendingRef = (getPendingCaptainReferral() || queryRef || '').trim();

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
    lang: (lang === 'en' ? 'en' : 'ar') as 'ar' | 'en',
  };

  if (process.env.NODE_ENV !== 'production') {
    console.info('[Supabase Auth Payload]', {
      mode: 'register',
      data: buildRiderSignUpMetadata(signUpInput),
    });
  }

  const regAuthPayload = {
    phone: normalizedPhone.phone,
    password: authPassword,
    role,
    email: personal.email?.trim() || undefined,
  };
  registeredAuthRef.current = regAuthPayload;
  if (typeof window !== 'undefined') {
    try {
      window.sessionStorage.setItem('radar_registered_auth', JSON.stringify(regAuthPayload));
    } catch {}
  }
  const signUpResult = await signUpRiderWithPhone(signUpInput);

  if ((signUpResult as any).needsEmailConfirmation) {
    setAwaitingConfirmationEmail((signUpResult as any).email || personal.email.trim());
    toast({
      title: lang === 'ar' ? 'تم إنشاء الحساب بنجاح! ✉️' : 'Account created successfully! ✉️',
      description: lang === 'ar'
        ? 'تم إرسال كود التفعيل المكون من 6 أرقام إلى بريدك الإلكتروني.'
        : 'A 6-digit verification code has been sent to your email.',
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
        if (signInRes.session) hasActiveSession = true;
      } catch (autoSignInErr) {
        if (process.env.NODE_ENV !== 'production') {
          console.warn('[Auto sign-in on registration]', autoSignInErr);
        }
      }
    }
    if (hasActiveSession) {
      await claimPendingRiderReferralIfNeeded(role, pendingRef);
    }
  }

  if (signUpResult.session && personal.email?.trim().includes('@')) {
    const { error: emailError } = await supabase.auth.updateUser(
      { email: personal.email.trim() },
      { emailRedirectTo: getAuthRedirectUrl('/reset-password') },
    );
    if (emailError && process.env.NODE_ENV !== 'production') {
      console.warn('[Registration Email Update Error]', emailError);
    }
  }

  if (role === 'driver' && signUpResult.user?.id) {
    await createCaptainProfileAndWelcomeCredit({
      userId: signUpResult.user.id,
      userSerialId: (signUpResult.user as any)?.serial_id,
      affiliation,
      vehicle,
      verificationDoc: personal.verificationDoc,
      sessionToken: (signUpResult as any)?.session?.access_token,
      lang,
      tAuto,
    });
  } else if (signUpResult.user?.id) {
    void recordLegalDeclaration({
      userId: signUpResult.user.id,
      userSerialId: (signUpResult.user as any)?.serial_id || ('U-' + signUpResult.user.id.slice(0, 6).toUpperCase()),
      actionType: 'NEW_ACCOUNT',
      actionLabel: lang === 'ar' ? 'تسجيل حساب جديد' : 'New Account Registration',
      isArabic: lang === 'ar',
    });
  }

  toast({
    title: tAuto('key_b4c64c00'),
    description: role === 'driver' ? tAuto('key_cd6703e6') : tAuto('key_7132f656'),
  });

  if (signUpResult.session) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('radar_pending_pwa_install_prompt', 'true');
      } catch {}
    }
    router.replace('/');
  } else {
    setAuthMode('login');
    router.replace('/');
  }
}
