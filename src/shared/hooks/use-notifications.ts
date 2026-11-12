'use client';

import { useState, useEffect, useCallback, useSyncExternalStore } from 'react';
import { supabase } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';
import {
  resolveNotificationForDisplay,
  requestBatchTranslation,
} from '@/shared/utils/notification-i18n';
import { playNotificationSound } from '@/shared/utils/notification-sound';
import { readStoredDashboardLanguage } from '@/lib/i18n/language-storage';
import { recordAdminNotificationSeen } from '@/features/account/services/legal-log-service';
import { getSupabaseAuthHeaders } from '@/shared/services/supabase-auth-headers';

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  timestamp: number;
  read: boolean;
  type?: 'info' | 'offer' | 'trip' | 'system' | 'WALLET_CREDIT' | 'WALLET_ALERT' | 'admin_message' | 'referral' | string;
}

const LEGACY_STORAGE_KEY = 'radar_user_notifications_v1';
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
          const userDeletedIds = getDeletedNotificationIds(newUserId);
          const filtered = parsed.filter((item) => !isNotificationExpired(item) && !userDeletedIds.has(item.id));
          memoryNotifications = filtered;
          isStoreLoaded = true;
          notifyStoreListeners();
          if (filtered.length !== parsed.length && storageKey) {
            try {
              localStorage.setItem(storageKey, JSON.stringify(filtered));
            } catch {}
          }
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
  const seenIds = new Set<string>();
  const deduplicated: AppNotification[] = [];
  for (const item of newItems) {
    if (!seenIds.has(item.id) && !isNotificationExpired(item)) {
      seenIds.add(item.id);
      deduplicated.push(item);
    }
  }
  memoryNotifications = deduplicated;
  isStoreLoaded = true;
  if (typeof window !== 'undefined' && uid) {
    try {
      const storageKey = getNotificationStorageKey(uid);
      if (storageKey) {
        localStorage.setItem(storageKey, JSON.stringify(deduplicated));
      }
    } catch {}
  }
  notifyStoreListeners();
}

let lastAddedNotificationHash = '';
let lastAddedNotificationTimestamp = 0;

const ALLOWED_CLIENT_NOTIFICATION_TYPES = new Set(['info', 'offer', 'trip', 'system']);
const FORBIDDEN_CLIENT_NOTIFICATION_ID_PATTERN =
  /(rcpt|topup|notif_top|notif_admin|notif_welcome|notif_inact|notif_ref|notif_verif|notif_status|notif_tier|notif_clear)/i;

export function addNotificationToStore(
  item: Omit<AppNotification, 'timestamp' | 'read'> & { id?: string; read?: boolean },
  targetUserId?: string | null
): void {
  const uid = targetUserId || currentStoreUserId || getInitialUserId();
  if (!uid) return;

  const now = Date.now();
  // Content hash deduplication: prevent identical rapid notifications within 1500ms
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

  const filtered = memoryNotifications.filter((n) => n.id !== notifId);
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
function bindGlobalAppNotificationListener(): void {
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

// Track deleted notification IDs in current session and persistent storage to prevent resurrection
const deletedNotificationIds = new Set<string>();

export function getDeletedNotificationIds(userId: string | null): Set<string> {
  const set = new Set<string>(deletedNotificationIds);
  if (!userId || typeof window === 'undefined') return set;
  try {
    const raw = localStorage.getItem(`radar_deleted_notifs_${userId}`);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        arr.forEach((id) => set.add(String(id)));
      }
    }
  } catch {}
  return set;
}

export function persistDeletedNotificationIds(userId: string | null, ids: string[]): void {
  if (!userId || typeof window === 'undefined' || ids.length === 0) return;
  try {
    const key = `radar_deleted_notifs_${userId}`;
    const existing = getDeletedNotificationIds(userId);
    ids.forEach((id) => {
      deletedNotificationIds.add(id);
      existing.add(id);
    });
    const arr = Array.from(existing).slice(-200);
    localStorage.setItem(key, JSON.stringify(arr));
  } catch {}
}

