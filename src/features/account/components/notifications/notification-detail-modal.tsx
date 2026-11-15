import React, { useState } from 'react';
import type { AppNotification } from '@/shared/hooks/use-notifications';
import {
  Bell,
  Trash2,
  X,
  MessageSquare,
  Wallet,
  ShieldAlert,
  Copy,
  UserCheck,
  UserX,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { highlightBrand } from '@/shared/components/brand-highlight';
import { formatReadableDateTime } from '@/shared/utils/date-format';
import { hasArabicScript, type resolveNotificationForDisplay } from '@/shared/utils/notification-i18n';

interface NotificationDetailModalProps {
  notification: AppNotification | null;
  onClose: () => void;
  onDelete: (id: string) => Promise<void>;
  isArabic: boolean;
  direction: 'rtl' | 'ltr';
  parsed: ReturnType<typeof resolveNotificationForDisplay>;
  tNotifs: (key: string, values?: any) => string;
}

export function NotificationDetailModal({
  notification,
  onClose,
  onDelete,
  isArabic,
  direction,
  parsed,
  tNotifs,
}: NotificationDetailModalProps) {
  const [copied, setCopied] = useState(false);

  if (!notification) return null;

  const displayTitle = parsed.title || notification.title || '';
  const displayDesc = parsed.description || notification.description || '';

  const getBadgeClass = () => {
    switch (notification.type) {
      case 'admin_message':
      case 'message':
      case 'referral_inactivity':
      case 'warning':
        return 'bg-amber-500/20 text-amber-300 border border-amber-500/30';
      case 'WALLET_CREDIT':
      case 'deposit_confirmed':
        return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30';
      case 'WALLET_ALERT':
      case 'urgent':
        return 'bg-rose-500/20 text-rose-300 border border-rose-500/30';
      case 'referral':
        return 'bg-teal-500/20 text-[#14F5D5] border border-teal-500/30';
      default:
        return 'bg-[#14B8A6]/20 text-[#14F5D5] border border-[#14B8A6]/30';
    }
  };

  const getBadgeLabel = () => {
    switch (notification.type) {
      case 'admin_message':
      case 'message':
        return tNotifs('badges.adminMessage');
      case 'referral_inactivity':
        return tNotifs('badges.referralInactivity');
      case 'WALLET_CREDIT':
        return tNotifs('badges.walletCredit');
      case 'deposit_confirmed':
        return tNotifs('badges.depositConfirmed');
      case 'WALLET_ALERT':
        return tNotifs('badges.walletAlert');
      case 'warning':
        return tNotifs('badges.warning');
      case 'urgent':
        return tNotifs('badges.urgent');
      case 'referral':
        return tNotifs('badges.newReferralModal');
      default:
        return tNotifs('badges.system');
    }
  };

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
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
                notification.type === 'admin_message' || notification.type === 'message'
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                  : notification.type === 'WALLET_CREDIT'
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                    : notification.type === 'WALLET_ALERT'
                      ? "border-rose-500/40 bg-rose-500/10 text-rose-300"
                      : "border-[#14B8A6]/40 bg-[#14B8A6]/10 text-[#14F5D5]"
              )}
            >
              {notification.type === 'admin_message' || notification.type === 'message' ? (
                <MessageSquare className="h-6 w-6" />
              ) : notification.type === 'referral_inactivity' ? (
                <UserX className="h-6 w-6 text-amber-400" />
              ) : notification.type === 'WALLET_CREDIT' ? (
                <Wallet className="h-6 w-6" />
              ) : notification.type === 'WALLET_ALERT' ? (
                <ShieldAlert className="h-6 w-6" />
              ) : notification.type === 'referral' ? (
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
                  getBadgeClass()
                )}
              >
                {getBadgeLabel()}
              </span>
              <p className="text-xs text-slate-400">
                {formatReadableDateTime(notification.timestamp, isArabic).fullText}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={tNotifs('modal.close')}
            title={tNotifs('modal.close')}
            className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-400 hover:bg-white/10 hover:text-white transition cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="space-y-3 pt-1" dir={direction}>
          <div className="flex items-start justify-between gap-2">
            <h2
              dir={hasArabicScript(displayTitle) ? 'rtl' : 'ltr'}
              className="text-base sm:text-lg font-black text-white leading-snug"
            >
              {highlightBrand(displayTitle)}
            </h2>
          </div>

          <div
            dir={hasArabicScript(displayDesc) ? 'rtl' : 'ltr'}
            className="rounded-2xl border border-white/5 bg-white/[0.03] p-4 text-sm leading-relaxed text-slate-200 whitespace-pre-wrap break-words max-h-64 overflow-y-auto selection:bg-[#14B8A6]/30"
          >
            {highlightBrand(displayDesc)}
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/10">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void onDelete(notification.id)}
            className="border-rose-500/30 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 text-xs sm:text-sm font-bold cursor-pointer inline-flex items-center gap-1.5"
          >
            <Trash2 className="h-4 w-4" />
            <span>{tNotifs('modal.delete')}</span>
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
              <span>{copied ? tNotifs('modal.copied') : tNotifs('modal.copy')}</span>
            </Button>

            <Button
              size="sm"
              onClick={onClose}
              className="bg-[#14B8A6] text-[#06111f] hover:bg-[#14F5D5] text-xs sm:text-sm font-black cursor-pointer px-4"
            >
              {tNotifs('modal.close')}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
