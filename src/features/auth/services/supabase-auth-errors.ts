import type { AuthError } from '@supabase/supabase-js';

// Narrower than the "invalid credentials" branch inside mapSupabaseAuthError
// below — this excludes the otp/token-expired cases (those aren't "wrong
// phone or password", so they shouldn't nudge someone toward registering).
// Used to decide when a failed login should suggest creating a new account.
export function isInvalidPhoneOrPasswordError(error: unknown) {
  const authError = error as Partial<AuthError> & { message?: string; code?: string };
  const message = `${authError?.message || error || ''}`.toLowerCase();
  const code = `${authError?.code || ''}`.toLowerCase();

  const isInvalidCredentials =
    (code.includes('invalid_credentials') ||
    message.includes('invalid login') ||
    message.includes('invalid credentials')) &&
    !message.includes('role_mismatch');

  return isInvalidCredentials && !code.includes('otp') && !message.includes('token');
}

export function mapSupabaseAuthError(error: unknown) {
  // If error has an Arabic message from our backend/validations, return it directly!
  const candidateMsg = error instanceof Error
    ? error.message
    : (typeof error === 'object' && error !== null && 'message' in error)
      ? String((error as any).message)
      : typeof error === 'string'
        ? error
        : null;

  if (candidateMsg) {
    const rawMsg = candidateMsg.trim();
    if (
      rawMsg.includes('account_in_use') ||
      rawMsg.includes('قيد الاستخدام') ||
      rawMsg.includes('مسجل دخول حالياً') ||
      rawMsg.includes('active_session')
    ) {
      return 'الحساب مسجل دخول حالياً على جهاز أو متصفح آخر. لا يمكنك تسجيل الدخول حتى يتم تسجيل الخروج من الجهاز المفتوح أولاً.';
    }
    if (/[\u0600-\u06FF]/.test(rawMsg)) {
      if (!rawMsg.includes('duplicate key') && !rawMsg.includes('Database error') && !rawMsg.includes('syntax error')) {
        return rawMsg;
      }
    }
  }
  const authError = typeof error === 'object' && error !== null
    ? (error as Partial<AuthError> & { message?: string; code?: string; status?: number; details?: string; error_description?: string })
    : {};
  const name = `${(authError as { name?: string })?.name || ''}`.toLowerCase();
  const message = `${authError?.message || authError?.details || authError?.error_description || error || ''}`.toLowerCase();
  const code = `${authError?.code || ''}`.toLowerCase();
  const details = `${authError?.details || ''}`.toLowerCase();
  const fullText = `${code} ${message} ${details}`;

  if (
    fullText.includes('account_in_use') ||
    fullText.includes('قيد الاستخدام') ||
    fullText.includes('مسجل دخول حالياً') ||
    fullText.includes('active_session')
  ) {
    return 'الحساب مسجل دخول حالياً على جهاز أو متصفح آخر. لا يمكنك تسجيل الدخول حتى يتم تسجيل الخروج من الجهاز المفتوح أولاً.';
  }

  if (
    fullText.includes('unique_national_id_number') ||
    fullText.includes('national_id_number') ||
    fullText.includes('national_id') ||
    fullText.includes('nationalidnumber')
  ) {
    return 'رقم الهوية الوطنية مسجل بالفعل مسبقاً. يرجى التأكد من الرقم أو استخدام رقم آخر.';
  }

  if (fullText.includes('invalid_quad_name')) {
    return 'يرجى كتابة الاسم الرباعي كاملاً (الاسم، الأب، الجد، العائلة) بحروف صحيحة دون أرقام أو رموز.';
  }

  if (
    fullText.includes('unique_plate_number') ||
    fullText.includes('plate_number') ||
    fullText.includes('platenumber') ||
    (fullText.includes('plate') && (fullText.includes('unique') || fullText.includes('duplicate') || fullText.includes('exists')))
  ) {
    return 'رقم لوحة المركبة مسجل بالفعل مسبقاً لمركبة أخرى في النظام. يرجى التأكد من الرقم أو استخدام لوحة أخرى.';
  }

  if (
    fullText.includes('unique_email') ||
    fullText.includes('email_exists') ||
    fullText.includes('email_already_exists') ||
    (fullText.includes('email') && (fullText.includes('registered') || fullText.includes('already exists') || fullText.includes('مسجل بالفعل') || fullText.includes('taken')))
  ) {
    return 'البريد الإلكتروني مسجل بالفعل مسبقاً لحساب آخر. يرجى استخدام بريد إلكتروني آخر.';
  }

  if (fullText.includes('missing_email')) {
    return 'البريد الإلكتروني مطلوب لإنشاء حساب الكابتن.';
  }

  if (
    fullText.includes('unique_license_number') ||
    fullText.includes('license_number') ||
    fullText.includes('licensenumber') ||
    (fullText.includes('license') && (fullText.includes('unique') || fullText.includes('duplicate') || fullText.includes('exists')))
  ) {
    return 'رقم رخصة القيادة مسجل بالفعل مسبقاً. يرجى التأكد من الرقم أو استخدام رقم آخر.';
  }

  if (
    code.includes('phone_exists') ||
    code.includes('user_already_exists') ||
    fullText.includes('registered') ||
    fullText.includes('already registered') ||
    fullText.includes('already exists') ||
    fullText.includes('user_already_exists') ||
    fullText.includes('phone_exists')
  ) {
    return 'رقم الهاتف مسجل بالفعل مسبقاً. يرجى تسجيل الدخول بدلاً من إنشاء حساب جديد.';
  }

  if (
    code.includes('invalid_credentials') ||
    code.includes('otp_expired') ||
    code.includes('otp_disabled') ||
    fullText.includes('invalid login') ||
    fullText.includes('invalid credentials') ||
    fullText.includes('token has expired') ||
    fullText.includes('invalid token') ||
    fullText.includes('authentication')
  ) {
    return code.includes('otp') || fullText.includes('token')
      ? 'رمز التحقق غير صحيح أو انتهت صلاحيته.'
      : 'رقم الهاتف أو كلمة المرور غير صحيحة.';
  }

  if (
    code.includes('email_not_confirmed') ||
    fullText.includes('email_not_confirmed') ||
    fullText.includes('email not confirmed')
  ) {
    return 'يرجى تأكيد حسابك عبر الرابط المرسل إلى بريدك الإلكتروني أولاً لتفعيل الحساب.';
  }

  if (
    code.includes('phone_provider_disabled') ||
    fullText.includes('phone provider') ||
    fullText.includes('phone signups are disabled')
  ) {
    return 'تسجيل الهاتف غير مفعّل حالياً في إعدادات الخدمة.';
  }

  if (code.includes('weak_password') || fullText.includes('weak password') || fullText.includes('password')) {
    return 'كلمة المرور ضعيفة. يجب ألا تقل عن 6 أحرف.';
  }

  if (
    name.includes('authretryablefetcherror') ||
    code.includes('request_timeout') ||
    code.includes('hook_timeout') ||
    code.includes('hook_timeout_after_retry') ||
    authError?.status === 504 ||
    authError?.status === 502 ||
    fullText.includes('network') ||
    fullText.includes('timeout') ||
    fullText.includes('failed to fetch') ||
    fullText.includes('gateway')
  ) {
    return 'تعذر الاتصال بالخدمة. تحقق من الإنترنت وحاول مرة أخرى.';
  }

  if (
    code.includes('unexpected_failure') ||
    code.includes('hook_payload_invalid_content_type') ||
    code.includes('hook_payload_over_size_limit') ||
    fullText.includes('database error saving new user') ||
    fullText.includes('error saving new user') ||
    fullText.includes('database error') ||
    fullText.includes('trigger') ||
    authError?.status === 500
  ) {
    if (
      fullText.includes('foreign key') ||
      fullText.includes('governorate') ||
      fullText.includes('district') ||
      fullText.includes('country')
    ) {
      return 'تعذر إنشاء الحساب لأن الدولة أو المحافظة أو المنطقة غير موجودة. حدّث الاختيارات ثم حاول مرة أخرى.';
    }

    if (code === '23505' || fullText.includes('duplicate key')) {
      if (fullText.includes('email') || fullText.includes('unique_profiles_email')) {
        return 'البريد الإلكتروني مسجل بالفعل مسبقاً لحساب آخر. يرجى استخدام بريد إلكتروني آخر.';
      }
      if (fullText.includes('national_id') || fullText.includes('unique_national_id_number')) {
        return 'رقم الهوية الوطنية مسجل بالفعل مسبقاً. يرجى التأكد من الرقم أو استخدام رقم آخر.';
      }
      if (fullText.includes('license') || fullText.includes('unique_license_number')) {
        return 'رقم رخصة القيادة مسجل بالفعل مسبقاً. يرجى التأكد من الرقم أو استخدام رقم آخر.';
      }
      if (fullText.includes('plate') || fullText.includes('unique_plate_number')) {
        return 'رقم لوحة المركبة مسجل بالفعل مسبقاً لمركبة أخرى في النظام. يرجى التأكد من الرقم أو استخدام لوحة أخرى.';
      }
      return 'بعض البيانات المدخلة (الهوية أو الرخصة أو اللوحة أو البريد الإلكتروني أو الهاتف) مسجلة بالفعل مسبقاً.';
    }

    return 'تعذر إنشاء الحساب من قاعدة البيانات. راجع البيانات وحاول مرة أخرى.';
  }

  if (code.includes('validation_failed') || fullText.includes('invalid phone')) {
    return 'رقم الهاتف غير صحيح. اكتبه مع رمز الدولة مثل +962 أو +20.';
  }

  if (fullText.startsWith('role_mismatch:') || message.startsWith('role_mismatch:')) {
    const parts = (message.startsWith('role_mismatch:') ? message : fullText).split(':');
    const actualRole = parts[1]?.toUpperCase() || '';
    if (actualRole === 'CAPTAIN') {
      return 'هذا الحساب مسجل كـ كابتن (سائق). يرجى تسجيل الدخول من بوابة الكباتن.';
    } else if (actualRole === 'RIDER') {
      return 'رقم الهاتف أو كلمة المرور غير صحيحة.';
    }
    return 'رقم الهاتف أو كلمة المرور غير صحيحة.';
  }

  if (error instanceof Error && error.message && /[\u0600-\u06FF]/.test(error.message)) return error.message;

  return 'تعذر إكمال العملية. يرجى المحاولة مرة أخرى.';
}
