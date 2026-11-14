'use client';

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';
import {
  type AppNotification,
  isAdminNotification,
  isTripOrSystemNotification,
} from '../services/notifications/notification-types';
import {
  subscribeStore,
  getSnapshot,
  getServerSnapshot,
  getInitialUserId,
  switchStoreUser,
  isMemoryStoreLoaded,
  getCurrentStoreUserId,
} from '../services/notifications/notification-store';
import {
  addNotificationToStore,
  bindGlobalAppNotificationListener,
} from '../services/notifications/notification-dispatcher';
import {
  fetchRemoteNotificationsGlobal,
  setupRealtimeChannelIfNeeded,
  setLatestToastFn,
} from '../services/notifications/notification-fetcher';
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotificationsAction,
  clearAllNotificationsAction,
} from '../services/notifications/notification-actions';

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

  useEffect(() => {
    setLatestToastFn((title, desc, variant) => {
      toast({ title, description: desc, variant });
    });
  }, [toast]);

  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!isMounted) return;
      const uid = data?.session?.user?.id ?? null;
      setUserId(uid);
      switchStoreUser(uid);
      setupRealtimeChannelIfNeeded(uid);
      if (uid) void fetchRemoteNotificationsGlobal(uid);
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
      if (uid) void fetchRemoteNotificationsGlobal(uid);
    });

    return () => {
      isMounted = false;
      authSub.subscription.unsubscribe();
    };
  }, []);

  const addNotification = useCallback(
    (item: Omit<AppNotification, 'timestamp' | 'read'> & { id?: string; read?: boolean }) => {
      const targetUserId = explicitUserId || userId || getCurrentStoreUserId() || getInitialUserId();
      addNotificationToStore(item, targetUserId);
    },
    [userId, explicitUserId]
  );

  const markAsRead = useCallback(
    async (notificationId: string) => {
      const targetUserId = explicitUserId || userId || getCurrentStoreUserId() || getInitialUserId();
      await markNotificationAsRead(notificationId, targetUserId);
    },
    [userId, explicitUserId]
  );

  const markAllAsRead = useCallback(async () => {
    const targetUserId = explicitUserId || userId || getCurrentStoreUserId() || getInitialUserId();
    await markAllNotificationsAsRead(targetUserId);
  }, [userId, explicitUserId]);

  const deleteNotifications = useCallback(
    async (idsToDelete: string[]) => {
      const targetUserId = explicitUserId || userId || getCurrentStoreUserId() || getInitialUserId();
      await deleteNotificationsAction(idsToDelete, targetUserId);
    },
    [userId, explicitUserId]
  );

  const clearAll = useCallback(
    async (idsToClear?: string[]) => {
      const targetUserId = explicitUserId || userId || getCurrentStoreUserId() || getInitialUserId();
      await clearAllNotificationsAction(targetUserId, idsToClear);
    },
    [userId, explicitUserId]
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
    isLoaded: isMemoryStoreLoaded(),
    refreshNotifications: () => {
      const targetUserId = userId || getCurrentStoreUserId() || getInitialUserId();
      if (targetUserId) void fetchRemoteNotificationsGlobal(targetUserId);
    },
  };
}

export * from '../services/notifications/notification-types';
export * from '../services/notifications/notification-store';
export * from '../services/notifications/notification-deleted-tracker';
export * from '../services/notifications/notification-dispatcher';
export * from '../services/notifications/notification-fetcher';
export * from '../services/notifications/notification-actions';
