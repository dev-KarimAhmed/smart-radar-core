'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { adminFetch } from '@/features/admin/lib/admin-api-client';
import { supabase } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';
import { useTranslations } from 'next-intl';
import {
  resolveNotificationForDisplay,
  requestBatchTranslation,
} from '@/shared/utils/notification-i18n';
import type {
  AdminNotificationItem,
  NotificationsSummary,
} from '../types/admin-notification-types';
import { playNotificationChime } from '../utils/notification-chime';

export function useAdminNotificationsCenter(isArabic: boolean) {
  const t = useTranslations('adminNotifications');
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([]);
  const [summary, setSummary] = useState<NotificationsSummary>({
    totalUnread: 0,
    pendingReceiptsCount: 0,
    pendingCaptainsCount: 0,
    pendingResetsCount: 0,
    unreadSystemCount: 0,
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem('radar_admin_notif_sound') !== 'disabled';
  });
  const [runtimeTranslations, setRuntimeTranslations] = useState<Record<string, string>>({});

  const previousUnreadCountRef = useRef<number>(0);
  const isInitialLoadRef = useRef<boolean>(true);

  const fetchNotifications = useCallback(async (isManual = false) => {
    try {
      if (isManual) setLoading(true);
      const res = await adminFetch('/api/admin/notifications');
      const data = await res.json();

      if (data?.success && Array.isArray(data.notifications)) {
        setNotifications(data.notifications);
        if (data.summary) {
          const newSummary = data.summary as NotificationsSummary;
          setSummary(newSummary);

          if (
            !isInitialLoadRef.current &&
            newSummary.totalUnread > previousUnreadCountRef.current &&
            soundEnabled
          ) {
            playNotificationChime();
            toast({
              title: t('audioToastTitle'),
              description: t('audioToastDesc', { count: newSummary.totalUnread }),
            });
          }

          previousUnreadCountRef.current = newSummary.totalUnread;
          isInitialLoadRef.current = false;
        }
      }
    } catch (err) {
      console.warn('[AdminNotificationCenter] Fetch error:', err);
    } finally {
      if (isManual) setLoading(false);
    }
  }, [soundEnabled, toast, t]);

  useEffect(() => {
    void fetchNotifications();
    const interval = setInterval(() => {
      void fetchNotifications();
    }, 25000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    const channel = supabase
      .channel('admin-radar-notifications-stream')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'wallet_transactions' },
        (payload) => {
          const row = payload.new as any;
          if (row?.status === 'PENDING') {
            if (soundEnabled) {
              playNotificationChime();
              toast({
                title: t('toastNewReceiptTitle'),
                description: t('toastNewReceiptDesc', {
                  amount: row.amount || '',
                  channel: row.payment_channel || t('defaultPaymentChannel'),
                }),
              });
            }
            void fetchNotifications();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'user_notifications' },
        () => {
          void fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      void channel.unsubscribe();
    };
  }, [fetchNotifications, soundEnabled, toast, t]);

  useEffect(() => {
    if (!notifications || notifications.length === 0) return;
    const targetLang: 'ar' | 'en' = isArabic ? 'ar' : 'en';
    const pending: string[] = [];

    for (const item of notifications) {
      const resolved = resolveNotificationForDisplay(item, isArabic);
      if (resolved.titleNeedsTranslation && resolved.title) {
        const key = `${targetLang}::${resolved.title.trim()}`;
        if (!runtimeTranslations[key] && !pending.includes(resolved.title.trim())) {
          pending.push(resolved.title.trim());
        }
      }
      if (resolved.descriptionNeedsTranslation && resolved.description) {
        const key = `${targetLang}::${resolved.description.trim()}`;
        if (!runtimeTranslations[key] && !pending.includes(resolved.description.trim())) {
          pending.push(resolved.description.trim());
        }
      }
    }

    if (pending.length === 0) return;

    let cancelled = false;
    void requestBatchTranslation(pending, targetLang).then((translatedMap) => {
      if (cancelled || !translatedMap || Object.keys(translatedMap).length === 0) return;
      setRuntimeTranslations((prev) => {
        const next = { ...prev };
        let changed = false;
        for (const [src, tr] of Object.entries(translatedMap)) {
          const k = `${targetLang}::${src.trim()}`;
          if (tr && next[k] !== tr) {
            next[k] = tr;
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    });

    return () => {
      cancelled = true;
    };
  }, [notifications, isArabic, runtimeTranslations]);

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('radar_admin_notif_sound', next ? 'enabled' : 'disabled');
      }
      return next;
    });
  };

  return {
    loading,
    notifications,
    setNotifications,
    summary,
    setSummary,
    soundEnabled,
    toggleSound,
    fetchNotifications,
    runtimeTranslations,
  };
}
