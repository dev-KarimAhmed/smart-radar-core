import { useState, useMemo, useEffect } from 'react';
import { isAdminNotification, type AppNotification } from '@/shared/hooks/use-notifications';
import { recordAdminNotificationSeen } from '../../services/legal-log-service';
import { resolveNotificationForDisplay, requestBatchTranslation } from '@/shared/utils/notification-i18n';

interface UseNotificationsTabStateParams {
  notifications: AppNotification[];
  isArabic: boolean;
  userId?: string;
  markAsRead: (id: string) => Promise<void>;
  deleteNotifications: (ids: string[]) => Promise<void>;
}

export function useNotificationsTabState({
  notifications,
  isArabic,
  userId,
  markAsRead,
  deleteNotifications,
}: UseNotificationsTabStateParams) {
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewingNotification, setViewingNotification] = useState<AppNotification | null>(null);
  const [translationRevision, setTranslationRevision] = useState(0);

  const parsedById = useMemo(() => {
    void translationRevision;
    const map = new Map<string, ReturnType<typeof resolveNotificationForDisplay>>();
    for (const item of notifications) {
      map.set(item.id, resolveNotificationForDisplay(item, isArabic));
    }
    return map;
  }, [notifications, isArabic, translationRevision]);

  useEffect(() => {
    const missingTexts: string[] = [];
    for (const parsed of parsedById.values()) {
      if (parsed.titleNeedsTranslation && parsed.title) {
        missingTexts.push(parsed.title);
      }
      if (parsed.descriptionNeedsTranslation && parsed.description) {
        missingTexts.push(parsed.description);
      }
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

  const allSelected = notifications.length > 0 && selectedIds.size === notifications.length;

  const toggleSelectMode = () => {
    if (isSelectMode) {
      setIsSelectMode(false);
      setSelectedIds(new Set());
    } else {
      setIsSelectMode(true);
    }
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(notifications.map((n: AppNotification) => n.id)));
    }
  };

  const toggleItem = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    const ids = Array.from(selectedIds);
    await deleteNotifications(ids);
    setSelectedIds(new Set());
    setIsSelectMode(false);
  };

  const handleItemClick = (item: AppNotification) => {
    if (isSelectMode) {
      toggleItem(item.id);
    } else {
      if (!item.read) {
        void markAsRead(item.id);
      } else if (isAdminNotification(item) && userId) {
        const parsedItem = parsedById.get(item.id) || resolveNotificationForDisplay(item, isArabic);
        void recordAdminNotificationSeen({
          userId,
          notificationId: item.id,
          notificationTitle: parsedItem.title || item.title,
          notificationDescription: parsedItem.description || item.description,
          isArabic,
        });
      }
      setViewingNotification(item);
    }
  };

  return {
    isSelectMode,
    selectedIds,
    allSelected,
    viewingNotification,
    setViewingNotification,
    parsedById,
    toggleSelectMode,
    toggleSelectAll,
    handleDeleteSelected,
    handleItemClick,
  };
}
