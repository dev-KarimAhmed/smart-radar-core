import { SOVEREIGN_ERR_DICTIONARY } from '../config/sovereign-errors';

export const SOVEREIGN_ERRORS = {
  AUTH_WEAK_PASSWORD: 'كلمة المرور ضعيفة. يجب أن تكون 6 أحرف على الأقل.',
  AUTH_EMAIL_ALREADY_IN_USE: 'هذا البريد الإلكتروني مستخدم من قبل.',
  AUTH_INVALID_EMAIL: 'البريد الإلكتروني غير صحيح.',
  AUTH_USER_NOT_FOUND: 'لم يتم العثور على حساب بهذه البيانات.',
  AUTH_WRONG_PASSWORD: 'كلمة المرور غير صحيحة.',
  AUTH_OPERATION_NOT_ALLOWED: 'تسجيل الدخول بهذه الطريقة غير مفعل حالياً.',
  AUTH_GENERIC_FAILURE: 'تعذر تسجيل الدخول. يرجى المحاولة مرة أخرى.',
  PHONE_OVERLAP_DETECTED: 'رقم الهاتف مسجل من قبل.',
  NAME_DISTRICT_OVERLAP_DETECTED: 'يوجد كابتن معلن بنفس الاسم في هذا اللواء. يرجى مراجعة البيانات.',
  AUTH_INTEGRITY_BREACH: 'بيانات الحساب غير مكتملة أو غير صحيحة.',
  SEAL_TIMEOUT: 'انتهت صلاحية الجلسة. يرجى المحاولة مرة أخرى.',
  SYBIL_ATTACK_DETECTED: 'لا يمكن استخدام نفس الجهاز لأكثر من نوع حساب مختلف.',
  SYS_PERMISSION_DENIED: 'ليس لديك صلاحية لتنفيذ هذه العملية.',

  RADAR_OFFLINE: 'الخدمة غير متاحة حالياً. يرجى تفعيل الموقع والمحاولة مرة أخرى.',
  PROTOCOL_9_LOCKED: 'هذا الحساب قيد المراجعة حالياً.',
  RADAR_001: 'يرجى تفعيل الموقع لتحديد المسار بدقة.',
  TRIP_NOT_FOUND: 'الرحلة المطلوبة غير متاحة.',
  OPS_001: 'يرجى تحديد الوجهة قبل المتابعة.',

  PRICE_DUMPING_ALERT: 'السعر أقل من الحد المسموح. يرجى تعديل السعر.',
  FEEDBACK_001: 'لا يمكن تعديل هذه البيانات الآن.',
  COURT_001: 'النظام مغلق مؤقتاً للمراجعة.',

  SYS_002: 'تعذر حفظ البيانات. يرجى المحاولة مرة أخرى.',
  SYS_COMPONENT_CRASH: 'حدث خطأ في جزء من التطبيق. يرجى تحديث الصفحة.',
  SYS_UNKNOWN: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
} as const;

export const SOVEREIGN_ERRORS_EN: Record<keyof typeof SOVEREIGN_ERRORS, string> = {
  AUTH_WEAK_PASSWORD: 'Weak password. It must be at least 6 characters.',
  AUTH_EMAIL_ALREADY_IN_USE: 'This email address is already in use.',
  AUTH_INVALID_EMAIL: 'Invalid email address.',
  AUTH_USER_NOT_FOUND: 'No account found with these credentials.',
  AUTH_WRONG_PASSWORD: 'Incorrect password.',
  AUTH_OPERATION_NOT_ALLOWED: 'Signing in with this method is currently disabled.',
  AUTH_GENERIC_FAILURE: 'Could not sign in. Please try again.',
  PHONE_OVERLAP_DETECTED: 'This phone number is already registered.',
  NAME_DISTRICT_OVERLAP_DETECTED: 'A captain with the same name is already registered in this district. Please review your details.',
  AUTH_INTEGRITY_BREACH: 'Account details are incomplete or invalid.',
  SEAL_TIMEOUT: 'Your session has expired. Please try again.',
  SYBIL_ATTACK_DETECTED: 'The same device cannot be used for more than one account type.',
  SYS_PERMISSION_DENIED: 'You do not have permission to perform this action.',

  RADAR_OFFLINE: 'Service is currently unavailable. Please enable location and try again.',
  PROTOCOL_9_LOCKED: 'This account is currently under review.',
  RADAR_001: 'Please enable location services to determine the route accurately.',
  TRIP_NOT_FOUND: 'The requested trip is not available.',
  OPS_001: 'Please select a destination before continuing.',

  PRICE_DUMPING_ALERT: 'The price is below the allowed minimum. Please adjust the price.',
  FEEDBACK_001: 'These details cannot be modified right now.',
  COURT_001: 'The system is temporarily locked for review.',

  SYS_002: 'Failed to save data. Please try again.',
  SYS_COMPONENT_CRASH: 'An error occurred in part of the app. Please refresh the page.',
  SYS_UNKNOWN: 'An unexpected error occurred. Please try again.',
};

