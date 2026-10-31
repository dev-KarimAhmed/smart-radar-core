'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { BellRing, Clock, Trash2, ChevronDown, Car, Tag, Wallet, Radio, ShieldCheck, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNotifications, type AppNotification } from '@/shared/hooks/use-notifications';
import { useAuth } from '@/hooks/use-auth';
import { parseNotificationContent } from '@/shared/utils/notification-i18n';
import { formatReadableDateTime } from '@/shared/utils/date-format';

const styles = {
  container: 'space-y-6',
  card: 'relative overflow-hidden rounded-3xl border border-[#14B8A6]/20 bg-[#0B0F19]/90 shadow-2xl backdrop-blur-xl w-full text-white',
  accentBar: 'absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-[#14F5D5]/50 to-transparent',
  header: 'p-5 pb-3',
  headerButton: 'w-full text-right cursor-pointer select-none transition-colors hover:bg-white/[0.02]',
  headerRow: 'flex items-center justify-between gap-3',
  headerInfo: 'flex items-center gap-3 min-w-0',
  iconBox: 'flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-[#14B8A6]/30 bg-[#14B8A6]/10 text-[#14F5D5] shadow-[0_0_15px_rgba(20,245,213,0.15)]',
  icon: 'h-5 w-5',
  titleBox: 'min-w-0',
  title: 'text-base font-black text-white flex items-center gap-2 font-sans',
  desc: 'text-xs text-slate-400 mt-0.5 leading-relaxed truncate font-sans',
  actionsBox: 'flex items-center gap-2',
  clearBtn: 'h-8 text-[11px] text-rose-400 hover:bg-rose-950/20 hover:text-rose-300 gap-1 rounded-xl',
  clearBtnIcon: 'h-3.5 w-3.5',
  countBadge: 'shrink-0 rounded-full border border-[#14B8A6]/30 bg-[#14B8A6]/10 px-3 py-1 text-xs font-bold text-[#14F5D5] shadow-sm font-mono',
  chevronBox: 'flex h-8 w-8 items-center justify-center rounded-xl border border-[#14B8A6]/20 bg-[#14B8A6]/10 text-[#14F5D5] transition-all hover:bg-[#14B8A6]/20 shrink-0',
  chevronIcon: 'h-4 w-4 transition-transform duration-200',
  chevronRotated: 'rotate-180',
  content: 'p-5 pt-2',
  emptyBox: 'rounded-2xl border border-dashed border-white/10 bg-black/20 p-6 text-center flex flex-col items-center justify-center gap-2.5 my-2',
  emptyIcon: 'h-8 w-8 text-slate-500',
  emptyTitle: 'text-xs font-semibold text-slate-400',
  emptyDesc: 'text-[11px] text-slate-500 leading-normal max-w-sm',
  list: 'space-y-3 max-h-[420px] overflow-y-auto pr-1',
  itemCard: 'group relative rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent hover:border-[#14B8A6]/30 p-3.5 transition-all space-y-2 text-right',
  itemHeader: 'flex items-center justify-between gap-2',
  badge: 'text-[10px] font-bold px-2.5 py-0.5 rounded-md border inline-flex items-center gap-1 font-sans',
  dateTimeBox: 'flex items-center gap-1.5 text-xs text-slate-300 font-medium font-sans',
  clockIcon: 'h-3 w-3 text-[#14F5D5] shrink-0',
  dateText: 'font-semibold text-slate-200',
  separatorDot: 'text-slate-500',
  timeText: 'font-mono text-slate-300',
  messageTitle: 'text-xs sm:text-sm font-bold text-white leading-snug',
  messageDesc: 'text-xs text-slate-300 leading-relaxed font-sans pt-0.5',
  deleteBtn: 'opacity-0 group-hover:opacity-100 transition-opacity p-1 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-950/20',
};

interface HistoryTripNotificationsProps {
  isArabic: boolean;
  t?: any;
}

