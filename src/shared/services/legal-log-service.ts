'use client';

import { supabase } from '@/lib/supabase-client';

export interface LegalDeclarationRecord {
  id: string;
  userId: string;
  userSerialId: string;
  actionType: 'NEW_ACCOUNT' | 'PROFILE_UPDATE' | 'VEHICLE_UPDATE' | 'ADMIN_NOTIFICATION' | string;
  actionLabel: string;
  declarationText: string;
  timestamp: number;
  preciseTime: string; // HH:mm:ss.SSS - YYYY/MM/DD
  ipAddress?: string;
  fieldsChanged?: string[];
  status: 'CONFIRMED' | 'VERIFIED';
}

export const LEGAL_DECLARATION_TEXT =
  'انت المسؤول عن صحة ومصداقية كافة البيانات المدخلة الشخصية والمهنية ولا تتحمل شبكة بينكم أي مسؤولية قانونية عن أي خلل او عدم مطابقة في مصداقيتها ...';

function formatPreciseTimestamp(date: Date, isArabic = true): string {
  const pad = (n: number, z = 2) => String(n).padStart(z, '0');
  const pad3 = (n: number) => String(n).padStart(3, '0');

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());

  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  const milliseconds = pad3(date.getMilliseconds());

  return `${hours}:${minutes}:${seconds}.${milliseconds} — ${year}/${month}/${day}`;
}

export function getLegalDeclarationsStorageKey(userId: string): string {
  return `radar_legal_declarations_${userId}`;
}

export function getStoredLegalDeclarations(userId?: string | null): LegalDeclarationRecord[] {
  if (typeof window === 'undefined' || !userId) return [];
  try {
    const raw = localStorage.getItem(getLegalDeclarationsStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function recordLegalDeclaration(params: {
  userId: string;
  userSerialId?: string;
  actionType: 'NEW_ACCOUNT' | 'PROFILE_UPDATE' | 'VEHICLE_UPDATE';
  actionLabel?: string;
  fieldsChanged?: string[];
  isArabic?: boolean;
}): Promise<LegalDeclarationRecord> {
  const now = new Date();
  const timestamp = now.getTime();
  const isArabic = params.isArabic ?? true;

  const defaultLabel =
    params.actionType === 'NEW_ACCOUNT'
      ? isArabic ? 'تسجيل حساب جديد' : 'New Account Registration'
      : params.actionType === 'VEHICLE_UPDATE'
      ? isArabic ? 'تعديل بيانات المركبة' : 'Vehicle Details Update'
      : isArabic ? 'تعديل بيانات الحساب' : 'Account Details Update';

  // Declaration ID formatted per requirements: DEC-YYYYMMDD-XXXX
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const decId = `DEC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${randomSuffix}`;
  const userSerialId = params.userSerialId || params.userId.slice(0, 8).toUpperCase();

  const record: LegalDeclarationRecord = {
    id: decId,
    userId: params.userId,
    userSerialId,
    actionType: params.actionType,
    actionLabel: params.actionLabel || defaultLabel,
    declarationText: LEGAL_DECLARATION_TEXT,
    timestamp,
    preciseTime: formatPreciseTimestamp(now, isArabic),
    fieldsChanged: params.fieldsChanged,
    status: 'CONFIRMED',
  };

  // 1. Save locally to localStorage (Instantaneous client-side SSOT)
  if (typeof window !== 'undefined') {
    try {
      const existing = getStoredLegalDeclarations(params.userId);
      const updated = [record, ...existing.filter((r) => r.id !== record.id)].slice(0, 50);
      localStorage.setItem(getLegalDeclarationsStorageKey(params.userId), JSON.stringify(updated));

      // Broadcast event for live UI update
      window.dispatchEvent(
        new CustomEvent('radar-legal-declaration-recorded', {
          detail: { record },
        })
      );
    } catch (e) {
      console.warn('Failed to save legal declaration locally:', e);
    }
  }

  // 2. Cloud SSOT Backup: Sync to user_notifications as an official audit notification
  try {
    const auditTitle = `إقرار قانوني إلكتروني: ${record.actionLabel}`;
    const auditDesc = `رقم الإقرار: ${record.id} | المستخدم: ${record.userSerialId} | التوقيت: ${record.preciseTime} — تم توثيق الإقرار وحفظه في السجل القانوني الإلكتروني بشاشة سجلاتي بنجاح.`;

    await supabase.from('user_notifications').insert({
      user_id: params.userId,
      title: auditTitle,
      description: auditDesc,
      type: 'info',
      is_read: false,
    });
  } catch (e) {
    console.warn('Cloud sync of legal declaration audit note failed (offline/non-critical):', e);
  }

  return record;
}

export function recordAdminNotificationSeen(params: {
  userId: string;
  userSerialId?: string;
  notificationId: string;
  notificationTitle: string;
  notificationDescription: string;
  isArabic?: boolean;
}): LegalDeclarationRecord | null {
  if (!params.userId || typeof window === 'undefined') return null;
  const existing = getStoredLegalDeclarations(params.userId);
  const decId = `DEC-ADM-${params.notificationId}`;
  if (existing.some((r) => r.id === decId || r.fieldsChanged?.includes(params.notificationId))) {
    return null;
  }
  const now = new Date();
  const isArabic = params.isArabic ?? true;
  const userSerialId = params.userSerialId || params.userId.slice(0, 8).toUpperCase();
  const record: LegalDeclarationRecord = {
    id: decId,
    userId: params.userId,
    userSerialId,
    actionType: 'ADMIN_NOTIFICATION',
    actionLabel: isArabic ? 'إشعار إداري رسمي مقروء' : 'Official Admin Notice Acknowledged',
    declarationText: isArabic
      ? `تم استلام وقراءة والإقرار رسمياً بمضمون الإشعار الإداري الصادر عن الإدارة: "${params.notificationTitle}" — ${params.notificationDescription}`
      : `Officially received, reviewed and acknowledged administrative notice: "${params.notificationTitle}" — ${params.notificationDescription}`,
    timestamp: now.getTime(),
    preciseTime: formatPreciseTimestamp(now, isArabic),
    fieldsChanged: [params.notificationId],
    status: 'VERIFIED',
  };

  const updated = [record, ...existing].slice(0, 50);
  try {
    localStorage.setItem(getLegalDeclarationsStorageKey(params.userId), JSON.stringify(updated));
    window.dispatchEvent(
      new CustomEvent('radar-legal-declaration-recorded', {
        detail: { record },
      })
    );
  } catch (e) {
    console.warn('[recordAdminNotificationSeen] local save skipped:', e);
  }
  return record;
}
