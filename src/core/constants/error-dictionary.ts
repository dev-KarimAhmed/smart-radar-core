import { SOVEREIGN_ERR_DICTIONARY } from '../config/sovereign-errors';

export const SOVEREIGN_ERRORS = {
  // 🔐 Authentication & Authorization Errors
  AUTH_WEAK_PASSWORD: 'كلمة المرور ضعيفة جداً. (6 أحرف على الأقل لتصل للحد الأدنى للمقاييس السيادية).',
  AUTH_EMAIL_ALREADY_IN_USE: 'هذا البريد الإلكتروني مستخدم بالفعل في حساب سابق.',
  AUTH_INVALID_EMAIL: 'صيغة البريد الإلكتروني غير مطابقة للمواصفات الفنية للولوج.',
  AUTH_USER_NOT_FOUND: 'لم يتم العثور على حساب بهذه المواصفات.',
  AUTH_WRONG_PASSWORD: 'بيانات المرور غير صحيحة. يرجى إعادة التحقق.',
  AUTH_OPERATION_NOT_ALLOWED: 'الفتح غير مسموح. يرجى تفعيل "الاتصالات المجهولة" (Anonymous Authentication) كجزء من الهيكل السحابي للرادار.',
  AUTH_GENERIC_FAILURE: 'فشل بروتوكول إثبات الهوية الفنية الرادارية.',
  AUTH_INTEGRITY_BREACH: 'خرق متكامل للهوية. البيانات المشبوهة تضر بسلامة النظام الميداني.',
  SEAL_TIMEOUT: 'انتهت مدة صلاحية الجلسة المفتوحة.',
  SYBIL_ATTACK_DETECTED: 'محاولة تسجيل الدخول بأجهزة متعددة محظورة حالياً.',
  SYS_PERMISSION_DENIED: 'ليست لديك الصلاحية الفنية لتنفيذ هذه العملية.',

  // 📡 Field & Operational Errors
  RADAR_OFFLINE: 'الرادار خارج الخدمة حالياً، يرجى تفعيل الموقع.',
  PROTOCOL_9_LOCKED: "الملف مغلق للمراجعة الفنية.",
  RADAR_001: "يجب تفعيل الـ GPS لتحديد المسار بدقة.",
  TRIP_NOT_FOUND: 'الرحلة المطلوبة لم تعد متاحة.',
  OPS_001: "يجب تعيين الوجهة قبل إطلاق النبض السحابي.",

  // ⚖️ Court & Pricing Errors
  PRICE_DUMPING_ALERT: 'السعر المقدم يخرق حد الأمان السيادي لسلامة المنافسة.',
  FEEDBACK_001: "لا يمكن تعديل البيانات السابقة قبل الانتهاء من الإجراء الميداني الحاضر.",
  COURT_001: "النظام مغلق للمراجعة الطارئة.",

  // 🌐 System & Generic Errors
  SYS_002: "فشل تسييل البيانات بسبب عطل طارئ، يرجى المحاولة لاحقاً.",
  SYS_COMPONENT_CRASH: 'حدث شلل فني في الأنظمة الداخلية للرادار.',
  SYS_UNKNOWN: "عطل فني مجهول. يرجى مراجعة الكود السحابي."
} as const;

export type SovereignErrorCode = keyof typeof SOVEREIGN_ERRORS;

export function getSovereignErrorMessage(error: any): string {
  const rawCode = error?.code || error?.message || (typeof error === 'string' ? error : 'SYS_UNKNOWN');

  // المطابقة الفورية مع القاموس السيادي الموحد V5.5
  const rawCodeStr = String(rawCode).trim().toUpperCase().replace(/_/g, '-');
  if (SOVEREIGN_ERR_DICTIONARY[rawCodeStr]) {
    const def = SOVEREIGN_ERR_DICTIONARY[rawCodeStr];
    return `[${def.code}] ${def.name}: ${def.description} (الإجراء المتخذ: ${def.action})`;
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
    'OPS_001': 'OPS_001',
  };

  const sovereignCode: string = mapping[rawCode] || rawCode;
  
  if (Object.prototype.hasOwnProperty.call(SOVEREIGN_ERRORS, sovereignCode)) {
    return SOVEREIGN_ERRORS[sovereignCode as SovereignErrorCode];
  }
  
  if (typeof rawCode === 'string' && rawCode.includes('auth/')) {
    return SOVEREIGN_ERRORS['AUTH_GENERIC_FAILURE'];
  }
  if (typeof rawCode === 'string' && rawCode.includes('permission-denied')) {
    return SOVEREIGN_ERRORS['SYS_PERMISSION_DENIED'];
  }

  return SOVEREIGN_ERRORS['SYS_UNKNOWN'];
}
