'use client';

import { useState } from 'react';
import { useNotifications } from '@/shared/hooks/use-notifications';
import { Bell, Check, Trash2, ListChecks, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';

const styles = {
  root: 'flex flex-col h-full w-full max-w-3xl mx-auto space-y-4 pb-36 sm:pb-40',
  header: 'flex flex-wrap items-center justify-between gap-3',
  title: 'text-2xl font-black text-white',
  headerActions: 'flex items-center gap-2 flex-wrap',
  selectModeBtn: 'border-white/10 text-slate-300 hover:bg-white/10 transition-all cursor-pointer',
  selectModeBtnActive: 'border-[#14B8A6]/40 text-[#14F5D5] bg-[#14B8A6]/10 hover:bg-[#14B8A6]/20 transition-all cursor-pointer',
  actionIcon: 'h-4 w-4',
  markAllBtn: 'border-[#14B8A6]/40 text-[#14F5D5] hover:bg-[#14B8A6]/20 transition-all cursor-pointer',
  selectAllBtn: 'border-white/10 text-slate-300 hover:bg-white/10 transition-all cursor-pointer text-xs sm:text-sm',
  deleteSelectedBtn: 'border-rose-500/40 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 transition-all cursor-pointer text-xs sm:text-sm',
  deleteSelectedBtnDisabled: 'opacity-50 cursor-not-allowed border-white/5 text-slate-500 bg-transparent',
  container: 'flex-1 rounded-2xl border border-white/10 bg-[#0B0F19]/60 overflow-hidden shadow-xl backdrop-blur-sm',
  emptyState: 'flex flex-col items-center justify-center h-64 text-center p-6',
  emptyIcon: 'h-12 w-12 text-slate-600 mb-4',
  emptyText: 'text-slate-400 font-bold',
  list: 'divide-y divide-white/5',
  item: 'p-4 transition-all duration-200 hover:bg-white/5 cursor-pointer select-none outline-none focus-visible:bg-white/10 relative',
  itemUnread: 'bg-[#14B8A6]/5 hover:bg-[#14B8A6]/10',
  itemRead: 'opacity-85 hover:opacity-100',
  itemSelected: 'bg-[#14B8A6]/15 hover:bg-[#14B8A6]/20 border-r-2 border-[#14F5D5]',
  itemRow: 'flex items-start gap-3 sm:gap-4',
  checkboxWrap: 'mt-2 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-all cursor-pointer',
  checkboxUnchecked: 'border-white/20 bg-white/5 hover:border-white/40',
  checkboxChecked: 'border-[#14F5D5] bg-[#14B8A6] text-[#0A0F1D]',
  checkboxIcon: 'h-3.5 w-3.5 stroke-[3]',
  iconWrap: 'mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors',
  iconWrapUnread: 'bg-[#14B8A6]/20 text-[#14F5D5]',
  iconWrapRead: 'bg-white/10 text-slate-400',
  bellIcon: 'h-5 w-5',
  contentWrap: 'flex-1 space-y-1 min-w-0',
  titleRow: 'flex items-center justify-between gap-2',
  itemTitle: 'text-sm font-bold transition-colors truncate',
  itemTitleUnread: 'text-white font-black',
  itemTitleRead: 'text-slate-300 font-medium',
  timestamp: 'text-xs text-slate-500 shrink-0',
  description: 'text-sm text-slate-400 leading-relaxed break-words',
  unreadDot: 'mt-2 h-2.5 w-2.5 shrink-0 rounded-full bg-[#14F5D5] shadow-[0_0_8px_#14F5D5]',
  selectionBar: 'flex items-center justify-between gap-3 p-3 bg-white/5 border-b border-white/10 text-xs sm:text-sm font-bold text-slate-300',
  selectionCount: 'text-[#14F5D5] font-black',
  selectionActions: 'flex items-center gap-2',
} as const;

function formatNotificationTime(timestamp: number, isArabic: boolean): string {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    if (isToday) {
      return date.toLocaleTimeString(isArabic ? 'ar-EG' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    return date.toLocaleDateString(isArabic ? 'ar-EG' : 'en-US', {
      month: 'numeric',
      day: 'numeric',
    });
  } catch {
    return '';
  }
}

export function NotificationsTab() {
  const { isArabic } = useDashboardLanguage();
  const { notifications, hasUnread, markAllAsRead, markAsRead, deleteNotifications } = useNotifications();

  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

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
      setSelectedIds(new Set(notifications.map((n) => n.id)));
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

  return (
    <div className={styles.root}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          {isArabic ? 'التنبيهات' : 'Notifications'}
        </h1>

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
                  <span>{isArabic ? 'إلغاء' : 'Cancel'}</span>
                </>
              ) : (
                <>
                  <ListChecks className={styles.actionIcon} />
                  <span>{isArabic ? 'تحديد' : 'Select'}</span>
                </>
              )}
            </Button>
          )}

          {!isSelectMode && hasUnread && (
            <Button
              variant='outline'
              onClick={() => void markAllAsRead()}
              className={styles.markAllBtn}
            >
              <Check className={styles.actionIcon} />
              <span>{isArabic ? 'تعليم الكل كمقروء' : 'Mark all read'}</span>
            </Button>
          )}
        </div>
      </div>

      <div className={styles.container}>
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
                  ? (isArabic ? 'إلغاء تحديد الكل' : 'Deselect all')
                  : (isArabic ? 'تحديد الكل' : 'Select all')}
              </Button>
              <span className={styles.selectionCount}>
                {isArabic
                  ? `(محدد ${selectedIds.size} من ${notifications.length})`
                  : `(${selectedIds.size} of ${notifications.length} selected)`}
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
                {isArabic ? `حذف المحدد (${selectedIds.size})` : `Delete (${selectedIds.size})`}
              </span>
            </Button>
          </div>
        )}

        {notifications.length === 0 ? (
          <div className={styles.emptyState}>
            <Bell className={styles.emptyIcon} />
            <p className={styles.emptyText}>
              {isArabic ? 'لا توجد إشعارات حالياً' : 'No notifications yet'}
            </p>
          </div>
        ) : (
          <div className={styles.list}>
            {notifications.map((item) => {
              const isSelected = selectedIds.has(item.id);

              return (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => {
                    if (isSelectMode) {
                      toggleItem(item.id);
                    } else if (!item.read) {
                      void markAsRead(item.id);
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      if (isSelectMode) {
                        toggleItem(item.id);
                      } else if (!item.read) {
                        void markAsRead(item.id);
                      }
                    }
                  }}
                  className={cn(
                    styles.item,
                    !item.read ? styles.itemUnread : styles.itemRead,
                    isSelectMode && isSelected && styles.itemSelected
                  )}
                  title={!item.read && !isSelectMode ? (isArabic ? 'اضغط للتعليم كمقروء' : 'Click to mark as read') : undefined}
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
                        !item.read ? styles.iconWrapUnread : styles.iconWrapRead
                      )}
                    >
                      <Bell className={styles.bellIcon} />
                    </div>

                    <div className={styles.contentWrap}>
                      <div className={styles.titleRow}>
                        <h3
                          className={cn(
                            styles.itemTitle,
                            !item.read ? styles.itemTitleUnread : styles.itemTitleRead
                          )}
                        >
                          {item.title}
                        </h3>
                        <span className={styles.timestamp}>
                          {formatNotificationTime(item.timestamp, isArabic)}
                        </span>
                      </div>
                      <p className={styles.description}>
                        {item.description}
                      </p>
                    </div>

                    {!item.read && !isSelectMode && (
                      <span className={styles.unreadDot} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
