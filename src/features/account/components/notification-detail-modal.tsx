'use client';

import { useState } from 'react';
import type { AppNotification } from '@/shared/hooks/use-notifications';
import { parseNotificationContent } from '@/shared/utils/notification-i18n';
import { formatReadableDateTime } from '@/shared/utils/date-format';
import { highlightBrand } from '@/shared/components/brand-highlight';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
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

interface NotificationDetailModalProps {
  notification: AppNotification;
  isArabic: boolean;
  direction: 'rtl' | 'ltr';
  onClose: () => void;
  onDelete: (id: string) => Promise<void> | void;
}

export function NotificationDetailModal({
  notification,
  isArabic,
  direction,
  onClose,
  onDelete,
}: NotificationDetailModalProps) {
  const tNotifs = useTranslations('notificationsTab');
  const [copied, setCopied] = useState(false);

  const parsedModal = parseNotificationContent(notification, isArabic);
  const displayTitle = parsedModal.title || notification.title || '';
  const displayDesc = parsedModal.description || notification.description || '';

  const isMsg = notification.type === 'admin_message' || notification.type === 'message';
  const isRefInactive = notification.type === 'referral_inactivity';
  const isCredit = notification.type === 'WALLET_CREDIT';
  const isDeposit = notification.type === 'deposit_confirmed';
  const isAlert = notification.type === 'WALLET_ALERT';
  const isWarning = notification.type === 'warning';
  const isUrgent = notification.type === 'urgent';
  const isRef = notification.type === 'referral';

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
                isMsg
                  ? "border-amber-500/40 bg-amber-500/10 text-amber-300"
                  : isCredit
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300"
                    : isAlert
                      ? "border-rose-500/40 bg-rose-500/10 text-rose-300"
                      : "border-[#14B8A6]/40 bg-[#14B8A6]/10 text-[#14F5D5]"
              )}
            >
              {isMsg ? (
                <MessageSquare className="h-6 w-6" />
              ) : isRefInactive ? (
                <UserX className="h-6 w-6 text-amber-400" />
              ) : isCredit ? (
                <Wallet className="h-6 w-6" />
              ) : isAlert ? (
                <ShieldAlert className="h-6 w-6" />
              ) : isRef ? (
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
                  isMsg || isRefInactive
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                    : isCredit || isDeposit
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                      : isAlert || isUrgent
                        ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                        : isWarning
                          ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                          : isRef
                            ? "bg-teal-500/20 text-[#14F5D5] border border-teal-500/30"
                            : "bg-[#14B8A6]/20 text-[#14F5D5] border border-[#14B8A6]/30"
                )}
              >
                {isMsg
                  ? tNotifs('badges.adminMessage')
                  : isRefInactive
                    ? tNotifs('badges.referralInactivity')
                    : isCredit
                      ? tNotifs('badges.walletCredit')
                      : isDeposit
                        ? tNotifs('badges.depositConfirmed')
                        : isAlert
                          ? tNotifs('badges.walletAlert')
                          : isWarning
                            ? tNotifs('badges.warning')
                            : isUrgent
                              ? tNotifs('badges.urgent')
                              : isRef
                                ? tNotifs('badges.newReferralModal')
                                : tNotifs('badges.system')}
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
              const id = notification.id;
              onClose();
              await onDelete(id);
            }}
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
