import {
  isInvalidPhoneOrPasswordError,
  mapSupabaseAuthError,
} from '../../services/supabase-auth';
import type { RegistrationRole } from '../../utils/registration-helpers';
import type { AuthMode, PersonalRegistrationState } from '../../types/registration-context-types';

interface HandleAuthSubmitErrorParams {
  error: unknown;
  authMode: AuthMode;
  role: RegistrationRole;
  personal: PersonalRegistrationState;
  lang: 'ar' | 'en';
  tAuto: (key: string) => string;
  toast: (opts: any) => void;
  setAwaitingConfirmationEmail: (email: string | null) => void;
  setCreateAccountPulseKey: React.Dispatch<React.SetStateAction<number>>;
}

export function handleAuthSubmitError({
  error,
  authMode,
  role,
  personal,
  lang,
  tAuto,
  toast,
  setAwaitingConfirmationEmail,
  setCreateAccountPulseKey,
}: HandleAuthSubmitErrorParams): void {
  if (process.env.NODE_ENV !== 'production') {
    const authError = error as { name?: string; code?: string; status?: number; message?: string };
    console.warn('[Supabase Auth]', {
      mode: authMode,
      role,
      name: authError?.name,
      code: authError?.code,
      status: authError?.status,
      message: authError?.message,
    });
  }

  const isAccountInUse = `${(error as any)?.message || ''}`.includes('account_in_use') || `${(error as any)?.message || ''}`.includes('قيد الاستخدام');
  if (isAccountInUse) {
    toast({
      variant: 'destructive',
      title: lang === 'ar' ? 'الحساب قيد الاستخدام حالياً' : 'Account Already In Use',
      description: lang === 'ar'
        ? 'هذا الحساب مفتوح حالياً على جهاز آخر. لا يمكنك تسجيل الدخول حتى يتم تسجيل الخروج من الجهاز الآخر.'
        : 'This account is currently active on another device. You cannot log in until it is logged out from the other device.',
      duration: 8000,
    });
    return;
  }

  const isUnconfirmed = (error as any)?.message === 'email_not_confirmed' || `${(error as any)?.message || ''}`.includes('email_not_confirmed');
  if (isUnconfirmed) {
    setAwaitingConfirmationEmail(personal.email?.trim() || (error as any)?.email || null);
    toast({
      variant: 'destructive',
      title: lang === 'ar' ? 'الحساب قيد الانتظار' : 'Account pending verification',
      description: lang === 'ar'
        ? 'يرجى تأكيد حسابك عبر الرابط المرسل إلى بريدك الإلكتروني أولاً لتفعيل الحساب.'
        : 'Please confirm your email using the link sent to your inbox before logging in.',
    });
    return;
  }

  const wrongCredentials = authMode === 'login' && isInvalidPhoneOrPasswordError(error);
  if (wrongCredentials) setCreateAccountPulseKey((key) => key + 1);

  toast({
    variant: 'destructive',
    title: authMode === 'register' ? tAuto('key_71272649') : tAuto('key_64bc4896'),
    description: wrongCredentials
      ? `${mapSupabaseAuthError(error)} يمكنك إنشاء حساب جديد إذا لم يكن لديك حساب بعد.`
      : mapSupabaseAuthError(error),
  });
}
