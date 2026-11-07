'use client';

import React from 'react';
import {
  ReceiptText,
  UserCheck,
  KeyRound,
  AlertTriangle,
  Clock,
  Eye,
  ArrowUpRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { AdminNotificationItem } from './admin-notification-types';

interface NotificationItemCardProps {
  item: AdminNotificationItem;
  t: (key: string, params?: Record<string, any>) => string;
  onOpenReceiptReview: (item: AdminNotificationItem) => void;
  onNavigateToTab: (tab: string, subtab?: string) => void;
}

export function NotificationItemCard({
  item,
  t,
  onOpenReceiptReview,
  onNavigateToTab,
}: NotificationItemCardProps) {
  const isReceipt = item.category === 'RECEIPT';
  const isCaptain = item.category === 'CAPTAIN';
  const isReset = item.category === 'PASSWORD_RESET';

  return (
    <div
      className={`rounded-2xl border p-4 transition-all hover:border-white/20 bg-black/40 flex flex-col sm:flex-row items-start justify-between gap-4 ${
        isReceipt
          ? 'border-emerald-500/30 hover:bg-emerald-950/10'
          : isCaptain
          ? 'border-cyan-500/30 hover:bg-cyan-950/10'
          : isReset
          ? 'border-amber-500/30 hover:bg-amber-950/10'
          : 'border-white/10 hover:bg-white/[0.02]'
      }`}
    >
      {/* Right: Icon + Details */}
      <div className="flex items-start gap-3 w-full sm:w-auto flex-1">
        {/* Category Icon */}
        <div
          className={`h-10 w-10 shrink-0 rounded-xl border flex items-center justify-center mt-0.5 ${
            isReceipt
              ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
              : isCaptain
              ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
              : isReset
              ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
              : 'bg-white/10 border-white/20 text-slate-300'
          }`}
        >
          {isReceipt ? (
            <ReceiptText className="w-5 h-5" />
          ) : isCaptain ? (
            <UserCheck className="w-5 h-5" />
          ) : isReset ? (
            <KeyRound className="w-5 h-5" />
          ) : (
            <AlertTriangle className="w-5 h-5" />
          )}
        </div>

        {/* Info Block */}
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="text-xs sm:text-sm font-black text-white">{item.title}</h4>
            <span className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {item.createdAt ? new Date(item.createdAt).toLocaleTimeString('ar-JO', { hour: '2-digit', minute: '2-digit' }) : ''}
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">{item.description}</p>

          {/* Extra detail chips */}
          {isReceipt && (
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                {t('amount')}: {item.payload.amount} {item.payload.currency}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white/5 text-slate-300 border border-white/10">
                {t('channel')}: {item.payload.channel}
              </span>
              {item.payload.captainPhone && (
                <span className="text-[10px] font-mono text-slate-400 bg-black/40 px-2 py-0.5 rounded-lg border border-white/5" dir="ltr">
                  {item.payload.captainPhone}
                </span>
              )}
            </div>
          )}

          {isCaptain && (
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              {item.payload.plateNumber && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-cyan-500/15 text-cyan-300 border border-cyan-500/25">
                  {t('plate')}: {item.payload.plateNumber}
                </span>
              )}
              {item.payload.vehicleBrand && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-white/5 text-slate-300 border border-white/10">
                  {item.payload.vehicleBrand} {item.payload.vehicleModel}
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Left: Action Buttons */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/5">
        {isReceipt && (
          <>
            <Button
              type="button"
              size="sm"
              onClick={() => onOpenReceiptReview(item)}
              className="bg-emerald-500 hover:bg-emerald-600 text-black font-black text-xs h-8 px-3 rounded-xl transition-all shadow-[0_0_12px_rgba(16,185,129,0.2)]"
            >
              <Eye className="w-3.5 h-3.5 ml-1" />
              <span>{t('reviewAndApprove')}</span>
            </Button>

            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => onNavigateToTab('wallet', 'receipts')}
              className="border-white/10 hover:bg-white/10 text-slate-300 text-xs h-8 px-2.5 rounded-xl"
              title={t('goToReceipts')}
            >
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Button>
          </>
        )}

        {isCaptain && (
          <Button
            type="button"
            size="sm"
            onClick={() => onNavigateToTab('captains')}
            className="bg-cyan-500 hover:bg-cyan-600 text-black font-black text-xs h-8 px-3 rounded-xl transition-all shadow-[0_0_12px_rgba(6,182,212,0.2)]"
          >
            <UserCheck className="w-3.5 h-3.5 ml-1" />
            <span>{t('reviewCaptain')}</span>
          </Button>
        )}

        {isReset && (
          <Button
            type="button"
            size="sm"
            onClick={() => onNavigateToTab('captains')}
            className="bg-amber-500 hover:bg-amber-600 text-black font-black text-xs h-8 px-3 rounded-xl transition-all"
          >
            <KeyRound className="w-3.5 h-3.5 ml-1" />
            <span>{t('reviewRequest')}</span>
          </Button>
        )}
      </div>
    </div>
  );
}
