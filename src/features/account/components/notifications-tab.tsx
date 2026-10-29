'use client';

import { useState } from 'react';
import { useNotifications, type AppNotification } from '@/shared/hooks/use-notifications';
import { highlightBrand } from '@/shared/components/brand-highlight';
import {
  Bell,
  Check,
  Trash2,
  ListChecks,
  X,
  MessageSquare,
  ArrowRight,
  ArrowLeft,
  Wallet,
  ShieldAlert,
  Copy,
  UserCheck,
  UserX,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { useAuth } from '@/hooks/use-auth';
import { useTranslations } from 'next-intl';
import { parseNotificationContent } from '@/shared/utils/notification-i18n';

const styles = {
  root: 'flex flex-col w-full max-w-3xl mx-auto space-y-4 px-3 sm:px-4 pb-32 sm:pb-36',
  header: 'flex flex-wrap items-center justify-between gap-3',
  title: 'text-xl sm:text-2xl font-black text-white',
  headerActions: 'flex items-center gap-2 flex-wrap',
  selectModeBtn: 'border-white/10 text-slate-300 hover:bg-white/10 transition-all cursor-pointer',
  selectModeBtnActive: 'border-[#14B8A6]/40 text-[#14F5D5] bg-[#14B8A6]/10 hover:bg-[#14B8A6]/20 transition-all cursor-pointer',
  actionIcon: 'h-4 w-4',
  markAllBtn: 'border-[#14B8A6]/40 text-[#14F5D5] hover:bg-[#14B8A6]/20 transition-all cursor-pointer',
  selectAllBtn: 'border-white/10 text-slate-300 hover:bg-white/10 transition-all cursor-pointer text-xs sm:text-sm',
  deleteSelectedBtn: 'border-rose-500/40 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 transition-all cursor-pointer text-xs sm:text-sm',
  deleteSelectedBtnDisabled: 'opacity-50 cursor-not-allowed border-white/5 text-slate-500 bg-transparent',
  container: 'w-full rounded-2xl border border-white/10 bg-[#0B0F19]/60 shadow-xl backdrop-blur-sm overflow-hidden',
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
  description: 'text-sm text-slate-400 leading-relaxed break-words line-clamp-2',
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

export function NotificationsTab({ onClose }: { onClose?: () => void } = {}) {
  const tRef = useTranslations('referral.notifications');
  const { user, isCaptain } = useAuth();
  const { isArabic, direction } = useDashboardLanguage();
  const { notifications, hasUnread, markAllAsRead, markAsRead, deleteNotifications } = useNotifications();

  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [viewingNotification, setViewingNotification] = useState<AppNotification | null>(null);
  const [copied, setCopied] = useState(false);

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

  const handleItemClick = (item: AppNotification) => {
    if (isSelectMode) {
      toggleItem(item.id);
    } else {
      if (!item.read) {
        void markAsRead(item.id);
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
              {isArabic ? (
                <>
                  <ArrowRight className="h-4 w-4 ml-1" />
                  <span>{isCaptain ? 'العودة للرادار' : 'العودة للرئيسية'}</span>
                </>
              ) : (
                <>
                  <ArrowLeft className="h-4 w-4 mr-1" />
                  <span>{isCaptain ? 'Back to Radar' : 'Back to Home'}</span>
                </>
              )}
            </Button>
          )}
          <h1 className={styles.title}>
            {isArabic ? 'الإشعارات' : 'Notifications'}
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
        {/* Page 2 Sovereign Welcome Banner */}
        <div data-step1="sovereign-welcome-banner-step1" className="mb-4 flex items-center justify-between rounded-2xl border border-[#14B8A6]/30 bg-[#060B18]/95 p-3.5 shadow-lg shadow-black/25">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 text-[#14F5D5]">
              <Bell className="h-4 w-4" />
            </div>
            <p className="text-sm font-black text-white">
              {isArabic ? (
                <>
                  شبكة <span className="text-[#14F5D5] font-black drop-shadow-[0_0_8px_rgba(20,245,213,0.4)]">بينكم</span> للإعلان الرقمي
                </>
              ) : (
                <>
                  <span className="text-[#14F5D5] font-black">Bynkcom</span> Digital Ad Network
                </>
              )}
            </p>
          </div>
          <span className="text-xs font-bold text-[#14B8A6]">
            {isArabic ? 'ترحب بك' : 'Welcomes you'}
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
                  title={!item.read && !isSelectMode ? (isArabic ? 'اضغط لعرض التفاصيل وتعيين كمقروء' : 'Click to view details') : (isArabic ? 'اضغط لعرض التفاصيل' : 'Click to view')}
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
                              {isArabic ? 'رسالة' : 'Message'}
                            </span>
                          )}
                          {isReferralInactivity && (
                            <span className="shrink-0 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-black text-amber-300 border border-amber-500/30">
                              {tRef('inactivityBadge')}
                            </span>
                          )}
                          {isReferral && (
                            <span className="shrink-0 rounded bg-[#14B8A6]/20 px-1.5 py-0.5 text-[10px] font-black text-[#14F5D5] border border-[#14B8A6]/30">
                              {isArabic ? 'إحالة جديدة' : 'New Referral'}
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
      {viewingNotification && (() => {
        const parsedModal = parseNotificationContent(viewingNotification, isArabic);
        const displayTitle = parsedModal.title || viewingNotification.title || '';
        const displayDesc = parsedModal.description || viewingNotification.description || '';

        return (
          <div
            className="fixed inset-0 z-[500] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-150"
            onClick={() => setViewingNotification(null)}
            dir={direction}
          >
            <div
              className="relative w-full max-w-lg rounded-3xl border border-[#14B8A6]/30 bg-[#0B0F19] p-5 sm:p-6 shadow-2xl space-y-4 text-white animate-in zoom-in-95 duration-150"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={cn(
                      "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border shadow-inner",
                      viewingNotification.type === 'admin_message' || viewingNotification.type === 'message'
                        ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                        : viewingNotification.type === 'WALLET_CREDIT'
                          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                          : viewingNotification.type === 'WALLET_ALERT'
                            ? "border-rose-500/40 bg-rose-500/10 text-rose-300"
                            : "border-[#14B8A6]/40 bg-[#14B8A6]/10 text-[#14F5D5]"
                    )}
                  >
                    {viewingNotification.type === 'admin_message' || viewingNotification.type === 'message' ? (
                      <MessageSquare className="h-6 w-6" />
                    ) : viewingNotification.type === 'referral_inactivity' ? (
                      <UserX className="h-6 w-6 text-amber-400" />
                    ) : viewingNotification.type === 'WALLET_CREDIT' ? (
                      <Wallet className="h-6 w-6" />
                    ) : viewingNotification.type === 'WALLET_ALERT' ? (
                      <ShieldAlert className="h-6 w-6" />
                    ) : viewingNotification.type === 'referral' ? (
                      <UserCheck className="h-6 w-6" />
                    ) : (
                      <Bell className="h-6 w-6" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-black mb-1",
                        isArabic ? "" : "uppercase tracking-wider",
                        viewingNotification.type === 'admin_message' || viewingNotification.type === 'message'
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : viewingNotification.type === 'referral_inactivity'
                            ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                            : viewingNotification.type === 'WALLET_CREDIT' || viewingNotification.type === 'deposit_confirmed'
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : viewingNotification.type === 'WALLET_ALERT' || viewingNotification.type === 'urgent'
                                ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                : viewingNotification.type === 'warning'
                                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                  : viewingNotification.type === 'referral'
                                    ? "bg-teal-500/20 text-[#14F5D5] border border-teal-500/30"
                                    : "bg-[#14B8A6]/20 text-[#14F5D5] border border-[#14B8A6]/30"
                      )}
                    >
                      {viewingNotification.type === 'admin_message' || viewingNotification.type === 'message'
                        ? (isArabic ? 'رسالة رسمية من الإدارة ✉️' : 'Admin Message ✉️')
                        : viewingNotification.type === 'referral_inactivity'
                          ? (isArabic ? 'تنبيه عدم نشاط راكب ⚠️' : tRef('inactivityDetailTitle'))
                          : viewingNotification.type === 'WALLET_CREDIT'
                            ? (isArabic ? 'إيداع وشحن رصيد 💰' : 'Wallet Credit 💰')
                            : viewingNotification.type === 'deposit_confirmed'
                              ? (isArabic ? 'تأكيد إيداع الرصيد 💰' : 'Deposit Confirmed 💰')
                              : viewingNotification.type === 'WALLET_ALERT'
                                ? (isArabic ? 'تنبيه مالي ⚠️' : 'Wallet Alert ⚠️')
                                : viewingNotification.type === 'warning'
                                  ? (isArabic ? 'تحذير هام ⚠️' : 'Important Warning ⚠️')
                                  : viewingNotification.type === 'urgent'
                                    ? (isArabic ? 'تنبيه عاجل 🚨' : 'Urgent Alert 🚨')
                                    : viewingNotification.type === 'referral'
                                      ? (isArabic ? 'إحالة مستخدم جديد 👥' : 'New Rider Referral 👥')
                                      : (isArabic ? 'إشعار من النظام 🔔' : 'System Notification 🔔')}
                    </span>
                    <p className="text-xs text-slate-400">
                      {new Date(viewingNotification.timestamp).toLocaleString(isArabic ? 'ar-EG' : 'en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setViewingNotification(null)}
                  aria-label={isArabic ? 'إغلاق' : 'Close'}
                  title={isArabic ? 'إغلاق' : 'Close'}
                  className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 hover:bg-white/10 hover:text-white transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="space-y-3 pt-1" dir={direction}>
                <div className="flex items-start justify-between gap-2">
                  <h2 className="text-base sm:text-lg font-black text-white leading-snug">
                    {highlightBrand(displayTitle)}
                  </h2>
                </div>

                <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-sm leading-relaxed text-slate-200 whitespace-pre-wrap break-words max-h-64 overflow-y-auto selection:bg-[#14B8A6]/30">
                  {highlightBrand(displayDesc)}
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    const idToDelete = viewingNotification.id;
                    setViewingNotification(null);
                    await deleteNotifications([idToDelete]);
                  }}
                  className="border-rose-500/30 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 text-xs sm:text-sm font-bold cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>{isArabic ? 'حذف الإشعار' : 'Delete'}</span>
                </Button>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      void navigator.clipboard.writeText(`${displayTitle}\n\n${displayDesc}`);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="border-white/10 text-slate-300 hover:bg-white/10 text-xs sm:text-sm font-bold cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <Copy className="h-4 w-4" />
                    <span>{copied ? (isArabic ? 'تم النسخ ✓' : 'Copied ✓') : (isArabic ? 'نسخ النص' : 'Copy')}</span>
                  </Button>

                  <Button
                    size="sm"
                    onClick={() => setViewingNotification(null)}
                    className="bg-[#14B8A6] text-[#06111f] hover:bg-[#14F5D5] text-xs sm:text-sm font-black cursor-pointer px-4"
                  >
                    {isArabic ? 'إغلاق' : 'Close'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
