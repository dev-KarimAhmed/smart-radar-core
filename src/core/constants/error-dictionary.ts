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
  NAME_DISTRICT_OVERLAP_DETECTED: 'يوجد كابتن بنفس الاسم في هذا اللواء. يرجى مراجعة البيانات.',
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

export type SovereignErrorCode = keyof typeof SOVEREIGN_ERRORS;

export function getSovereignErrorMessage(error: any): string {
  const rawCode = error?.code || error?.message || (typeof error === 'string' ? error : 'SYS_UNKNOWN');
  const rawCodeStr = String(rawCode).trim().toUpperCase().replace(/_/g, '-');

  if (SOVEREIGN_ERR_DICTIONARY[rawCodeStr]) {
    return SOVEREIGN_ERRORS.SYS_PERMISSION_DENIED;
  }

  if (rawCode === 'auth/operation-not-allowed') {
    return SOVEREIGN_ERRORS.AUTH_OPERATION_NOT_ALLOWED;
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
    return SOVEREIGN_ERRORS[sovereignCode as SovereignErrorCode];
  }

  if (typeof rawCode === 'string' && rawCode.includes('auth/')) {
    return SOVEREIGN_ERRORS.AUTH_GENERIC_FAILURE;
  }

  if (typeof rawCode === 'string' && rawCode.includes('permission-denied')) {
    return SOVEREIGN_ERRORS.SYS_PERMISSION_DENIED;
  }

  return SOVEREIGN_ERRORS.SYS_UNKNOWN;
}

