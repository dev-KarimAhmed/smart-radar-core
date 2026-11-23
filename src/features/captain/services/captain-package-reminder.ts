import { encodeNotificationPayload } from '@/shared/utils/notification-i18n';
import type { CaptainAdPackage } from './captain-ads-types';

export const EXPIRATION_REMINDER_THRESHOLD_MS = 2 * 24 * 60 * 60 * 1000; // 48 hours (2 days)

export interface ShouldSendExpirationReminderParams {
  adPackage?: CaptainAdPackage | null;
  now?: number;
  isDispatchedAlready?: boolean;
}

export function shouldSendExpirationReminder({
  adPackage,
  now = Date.now(),
  isDispatchedAlready = false,
}: ShouldSendExpirationReminderParams): boolean {
  if (!adPackage || adPackage.status !== 'ACTIVE') return false;
  if (isDispatchedAlready) return false;

  const expiresAtMs = adPackage.expiresAt ? new Date(adPackage.expiresAt).getTime() : 0;
  if (!expiresAtMs || Number.isNaN(expiresAtMs)) return false;

  const diffMs = expiresAtMs - now;
  // Trigger strictly within 48 hours before expiration and while still active
  return diffMs > 0 && diffMs <= EXPIRATION_REMINDER_THRESHOLD_MS;
}

export function getReminderStorageKey(captainId: string, subscribedAt?: string): string {
  return `radar_ad_pkg_exp_reminder_dispatched_${captainId}_${subscribedAt || 'default'}`;
}

export interface CheckAndDispatchReminderParams {
  captainId: string;
  adPackage?: CaptainAdPackage | null;
  language?: 'ar' | 'en';
  now?: number;
}

export function checkAndDispatchPackageExpirationReminder({
  captainId,
  adPackage,
  language = 'ar',
  now = Date.now(),
}: CheckAndDispatchReminderParams): boolean {
  if (!captainId || !adPackage) return false;

  const reminderKey = getReminderStorageKey(captainId, adPackage.subscribedAt);
  const isDispatched = typeof window !== 'undefined' ? localStorage.getItem(reminderKey) === 'true' : false;

  if (!shouldSendExpirationReminder({ adPackage, now, isDispatchedAlready: isDispatched })) {
    return false;
  }

  const isArabic = language === 'ar';
  const expiresAtMs = adPackage.expiresAt ? new Date(adPackage.expiresAt).getTime() : now + EXPIRATION_REMINDER_THRESHOLD_MS;
  const diffMs = Math.max(0, expiresAtMs - now);
  const hoursLeft = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60)));
  const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  const titleAr = 'تنبيه: باقتك الافتتاحية المجانية تنتهي خلال يومين ⏳';
  const bodyAr = `متبقي ${daysLeft <= 1 ? `${hoursLeft} ساعة` : 'يومان'} على انتهاء فترة العرض المجاني (30 يوماً). يرجى شحن رصيد ساعات التشغيل أو تجديد الباقة لضمان استمرار استقبال الرحلات ونشر إعلاناتك دون توقف.`;

  const titleEn = 'Reminder: Your Free Launch Package expires in 2 days ⏳';
  const bodyEn = `Only ${daysLeft <= 1 ? `${hoursLeft} hours` : '2 days'} remaining in your 30-day free trial. Please recharge operating hours or renew your package to continue receiving trips without interruption.`;

  const payload = encodeNotificationPayload(titleAr, bodyAr, titleEn, bodyEn);
  const notifId = `notif_pkg_exp_48h_${captainId}_${Math.floor(expiresAtMs / (1000 * 60 * 60 * 24))}`;

  // 1. Add notification to store and persist to Supabase user_notifications
  void import('@/shared/services/notifications/notification-dispatcher')
    .then(({ addNotificationToStore }) => {
      addNotificationToStore(
        {
          id: notifId,
          title: isArabic ? payload.title : (titleEn || payload.title),
          description: payload.description,
          type: 'info',
        },
        captainId
      );
    })
    .catch(() => null);

  if (typeof window !== 'undefined') {
    // 2. Play sound
    void import('@/shared/utils/notification-sound')
      .then(({ playNotificationSound }) => {
        playNotificationSound();
      })
      .catch(() => null);

    // 3. Native browser notification if allowed
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        new Notification(isArabic ? titleAr : titleEn, {
          body: isArabic ? bodyAr : bodyEn,
          icon: '/icons/icon-192x192.png',
        });
      } catch {
        // Safe notification catch
      }
    }

    // 4. Mark dispatched in localStorage
    localStorage.setItem(reminderKey, 'true');
  }

  return true;
}
