'use client';

import React from 'react';
import { Clock, Car, Tag, Wallet, Radio, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AppNotification } from '@/shared/hooks/use-notifications';
import { hasArabicScript } from '@/shared/utils/notification-i18n';
import { formatReadableDateTime } from '@/shared/utils/date-format';
import { styles } from './history-trip-notifications-styles';

interface HistoryTripNotificationItemProps {
  item: AppNotification;
  parsed: { title: string; description: string };
  isArabic: boolean;
  relativeTime: string;
  badgeLabel: string;
  deleteTooltip: string;
  onMarkRead: (id: string) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
}

export function HistoryTripNotificationItem({
  item,
  parsed,
  isArabic,
  relativeTime,
  badgeLabel,
  deleteTooltip,
  onMarkRead,
  onDelete,
}: HistoryTripNotificationItemProps) {
  const { dateText, timeText } = formatReadableDateTime(item.timestamp, isArabic);

  const getBadgeIcon = (type?: string) => {
    if (type === 'trip') {
      return (
        <span className={cn(styles.badge, 'border-emerald-500/30 bg-emerald-950/40 text-emerald-300')}>
          <Car className="h-3 w-3" />
          <span>{badgeLabel}</span>
        </span>
      );
    }
    if (type === 'offer') {
      return (
        <span className={cn(styles.badge, 'border-cyan-500/30 bg-cyan-950/40 text-cyan-300')}>
          <Tag className="h-3 w-3" />
          <span>{badgeLabel}</span>
        </span>
      );
    }
    if (type === 'WALLET_CREDIT' || type === 'WALLET_ALERT') {
      return (
        <span className={cn(styles.badge, 'border-amber-500/30 bg-amber-950/40 text-amber-300')}>
          <Wallet className="h-3 w-3" />
          <span>{badgeLabel}</span>
        </span>
      );
    }
    return (
      <span className={cn(styles.badge, 'border-teal-500/30 bg-teal-950/40 text-[#14F5D5]')}>
        <Radio className="h-3 w-3" />
        <span>{badgeLabel}</span>
      </span>
    );
  };

  const handleClick = () => {
    if (!item.read) onMarkRead(item.id);
    const tripsEl =
      document.getElementById('captain-trips-section') ||
      document.getElementById('rider-trips-section');
    if (tripsEl) {
      tripsEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(styles.itemCard, !item.read && 'border-[#14B8A6]/40 bg-[#14B8A6]/5')}
    >
      <div className={styles.itemHeader}>
        <div className="flex items-center gap-2">
          {getBadgeIcon(item.type)}
          <span className="text-[10px] text-slate-400 font-sans">{relativeTime}</span>
        </div>

        <div className="flex items-center gap-2">
          <div className={styles.dateTimeBox}>
            <Clock className={styles.clockIcon} />
            <span className={styles.dateText}>{dateText}</span>
            <span className={styles.separatorDot}>•</span>
            <span className={styles.timeText}>{timeText}</span>
          </div>

          <button
            type="button"
            onClick={(e) => onDelete(e, item.id)}
            className={styles.deleteBtn}
            title={deleteTooltip}
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="space-y-1 pt-1">
        <p dir={hasArabicScript(parsed.title) ? 'rtl' : 'ltr'} className={styles.messageTitle}>
          {parsed.title}
        </p>
        {parsed.description && (
          <p dir={hasArabicScript(parsed.description) ? 'rtl' : 'ltr'} className={styles.messageDesc}>
            {parsed.description}
          </p>
        )}
      </div>
    </div>
  );
}
