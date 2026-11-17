'use client';

import { useMemo } from 'react';
import { useNotifications, type AppNotification } from '@/shared/hooks/use-notifications';
import {
  Bell,
  Check,
  Trash2,
  ListChecks,
  X,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { useAuth } from '@/hooks/use-auth';
import { useTranslations } from 'next-intl';
import { resolveNotificationForDisplay } from '@/shared/utils/notification-i18n';
import { styles } from './notifications/notifications-styles';
import { NotificationItem } from './notifications/notification-item';
import { NotificationDetailModal } from './notifications/notification-detail-modal';
import { useNotificationsTabState } from './notifications/use-notifications-tab-state';

export interface NotificationsTabProps {
  onClose?: () => void;
  filterCategory?: 'all' | 'admin' | 'trip';
}

export function NotificationsTab({ onClose, filterCategory }: NotificationsTabProps = {}) {
  const tRef = useTranslations('referral.notifications');
  const tNotifs = useTranslations('notificationsTab');
  const { user, isCaptain } = useAuth();
  const { isArabic, direction } = useDashboardLanguage();
  const {
    notifications: allNotifications,
    adminNotifications,
    tripNotifications,
    markAsRead,
    deleteNotifications,
  } = useNotifications(user?.uid);

  const effectiveCategory = filterCategory ?? (isCaptain ? 'admin' : 'all');

  const notifications: AppNotification[] = useMemo(() => {
    if (effectiveCategory === 'admin') return adminNotifications;
    if (effectiveCategory === 'trip') return tripNotifications;
    return allNotifications;
  }, [effectiveCategory, adminNotifications, tripNotifications, allNotifications]);

  const hasUnread = notifications.some((n: AppNotification) => !n.read);

  const {
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
  } = useNotificationsTabState({
    notifications,
    isArabic,
    userId: user?.uid,
    markAsRead,
    deleteNotifications,
  });

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className="flex items-center gap-2.5">
          {onClose && !isCaptain && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="border-2 border-orange-500/80 bg-gradient-to-r from-orange-500/25 via-amber-500/20 to-orange-600/25 text-orange-300 hover:text-white shadow-[0_0_15px_rgba(249,115,22,0.35)] text-xs sm:text-sm font-bold cursor-pointer transition-all active:scale-95"
            >
              <ArrowRight className="h-4 w-4 rtl:ml-1 ltr:mr-1 ltr:rotate-180" />
              <span>{tNotifs('backToHome')}</span>
            </Button>
          )}
          <h1 className={styles.title}>
            {effectiveCategory === 'admin'
              ? tNotifs('adminTitle')
              : effectiveCategory === 'trip'
              ? tNotifs('tripTitle')
              : tNotifs('generalTitle')}
          </h1>
        </div>

        <div className={styles.headerActions}>
          {notifications.length > 0 && (
            <Button
              variant='outline'
              onClick={toggleSelectMode}
              className={isSelectMode ? styles.selectModeBtnActive : styles.selectModeBtn}
            >
              {isSelectMode ? (
                <>
                  <X className={styles.actionIcon} />
                  <span>{tNotifs('cancel')}</span>
                </>
              ) : (
                <>
                  <ListChecks className={styles.actionIcon} />
                  <span>{tNotifs('select')}</span>
                </>
              )}
            </Button>
          )}

          {!isSelectMode && hasUnread && (
            <Button
              variant='outline'
              onClick={async () => {
                const unreadIds = notifications.filter((n: AppNotification) => !n.read).map((n: AppNotification) => n.id);
                if (unreadIds.length > 0) {
                  await Promise.all(unreadIds.map((id: string) => markAsRead(id)));
                }
              }}
              className={styles.markAllBtn}
            >
              <Check className={styles.actionIcon} />
              <span>{tNotifs('markAllRead')}</span>
            </Button>
          )}
        </div>
      </div>

      <div className={styles.container}>
        {/* Page 2 Sovereign Welcome Banner */}
        <div data-step1="sovereign-welcome-banner-step1" className="mb-4 flex items-center justify-between rounded-2xl border border-[#14B8A6]/30 bg-[#060B18]/95 p-3.5 shadow-lg shadow-black/25">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 text-[#14F5D5]">
              <Bell className="h-4 w-4" />
            </div>
            <p className="text-sm font-black text-white">
              {tNotifs('adNetworkPrefix')}
              <span className="text-[#14F5D5] font-black drop-shadow-[0_0_8px_rgba(20,245,213,0.4)]">
                {tNotifs('adNetworkBrand')}
              </span>
              {tNotifs('adNetworkSuffix')}
            </p>
          </div>
          <span className="text-xs font-bold text-[#14B8A6]">
            {tNotifs('adNetworkWelcome')}
          </span>
        </div>

        {/* Selection Bar in Select Mode */}
        {isSelectMode && notifications.length > 0 && (
          <div className={styles.selectionBar}>
            <div className={styles.selectionActions}>
              <Button
                variant='outline'
                size='sm'
                onClick={toggleSelectAll}
                className={styles.selectAllBtn}
              >
                {allSelected
                  ? tNotifs('deselectAll')
                  : tNotifs('selectAll')}
              </Button>
              <span className={styles.selectionCount}>
                {tNotifs('selectedCount', { selected: selectedIds.size, total: notifications.length })}
              </span>
            </div>

            <Button
              variant='outline'
              size='sm'
              disabled={selectedIds.size === 0}
              onClick={() => void handleDeleteSelected()}
              className={cn(
                styles.deleteSelectedBtn,
                selectedIds.size === 0 && styles.deleteSelectedBtnDisabled
              )}
            >
              <Trash2 className={styles.actionIcon} />
              <span>
                {tNotifs('deleteSelected', { count: selectedIds.size })}
              </span>
            </Button>
          </div>
        )}

        {notifications.length === 0 ? (
          <div className={styles.emptyState}>
            <Bell className={styles.emptyIcon} />
            <p className={styles.emptyText}>
              {effectiveCategory === 'admin'
                ? tNotifs('emptyAdmin')
                : effectiveCategory === 'trip'
                ? tNotifs('emptyTrip')
                : tNotifs('emptyGeneral')}
            </p>
          </div>
        ) : (
          <div className={styles.list}>
            {notifications.map((item: AppNotification) => (
              <NotificationItem
                key={item.id}
                item={item}
                isSelected={selectedIds.has(item.id)}
                isSelectMode={isSelectMode}
                parsed={parsedById.get(item.id) || resolveNotificationForDisplay(item, isArabic)}
                isArabic={isArabic}
                onClick={() => handleItemClick(item)}
                tNotifs={tNotifs}
                tRef={tRef}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pop-up Notification Detail Modal */}
      {viewingNotification && (
        <NotificationDetailModal
          notification={viewingNotification}
          onClose={() => setViewingNotification(null)}
          onDelete={async (id) => {
            setViewingNotification(null);
            await deleteNotifications([id]);
          }}
          isArabic={isArabic}
          direction={direction}
          parsed={parsedById.get(viewingNotification.id) || resolveNotificationForDisplay(viewingNotification, isArabic)}
          tNotifs={tNotifs}
        />
      )}
    </div>
  );
}
