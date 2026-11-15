'use client';

import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { signInRiderWithPhone } from '../../services/supabase-auth';
import { normalizeInternationalPhone } from '../../services/supabase-auth-logic';
import {
  normalizePhoneForCountry,
  toSupabaseAuthRole,
  type RegistrationRole,
} from '../../utils/registration-helpers';
import type { SupabaseCountryRow } from '../use-supabase-countries';
import type { AuthMode, PersonalRegistrationState } from '../../types/registration-context-types';
import { claimPendingRiderReferralIfNeeded } from './registration-referral-helper';

interface RegisteredAuthRecord {
  phone: string;
  password: string;
  role: RegistrationRole;
  email?: string;
}

interface UseRegistrationEmailVerificationParams {
  registeredAuthRef: React.MutableRefObject<RegisteredAuthRecord | null>;
  awaitingConfirmationEmail: string | null;
  setAwaitingConfirmationEmail: (email: string | null) => void;
  personal: PersonalRegistrationState;
  selectedCountry: SupabaseCountryRow | null;
  authPassword: string;
  role: RegistrationRole;
  rememberMe: boolean;
  lang: 'ar' | 'en';
  setAuthMode: (mode: AuthMode) => void;
  tAuto: (key: string) => string;
}

export function useRegistrationEmailVerification({
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
}: UseRegistrationEmailVerificationParams) {
  const router = useRouter();
  const { toast } = useToast();

  const verifyEmailCode = async (code: string): Promise<boolean> => {
    const cleanCode = code.trim().replace(/\D/g, '');
    if (cleanCode.length !== 6) {
      toast({
        variant: 'destructive',
        title: lang === 'ar' ? 'رمز تفعيل غير مكتمل' : 'Incomplete code',
        description: lang === 'ar' ? 'يرجى إدخال كود التفعيل المكون من 6 أرقام.' : 'Please enter the 6-digit activation code.',
      });
      return false;
    }

    let savedAuth = registeredAuthRef.current;
    if ((!savedAuth?.phone || !savedAuth?.password) && typeof window !== 'undefined') {
      try {
        const cached = window.sessionStorage.getItem('radar_registered_auth');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed && typeof parsed === 'object') {
            savedAuth = parsed;
            registeredAuthRef.current = parsed;
          }
        }
      } catch {}
    }

    const emailToVerify = (awaitingConfirmationEmail || savedAuth?.email || personal.email)?.trim();
    const normalizedForVerify = normalizePhoneForCountry(personal.phone, selectedCountry, tAuto);
    const verifyPhone =
      savedAuth?.phone ||
      (normalizedForVerify.ok ? normalizedForVerify.phone : '') ||
      normalizeInternationalPhone(personal.phone);

    try {
      const res = await fetch('/api/auth/verify-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: cleanCode,
          email: emailToVerify,
          phone: verifyPhone,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'كود التفعيل غير صحيح أو انتهت صلاحيته.');
      }

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('radar_pending_pwa_install_prompt', 'true');
        } catch {}
      }

      const rawLoginPhone =
        savedAuth?.phone ||
        (normalizedForVerify.ok ? normalizedForVerify.phone : '') ||
        String(data.phone || '') ||
        personal.phone;

      let finalLoginPhone = normalizeInternationalPhone(rawLoginPhone);
      if (!finalLoginPhone.startsWith('+')) {
        const countryNormalized = normalizePhoneForCountry(rawLoginPhone, selectedCountry, tAuto);
        if (countryNormalized.ok) {
          finalLoginPhone = countryNormalized.phone;
        } else if (/^[1-9]\d{7,14}$/.test(finalLoginPhone)) {
          finalLoginPhone = '+' + finalLoginPhone;
        }
      }

      const loginPassword = savedAuth?.password || authPassword;
      const targetRole: RegistrationRole = savedAuth?.role || role || 'rider';
      const loginEmail = savedAuth?.email || emailToVerify || (data.email ? String(data.email) : undefined);

      if (finalLoginPhone && loginPassword) {
        try {
          await signInRiderWithPhone({
            phone: finalLoginPhone,
            password: loginPassword,
            rememberMe,
            expectedRole: toSupabaseAuthRole(targetRole),
            email: loginEmail,
          });
          await claimPendingRiderReferralIfNeeded(targetRole);

          if (typeof window !== 'undefined') {
            try {
              window.sessionStorage.removeItem('radar_registered_auth');
            } catch {}
          }

          toast({
            title: lang === 'ar' ? 'تم تفعيل الحساب والدخول بنجاح! 🎉' : 'Account activated & logged in! 🎉',
            description: lang === 'ar' ? 'أهلاً بك! يتم نقلك إلى التطبيق...' : 'Welcome! Redirecting...',
          });

          const directPath =
            targetRole === 'driver' ? '/captain' :
            targetRole === 'rider' ? '/rider' :
            targetRole === 'admin' ? '/admin' :
            targetRole === 'advertiser' ? '/advertiser/dashboard' :
            targetRole === 'delegate' ? '/delegate' :
            '/rider';

          setAwaitingConfirmationEmail(null);

          if (typeof window !== 'undefined') {
            window.location.replace(directPath);
            return true;
          }
          router.replace(directPath);
          return true;
        } catch (loginErr) {
          console.error('[Auto-login after OTP failed]', loginErr);
        }
      }

      toast({
        title: lang === 'ar' ? 'تم تفعيل الحساب بنجاح! 🎉' : 'Account activated successfully! 🎉',
        description: data.message || (lang === 'ar' ? 'تم تأكيد بريدك الإلكتروني بنجاح.' : 'Your email has been confirmed successfully.'),
      });
      setAwaitingConfirmationEmail(null);
      setAuthMode('login');
      return true;
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: lang === 'ar' ? 'فشل تأكيد الكود' : 'Verification failed',
        description: err?.message || (lang === 'ar' ? 'كود التفعيل غير صحيح أو انتهت صلاحيته.' : 'Invalid or expired code.'),
      });
      return false;
    }
  };

  const resendConfirmationEmail = async (overrideEmail?: string) => {
    const emailToResend = (overrideEmail || awaitingConfirmationEmail || personal.email)?.trim();
    if (!emailToResend) {
      toast({
        variant: 'destructive',
        title: lang === 'ar' ? 'البريد الإلكتروني غير متوفر' : 'Email missing',
        description: lang === 'ar' ? 'يرجى إدخال بريدك الإلكتروني لإعادة إرسال رسالة التأكيد.' : 'Please provide your email to resend confirmation.',
      });
      return false;
    }

    try {
      const res = await fetch('/api/auth/resend-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: emailToResend,
          phone: personal.phone,
          lang: (lang === 'en' ? 'en' : 'ar'),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'تعذر إعادة إرسال رسالة التأكيد.');
      }
      toast({
        title: lang === 'ar' ? 'تم الإرسال بنجاح ✉️' : 'Sent successfully ✉️',
        description: data.message || (lang === 'ar' ? 'تم إرسال رابط تأكيد جديد إلى بريدك الإلكتروني.' : 'New confirmation link sent to your email.'),
      });
      return true;
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: lang === 'ar' ? 'خطأ أثناء الإرسال' : 'Dispatch error',
        description: err?.message || (lang === 'ar' ? 'تعذر إعادة إرسال رسالة التأكيد. حاول مرة أخرى لاحقاً.' : 'Failed to resend confirmation email.'),
      });
      return false;
    }
  };

  return {
    verifyEmailCode,
    resendConfirmationEmail,
  };
}
