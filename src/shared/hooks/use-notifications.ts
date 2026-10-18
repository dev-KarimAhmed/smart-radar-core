'use client';

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  timestamp: number;
  read: boolean;
  type?: 'info' | 'offer' | 'trip' | 'system' | 'WALLET_CREDIT' | 'WALLET_ALERT' | 'admin_message' | string;
}

const STORAGE_KEY = 'radar_user_notifications_v1';

// --- Singleton Memory Store ---
let memoryNotifications: AppNotification[] = [];
let isStoreInitialized = false;
let isStoreLoaded = false;
const storeListeners = new Set<() => void>();

function initStoreIfNeeded(): void {
  if (isStoreInitialized || typeof window === 'undefined') return;
  isStoreInitialized = true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        memoryNotifications = parsed;
        isStoreLoaded = true;
        return;
      }
    }

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
    memoryNotifications = initial;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
    isStoreLoaded = true;
  } catch {
    isStoreLoaded = true;
  }
}

function notifyStoreListeners(): void {
  for (const listener of storeListeners) {
    listener();
  }
}

function updateStore(newItems: AppNotification[]): void {
  memoryNotifications = newItems;
  isStoreLoaded = true;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
    } catch {}
  }
  notifyStoreListeners();
}

function subscribeStore(callback: () => void): () => void {
  storeListeners.add(callback);
  return () => {
    storeListeners.delete(callback);
  };
}

function getSnapshot(): AppNotification[] {
  initStoreIfNeeded();
  return memoryNotifications;
}

const SERVER_SNAPSHOT: AppNotification[] = [];
function getServerSnapshot(): AppNotification[] {
  return SERVER_SNAPSHOT;
}

// Multi-tab storage sync
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY && e.newValue) {
      try {
        const parsed = JSON.parse(e.newValue);
        if (Array.isArray(parsed)) {
          memoryNotifications = parsed;
          notifyStoreListeners();
        }
      } catch {}
    }
  });
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

let isGlobalFetching = false;
let lastFetchTimestamp = 0;

async function fetchRemoteNotificationsGlobal(currentUserId: string): Promise<void> {
  const now = Date.now();
  if (isGlobalFetching || now - lastFetchTimestamp < 1500) return;
  isGlobalFetching = true;
  lastFetchTimestamp = now;

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

    const map = new Map<string, AppNotification>();
    remoteItems.forEach((item) => map.set(item.id, item));

    // Preserve any local items not yet in remote DB
    memoryNotifications.forEach((item) => {
      if (!map.has(item.id)) {
        map.set(item.id, item);
      }
    });

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

    updateStore(merged);
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.warn('[useNotifications] fetch exception:', err);
  } finally {
    isGlobalFetching = false;
  }
}

// Single active realtime channel manager
let activeRealtimeUserId: string | null = null;
let activeChannel: any = null;
let latestToastFn: ((title: string, desc?: string, variant?: 'default' | 'destructive') => void) | null = null;

function setupRealtimeChannelIfNeeded(userId: string) {
  if (activeRealtimeUserId === userId && activeChannel) return;

  if (activeChannel) {
    void supabase.removeChannel(activeChannel);
    activeChannel = null;
  }

  activeRealtimeUserId = userId;
  const channelName = `realtime-user-notifications-${userId}`;

  activeChannel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'user_notifications',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        if (payload.eventType === 'INSERT' && payload.new) {
          const newRow = payload.new as any;
          if (newRow?.title) {
            if (latestToastFn) {
              latestToastFn(
                newRow.title,
                newRow.description || '',
                newRow.type === 'WALLET_ALERT' || newRow.type === 'urgent' || newRow.type === 'warning' ? 'destructive' : 'default'
              );
            }

            try {
              const audio = new Audio('/sounds/notification.mp3');
              void audio.play().catch(() => {});
            } catch {}

            if (
              newRow.type === 'WALLET_CREDIT' ||
              newRow.type === 'WALLET_ALERT' ||
              String(newRow.id || '').includes('rcpt') ||
              String(newRow.id || '').includes('top')
            ) {
              window.dispatchEvent(new CustomEvent('radar-wallet-refresh'));
            }
          }
        }
        void fetchRemoteNotificationsGlobal(userId);
      }
    )
    .subscribe();
}

export function useNotifications() {
  const notifications = useSyncExternalStore(subscribeStore, getSnapshot, getServerSnapshot);
  const [userId, setUserId] = useState<string | null>(() => getInitialUserId());
  const { toast } = useToast();

  // Register latest toast caller
  useEffect(() => {
    latestToastFn = (title, desc, variant) => {
      toast({
        title,
        description: desc,
        variant,
      });
    };
  }, [toast]);

  // Track authenticated user session from Supabase
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

  // Fetch when user ID is available
  useEffect(() => {
    if (userId) {
      void fetchRemoteNotificationsGlobal(userId);
    }
  }, [userId]);

  // Realtime channel listener
  useEffect(() => {
    if (!userId) return;
    setupRealtimeChannelIfNeeded(userId);
  }, [userId]);

  // Add notification
  const addNotification = useCallback((item: Omit<AppNotification, 'timestamp' | 'read'> & { id?: string; read?: boolean }) => {
    const notifId = item.id || `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newNotif: AppNotification = {
      ...item,
      id: notifId,
      timestamp: Date.now(),
      read: item.read ?? false,
    };

    const filtered = memoryNotifications.filter((n) => n.id !== notifId);
    const updated = [newNotif, ...filtered].slice(0, 50);
    updateStore(updated);

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

  // Mark single notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    const updated = memoryNotifications.map((n) => (n.id === notificationId ? { ...n, read: true } : n));
    updateStore(updated);

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

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    const updated = memoryNotifications.map((n) => ({ ...n, read: true }));
    updateStore(updated);

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

  // Delete specific notifications (single or bulk)
  const deleteNotifications = useCallback(async (idsToDelete: string[]) => {
    if (!idsToDelete || idsToDelete.length === 0) return;
    const deleteSet = new Set(idsToDelete);
    const updated = memoryNotifications.filter((n) => !deleteSet.has(n.id));
    updateStore(updated);

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

  // Clear all
  const clearAll = useCallback(async () => {
    updateStore([]);

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

  // Listen to global app-notification custom events
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
    isLoaded: isStoreLoaded,
    refreshNotifications: () => {
      const targetUserId = userId || getInitialUserId();
      if (targetUserId) void fetchRemoteNotificationsGlobal(targetUserId);
    },
  };
}
