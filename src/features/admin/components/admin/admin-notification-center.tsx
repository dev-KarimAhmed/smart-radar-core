'use client';

import React, { useState } from 'react';
import {
  Bell,
  BellRing,
  CheckCircle2,
  Loader2,
  Shield,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
} from '@/components/ui/dialog';
import { useTranslations } from 'next-intl';
import { useDashboardLanguage } from '@/shared/hooks/use-dashboard-language';
import type { AdminNotificationItem } from '../../types/admin-notification-types';
import { useAdminNotificationsCenter } from '../../hooks/use-admin-notifications-center';
import {
  AdminNotificationsHeader,
  type NotificationFilterTab,
} from './notifications/admin-notifications-header';
import { AdminNotificationCard } from './notifications/admin-notification-card';
import { AdminReceiptReviewModal } from './notifications/admin-receipt-review-modal';

export type { AdminNotificationItem };

export function AdminNotificationCenter() {
  const t = useTranslations('adminNotifications');
  const { isArabic, direction } = useDashboardLanguage();

  const [isOpen, setIsOpen] = useState(false);
  const [filterTab, setFilterTab] = useState<NotificationFilterTab>('ALL');
  const [reviewItem, setReviewItem] = useState<AdminNotificationItem | null>(null);

  const {
    loading,
    notifications,
    setNotifications,
    summary,
    setSummary,
    soundEnabled,
    toggleSound,
    fetchNotifications,
    runtimeTranslations,
  } = useAdminNotificationsCenter(isArabic);

  const handleNavigateToTab = (tab: string, subtab?: string) => {
    setIsOpen(false);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('admin-switch-tab', { detail: { tab } }));
      if (subtab && tab === 'wallet') {
        window.dispatchEvent(new CustomEvent('admin-wallet-subtab', { detail: { subtab } }));
      }
    }
  };

  const filteredNotifications = notifications.filter((item) => {
    if (filterTab === 'ALL') return true;
    return item.category === filterTab;
  });

  const hasUnread = summary.totalUnread > 0;

  return (
    <>
      {/* ================= Notifications Trigger Button ================= */}
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

      {/* ================= Main Notifications Center Dialog ================= */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-2xl bg-[#0B0F19]/98 border border-teal-500/30 text-white shadow-2xl rounded-2xl p-0 overflow-hidden backdrop-blur-2xl max-h-[85vh] flex flex-col" dir={direction}>
          <AdminNotificationsHeader
            isArabic={isArabic}
            hasUnread={hasUnread}
            summary={summary}
            soundEnabled={soundEnabled}
            toggleSound={toggleSound}
            loading={loading}
            fetchNotifications={fetchNotifications}
            filterTab={filterTab}
            setFilterTab={setFilterTab}
            t={t}
          />

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
                <AdminNotificationCard
                  key={item.id}
                  item={item}
                  isArabic={isArabic}
                  runtimeTranslations={runtimeTranslations}
                  onOpenReceiptReview={(target) => setReviewItem(target)}
                  onNavigateToTab={handleNavigateToTab}
                  t={t}
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

      {/* ================= Quick Receipt Review Dialog ================= */}
      <AdminReceiptReviewModal
        reviewItem={reviewItem}
        onClose={() => setReviewItem(null)}
        isArabic={isArabic}
        direction={direction}
        setNotifications={setNotifications}
        setSummary={setSummary}
        fetchNotifications={fetchNotifications}
        t={t}
      />
    </>
  );
}
