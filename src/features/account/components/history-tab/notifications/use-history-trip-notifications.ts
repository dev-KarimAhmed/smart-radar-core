'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useNotifications, type AppNotification } from '@/shared/hooks/use-notifications';
import { useAuth } from '@/hooks/use-auth';
import {
  resolveNotificationForDisplay,
  requestBatchTranslation,
} from '@/shared/utils/notification-i18n';

export function useHistoryTripNotifications(isArabic: boolean, timeLabels: {
  justNow: string;
  minsAgo: (mins: number) => string;
  hoursAgo: (hours: number) => string;
  daysAgo: (days: number) => string;
}) {
  const { user } = useAuth();
  const {
    tripNotifications,
    tripUnreadCount,
    hasTripUnread,
    deleteNotifications,
    markAsRead,
  } = useNotifications(user?.uid);
  const [isExpanded, setIsExpanded] = useState(false);
  const [translationRevision, setTranslationRevision] = useState(0);

  const parsedById = useMemo(() => {
    void translationRevision;
    const map = new Map<string, ReturnType<typeof resolveNotificationForDisplay>>();
    for (const item of tripNotifications) {
      map.set(item.id, resolveNotificationForDisplay(item, isArabic));
    }
    return map;
  }, [tripNotifications, isArabic, translationRevision]);

  useEffect(() => {
    const missingTexts: string[] = [];
    for (const parsed of parsedById.values()) {
      if (parsed.titleNeedsTranslation && parsed.title) missingTexts.push(parsed.title);
      if (parsed.descriptionNeedsTranslation && parsed.description) missingTexts.push(parsed.description);
    }
    if (missingTexts.length === 0) return;

    let active = true;
    const targetLang: 'ar' | 'en' = isArabic ? 'ar' : 'en';
    void requestBatchTranslation(missingTexts, targetLang).then((translatedMap) => {
      if (active && Object.keys(translatedMap).length > 0) {
        setTranslationRevision((v) => v + 1);
      }
    });

    return () => {
      active = false;
    };
  }, [parsedById, isArabic]);

  const formatRelativeTime = (timestamp: number) => {
    try {
      const diff = Math.floor((Date.now() - timestamp) / 1000);
      if (diff < 60) return timeLabels.justNow;
      if (diff < 3600) {
        const mins = Math.floor(diff / 60);
        return timeLabels.minsAgo(mins);
      }
      if (diff < 86400) {
        const hrs = Math.floor(diff / 3600);
        return timeLabels.hoursAgo(hrs);
      }
      const days = Math.floor(diff / 86400);
      return timeLabels.daysAgo(days);
    } catch {
      return '';
    }
  };

  const handleClearAll = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (tripNotifications.length === 0) return;
    const ids = tripNotifications.map((n) => n.id);
    await deleteNotifications(ids);
  };

  const handleMarkAllTripRead = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const unread = tripNotifications.filter((n) => !n.read);
    for (const n of unread) {
      void markAsRead(n.id);
    }
  };

  const handleDeleteItem = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteNotifications([id]);
  };

  return {
    isExpanded,
    setIsExpanded,
    tripNotifications,
    tripUnreadCount,
    hasTripUnread,
    parsedById,
    markAsRead,
    formatRelativeTime,
    handleClearAll,
    handleMarkAllTripRead,
    handleDeleteItem,
  };
}
