'use client';

import { useState, useEffect, useCallback } from 'react';

export interface AppNotification {
  id: string;
  title: string;
  description: string;
  timestamp: number;
  read: boolean;
  type?: 'info' | 'offer' | 'trip' | 'system';
}

const STORAGE_KEY = 'radar_user_notifications_v1';

export function useNotifications() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage
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

      // Default initial welcome notification if empty
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

  // Save changes to localStorage
  const persist = useCallback((items: AppNotification[]) => {
    setNotifications(items);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Ignore
    }
  }, []);

  // Add notification
  const addNotification = useCallback((item: Omit<AppNotification, 'id' | 'timestamp' | 'read'>) => {
    const newNotif: AppNotification = {
      ...item,
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
      read: false,
    };
    setNotifications((prev) => {
      const updated = [newNotif, ...prev.slice(0, 19)];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  // Clear all
  const clearAll = useCallback(() => {
    persist([]);
  }, [persist]);

  // Listen to global app-notification custom events
  useEffect(() => {
    const handleEvent = (e: Event) => {
      const detail = (e as CustomEvent<{ title: string; description: string; type?: AppNotification['type'] }>).detail;
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
    markAllAsRead,
    addNotification,
    clearAll,
    isLoaded,
  };
}
