import { type LegalDeclarationRecord, LEGAL_DECLARATION_TEXT } from '@/features/account/services/legal-log-service';
import { resolveNotificationForDisplay } from '@/shared/utils/notification-i18n';

export const LEGAL_DECLARATION_TEXT_EN =
  'You are solely responsible for the accuracy and authenticity of all entered personal and professional data, and Bynkcom Network bears no legal liability for any discrepancy or inaccuracy therein...';

export function getLocalizedActionLabel(item: LegalDeclarationRecord, isArabic: boolean): string {
  const label = (item.actionLabel || '').trim();
  if (isArabic) {
    if (item.actionType === 'NEW_ACCOUNT' || label === 'New Account Registration') return 'تسجيل حساب جديد';
    if (item.actionType === 'CAPTAIN_CONTRACT_ACTIVATION') return 'توثيق وثيقة الكابتن وتفعيل الباقة';
    if (item.actionType === 'VEHICLE_UPDATE' || label === 'Vehicle Details Update') return 'تعديل بيانات المركبة';
    if (item.actionType === 'PROFILE_UPDATE' || label === 'Account Details Update') return 'تعديل بيانات الحساب';
    if (item.actionType === 'ADMIN_NOTIFICATION' || label === 'Official Admin Notice Acknowledged') return 'إشعار إداري رسمي مقروء';
    return label;
  }

  if (item.actionType === 'NEW_ACCOUNT' || label === 'تسجيل حساب جديد') return 'New Account Registration';
  if (item.actionType === 'CAPTAIN_CONTRACT_ACTIVATION' || label.includes('توثيق وثيقة الكابتن')) {
    return 'Official Captain Contract Activation';
  }
  if (item.actionType === 'VEHICLE_UPDATE' || label === 'تعديل بيانات المركبة' || label === 'تحديث بيانات المركبة والوثائق') {
    return 'Vehicle Details Update';
  }
  if (
    item.actionType === 'PROFILE_UPDATE' ||
    label === 'تعديل بيانات الحساب' ||
    label === 'تعديل بيانات الحساب الشخصي'
  ) {
    return 'Account Details Update';
  }
  if (label === 'تعديل بيانات الحساب والمركبة') {
    return 'Account & Vehicle Details Update';
  }
  if (item.actionType === 'ADMIN_NOTIFICATION' || label === 'إشعار إداري رسمي مقروء') {
    return 'Official Admin Notice Acknowledged';
  }
  return label;
}

export function getLocalizedDeclarationText(item: LegalDeclarationRecord, isArabic: boolean): string {
  const text = (item.declarationText || '').trim();
  if (!isArabic) {
    if (text === LEGAL_DECLARATION_TEXT || text.includes('انت المسؤول عن صحة ومصداقية كافة البيانات المدخلة')) {
      return LEGAL_DECLARATION_TEXT_EN;
    }
    const adminPrefixAr = 'تم استلام وقراءة والإقرار رسمياً بمضمون الإشعار الإداري الصادر عن الإدارة:';
    if (text.startsWith(adminPrefixAr)) {
      const rest = text.slice(adminPrefixAr.length).trim();
      const m = rest.match(/^"([^"]+)"\s*—\s*([\s\S]+)$/);
      if (m) {
        const resolved = resolveNotificationForDisplay({ title: m[1], description: m[2] }, false);
        return `Officially received, reviewed and acknowledged administrative notice: "${resolved.title}" — ${resolved.description}`;
      }
      return `Officially received, reviewed and acknowledged administrative notice: ${rest}`;
    }
    return text;
  }

  if (text === LEGAL_DECLARATION_TEXT_EN) {
    return LEGAL_DECLARATION_TEXT;
  }
  const adminPrefixEn = 'Officially received, reviewed and acknowledged administrative notice:';
  if (text.startsWith(adminPrefixEn)) {
    const rest = text.slice(adminPrefixEn.length).trim();
    const m = rest.match(/^"([^"]+)"\s*—\s*([\s\S]+)$/);
    if (m) {
      const resolved = resolveNotificationForDisplay({ title: m[1], description: m[2] }, true);
      return `تم استلام وقراءة والإقرار رسمياً بمضمون الإشعار الإداري الصادر عن الإدارة: "${resolved.title}" — ${resolved.description}`;
    }
    return `تم استلام وقراءة والإقرار رسمياً بمضمون الإشعار الإداري الصادر عن الإدارة: ${rest}`;
  }
  return text;
}
