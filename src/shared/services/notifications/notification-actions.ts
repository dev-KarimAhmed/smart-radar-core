import { supabase } from '@/lib/supabase-client';
import { readStoredDashboardLanguage } from '@/lib/i18n/language-storage';
import { recordAdminNotificationSeen } from '@/features/account/services/legal-log-service';
import { getSupabaseAuthHeaders } from '@/shared/services/supabase-auth-headers';
import { resolveNotificationForDisplay } from '@/shared/utils/notification-i18n';
import { isAdminNotification } from './notification-types';
import {
  getMemoryNotifications,
  updateStore,
} from './notification-store';
import {
  deletedNotificationIds,
  persistDeletedNotificationIds,
} from './notification-deleted-tracker';

export async function markNotificationAsRead(notificationId: string, targetUserId: string | null): Promise<void> {
  const memoryNotifications = getMemoryNotifications();
  const targetItem = memoryNotifications.find((n) => n.id === notificationId);
  if (targetItem && isAdminNotification(targetItem) && targetUserId) {
    const isArabic = typeof window !== 'undefined' ? readStoredDashboardLanguage() === 'ar' : true;
    const parsedItem = resolveNotificationForDisplay(targetItem, isArabic);
    void recordAdminNotificationSeen({
      userId: targetUserId,
      notificationId: targetItem.id,
      notificationTitle: parsedItem.title || targetItem.title,
      notificationDescription: parsedItem.description || targetItem.description,
      isArabic,
    });
  }

  const updated = memoryNotifications.map((n) => (n.id === notificationId ? { ...n, read: true } : n));
  updateStore(updated, targetUserId);

  if (!targetUserId) return;

  try {
    const { error: rpcErr } = await supabase.rpc('mark_notification_read', { p_notification_id: notificationId });
    if (rpcErr) {
      await supabase
        .from('user_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId)
        .eq('user_id', targetUserId);
    }
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.warn('[useNotifications] markAsRead sync error:', err);
  }
}

export async function markAllNotificationsAsRead(targetUserId: string | null): Promise<void> {
  const memoryNotifications = getMemoryNotifications();
  if (targetUserId) {
    const isArabic = typeof window !== 'undefined' ? readStoredDashboardLanguage() === 'ar' : true;
    memoryNotifications.forEach((n) => {
      if (!n.read && isAdminNotification(n)) {
        const parsedItem = resolveNotificationForDisplay(n, isArabic);
        void recordAdminNotificationSeen({
          userId: targetUserId,
          notificationId: n.id,
          notificationTitle: parsedItem.title || n.title,
          notificationDescription: parsedItem.description || n.description,
          isArabic,
        });
      }
    });
  }

  const updated = memoryNotifications.map((n) => ({ ...n, read: true }));
  updateStore(updated, targetUserId);

  if (!targetUserId) return;

  try {
    const { error: rpcErr } = await supabase.rpc('mark_all_notifications_read');
    if (rpcErr) {
      await supabase
        .from('user_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('user_id', targetUserId)
        .eq('is_read', false);
    }
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.warn('[useNotifications] markAllAsRead sync error:', err);
  }
}

export async function deleteNotificationsAction(idsToDelete: string[], targetUserId: string | null): Promise<void> {
  if (!idsToDelete || idsToDelete.length === 0) return;
  const deleteSet = new Set(idsToDelete);
  idsToDelete.forEach((id) => deletedNotificationIds.add(id));
  persistDeletedNotificationIds(targetUserId, idsToDelete);
  const updated = getMemoryNotifications().filter((n) => !deleteSet.has(n.id));
  updateStore(updated, targetUserId);

  try {
    const authHeaders = await getSupabaseAuthHeaders({ 'Content-Type': 'application/json' });
    const apiPromise = authHeaders.Authorization
      ? fetch('/api/notifications', {
          method: 'DELETE',
          headers: authHeaders,
          body: JSON.stringify({ ids: idsToDelete }),
        }).catch((err) => {
          if (process.env.NODE_ENV !== 'production') console.warn('[useNotifications] API delete error:', err);
        })
      : Promise.resolve();

    const rpcPromise = Promise.resolve(
      supabase.rpc('delete_user_notifications', { p_ids: idsToDelete })
    ).catch(() => null);

    const directPromise = (async () => {
      try {
        await supabase.from('user_notifications').delete().in('id', idsToDelete);
      } catch {}
    })();

    await Promise.allSettled([apiPromise, rpcPromise, directPromise]);
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.warn('[useNotifications] delete error:', err);
  }
}

export async function clearAllNotificationsAction(targetUserId: string | null, idsToClear?: string[]): Promise<void> {
  if (idsToClear && idsToClear.length > 0) {
    await deleteNotificationsAction(idsToClear, targetUserId);
    return;
  }

  const ids = getMemoryNotifications().map((n) => n.id);
  ids.forEach((id) => deletedNotificationIds.add(id));
  persistDeletedNotificationIds(targetUserId, ids);
  updateStore([], targetUserId);

  try {
    const authHeaders = await getSupabaseAuthHeaders({ 'Content-Type': 'application/json' });
    const apiPromise = authHeaders.Authorization
      ? fetch('/api/notifications', {
          method: 'DELETE',
          headers: authHeaders,
          body: JSON.stringify({ all: true }),
        }).catch((err) => {
          if (process.env.NODE_ENV !== 'production') console.warn('[useNotifications] API clearAll error:', err);
        })
      : Promise.resolve();

    const rpcPromise = ids.length > 0
      ? Promise.resolve(supabase.rpc('delete_user_notifications', { p_ids: ids })).catch(() => null)
      : Promise.resolve(null);

    const directPromise = (async () => {
      try {
        if (targetUserId) {
          await supabase.from('user_notifications').delete().eq('user_id', targetUserId);
        }
      } catch {}
    })();

    await Promise.allSettled([apiPromise, rpcPromise, directPromise]);
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.warn('[useNotifications] clearAll exception:', err);
  }
}
