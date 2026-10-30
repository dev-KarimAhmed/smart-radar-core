'use client';

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';
import { parseNotificationContent } from '@/shared/utils/notification-i18n';
import { playNotificationSound } from '@/shared/utils/notification-sound';
import { readStoredDashboardLanguage } from '@/lib/i18n/language-storage';

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  timestamp: number;
  read: boolean;
  type?: 'info' | 'offer' | 'trip' | 'system' | 'WALLET_CREDIT' | 'WALLET_ALERT' | 'admin_message' | 'referral' | string;
}

const LEGACY_STORAGE_KEY = 'radar_user_notifications_v1';

export function getNotificationStorageKey(userId: string | null): string | null {
  if (!userId) return null;
  return `radar_user_notifications_${userId}`;
}

// --- Singleton Memory Store ---
let memoryNotifications: AppNotification[] = [];
let currentStoreUserId: string | null = null;
let isStoreInitialized = false;
let isStoreLoaded = false;
const storeListeners = new Set<() => void>();

export function getInitialUserId(): string | null {
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

function purgeLegacyStorage(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {}
}

export function switchStoreUser(newUserId: string | null): void {
  purgeLegacyStorage();

  if (currentStoreUserId === newUserId && isStoreInitialized) {
    return;
  }

  currentStoreUserId = newUserId;
  isStoreInitialized = true;

  if (!newUserId) {
    memoryNotifications = [];
    isStoreLoaded = true;
    notifyStoreListeners();
    return;
  }

  if (typeof window !== 'undefined') {
    try {
      const storageKey = getNotificationStorageKey(newUserId);
      const raw = storageKey ? localStorage.getItem(storageKey) : null;
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          memoryNotifications = parsed;
          isStoreLoaded = true;
          notifyStoreListeners();
          return;
        }
      }
    } catch {}
  }

  // New user or no cached notifications: starts cleanly with 0 notifications
  memoryNotifications = [];
  isStoreLoaded = true;
  notifyStoreListeners();
}

export function clearNotificationMemoryStore(): void {
  purgeLegacyStorage();
  if (typeof window !== 'undefined' && currentStoreUserId) {
    try {
      const key = getNotificationStorageKey(currentStoreUserId);
      if (key) localStorage.removeItem(key);
    } catch {}
  }
  memoryNotifications = [];
  currentStoreUserId = null;
  isStoreInitialized = true;
  isStoreLoaded = true;
  notifyStoreListeners();
}

function initStoreIfNeeded(explicitUserId?: string | null): void {
  if (isStoreInitialized || typeof window === 'undefined') return;
  const targetUserId = explicitUserId !== undefined ? explicitUserId : getInitialUserId();
  switchStoreUser(targetUserId);
}

function notifyStoreListeners(): void {
  for (const listener of storeListeners) {
    listener();
  }
}

function updateStore(newItems: AppNotification[], targetUserId?: string | null): void {
  const uid = targetUserId || currentStoreUserId;
  memoryNotifications = newItems;
  isStoreLoaded = true;
  if (typeof window !== 'undefined' && uid) {
    try {
      const storageKey = getNotificationStorageKey(uid);
      if (storageKey) {
        localStorage.setItem(storageKey, JSON.stringify(newItems));
      }
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
    if (!currentStoreUserId) return;
    const currentKey = getNotificationStorageKey(currentStoreUserId);
    if (!currentKey) return;

    if (e.key === currentKey) {
      if (e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            memoryNotifications = parsed;
            notifyStoreListeners();
          }
        } catch {}
      } else {
        memoryNotifications = [];
        notifyStoreListeners();
      }
    }
  });
}

// Track deleted notification IDs in current session to prevent resurrection
const deletedNotificationIds = new Set<string>();

let isGlobalFetching = false;
let lastFetchTimestamp = 0;

