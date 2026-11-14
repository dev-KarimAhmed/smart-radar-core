'use client';

import React from 'react';
import {
  Bell,
  ReceiptText,
  UserCheck,
  KeyRound,
  AlertTriangle,
  RefreshCw,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type { NotificationsSummary } from '../../../types/admin-notification-types';

export type NotificationFilterTab = 'ALL' | 'RECEIPT' | 'CAPTAIN' | 'PASSWORD_RESET' | 'SYSTEM';

interface AdminNotificationsHeaderProps {
  isArabic: boolean;
  hasUnread: boolean;
  summary: NotificationsSummary;
  soundEnabled: boolean;
  toggleSound: () => void;
  loading: boolean;
  fetchNotifications: (isManual?: boolean) => void;
  filterTab: NotificationFilterTab;
  setFilterTab: (tab: NotificationFilterTab) => void;
  t: (key: string, values?: any) => string;
}

export function AdminNotificationsHeader({
  isArabic,
  hasUnread,
  summary,
  soundEnabled,
  toggleSound,
  loading,
  fetchNotifications,
  filterTab,
  setFilterTab,
  t,
}: AdminNotificationsHeaderProps) {
  return (
    <DialogHeader className={cn('p-4 sm:p-5 border-b border-white/10 bg-black/40 space-y-2', isArabic ? 'text-right' : 'text-left')}>
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
          {/* Sound Toggle */}
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

          {/* Refresh Button */}
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
      <div className="flex items-center gap-1.5 pt-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setFilterTab('ALL')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            filterTab === 'ALL'
              ? 'bg-teal-500 text-[#0B0F19] shadow-[0_0_12px_rgba(20,184,166,0.3)]'
              : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5'
          }`}
        >
          <span>{t('tabAll')}</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${filterTab === 'ALL' ? 'bg-[#0B0F19]/20 text-[#0B0F19]' : 'bg-white/10 text-slate-300'}`}>
            {summary.totalUnread}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilterTab('RECEIPT')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            filterTab === 'RECEIPT'
              ? 'bg-emerald-500 text-black shadow-[0_0_12px_rgba(16,185,129,0.3)]'
              : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5'
          }`}
        >
          <ReceiptText className="w-3.5 h-3.5" />
          <span>{t('tabReceipts')}</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${filterTab === 'RECEIPT' ? 'bg-black/20 text-black' : 'bg-emerald-500/20 text-emerald-300'}`}>
            {summary.pendingReceiptsCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilterTab('CAPTAIN')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            filterTab === 'CAPTAIN'
              ? 'bg-cyan-500 text-black shadow-[0_0_12px_rgba(6,182,212,0.3)]'
              : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>{t('tabCaptains')}</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${filterTab === 'CAPTAIN' ? 'bg-black/20 text-black' : 'bg-cyan-500/20 text-cyan-300'}`}>
            {summary.pendingCaptainsCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilterTab('PASSWORD_RESET')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            filterTab === 'PASSWORD_RESET'
              ? 'bg-amber-500 text-black shadow-[0_0_12px_rgba(245,158,11,0.3)]'
              : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5'
          }`}
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>{t('tabResets')}</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${filterTab === 'PASSWORD_RESET' ? 'bg-black/20 text-black' : 'bg-amber-500/20 text-amber-300'}`}>
            {summary.pendingResetsCount}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setFilterTab('SYSTEM')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap ${
            filterTab === 'SYSTEM'
              ? 'bg-teal-500 text-black shadow-[0_0_12px_rgba(20,184,166,0.3)]'
              : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 border border-white/5'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>{t('tabSystem')}</span>
        </button>
      </div>
    </DialogHeader>
  );
}