export function HistoryTripNotifications({ isArabic }: HistoryTripNotificationsProps) {
  const { user } = useAuth();
  const { tripNotifications, tripUnreadCount, hasTripUnread, deleteNotifications, markAsRead } = useNotifications(user?.uid);
  const [isExpanded, setIsExpanded] = useState(false);

  const formatRelativeTime = (timestamp: number) => {
    try {
      const diff = Math.floor((Date.now() - timestamp) / 1000);
      if (diff < 60) return isArabic ? 'الآن' : 'just now';
      if (diff < 3600) {
        const mins = Math.floor(diff / 60);
        return isArabic ? `منذ ${mins} دقيقة` : `${mins}m ago`;
      }
      if (diff < 86400) {
        const hrs = Math.floor(diff / 3600);
        return isArabic ? `منذ ${hrs} ساعة` : `${hrs}h ago`;
      }
      const days = Math.floor(diff / 86400);
      return isArabic ? `منذ ${days} يوم` : `${days}d ago`;
    } catch {
      return '';
    }
  };


  const getNotificationBadge = (item: AppNotification) => {
    const type = item.type || 'system';
    if (type === 'trip') {
      return (
        <span className={cn(styles.badge, 'border-emerald-500/30 bg-emerald-950/40 text-emerald-300')}>
          <Car className="h-3 w-3" />
          <span>{isArabic ? 'رحلة' : 'Trip'}</span>
        </span>
      );
    }
    if (type === 'offer') {
      return (
        <span className={cn(styles.badge, 'border-cyan-500/30 bg-cyan-950/40 text-cyan-300')}>
          <Tag className="h-3 w-3" />
          <span>{isArabic ? 'عرض' : 'Offer'}</span>
        </span>
      );
    }
    if (type === 'WALLET_CREDIT' || type === 'WALLET_ALERT') {
      return (
        <span className={cn(styles.badge, 'border-amber-500/30 bg-amber-950/40 text-amber-300')}>
          <Wallet className="h-3 w-3" />
          <span>{isArabic ? 'محفظة' : 'Wallet'}</span>
        </span>
      );
    }
    return (
      <span className={cn(styles.badge, 'border-teal-500/30 bg-teal-950/40 text-[#14F5D5]')}>
        <Radio className="h-3 w-3" />
        <span>{isArabic ? 'نظام' : 'System'}</span>
      </span>
    );
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

  return (
    <Card className={styles.card}>
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
                  {isArabic ? 'سجل إشعارات الرحلات والنظام' : 'Trip & System Notifications'}
                </CardTitle>
                <CardDescription className={styles.desc}>
                  {isArabic
                    ? 'أرشيف إشعارات المشاوير والعروض وتحديثات النظام (خلال 72 ساعة)'
                    : 'Log of trips, offers, and operational system notifications (72h)'}
                </CardDescription>
              </div>
            </div>

            <div className={styles.actionsBox}>
              {hasTripUnread && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllTripRead}
                  className="h-8 text-[11px] text-[#14F5D5] hover:bg-[#14B8A6]/20 gap-1 rounded-xl"
                  title={isArabic ? 'تعليم الكل كمقروء' : 'Mark all read'}
                >
                  <Check className="h-3.5 w-3.5" />
                  <span>{isArabic ? 'تعليم كمقروء' : 'Mark read'}</span>
                </Button>
              )}

              {tripNotifications.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearAll}
                  className={styles.clearBtn}
                  title={isArabic ? 'مسح إشعارات الرحلات' : 'Clear all'}
                >
                  <Trash2 className={styles.clearBtnIcon} />
                  <span>{isArabic ? 'مسح' : 'Clear'}</span>
                </Button>
              )}

              {hasTripUnread ? (
                <span className="shrink-0 rounded-full bg-rose-500 px-2.5 py-0.5 text-xs font-black text-white shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-pulse">
                  {tripUnreadCount > 99 ? '99+' : tripUnreadCount}
                </span>
              ) : (
                <Badge variant="outline" className={styles.countBadge}>
                  {tripNotifications.length}
                </Badge>
              )}

              <div className={styles.chevronBox}>
                <ChevronDown className={cn(styles.chevronIcon, isExpanded && styles.chevronRotated)} />
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
              <p className={styles.emptyTitle}>
                {isArabic ? 'لا توجد إشعارات رحلات أو عمليات حالياً' : 'No operational trip notifications yet'}
              </p>
              <p className={styles.emptyDesc}>
                {isArabic
                  ? 'يتم أرشفة إشعارات قبول الرحلات وبدء المشاوير والعروض هنا تلقائياً وتُحذف كل 72 ساعة تماشياً مع البروتوكول السيادي.'
                  : 'Operational ride and offer notifications are recorded here and purged automatically after 72 hours.'}
              </p>
            </div>
          ) : (
            <div className={styles.list}>
              {tripNotifications.map((item) => {
                const parsed = parseNotificationContent(item, isArabic);
                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (!item.read) void markAsRead(item.id);
                    }}
                    className={cn(
                      styles.itemCard,
                      !item.read && 'border-[#14B8A6]/40 bg-[#14B8A6]/5'
                    )}
                  >
                    <div className={styles.itemHeader}>
                      <div className="flex items-center gap-2">
                        {getNotificationBadge(item)}
                        <span className="text-[10px] text-slate-400 font-sans">
                          {formatRelativeTime(item.timestamp)}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {(() => {
                          const { dateText, timeText } = formatReadableDateTime(item.timestamp, isArabic);
                          return (
                            <div className={styles.dateTimeBox}>
                              <Clock className={styles.clockIcon} />
                              <span className={styles.dateText}>{dateText}</span>
                              <span className={styles.separatorDot}>•</span>
                              <span className={styles.timeText}>{timeText}</span>
                            </div>
                          );
                        })()}

                        <button
                          type="button"
                          onClick={(e) => handleDeleteItem(e, item.id)}
                          className={styles.deleteBtn}
                          title={isArabic ? 'حذف هذا الإشعار' : 'Delete notification'}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1 pt-1">
                      <p className={styles.messageTitle}>{parsed.title}</p>
                      {parsed.description && (
                        <p className={styles.messageDesc}>{parsed.description}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
