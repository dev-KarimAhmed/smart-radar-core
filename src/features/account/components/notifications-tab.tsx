'use client';

import { useState, useMemo } from 'react';
import { useNotifications, isAdminNotification, type AppNotification } from '@/shared/hooks/use-notifications';
import { recordAdminNotificationSeen } from '../services/legal-log-service';
import { highlightBrand } from '@/shared/components/brand-highlight';
import {
  Bell,
  Check,
  Trash2,
  ListChecks,
  X,
  MessageSquare,
  ArrowRight,
  Wallet,
  ShieldAlert,
  UserCheck,
  UserX,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { useAuth } from '@/hooks/use-auth';
import { useTranslations } from 'next-intl';
import { formatNotificationShortTime } from '@/shared/utils/date-format';
import { parseNotificationContent } from '@/shared/utils/notification-i18n';
import { notificationsTabStyles as styles } from './notifications-tab-styles';
import { NotificationDetailModal } from './notification-detail-modal';

export { notificationsTabStyles } from './notifications-tab-styles';
export { NotificationDetailModal } from './notification-detail-modal';

function formatNotificationTime(timestamp: number, isArabic: boolean): string {
  return formatNotificationShortTime(timestamp, isArabic);
}

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

  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewingNotification, setViewingNotification] = useState<AppNotification | null>(null);

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
      } else if (isAdminNotification(item) && user?.uid) {
        void recordAdminNotificationSeen({
          userId: user.uid,
          notificationId: item.id,
          notificationTitle: item.title,
          notificationDescription: item.description,
          isArabic,
        });
      }
      setViewingNotification(item);
    }
  };

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <div className="flex items-center gap-2.5">
          {onClose && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="border-2 border-orange-500/80 bg-gradient-to-r from-orange-500/25 via-amber-500/20 to-orange-600/25 text-orange-300 hover:text-white shadow-[0_0_15px_rgba(249,115,22,0.35)] text-xs sm:text-sm font-bold cursor-pointer transition-all active:scale-95"
            >
              <ArrowRight className="h-4 w-4 rtl:ml-1 ltr:mr-1 ltr:rotate-180" />
              <span>{isCaptain ? tNotifs('backToRadar') : tNotifs('backToHome')}</span>
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
            {notifications.map((item: AppNotification) => {
              const isSelected = selectedIds.has(item.id);
              const isMessage = item.type === 'admin_message' || item.type === 'message';
              const isWalletCredit = item.type === 'WALLET_CREDIT';
              const isWalletAlert = item.type === 'WALLET_ALERT';
              const isReferral = item.type === 'referral';
              const isReferralInactivity = item.type === 'referral_inactivity';
              const parsed = parseNotificationContent(item, isArabic);

              return (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleItemClick(item)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      handleItemClick(item);
                    }
                  }}
                  className={cn(
                    styles.item,
                    !item.read ? styles.itemUnread : styles.itemRead,
                    isSelectMode && isSelected && styles.itemSelected,
                    (isMessage || isReferralInactivity) && !item.read && 'border-r-2 border-amber-400 bg-amber-500/5 hover:bg-amber-500/10'
                  )}
                  title={!item.read && !isSelectMode ? tNotifs('clickToViewUnread') : tNotifs('clickToView')}
                >
                  <div className={styles.itemRow}>
                    {isSelectMode && (
                      <div
                        className={cn(
                          styles.checkboxWrap,
                          isSelected ? styles.checkboxChecked : styles.checkboxUnchecked
                        )}
                      >
                        {isSelected && <Check className={styles.checkboxIcon} />}
                      </div>
                    )}

                    <div
                      className={cn(
                        styles.iconWrap,
                        isMessage || isReferralInactivity
                          ? 'bg-amber-500/20 text-amber-300'
                          : isWalletCredit
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : isWalletAlert
                              ? 'bg-rose-500/20 text-rose-300'
                              : isReferral
                                ? 'bg-teal-500/20 text-[#14F5D5]'
                                : !item.read
                                  ? styles.iconWrapUnread
                                  : styles.iconWrapRead
                      )}
                    >
                      {isMessage ? (
                        <MessageSquare className={styles.bellIcon} />
                      ) : isReferralInactivity ? (
                        <UserX className={styles.bellIcon} />
                      ) : isWalletCredit ? (
                        <Wallet className={styles.bellIcon} />
                      ) : isWalletAlert ? (
                        <ShieldAlert className={styles.bellIcon} />
                      ) : isReferral ? (
                        <UserCheck className={styles.bellIcon} />
                      ) : (
                        <Bell className={styles.bellIcon} />
                      )}
                    </div>

                    <div className={styles.contentWrap}>
                      <div className={styles.titleRow}>
                        <div className="flex items-center gap-2 truncate">
                          {isMessage && (
                            <span className="shrink-0 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-black text-amber-300 border border-amber-500/30">
                              {tNotifs('badges.message')}
                            </span>
                          )}
                          {isReferralInactivity && (
                            <span className="shrink-0 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-black text-amber-300 border border-amber-500/30">
                              {tRef('inactivityBadge')}
                            </span>
                          )}
                          {isReferral && (
                            <span className="shrink-0 rounded bg-[#14B8A6]/20 px-1.5 py-0.5 text-[10px] font-black text-[#14F5D5] border border-[#14B8A6]/30">
                              {tNotifs('badges.referral')}
                            </span>
                          )}
                          <h3
                            className={cn(
                              styles.itemTitle,
                              !item.read ? styles.itemTitleUnread : styles.itemTitleRead
                            )}
                          >
                            {highlightBrand(parsed.title)}
                          </h3>
                        </div>
                        <span className={styles.timestamp}>
                          {formatNotificationTime(item.timestamp, isArabic)}
                        </span>
                      </div>
                      <p className={styles.description}>
                        {highlightBrand(parsed.description)}
                      </p>
                    </div>

                    {!item.read && !isSelectMode && (
                      <span className={cn(
                        styles.unreadDot,
                        isMessage && 'bg-amber-400 shadow-[0_0_8px_#f59e0b]'
                      )} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pop-up Notification Detail Modal */}
      {viewingNotification && (
        <NotificationDetailModal
          notification={viewingNotification}
          isArabic={isArabic}
          direction={direction}
          onClose={() => setViewingNotification(null)}
          onDelete={async (id) => {
            await deleteNotifications([id]);
          }}
        />
      )}
    </div>
  );
}
