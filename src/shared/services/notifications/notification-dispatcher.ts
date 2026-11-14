import { supabase } from '@/lib/supabase-client';
import { playNotificationSound } from '@/shared/utils/notification-sound';
import type { AppNotification } from './notification-types';
import {
  getMemoryNotifications,
  getCurrentStoreUserId,
  getInitialUserId,
  updateStore,
} from './notification-store';

let lastAddedNotificationHash = '';
let lastAddedNotificationTimestamp = 0;

const ALLOWED_CLIENT_NOTIFICATION_TYPES = new Set(['info', 'offer', 'trip', 'system']);
const FORBIDDEN_CLIENT_NOTIFICATION_ID_PATTERN =
  /(rcpt|topup|notif_top|notif_admin|notif_welcome|notif_inact|notif_ref|notif_verif|notif_status|notif_tier|notif_clear)/i;

export function addNotificationToStore(
  item: Omit<AppNotification, 'timestamp' | 'read'> & { id?: string; read?: boolean },
  targetUserId?: string | null
): void {
  const uid = targetUserId || getCurrentStoreUserId() || getInitialUserId();
  if (!uid) return;

  const now = Date.now();
  const hash = `${item.id || ''}::${item.title}::${item.description}::${item.type || 'system'}`;
  if (hash === lastAddedNotificationHash && now - lastAddedNotificationTimestamp < 1500) {
    return;
  }
  lastAddedNotificationHash = hash;
  lastAddedNotificationTimestamp = now;

  const notifId = item.id || `notif_${now}_${Math.random().toString(36).slice(2, 6)}`;
  const newNotif: AppNotification = {
    ...item,
    id: notifId,
    timestamp: now,
    read: item.read ?? false,
  };

  const filtered = getMemoryNotifications().filter((n) => n.id !== notifId);
  const updated = [newNotif, ...filtered].slice(0, 50);
  updateStore(updated, uid);

  const normalizedType = String(newNotif.type || 'system').toLowerCase();
  const dbType = ALLOWED_CLIENT_NOTIFICATION_TYPES.has(normalizedType) ? normalizedType : 'info';

  if (!FORBIDDEN_CLIENT_NOTIFICATION_ID_PATTERN.test(newNotif.id)) {
    void Promise.resolve(
      supabase.from('user_notifications').upsert({
        id: newNotif.id,
        user_id: uid,
        title: newNotif.title,
        description: newNotif.description,
        type: dbType,
        is_read: newNotif.read,
        created_at: new Date(newNotif.timestamp).toISOString(),
      }, { onConflict: 'id' })
    ).catch(() => null);
  }
}

let isGlobalAppNotificationListenerBound = false;
export function bindGlobalAppNotificationListener(): void {
  if (typeof window === 'undefined' || isGlobalAppNotificationListenerBound) return;
  isGlobalAppNotificationListenerBound = true;

  window.addEventListener('app-notification', (e: Event) => {
    const detail = (e as CustomEvent<Omit<AppNotification, 'timestamp' | 'read'> & { id?: string; read?: boolean }>).detail;
    if (detail?.title) {
      addNotificationToStore(detail);
      playNotificationSound();
    }
  });
}

if (typeof window !== 'undefined') {
  bindGlobalAppNotificationListener();
}
