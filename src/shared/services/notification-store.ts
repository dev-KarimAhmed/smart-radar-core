import { supabase } from '@/lib/supabase-client';
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
export let memoryNotifications: AppNotification[] = [];
export let currentStoreUserId: string | null = null;
let isStoreInitialized = false;
export let isStoreLoaded = false;
const storeListeners = new Set<() => void>();

export function getInitialUserId(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const rawMock =
      window.localStorage.getItem('radar_sovereign_mock_user') ||
      window.sessionStorage.getItem('radar_sovereign_mock_user');
    if (rawMock) {
      const parsedMock = JSON.parse(rawMock);
      if (parsedMock?.uid) return String(parsedMock.uid);
    }
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

export function initStoreIfNeeded(explicitUserId?: string | null): void {
  if (isStoreInitialized || typeof window === 'undefined') return;
  const targetUserId = explicitUserId !== undefined ? explicitUserId : getInitialUserId();
  switchStoreUser(targetUserId);
}

export function notifyStoreListeners(): void {
  for (const listener of storeListeners) {
    listener();
  }
}

export function updateStore(newItems: AppNotification[], targetUserId?: string | null): void {
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

  void supabase.from('user_notifications').upsert(
    {
      id: newNotif.id,
      user_id: uid,
      title: newNotif.title,
      description: newNotif.description,
      type: newNotif.type || 'system',
      is_read: newNotif.read,
      created_at: new Date(newNotif.timestamp).toISOString(),
    },
    { onConflict: 'id' }
  );
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

export function subscribeStore(callback: () => void): () => void {
  storeListeners.add(callback);
  return () => {
    storeListeners.delete(callback);
  };
}

export function getSnapshot(): AppNotification[] {
  initStoreIfNeeded();
  return memoryNotifications;
}

const SERVER_SNAPSHOT: AppNotification[] = [];
export function getServerSnapshot(): AppNotification[] {
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
export const deletedNotificationIds = new Set<string>();

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

export async function fetchRemoteNotificationsGlobal(targetUserId: string): Promise<void> {
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
      void supabase.from('user_notifications').delete().in('id', expiredRemoteTripIds);
    }

    const map = new Map<string, AppNotification>();
    remoteItems.forEach((item) => map.set(item.id, item));

    if (currentStoreUserId === targetUserId) {
      memoryNotifications.forEach((item) => {
        if (
          !deletedNotificationIds.has(item.id) &&
          !userDeletedIds.has(item.id) &&
          !isNotificationExpired(item) &&
          !map.has(item.id)
        ) {
          map.set(item.id, item);
        }
      });
    }

    const merged = Array.from(map.values())
      .filter((item) => !isNotificationExpired(item))
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 50);

    updateStore(merged, targetUserId);
  } catch (err) {
    if (process.env.NODE_ENV !== 'production') console.warn('[useNotifications] fetch exception:', err);
  } finally {
    isGlobalFetching = false;
  }
}

let activeRealtimeUserId: string | null = null;
let activeChannel: any = null;
let latestToastFn: ((title: string, desc?: string, variant?: 'default' | 'destructive') => void) | null = null;

export function setLatestToastFunction(
  fn: ((title: string, desc?: string, variant?: 'default' | 'destructive') => void) | null
): void {
  latestToastFn = fn;
}

export function setupRealtimeChannelIfNeeded(userId: string | null): void {
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
                newRow.type === 'WALLET_ALERT' || newRow.type === 'urgent' || newRow.type === 'warning'
                  ? 'destructive'
                  : 'default'
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