let isGlobalFetching = false;
let lastFetchTimestamp = 0;
let pendingForcedFetchUserId: string | null = null;

async function fetchRemoteNotificationsGlobal(targetUserId: string, force = false): Promise<void> {
  if (!targetUserId) return;
  const now = Date.now();
  if (isGlobalFetching) {
    if (force) pendingForcedFetchUserId = targetUserId;
    return;
  }
  if (!force && now - lastFetchTimestamp < 1500) return;
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

    const userDeletedIds = getDeletedNotificationIds(targetUserId);
    const expiredRemoteTripIds: string[] = [];

    const remoteItems: AppNotification[] = Array.isArray(data)
      ? data
          .filter((row: any) => {
            const notifId = String(row.id);
            if (deletedNotificationIds.has(notifId) || userDeletedIds.has(notifId)) return false;
            const ts = new Date(row.created_at).getTime();
            if ((row.type === 'trip' || row.type === 'offer') && now - ts > SEVENTY_TWO_HOURS_MS) {
              expiredRemoteTripIds.push(notifId);
              return false;
            }
            return true;
          })
          .map((row: any) => ({
            id: String(row.id),
            title: String(row.title),
            description: String(row.description),
            timestamp: new Date(row.created_at).getTime(),
            read: Boolean(row.is_read),
            type: (row.type as AppNotification['type']) || 'system',
          }))
      : [];

    if (expiredRemoteTripIds.length > 0) {
      // In background, cleanly purge expired trip notifications from server
      void supabase.from('user_notifications').delete().in('id', expiredRemoteTripIds);
    }

    const map = new Map<string, AppNotification>();
    remoteItems.forEach((item) => map.set(item.id, item));

    // Preserve any local items for this same user not yet in remote DB
    if (currentStoreUserId === targetUserId) {
      memoryNotifications.forEach((item) => {
        if (!deletedNotificationIds.has(item.id) && !userDeletedIds.has(item.id) && !isNotificationExpired(item) && !map.has(item.id)) {
          map.set(item.id, item);
        }
      });
    }

    // New accounts start with exactly 0 notifications!
    // No hardcoded dummy welcome notifications inserted.

    const merged = Array.from(map.values())
      .filter((item) => !isNotificationExpired(item))
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 50);

    updateStore(merged, targetUserId);
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.warn('[useNotifications] fetch exception:', err);
  } finally {
    isGlobalFetching = false;
    if (pendingForcedFetchUserId && pendingForcedFetchUserId === currentStoreUserId) {
      const nextUid = pendingForcedFetchUserId;
      pendingForcedFetchUserId = null;
      void fetchRemoteNotificationsGlobal(nextUid, true);
    }
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
            // Optimistically prepend realtime row into memory store so UI updates instantaneously
            const optimisticItem: AppNotification = {
              id: String(newRow.id || `rt_${Date.now()}`),
              title: String(newRow.title),
              description: String(newRow.description || ''),
              timestamp: newRow.created_at ? new Date(newRow.created_at).getTime() : Date.now(),
              read: Boolean(newRow.is_read),
              type: (newRow.type as AppNotification['type']) || 'system',
            };
            const userDeletedIds = getDeletedNotificationIds(userId);
            if (
              currentStoreUserId === userId &&
              !deletedNotificationIds.has(optimisticItem.id) &&
              !userDeletedIds.has(optimisticItem.id) &&
              !isNotificationExpired(optimisticItem)
            ) {
              const filtered = memoryNotifications.filter((item) => item.id !== optimisticItem.id);
              updateStore([optimisticItem, ...filtered].slice(0, 50), userId);
            }

            const isArabic = typeof window !== 'undefined' ? readStoredDashboardLanguage() === 'ar' : true;
            const targetLang: 'ar' | 'en' = isArabic ? 'ar' : 'en';
            let parsed = resolveNotificationForDisplay(newRow, isArabic);

            const fireToast = (title: string, description: string) => {
              if (latestToastFn) {
                latestToastFn(
                  title,
                  description,
                  newRow.type === 'WALLET_ALERT' || newRow.type === 'urgent' || newRow.type === 'warning' ? 'destructive' : 'default'
                );
              }
            };

            if (parsed.titleNeedsTranslation || parsed.descriptionNeedsTranslation) {
              const missing: string[] = [];
              if (parsed.titleNeedsTranslation && parsed.title) missing.push(parsed.title);
              if (parsed.descriptionNeedsTranslation && parsed.description) missing.push(parsed.description);
              void Promise.race([
                requestBatchTranslation(missing, targetLang),
                new Promise<Record<string, string>>((resolve) => setTimeout(() => resolve({}), 2500)),
              ]).then(() => {
                parsed = resolveNotificationForDisplay(newRow, isArabic);
                fireToast(parsed.title, parsed.description);
              });
            } else {
              fireToast(parsed.title, parsed.description);
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
        void fetchRemoteNotificationsGlobal(userId, true);
      }
    )
    .subscribe();
}

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
    const targetUserId = explicitUserId || userId || currentStoreUserId || getInitialUserId();
    addNotificationToStore(item, targetUserId);
  }, [userId, explicitUserId]);

  // Mark single notification as read
  const markAsRead = useCallback(async (notificationId: string) => {
    const targetUserId = explicitUserId || userId || currentStoreUserId || getInitialUserId();
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
  }, [userId, explicitUserId]);

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    const targetUserId = explicitUserId || userId || currentStoreUserId || getInitialUserId();
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
  }, [userId, explicitUserId]);

  // Delete specific notifications (single or bulk)
  const deleteNotifications = useCallback(async (idsToDelete: string[]) => {
    if (!idsToDelete || idsToDelete.length === 0) return;
    const targetUserId = explicitUserId || userId || currentStoreUserId || getInitialUserId();
    const deleteSet = new Set(idsToDelete);
    idsToDelete.forEach((id) => deletedNotificationIds.add(id));
    persistDeletedNotificationIds(targetUserId, idsToDelete);
    const updated = memoryNotifications.filter((n) => !deleteSet.has(n.id));
    updateStore(updated, targetUserId);

    try {
      // 1. Authoritative backend API deletion (via service role with verified Bearer token)
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

      // 2. Client-side RPC & direct query as fast parallel paths
      const rpcPromise = Promise.resolve(
        supabase.rpc('delete_user_notifications', { p_ids: idsToDelete })
      ).catch(() => null);

      const directPromise = (async () => {
        try {
          await supabase
            .from('user_notifications')
            .delete()
            .in('id', idsToDelete);
        } catch {}
      })();

      await Promise.allSettled([apiPromise, rpcPromise, directPromise]);
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.warn('[useNotifications] delete error:', err);
    }
  }, [userId, explicitUserId]);

  // Clear all
  const clearAll = useCallback(async (idsToClear?: string[]) => {
    // If specific IDs were specified, delegate directly to deleteNotifications to prevent cross-category wipeouts
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
      // 1. Authoritative backend API clear-all
      const authHeaders = await getSupabaseAuthHeaders({ 'Content-Type': 'application/json' });
      const apiPromise = authHeaders.Authorization
        ? fetch('/api/notifications', {
            method: 'DELETE',
            headers: authHeaders,
            body: JSON.stringify({
              all: true,
            }),
          }).catch((err) => {
            if (process.env.NODE_ENV !== 'production') console.warn('[useNotifications] API clearAll error:', err);
          })
        : Promise.resolve();

      // 2. Client-side RPC with IDs
      const rpcPromise = ids.length > 0
        ? Promise.resolve(supabase.rpc('delete_user_notifications', { p_ids: ids })).catch(() => null)
        : Promise.resolve(null);

      // 3. Client-side direct delete on table
      const directPromise = (async () => {
        try {
          if (targetUserId) {
            await supabase
              .from('user_notifications')
              .delete()
              .eq('user_id', targetUserId);
          }
        } catch {}
      })();

      await Promise.allSettled([apiPromise, rpcPromise, directPromise]);
    } catch (err) {
      if (process.env.NODE_ENV !== 'production') console.warn('[useNotifications] clearAll exception:', err);
    }
  }, [userId, explicitUserId, deleteNotifications]);

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
