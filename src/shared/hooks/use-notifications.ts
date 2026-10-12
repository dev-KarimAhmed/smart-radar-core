'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase-client';

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  timestamp: number;
  read: boolean;
  type?: 'info' | 'offer' | 'trip' | 'system';
}

const STORAGE_KEY = 'radar_user_notifications_v1';
const SYNC_EVENT = 'radar-notifications-sync';

function broadcastNotificationsSync() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(SYNC_EVENT));
  }
}

function getInitialUserId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw =
      window.localStorage.getItem('radar_supabase_auth_session') ||
      window.sessionStorage.getItem('radar_supabase_auth_session');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed?.user?.id) return String(parsed.user.id);
    }
  } catch {}
  return null;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [userId, setUserId] = useState<string | null>(() => getInitialUserId());
  const isFetchingRef = useRef(false);

  // 1. Initial instant load from localStorage for 0ms offline-first rendering
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setNotifications(parsed);
          setIsLoaded(true);
          return;
        }
      }

      // Default initial welcome notification if local storage is completely empty
      const initial: AppNotification[] = [
        {
          id: 'welcome-radar',
          title: 'مرحباً بك في رادار',
          description: 'تم تفعيل حسابك بنجاح. رادارك الذكي جاهز لمطابقة أفضل العروض في منطقتك.',
          timestamp: Date.now(),
          read: false,
          type: 'system',
        },
      ];
      setNotifications(initial);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    } catch {
      // Ignore storage errors
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // 2. Cross-instance synchronization (Header, Sidebar, NotificationsTab, and multi-tab)
  useEffect(() => {
    const handleSync = () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            setNotifications(parsed);
          }
        }
      } catch {}
    };

    window.addEventListener(SYNC_EVENT, handleSync);
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        handleSync();
      }
    };
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener(SYNC_EVENT, handleSync);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // 3. Track authenticated user session from Supabase
  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (isMounted && data?.session?.user?.id) {
        setUserId(data.session.user.id);
      }
    });

    supabase.auth.getUser().then(({ data }) => {
      if (isMounted && data?.user?.id) {
        setUserId(data.user.id);
      }
    });

    const { data: authSub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setUserId(session?.user?.id || getInitialUserId());
      }
    });

    return () => {
      isMounted = false;
      authSub.subscription.unsubscribe();
    };
  }, []);

  // 4. Fetch notifications from Supabase database with seamless merging
  const fetchRemoteNotifications = useCallback(async (currentUserId: string) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      const { data, error } = await supabase
        .from('user_notifications')
        .select('id, title, description, is_read, type, created_at')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        if (process.env.NODE_ENV !== 'production') console.warn('[useNotifications] fetch error:', error);
        return;
      }

      const remoteItems: AppNotification[] = Array.isArray(data)
        ? data.map((row: any) => ({
            id: String(row.id),
            title: String(row.title),
            description: String(row.description),
            timestamp: new Date(row.created_at).getTime(),
            read: Boolean(row.is_read),
            type: (row.type as AppNotification['type']) || 'system',
          }))
        : [];

      setNotifications((prev) => {
        const map = new Map<string, AppNotification>();

        // Remote database items
        remoteItems.forEach((item) => map.set(item.id, item));

        // Preserve any local-only items not yet in remote DB
        prev.forEach((item) => {
          if (!map.has(item.id)) {
            map.set(item.id, item);
          }
        });

        // If completely empty, seed welcome notification
        if (map.size === 0) {
          const welcomeNotif: AppNotification = {
            id: 'welcome-radar',
            title: 'مرحباً بك في رادار',
            description: 'تم تفعيل حسابك بنجاح. رادارك الذكي جاهز لمطابقة أفضل العروض في منطقتك.',
            timestamp: Date.now(),
            read: false,
            type: 'system',
          };
          map.set(welcomeNotif.id, welcomeNotif);
          void supabase.from('user_notifications').upsert(
            {
              id: welcomeNotif.id,
              user_id: currentUserId,
              title: welcomeNotif.title,
              description: welcomeNotif.description,
              type: welcomeNotif.type,
              is_read: false,
            },
            { onConflict: 'id' }
          );
        }

        const merged = Array.from(map.values())
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, 50);

        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
          broadcastNotificationsSync();
        } catch {}

        return merged;
      });
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.warn('[useNotifications] fetch exception:', err);
    } finally {
      isFetchingRef.current = false;
      setIsLoaded(true);
    }
  }, []);

  // Fetch when user ID is available
  useEffect(() => {
    if (userId) {
      void fetchRemoteNotifications(userId);
    }
  }, [userId, fetchRemoteNotifications]);

  // 5. Realtime Postgres changes on user_notifications
  useEffect(() => {
    if (!userId) return;

    const channelName = `realtime-user-notifications-${userId}-${Math.random().toString(36).slice(2, 6)}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void fetchRemoteNotifications(userId);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId, fetchRemoteNotifications]);

  // 6. Add notification
  const addNotification = useCallback((item: Omit<AppNotification, 'timestamp' | 'read'> & { id?: string; read?: boolean }) => {
    const notifId = item.id || `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newNotif: AppNotification = {
      ...item,
      id: notifId,
      timestamp: Date.now(),
      read: item.read ?? false,
    };

    setNotifications((prev) => {
      const filtered = prev.filter((n) => n.id !== notifId);
      const updated = [newNotif, ...filtered].slice(0, 50);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        broadcastNotificationsSync();
      } catch {}
      return updated;
    });

    const targetUserId = userId || getInitialUserId();
    if (targetUserId) {
      void supabase.from('user_notifications').upsert({
        id: newNotif.id,
        user_id: targetUserId,
        title: newNotif.title,
        description: newNotif.description,
        type: newNotif.type || 'system',
        is_read: newNotif.read,
        created_at: new Date(newNotif.timestamp).toISOString(),
      }, { onConflict: 'id' });
    }
  }, [userId]);

  // 7. Mark single notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n));
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        broadcastNotificationsSync();
      } catch {}
      return updated;
    });

    const targetUserId = userId || getInitialUserId();
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
  }, [userId]);

  // 8. Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        broadcastNotificationsSync();
      } catch {}
      return updated;
    });

    const targetUserId = userId || getInitialUserId();
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
  }, [userId]);

  // 9. Delete specific notifications (single or bulk)
  const deleteNotifications = useCallback(async (idsToDelete: string[]) => {
    if (!idsToDelete || idsToDelete.length === 0) return;
    const deleteSet = new Set(idsToDelete);

    setNotifications((prev) => {
      const updated = prev.filter((n) => !deleteSet.has(n.id));
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        broadcastNotificationsSync();
      } catch {}
      return updated;
    });

    const targetUserId = userId || getInitialUserId();
    if (!targetUserId) return;

    try {
      const { error: rpcErr } = await supabase.rpc('delete_user_notifications', { p_ids: idsToDelete });
      if (rpcErr) {
        await supabase
          .from('user_notifications')
          .delete()
          .in('id', idsToDelete)
          .eq('user_id', targetUserId);
      }
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.warn('[useNotifications] delete error:', err);
    }
  }, [userId]);

  // 10. Clear all local notifications and remote sync
  const clearAll = useCallback(async () => {
    setNotifications([]);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      broadcastNotificationsSync();
    } catch {}

    const targetUserId = userId || getInitialUserId();
    if (!targetUserId) return;

    try {
      await supabase
        .from('user_notifications')
        .delete()
        .eq('user_id', targetUserId);
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.warn('[useNotifications] clearAll exception:', err);
    }
  }, [userId]);

  // 11. Listen to global app-notification custom events
  useEffect(() => {
    const handleEvent = (e: Event) => {
      const detail = (e as CustomEvent<Omit<AppNotification, 'timestamp' | 'read'> & { id?: string; read?: boolean }>).detail;
      if (detail?.title) {
        addNotification(detail);
      }
    };

    window.addEventListener('app-notification', handleEvent);
    return () => window.removeEventListener('app-notification', handleEvent);
  }, [addNotification]);

  const unreadCount = notifications.filter((n) => !n.read).length;
  const hasUnread = unreadCount > 0;

  return {
    notifications,
    unreadCount,
    hasUnread,
    markAsRead,
    markAllAsRead,
    addNotification,
    deleteNotifications,
    clearAll,
    isLoaded,
    refreshNotifications: () => {
      const targetUserId = userId || getInitialUserId();
      if (targetUserId) void fetchRemoteNotifications(targetUserId);
    },
  };
}
