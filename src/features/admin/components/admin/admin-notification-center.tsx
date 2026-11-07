'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { adminFetch } from '@/features/admin/lib/admin-api-client';
import { supabase } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';
import {
  Bell,
  BellRing,
  ReceiptText,
  UserCheck,
  KeyRound,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Loader2,
  Volume2,
  VolumeX,
  Shield,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { useTranslations } from 'next-intl';
import { useDashboardLanguage } from '@/shared/hooks/use-dashboard-language';
import { cn } from '@/lib/utils';
import {
  type AdminNotificationItem,
  type NotificationsSummary,
  playNotificationChime,
} from './notifications/admin-notification-types';
import { NotificationItemCard } from './notifications/notification-item-card';
import { QuickReceiptReviewDialog } from './notifications/quick-receipt-review-dialog';
import { NotificationFilterTabs, type NotificationCategoryFilter } from './notifications/notification-filter-tabs';

export type { AdminNotificationItem, NotificationsSummary } from './notifications/admin-notification-types';
export { playNotificationChime } from './notifications/admin-notification-types';
export { NotificationItemCard } from './notifications/notification-item-card';
export { QuickReceiptReviewDialog } from './notifications/quick-receipt-review-dialog';
export { NotificationFilterTabs } from './notifications/notification-filter-tabs';

export function AdminNotificationCenter() {
  const t = useTranslations('adminNotifications');
  const { isArabic, direction } = useDashboardLanguage();
  const { toast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterTab, setFilterTab] = useState<'ALL' | 'RECEIPT' | 'CAPTAIN' | 'PASSWORD_RESET' | 'SYSTEM'>('ALL');
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

  // Quick Receipt Review Modal
  const [reviewItem, setReviewItem] = useState<AdminNotificationItem | null>(null);
  const [creditType, setCreditType] = useState<'MINUTES' | 'CASH'>('MINUTES');
  const [minutesValue, setMinutesValue] = useState<number>(0);
  const [adminNote, setAdminNote] = useState<string>('');
  const [processingAction, setProcessingAction] = useState<boolean>(false);
  const [rejectMode, setRejectMode] = useState<boolean>(false);
  const [rejectionReason, setRejectionReason] = useState<string>('');

  const previousUnreadCountRef = useRef<number>(0);
  const isInitialLoadRef = useRef<boolean>(true);

  // Fetch notifications from server
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

          // Check if unread count increased to play sound & toast
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

  // Initial fetch and 25s polling pulse
  useEffect(() => {
    void fetchNotifications();
    const interval = setInterval(() => {
      void fetchNotifications();
    }, 25000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  // Supabase Realtime subscriptions
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
        { event: '*', schema: 'public', table: 'captain_profiles' },
        (payload) => {
          const row = payload.new as any;
          if (row?.verification_status === 'PENDING') {
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

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('radar_admin_notif_sound', next ? 'enabled' : 'disabled');
      }
      return next;
    });
  };

  // Navigate to target tab
  const handleNavigateToTab = (tab: string, subtab?: string) => {
    setIsOpen(false);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('admin-switch-tab', { detail: { tab } }));
      if (subtab && tab === 'wallet') {
        window.dispatchEvent(new CustomEvent('admin-wallet-subtab', { detail: { subtab } }));
      }
    }
  };

  // Open Quick Receipt Review Dialog
  const handleOpenReceiptReview = (item: AdminNotificationItem) => {
    const amt = item.payload.amount || 0;
    setReviewItem(item);
    setCreditType('MINUTES');
    setMinutesValue(Math.round(amt * 60));
    setAdminNote('');
    setRejectMode(false);
    setRejectionReason('');
  };

  // Execute Receipt Approval
  const handleApproveReceipt = async () => {
    if (!reviewItem?.payload.transactionId) return;
    try {
      setProcessingAction(true);
      const res = await adminFetch('/api/admin/notifications', {
        method: 'POST',
        body: JSON.stringify({
          action: 'APPROVE_RECEIPT',
          transactionId: reviewItem.payload.transactionId,
          creditType,
          minutesToGrant: minutesValue,
          adminNote,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error || t('toastApproveErrorDesc'));
      }

      toast({
        title: t('toastApprovedTitle'),
        description: data.message || t('toastApprovedDesc'),
      });

      setNotifications((prev) => prev.filter((n) => n.id !== reviewItem.id));
      setSummary((prev) => ({
        ...prev,
        totalUnread: Math.max(0, prev.totalUnread - 1),
        pendingReceiptsCount: Math.max(0, prev.pendingReceiptsCount - 1),
      }));

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('radar-wallet-refresh'));
      }

      setReviewItem(null);
      void fetchNotifications();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: t('toastApproveErrorTitle'),
        description: err.message || t('toastApproveErrorDesc'),
      });
    } finally {
      setProcessingAction(false);
    }
  };

  // Execute Receipt Rejection
  const handleRejectReceipt = async () => {
    if (!reviewItem?.payload.transactionId) return;
    try {
      setProcessingAction(true);
      const res = await adminFetch('/api/admin/notifications', {
        method: 'POST',
        body: JSON.stringify({
          action: 'REJECT_RECEIPT',
          transactionId: reviewItem.payload.transactionId,
          rejectionReason,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data?.error || t('toastRejectErrorDesc'));
      }

      toast({
        title: t('toastRejectedTitle'),
        description: t('toastRejectedDesc'),
      });

      setNotifications((prev) => prev.filter((n) => n.id !== reviewItem.id));
      setSummary((prev) => ({
        ...prev,
        totalUnread: Math.max(0, prev.totalUnread - 1),
        pendingReceiptsCount: Math.max(0, prev.pendingReceiptsCount - 1),
      }));

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('radar-wallet-refresh'));
      }

      setReviewItem(null);
      void fetchNotifications();
    } catch (err: any) {
      toast({
        variant: 'destructive',
        title: t('toastRejectErrorTitle'),
        description: err.message || t('toastRejectErrorDesc'),
      });
    } finally {
      setProcessingAction(false);
    }
  };

  const filteredNotifications = notifications.filter((item) => {
    if (filterTab === 'ALL') return true;
    return item.category === filterTab;
  });

  const hasUnread = summary.totalUnread > 0;

  return (
    <>
      {/* Notifications Trigger Button */}
      <Button
        type="button"
        variant="ghost"
        onClick={() => setIsOpen(true)}
        className={`relative h-10 px-3.5 rounded-xl border font-bold text-xs transition-all active:scale-95 flex items-center gap-2 ${
          hasUnread
            ? 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
            : 'bg-[#161F30] hover:bg-[#1C273C] border-teal-500/20 text-slate-300 hover:text-white'
        }`}
        title={t('bellTitle')}
      >
        <div className="relative">
          {hasUnread ? (
            <BellRing className="w-4 h-4 text-amber-400 animate-bounce" />
          ) : (
            <Bell className="w-4 h-4 text-teal-400" />
          )}

          {hasUnread && (
            <span className="absolute -top-1.5 -right-2 flex h-4 min-w-4 px-1 items-center justify-center rounded-full bg-rose-500 text-[9px] font-black text-white ring-2 ring-[#0B0F19]">
              {summary.totalUnread > 99 ? '99+' : summary.totalUnread}
            </span>
          )}
        </div>
        <span className="hidden sm:inline">{t('notifications')}</span>
        {hasUnread && (
          <Badge className="bg-amber-500/20 text-amber-300 border-none text-[10px] py-0 px-1.5 hidden md:inline-flex">
            {summary.totalUnread} {t('newBadge')}
          </Badge>
        )}
      </Button>

      {/* Main Notifications Center Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-2xl bg-[#0B0F19]/98 border border-teal-500/30 text-white shadow-2xl rounded-2xl p-0 overflow-hidden backdrop-blur-2xl max-h-[85vh] flex flex-col" dir={direction}>
          {/* Header */}
          <DialogHeader className={cn("p-4 sm:p-5 border-b border-white/10 bg-black/40 space-y-2", isArabic ? "text-right" : "text-left")}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-400">
                  <Bell className="w-5 h-5 text-teal-300" />
                </div>
                <div>
                  <DialogTitle className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                    <span>{t('title')}</span>
                    {hasUnread && (
                      <Badge className="bg-amber-500/20 text-amber-300 border-none text-[10px] font-black px-2 py-0.5">
                        {summary.totalUnread} {t('pendingBadge')}
                      </Badge>
                    )}
                  </DialogTitle>
                  <DialogDescription className="text-slate-400 text-xs">
                    {t('subtitle')}
                  </DialogDescription>
                </div>
              </div>

              {/* Action buttons in header */}
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={toggleSound}
                  className={`h-8 w-8 p-0 rounded-lg border transition-all ${
                    soundEnabled
                      ? 'border-teal-500/30 text-teal-300 bg-teal-500/10 hover:bg-teal-500/20'
                      : 'border-white/10 text-slate-500 bg-black/40 hover:text-white'
                  }`}
                  title={soundEnabled ? t('muteSound') : t('enableSound')}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  disabled={loading}
                  onClick={() => fetchNotifications(true)}
                  className="h-8 w-8 p-0 rounded-lg border border-white/10 bg-black/40 text-slate-300 hover:text-teal-300 hover:bg-teal-500/10 transition-all"
                  title={t('refresh')}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-teal-400' : ''}`} />
                </Button>
              </div>
            </div>

            {/* Filter Tabs */}
            <NotificationFilterTabs
              filterTab={filterTab}
              setFilterTab={setFilterTab}
              summary={summary}
              t={t}
            />
          </DialogHeader>

          {/* Notifications List Content */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3 scrollbar-thin">
            {loading && notifications.length === 0 ? (
              <div className="flex min-h-52 flex-col items-center justify-center gap-2 text-slate-400">
                <Loader2 className="h-6 w-6 animate-spin text-teal-400" />
                <p className="text-xs">{t('loading')}</p>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="flex min-h-52 flex-col items-center justify-center gap-3 text-slate-400 p-6 text-center">
                <div className="w-12 h-12 rounded-2xl bg-teal-500/10 border border-teal-500/20 flex items-center justify-center text-teal-400">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{t('emptyTitle')}</p>
                  <p className="text-xs text-slate-500 mt-1">{t('emptyDesc')}</p>
                </div>
              </div>
            ) : (
              filteredNotifications.map((item) => (
                <NotificationItemCard
                  key={item.id}
                  item={item}
                  t={t}
                  onOpenReceiptReview={handleOpenReceiptReview}
                  onNavigateToTab={handleNavigateToTab}
                />
              ))
            )}
          </div>

          {/* Footer */}
          <DialogFooter className="p-3 sm:p-4 border-t border-white/10 bg-black/60 flex items-center justify-between sm:justify-between text-xs text-slate-400">
            <div className="flex items-center gap-1.5 text-[11px]">
              <Shield className="w-3.5 h-3.5 text-teal-400" />
              <span>{t('footerDigitalJudge')}</span>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white h-8 px-3 rounded-xl"
            >
              {t('close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Quick Receipt Review Dialog */}
      <QuickReceiptReviewDialog
        reviewItem={reviewItem}
        onClose={() => setReviewItem(null)}
        direction={direction}
        isArabic={isArabic}
        t={t}
        creditType={creditType}
        setCreditType={setCreditType}
        minutesValue={minutesValue}
        setMinutesValue={setMinutesValue}
        adminNote={adminNote}
        setAdminNote={setAdminNote}
        rejectMode={rejectMode}
        setRejectMode={setRejectMode}
        rejectionReason={rejectionReason}
        setRejectionReason={setRejectionReason}
        processingAction={processingAction}
        onApproveReceipt={handleApproveReceipt}
        onRejectReceipt={handleRejectReceipt}
      />
    </>
  );
}