async function fetchRemoteNotificationsGlobal(targetUserId: string): Promise<void> {
  if (!targetUserId) return;
  const now = Date.now();
  if (isGlobalFetching || now - lastFetchTimestamp < 1500) return;
  isGlobalFetching = true;
  lastFetchTimestamp = now;

  try {
    const { data, error } = await supabase
      .from('user_notifications')
      .select('id, title, description, is_read, type, created_at')
      .eq('user_id', targetUserId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) {
      if (process.env.NODE_ENV !== 'production') console.warn('[useNotifications] fetch error:', error);
      return;
    }

    // If the active user changed while request was in-flight, discard response
    if (currentStoreUserId !== targetUserId) return;

    const remoteItems: AppNotification[] = Array.isArray(data)
      ? data
          .filter((row: any) => !deletedNotificationIds.has(String(row.id)))
          .map((row: any) => ({
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

    // Preserve any local items for this same user not yet in remote DB
    if (currentStoreUserId === targetUserId) {
      memoryNotifications.forEach((item) => {
        if (!deletedNotificationIds.has(item.id) && !map.has(item.id)) {
          map.set(item.id, item);
        }
      });
    }

    // New accounts start with exactly 0 notifications!
    // No hardcoded dummy welcome notifications inserted.

    const merged = Array.from(map.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 50);

    updateStore(merged, targetUserId);
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

function setupRealtimeChannelIfNeeded(userId: string | null): void {
  if (!userId) {
    if (activeChannel) {
      void supabase.removeChannel(activeChannel);
      activeChannel = null;
    }
    activeRealtimeUserId = null;
    return;
  }

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
            const isArabic = typeof window !== 'undefined' ? readStoredDashboardLanguage() === 'ar' : true;
            const parsed = parseNotificationContent(newRow, isArabic);
            if (latestToastFn) {
              latestToastFn(
                parsed.title,
                parsed.description,
                newRow.type === 'WALLET_ALERT' || newRow.type === 'urgent' || newRow.type === 'warning' ? 'destructive' : 'default'
              );
            }

            playNotificationSound();

            if (
              newRow.type === 'WALLET_CREDIT' ||
              newRow.type === 'WALLET_ALERT' ||
              String(newRow.id || '').includes('rcpt') ||
              String(newRow.id || '').includes('top')
            ) {
              window.dispatchEvent(new CustomEvent('radar-wallet-refresh'));
            }

            if (newRow.type === 'referral') {
              window.dispatchEvent(new CustomEvent('radar_favorites_updated'));
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
  const addNotification = useCallback((item: Omit<AppNotification, 'timestamp' | 'read'> & { id?: string; read?: boolean }) => {
    const targetUserId = userId || currentStoreUserId || getInitialUserId();
    if (!targetUserId) return;

    const notifId = item.id || `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const newNotif: AppNotification = {
      ...item,
      id: notifId,
      timestamp: Date.now(),
      read: item.read ?? false,
    };

    const filtered = memoryNotifications.filter((n) => n.id !== notifId);
    const updated = [newNotif, ...filtered].slice(0, 50);
    updateStore(updated, targetUserId);

    void supabase.from('user_notifications').upsert({
      id: newNotif.id,
      user_id: targetUserId,
      title: newNotif.title,
      description: newNotif.description,
      type: newNotif.type || 'system',
      is_read: newNotif.read,
      created_at: new Date(newNotif.timestamp).toISOString(),
    }, { onConflict: 'id' });
  }, [userId]);

  // Mark single notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    const targetUserId = userId || currentStoreUserId || getInitialUserId();
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
  }, [userId]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    const targetUserId = userId || currentStoreUserId || getInitialUserId();
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
  }, [userId]);

  // Delete specific notifications (single or bulk)
  const deleteNotifications = useCallback(async (idsToDelete: string[]) => {
    if (!idsToDelete || idsToDelete.length === 0) return;
    const targetUserId = userId || currentStoreUserId || getInitialUserId();
    const deleteSet = new Set(idsToDelete);
    idsToDelete.forEach((id) => deletedNotificationIds.add(id));
    const updated = memoryNotifications.filter((n) => !deleteSet.has(n.id));
    updateStore(updated, targetUserId);

    if (!targetUserId) return;

    try {
      // 1. Authoritative backend API deletion (via service role to bypass RLS/session edge cases)
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

      // 2. Client-side RPC & direct query as fast parallel paths
      const rpcPromise = Promise.resolve(
        supabase.rpc('delete_user_notifications', { p_ids: idsToDelete })
      )
        .then(async ({ data: count, error: rpcErr }) => {
          if (rpcErr || count === 0) {
            await supabase
              .from('user_notifications')
              .delete()
              .in('id', idsToDelete)
              .eq('user_id', targetUserId);
          }
        })
        .catch(() => {});

      await Promise.allSettled([apiPromise, rpcPromise]);
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.warn('[useNotifications] delete error:', err);
    }
  }, [userId]);

  // Clear all
  const clearAll = useCallback(async () => {
    const targetUserId = userId || currentStoreUserId || getInitialUserId();
    memoryNotifications.forEach((n) => deletedNotificationIds.add(n.id));
    updateStore([], targetUserId);

    if (!targetUserId) return;

    try {
      // 1. Authoritative backend API clear-all
      const session = (await supabase.auth.getSession()).data?.session;
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) {
        headers['Authorization'] = `Bearer ${session.access_token}`;
      }

      const apiPromise = fetch('/api/notifications', {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ all: true, userId: targetUserId }),
      }).catch((err) => {
        if (process.env.NODE_ENV !== 'production') console.warn('[useNotifications] API clearAll error:', err);
      });

      // 2. Client-side RPC & direct delete
      const rpcPromise = Promise.resolve(
        supabase.rpc('delete_all_user_notifications')
      )
        .then(async ({ data: count, error: rpcErr }) => {
          if (rpcErr || count === 0) {
            await supabase
              .from('user_notifications')
              .delete()
              .eq('user_id', targetUserId);
          }
        })
        .catch(() => {});

      await Promise.allSettled([apiPromise, rpcPromise]);
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
        playNotificationSound();
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
      const targetUserId = userId || currentStoreUserId || getInitialUserId();
      if (targetUserId) void fetchRemoteNotificationsGlobal(targetUserId);
    },
  };
}
