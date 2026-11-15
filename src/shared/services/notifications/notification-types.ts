export interface AppNotification {
  id: string;
  title: string;
  description: string;
  timestamp: number;
  read: boolean;
  type?: 'info' | 'offer' | 'trip' | 'system' | 'WALLET_CREDIT' | 'WALLET_ALERT' | 'admin_message' | 'referral' | string;
}

export const LEGACY_STORAGE_KEY = 'radar_user_notifications_v1';
export const SEVENTY_TWO_HOURS_MS = 72 * 60 * 60 * 1000;

export function isNotificationExpired(item: { timestamp: number; type?: string }): boolean {
  if (item.type === 'trip' || item.type === 'offer') {
    return Date.now() - item.timestamp > SEVENTY_TWO_HOURS_MS;
  }
  return false;
}

export function isAdminNotification(item: { type?: string }): boolean {
  if (!item || !item.type) return false;
  const t = item.type.toLowerCase();
  return (
    t === 'admin_message' ||
    t === 'admin' ||
    t === 'warning' ||
    t === 'urgent' ||
    t === 'message' ||
    t === 'admin_announcement'
  );
}

export function isTripOrSystemNotification(item: { type?: string }): boolean {
  return !isAdminNotification(item);
}

export function getNotificationStorageKey(userId: string | null): string | null {
  if (!userId) return null;
  return `radar_user_notifications_${userId}`;
}
