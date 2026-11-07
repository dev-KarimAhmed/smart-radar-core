'use client';

import React from 'react';
import {
  ReceiptText,
  UserCheck,
  KeyRound,
  AlertTriangle,
} from 'lucide-react';
import type { NotificationsSummary } from './admin-notification-types';

export type NotificationCategoryFilter = 'ALL' | 'RECEIPT' | 'CAPTAIN' | 'PASSWORD_RESET' | 'SYSTEM';

interface NotificationFilterTabsProps {
  filterTab: NotificationCategoryFilter;
  setFilterTab: (tab: NotificationCategoryFilter) => void;
  summary: NotificationsSummary;
  t: (key: string) => string;
}

export function NotificationFilterTabs({
  filterTab,
  setFilterTab,
  summary,
  t,
}: NotificationFilterTabsProps) {
  return (
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
  );
}
