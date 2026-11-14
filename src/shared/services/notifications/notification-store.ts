import {
  type AppNotification,
  LEGACY_STORAGE_KEY,
  isNotificationExpired,
  getNotificationStorageKey,
} from './notification-types';
import { getDeletedNotificationIds } from './notification-deleted-tracker';

let memoryNotifications: AppNotification[] = [];
let currentStoreUserId: string | null = null;
let isStoreInitialized = false;
let isStoreLoaded = false;
const storeListeners = new Set<() => void>();

export function getMemoryNotifications(): AppNotification[] {
  return memoryNotifications;
}

export function getCurrentStoreUserId(): string | null {
  return currentStoreUserId;
}

export function isMemoryStoreLoaded(): boolean {
  return isStoreLoaded;
}

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
