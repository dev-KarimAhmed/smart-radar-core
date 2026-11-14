import { supabase } from '@/lib/supabase-client';
import {
  resolveNotificationForDisplay,
  requestBatchTranslation,
} from '@/shared/utils/notification-i18n';
import { playNotificationSound } from '@/shared/utils/notification-sound';
import { readStoredDashboardLanguage } from '@/lib/i18n/language-storage';
import {
  type AppNotification,
  SEVENTY_TWO_HOURS_MS,
  isNotificationExpired,
} from './notification-types';
import {
  getMemoryNotifications,
  getCurrentStoreUserId,
  updateStore,
} from './notification-store';
import {
  getDeletedNotificationIds,
  deletedNotificationIds,
} from './notification-deleted-tracker';

let isGlobalFetching = false;
let lastFetchTimestamp = 0;
let pendingForcedFetchUserId: string | null = null;

export async function fetchRemoteNotificationsGlobal(targetUserId: string, force = false): Promise<void> {
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

    if (getCurrentStoreUserId() !== targetUserId) return;

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

    if (getCurrentStoreUserId() === targetUserId) {
      getMemoryNotifications().forEach((item) => {
        if (!deletedNotificationIds.has(item.id) && !userDeletedIds.has(item.id) && !isNotificationExpired(item) && !map.has(item.id)) {
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
    if (pendingForcedFetchUserId && pendingForcedFetchUserId === getCurrentStoreUserId()) {
      const nextUid = pendingForcedFetchUserId;
      pendingForcedFetchUserId = null;
      void fetchRemoteNotificationsGlobal(nextUid, true);
    }
  }
}

let activeRealtimeUserId: string | null = null;
let activeChannel: any = null;
let latestToastFn: ((title: string, desc?: string, variant?: 'default' | 'destructive') => void) | null = null;

export function setLatestToastFn(fn: ((title: string, desc?: string, variant?: 'default' | 'destructive') => void) | null): void {
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
              getCurrentStoreUserId() === userId &&
              !deletedNotificationIds.has(optimisticItem.id) &&
              !userDeletedIds.has(optimisticItem.id) &&
              !isNotificationExpired(optimisticItem)
            ) {
              const filtered = getMemoryNotifications().filter((item) => item.id !== optimisticItem.id);
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
