'use client';

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';
import { recordAdminNotificationSeen } from '@/shared/services/legal-log-service';
import {
  type AppNotification,
  SEVENTY_TWO_HOURS_MS,
  isNotificationExpired,
  isAdminNotification,
  isTripOrSystemNotification,
  getNotificationStorageKey,
  getInitialUserId,
  switchStoreUser,
  clearNotificationMemoryStore,
  subscribeStore,
  getSnapshot,
  getServerSnapshot,
  addNotificationToStore,
  updateStore,
  bindGlobalAppNotificationListener,
  fetchRemoteNotificationsGlobal,
  setupRealtimeChannelIfNeeded,
  setLatestToastFunction,
  persistDeletedNotificationIds,
  deletedNotificationIds,
  memoryNotifications,
  currentStoreUserId,
  isStoreLoaded,
} from '../services/notification-store';

export type { AppNotification };
export {
  SEVENTY_TWO_HOURS_MS,
  isNotificationExpired,
  isAdminNotification,
  isTripOrSystemNotification,
  getNotificationStorageKey,
  getInitialUserId,
  switchStoreUser,
  clearNotificationMemoryStore,
  addNotificationToStore,
  bindGlobalAppNotificationListener,
};

export function useNotifications(explicitUserId?: string | null) {
  const notifications = useSyncExternalStore(subscribeStore, getSnapshot, getServerSnapshot);
  const [userId, setUserId] = useState<string | null>(() => explicitUserId || getInitialUserId());
  const { toast } = useToast();

  useEffect(() => {
    if (explicitUserId) {
      setUserId(explicitUserId);
      switchStoreUser(explicitUserId);
      setupRealtimeChannelIfNeeded(explicitUserId);
      void fetchRemoteNotificationsGlobal(explicitUserId);
    }
  }, [explicitUserId]);

  // Register latest toast caller
  useEffect(() => {
    setLatestToastFunction((title, desc, variant) => {
      toast({
        title,
        description: desc,
        variant,
      });
    });
  }, [toast]);

  // Track authenticated user session from Supabase
  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      const uid = data?.session?.user?.id ?? null;
      setUserId(uid);
      switchStoreUser(uid);
      setupRealtimeChannelIfNeeded(uid);
      if (uid) {
        void fetchRemoteNotificationsGlobal(uid);
      }
    });

    supabase.auth.getUser().then(({ data }) => {
      if (!isMounted) return;
      if (data?.user?.id) {
        const uid = data.user.id;
        setUserId(uid);
        switchStoreUser(uid);
        setupRealtimeChannelIfNeeded(uid);
        void fetchRemoteNotificationsGlobal(uid);
      }
    });

    const { data: authSub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;
      const uid = session?.user?.id ?? (event === 'SIGNED_OUT' ? null : getInitialUserId());
      setUserId(uid);
      switchStoreUser(uid);
      setupRealtimeChannelIfNeeded(uid);
      if (uid) {
        void fetchRemoteNotificationsGlobal(uid);
      }
    });

    return () => {
      isMounted = false;
      authSub.subscription.unsubscribe();
    };
  }, []);

  // Add notification
  const addNotification = useCallback(
    (item: Omit<AppNotification, 'timestamp' | 'read'> & { id?: string; read?: boolean }) => {
      const targetUserId = explicitUserId || userId || currentStoreUserId || getInitialUserId();
      addNotificationToStore(item, targetUserId);
    },
    [userId, explicitUserId]
  );

  // Mark single notification as read
  const markAsRead = useCallback(
    async (notificationId: string) => {
      const targetUserId = explicitUserId || userId || currentStoreUserId || getInitialUserId();
      const targetItem = memoryNotifications.find((n) => n.id === notificationId);
      if (targetItem && isAdminNotification(targetItem) && targetUserId) {
        void recordAdminNotificationSeen({
          userId: targetUserId,
          notificationId: targetItem.id,
          notificationTitle: targetItem.title,
          notificationDescription: targetItem.description,
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
    },
    [userId, explicitUserId]
  );

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    const targetUserId = explicitUserId || userId || currentStoreUserId || getInitialUserId();
    if (targetUserId) {
      memoryNotifications.forEach((n) => {
        if (!n.read && isAdminNotification(n)) {
          void recordAdminNotificationSeen({
            userId: targetUserId,
            notificationId: n.id,
            notificationTitle: n.title,
            notificationDescription: n.description,
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
  }, [userId, explicitUserId]);

  // Delete specific notifications (single or bulk)
  const deleteNotifications = useCallback(
    async (idsToDelete: string[]) => {
      if (!idsToDelete || idsToDelete.length === 0) return;
      const targetUserId = explicitUserId || userId || currentStoreUserId || getInitialUserId();
      const deleteSet = new Set(idsToDelete);
      idsToDelete.forEach((id) => deletedNotificationIds.add(id));
      persistDeletedNotificationIds(targetUserId, idsToDelete);
      const updated = memoryNotifications.filter((n) => !deleteSet.has(n.id));
      updateStore(updated, targetUserId);

      try {
        const session = (await supabase.auth.getSession()).data?.session;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const apiPromise = fetch('/api/notifications', {
          method: 'DELETE',
          headers,
          body: JSON.stringify({ ids: idsToDelete, userId: targetUserId }),
        }).catch((err) => {
          if (process.env.NODE_ENV !== 'production') console.warn('[useNotifications] API delete error:', err);
        });

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
    },
    [userId, explicitUserId]
  );

  // Clear all
  const clearAll = useCallback(
    async (idsToClear?: string[]) => {
      if (idsToClear && idsToClear.length > 0) {
        await deleteNotifications(idsToClear);
        return;
      }

      const targetUserId = explicitUserId || userId || currentStoreUserId || getInitialUserId();
      const ids = memoryNotifications.map((n) => n.id);

      ids.forEach((id) => deletedNotificationIds.add(id));
      persistDeletedNotificationIds(targetUserId, ids);
      updateStore([], targetUserId);

      try {
        const session = (await supabase.auth.getSession()).data?.session;
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }

        const apiPromise = fetch('/api/notifications', {
          method: 'DELETE',
          headers,
          body: JSON.stringify({
            all: true,
            userId: targetUserId,
          }),
        }).catch((err) => {
          if (process.env.NODE_ENV !== 'production') console.warn('[useNotifications] API clearAll error:', err);
        });

        const rpcPromise =
          ids.length > 0
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
    },
    [userId, explicitUserId, deleteNotifications]
  );

  useEffect(() => {
    bindGlobalAppNotificationListener();
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const hasUnread = unreadCount > 0;

  const adminNotifications = notifications.filter(isAdminNotification);
  const tripNotifications = notifications.filter(isTripOrSystemNotification);

  const adminUnreadCount = adminNotifications.filter((n) => !n.read).length;
  const hasAdminUnread = adminUnreadCount > 0;

  const tripUnreadCount = tripNotifications.filter((n) => !n.read).length;
  const hasTripUnread = tripUnreadCount > 0;

  return {
    notifications,
    unreadCount,
    hasUnread,
    adminNotifications,
    adminUnreadCount,
    hasAdminUnread,
    tripNotifications,
    tripUnreadCount,
    hasTripUnread,
    markAsRead,
    markAllAsRead,
    addNotification,
    deleteNotifications,
    clearAll,
    isLoaded: isStoreLoaded,
    refreshNotifications: () => {
      const targetUserId = userId || currentStoreUserId || getInitialUserId();
      if (targetUserId) void fetchRemoteNotificationsGlobal(targetUserId);
    },
  };
}