export type SovereignErrorCode = keyof typeof SOVEREIGN_ERRORS;

export function getSovereignErrorMessage(error: any, tAutoOrIsArabic?: any): string {
  const rawCode = error?.code || error?.message || (typeof error === 'string' ? error : 'SYS_UNKNOWN');
  const rawCodeStr = String(rawCode).trim().toUpperCase().replace(/_/g, '-');

  const isDocEnglish =
    typeof document !== 'undefined' &&
    (document.documentElement.lang === 'en' || document.documentElement.dir === 'ltr');

  const getTranslatedMessage = (code: SovereignErrorCode) => {
    if (typeof tAutoOrIsArabic === 'boolean') {
      return tAutoOrIsArabic ? SOVEREIGN_ERRORS[code] : SOVEREIGN_ERRORS_EN[code];
    }
    if (typeof tAutoOrIsArabic === 'function') {
      if (typeof tAutoOrIsArabic.has === 'function' && tAutoOrIsArabic.has(code)) {
        return tAutoOrIsArabic(code);
      }
      return isDocEnglish ? SOVEREIGN_ERRORS_EN[code] : SOVEREIGN_ERRORS[code];
    }
    return isDocEnglish ? SOVEREIGN_ERRORS_EN[code] : SOVEREIGN_ERRORS[code];
  };

  if (SOVEREIGN_ERR_DICTIONARY[rawCodeStr]) {
    return getTranslatedMessage('SYS_PERMISSION_DENIED');
  }

  if (rawCode === 'auth/operation-not-allowed') {
    return getTranslatedMessage('AUTH_OPERATION_NOT_ALLOWED');
  }

  const mapping: { [key: string]: SovereignErrorCode } = {
    'auth/weak-password': 'AUTH_WEAK_PASSWORD',
    'auth/email-already-in-use': 'AUTH_EMAIL_ALREADY_IN_USE',
    'auth/invalid-email': 'AUTH_INVALID_EMAIL',
    'auth/user-not-found': 'AUTH_USER_NOT_FOUND',
    'auth/wrong-password': 'AUTH_WRONG_PASSWORD',
    'auth/operation-not-allowed': 'AUTH_OPERATION_NOT_ALLOWED',
    'permission-denied': 'SYS_PERMISSION_DENIED',
    'functions/permission-denied': 'SYS_PERMISSION_DENIED',
    'unavailable': 'SYS_002',
    'functions/unavailable': 'SYS_002',
    'already-exists': 'FEEDBACK_001',
    'functions/already-exists': 'FEEDBACK_001',
    'failed-precondition': 'PROTOCOL_9_LOCKED',
    'functions/failed-precondition': 'PROTOCOL_9_LOCKED',
    'invalid-argument': 'PRICE_DUMPING_ALERT',
    'functions/invalid-argument': 'PRICE_DUMPING_ALERT',
    'not-found': 'TRIP_NOT_FOUND',
    'functions/not-found': 'TRIP_NOT_FOUND',
    PHONE_OVERLAP_DETECTED: 'PHONE_OVERLAP_DETECTED',
    NAME_DISTRICT_OVERLAP_DETECTED: 'NAME_DISTRICT_OVERLAP_DETECTED',
    SYBIL_ATTACK_DETECTED: 'SYBIL_ATTACK_DETECTED',
    OPS_001: 'OPS_001',
  };

  const sovereignCode: string = mapping[rawCode] || mapping[String(rawCode).toUpperCase()];

  if (sovereignCode && Object.prototype.hasOwnProperty.call(SOVEREIGN_ERRORS, sovereignCode)) {
    return getTranslatedMessage(sovereignCode as SovereignErrorCode);
  }

  if (typeof rawCode === 'string' && rawCode.includes('auth/')) {
    return getTranslatedMessage('AUTH_GENERIC_FAILURE');
  }

  if (typeof rawCode === 'string' && rawCode.includes('permission-denied')) {
    return getTranslatedMessage('SYS_PERMISSION_DENIED');
  }

  return getTranslatedMessage('SYS_UNKNOWN');
}

