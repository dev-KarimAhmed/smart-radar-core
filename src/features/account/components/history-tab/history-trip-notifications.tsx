'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BellRing, Trash2, ChevronDown, ShieldCheck, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { resolveNotificationForDisplay } from '@/shared/utils/notification-i18n';
import { styles } from './notifications/history-trip-notifications-styles';
import { HistoryTripNotificationItem } from './notifications/history-trip-notification-item';
import { useHistoryTripNotifications } from './notifications/use-history-trip-notifications';

interface HistoryTripNotificationsProps {
  isArabic: boolean;
  t?: any;
}

export function HistoryTripNotifications({ isArabic }: HistoryTripNotificationsProps) {
  const t = useTranslations('historyTab.tripNotifications');

  const {
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
  } = useHistoryTripNotifications(isArabic, {
    justNow: t('time.justNow'),
    minsAgo: (mins) => t('time.minsAgo', { mins }),
    hoursAgo: (hours) => t('time.hoursAgo', { hours }),
    daysAgo: (days) => t('time.daysAgo', { days }),
  });

  const getBadgeLabel = (type?: string) => {
    if (type === 'trip') return t('badges.trip');
    if (type === 'offer') return t('badges.offer');
    if (type === 'WALLET_CREDIT' || type === 'WALLET_ALERT') return t('badges.wallet');
    return t('badges.system');
  };

  return (
    <Card className={styles.card} dir={isArabic ? 'rtl' : 'ltr'}>
      <div className={styles.accentBar} />
      <CardHeader className={styles.header}>
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsExpanded(!isExpanded)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsExpanded(!isExpanded);
            }
          }}
          className={styles.headerButton}
        >
          <div className={styles.headerRow}>
            <div className={styles.headerInfo}>
              <div className={styles.iconBox}>
                <BellRing className={styles.icon} />
              </div>
              <div className={styles.titleBox}>
                <CardTitle className={styles.title}>
                  {t('title')}
                </CardTitle>
                <CardDescription className={styles.descDesktop}>
                  {t('desc')}
                </CardDescription>
              </div>
            </div>

            <div className={styles.actionsRow}>
              <CardDescription className={styles.descMobile}>
                {t('desc')}
              </CardDescription>

              <div className={styles.actionsGroup}>
                <Badge
                  variant="outline"
                  className={cn(
                    styles.countBadge,
                    hasTripUnread && 'border-rose-500/40 bg-rose-500/15 text-rose-300'
                  )}
                >
                  {hasTripUnread && (
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse ltr:mr-1 rtl:ml-1" />
                  )}
                  <span>{tripNotifications.length} {isArabic ? 'إشعار' : 'events'}</span>
                  {hasTripUnread && (
                    <span className="opacity-75"> ({tripUnreadCount} {isArabic ? 'جديد' : 'new'})</span>
                  )}
                </Badge>

                <div className={styles.chevronBox}>
                  <ChevronDown className={cn(styles.chevronIcon, isExpanded && styles.chevronRotated)} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className={styles.content}>
          {tripNotifications.length === 0 ? (
            <div className={styles.emptyBox}>
              <ShieldCheck className={styles.emptyIcon} />
              <p className={styles.emptyTitle}>{t('emptyTitle')}</p>
              <p className={styles.emptyDesc}>{t('emptyDesc')}</p>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 mb-3 border-b border-white/5">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-400 font-sans font-medium">
                    {isArabic ? `إجمالي الإشعارات: ${tripNotifications.length}` : `Total notifications: ${tripNotifications.length}`}
                  </span>
                  {hasTripUnread && (
                    <span className="rounded-full bg-rose-500/20 border border-rose-500/30 px-2 py-0.5 text-[10px] font-bold text-rose-300">
                      {tripUnreadCount} {isArabic ? 'غير مقروء' : 'unread'}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {hasTripUnread && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleMarkAllTripRead}
                      className="h-7 text-xs font-semibold text-[#14F5D5] hover:bg-[#14B8A6]/20 bg-[#14B8A6]/10 border border-[#14B8A6]/20 gap-1.5 rounded-xl px-2.5 transition-colors"
                      title={t('markAllRead')}
                    >
                      <Check className="h-3.5 w-3.5" />
                      <span>{t('markRead')}</span>
                    </Button>
                  )}

                  {tripNotifications.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleClearAll}
                      className="h-7 text-xs font-semibold text-rose-400 hover:bg-rose-950/30 bg-rose-950/20 border border-rose-500/20 gap-1.5 rounded-xl px-2.5 transition-colors"
                      title={t('clearTitle')}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>{t('clear')}</span>
                    </Button>
                  )}
                </div>
              </div>

              <div className={styles.list}>
                {tripNotifications.map((item) => {
                  const parsed = parsedById.get(item.id) || resolveNotificationForDisplay(item, isArabic);
                  return (
                    <HistoryTripNotificationItem
                      key={item.id}
                      item={item}
                      parsed={parsed}
                      isArabic={isArabic}
                      relativeTime={formatRelativeTime(item.timestamp)}
                      badgeLabel={getBadgeLabel(item.type)}
                      deleteTooltip={t('deleteTooltip')}
                      onMarkRead={markAsRead}
                      onDelete={handleDeleteItem}
                    />
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}
