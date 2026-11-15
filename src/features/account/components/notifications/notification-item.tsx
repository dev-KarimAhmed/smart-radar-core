import React from 'react';
import type { AppNotification } from '@/shared/hooks/use-notifications';
import {
  Bell,
  Check,
  MessageSquare,
  Wallet,
  ShieldAlert,
  UserCheck,
  UserX,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { highlightBrand } from '@/shared/components/brand-highlight';
import { hasArabicScript, type resolveNotificationForDisplay } from '@/shared/utils/notification-i18n';
import { formatNotificationShortTime } from '@/shared/utils/date-format';
import { styles } from './notifications-styles';

interface NotificationItemProps {
  item: AppNotification;
  isSelected: boolean;
  isSelectMode: boolean;
  parsed: ReturnType<typeof resolveNotificationForDisplay>;
  isArabic: boolean;
  onClick: () => void;
  tNotifs: (key: string) => string;
  tRef: (key: string) => string;
}

export function NotificationItem({
  item,
  isSelected,
  isSelectMode,
  parsed,
  isArabic,
  onClick,
  tNotifs,
  tRef,
}: NotificationItemProps) {
  const isMessage = item.type === 'admin_message' || item.type === 'message';
  const isWalletCredit = item.type === 'WALLET_CREDIT';
  const isWalletAlert = item.type === 'WALLET_ALERT';
  const isReferral = item.type === 'referral';
  const isReferralInactivity = item.type === 'referral_inactivity';

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
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
                dir={hasArabicScript(parsed.title) ? 'rtl' : 'ltr'}
                className={cn(
                  styles.itemTitle,
                  !item.read ? styles.itemTitleUnread : styles.itemTitleRead
                )}
              >
                {highlightBrand(parsed.title)}
              </h3>
            </div>
            <span className={styles.timestamp}>
              {formatNotificationShortTime(item.timestamp, isArabic)}
            </span>
          </div>
          <p
            dir={hasArabicScript(parsed.description) ? 'rtl' : 'ltr'}
            className={styles.description}
          >
            {highlightBrand(parsed.description)}
          </p>
        </div>

        {!item.read && !isSelectMode && (
          <span
            className={cn(
              styles.unreadDot,
              isMessage && 'bg-amber-400 shadow-[0_0_8px_#f59e0b]'
            )}
          />
        )}
      </div>
    </div>
  );
}
