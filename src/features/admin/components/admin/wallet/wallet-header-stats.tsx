'use client';

import React from 'react';
import {
  DollarSign,
  Clock,
  Receipt,
  Ticket,
  Zap,
  Layers,
  CreditCard,
  UserCheck,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Loader2,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { WalletOverview, WalletSubTab } from './wallet-types';

interface WalletHeaderStatsProps {
  overview: WalletOverview | null;
  loadingOverview: boolean;
  activeSubTab: WalletSubTab;
  setActiveSubTab: (tab: WalletSubTab) => void;
  loadingData: boolean;
  togglingSelfTopup: boolean;
  onToggleSelfTopup: () => Promise<void>;
  onRefresh: () => void;
  t: (key: any, values?: any) => string;
}

export function WalletHeaderStats({
  overview,
  loadingOverview,
  activeSubTab,
  setActiveSubTab,
  loadingData,
  togglingSelfTopup,
  onToggleSelfTopup,
  onRefresh,
  t,
}: WalletHeaderStatsProps) {
  return (
    <>
      {/* 1. FINANCIAL KPIS & QUICK METRICS BAR */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* KPI 1: Total Cash Balance */}
        <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-[#0B0F19]/95 p-4 transition-all hover:border-amber-500/40 shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <DollarSign className="h-5 w-5" />
            </div>
            <Badge className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-mono">
              {t('captainLiquidity')}
            </Badge>
          </div>
          <div className="mt-2.5 text-xs font-bold text-slate-300">{t('totalCashBalance')}</div>
          <div className="mt-1">
            {loadingOverview ? (
              <span className="font-mono text-2xl font-black text-amber-400">...</span>
            ) : (overview?.egpBalance ?? 0) > 0 && (overview?.jodBalance ?? 0) > 0 ? (
              <div className="space-y-0.5">
                <div className="flex items-baseline justify-between">
                  <span className="font-mono text-xl font-black text-amber-400">
                    {overview?.jodBalance?.toFixed(2)}
                  </span>
                  <span className="text-xs font-bold text-amber-500/80 font-sans">{t('jodLabel')}</span>
                </div>
                <div className="flex items-baseline justify-between border-t border-white/5 pt-0.5">
                  <span className="font-mono text-base font-bold text-amber-300">
                    {overview?.egpBalance?.toFixed(2)}
                  </span>
                  <span className="text-[11px] font-bold text-amber-400/70 font-sans">{t('egpLabel')}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-2xl font-black text-amber-400">
                  {((overview?.jodBalance ?? 0) > 0
                    ? overview?.jodBalance?.toFixed(2)
                    : overview?.egpBalance?.toFixed(2)) || overview?.totalCashBalance.toFixed(2) || '0.00'}
                </span>
                <span className="text-xs font-bold text-amber-500/80">
                  {(overview?.egpBalance ?? 0) > 0 ? t('egpFull') : t('jodFull')}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* KPI 2: Total Flight Minutes */}
        <div className="relative overflow-hidden rounded-2xl border border-teal-500/20 bg-[#0B0F19]/95 p-4 transition-all hover:border-teal-500/40 shadow-xl backdrop-blur-xl">
          <div className="flex items-center justify-between">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20">
              <Clock className="h-5 w-5" />
            </div>
            <Badge className="bg-teal-500/10 text-teal-400 border border-teal-500/30 text-[10px] font-mono">
              {loadingOverview ? '...' : t('flightHoursEst', { hours: overview?.totalFlightHours || 0 })}
            </Badge>
          </div>
          <div className="mt-2.5 text-xs font-bold text-slate-300">{t('flightMinutesLoaded')}</div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-black text-teal-400">
              {loadingOverview ? '...' : `${overview?.totalPaidMinutes.toLocaleString() || '0'}`}
            </span>
            <span className="text-xs font-bold text-teal-500/80">{t('flightMinutesUnit')}</span>
          </div>
        </div>

        {/* KPI 3: Pending Recharge Receipts */}
        <div className={cn(
          "relative overflow-hidden rounded-2xl border p-4 transition-all shadow-xl backdrop-blur-xl",
          (overview?.pendingReceiptsCount ?? 0) > 0
            ? "border-rose-500/40 bg-[#0B0F19]/95 shadow-[0_0_20px_rgba(244,63,94,0.1)]"
            : "border-white/10 bg-[#0B0F19]/95"
        )}>
          <div className="flex items-center justify-between">
            <div className={cn(
              "flex h-9 w-9 items-center justify-center rounded-xl border",
              (overview?.pendingReceiptsCount ?? 0) > 0
                ? "bg-rose-500/15 text-rose-400 border-rose-500/30 animate-pulse"
                : "bg-white/5 text-slate-400 border-white/10"
            )}>
              <Receipt className="h-5 w-5" />
            </div>
            {(overview?.pendingReceiptsCount ?? 0) > 0 ? (
              <Badge className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-bold">
                {t('immediateReview')}
              </Badge>
            ) : (
              <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                {t('allSettled')}
              </Badge>
            )}
          </div>
          <div className="mt-2.5 text-xs font-bold text-slate-300">{t('pendingReceipts')}</div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className={cn(
              "font-mono text-2xl font-black",
              (overview?.pendingReceiptsCount ?? 0) > 0 ? "text-rose-400" : "text-white"
            )}>
              {loadingOverview ? '...' : overview?.pendingReceiptsCount || 0}
            </span>
            <span className="text-xs font-bold text-slate-500">{t('receiptsNeedAudit')}</span>
          </div>
        </div>

        {/* KPI 4: Unused Vouchers & Test Flag */}
        <div className="relative overflow-hidden rounded-2xl border border-indigo-500/20 bg-[#0B0F19]/95 p-4 transition-all hover:border-indigo-500/40 shadow-xl backdrop-blur-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Ticket className="h-5 w-5" />
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={togglingSelfTopup || loadingOverview}
                onClick={onToggleSelfTopup}
                className={cn(
                  "h-7 px-2.5 rounded-lg text-[10px] font-bold border transition-all flex items-center gap-1",
                  overview?.selfTopupEnabled
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                    : "bg-white/5 border-white/10 text-slate-400"
                )}
                title={t('selfTopupTooltip')}
              >
                {togglingSelfTopup ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : overview?.selfTopupEnabled ? (
                  <ToggleRight className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <ToggleLeft className="w-3.5 h-3.5 text-slate-500" />
                )}
                <span>{t('selfTopupLabel', { status: overview?.selfTopupEnabled ? t('enabled') : t('disabled') })}</span>
              </Button>
            </div>
            <div className="mt-2.5 text-xs font-bold text-slate-300">{t('vouchersAvailable')}</div>
          </div>
          <div className="mt-1 flex items-baseline justify-between">
            <span className="font-mono text-2xl font-black text-indigo-400">
              {loadingOverview ? '...' : overview?.unusedVouchersCount || 0}
            </span>
            <span className="text-xs font-bold text-slate-500">
              {t('vouchersOutOfTotal', { total: overview?.totalVouchersCount || 0 })}
            </span>
          </div>
        </div>
      </div>

      {/* 2. SUB-NAVIGATION TABS */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-[#050A0F]/90 border border-white/10 p-2 rounded-2xl">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setActiveSubTab('receipts')}
            className={cn(
              "py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
              activeSubTab === 'receipts'
                ? "bg-[#14B8A6] text-[#0B0F19] hover:bg-[#14B8A6]/90"
                : "text-slate-300 hover:text-white hover:bg-white/5"
            )}
          >
            <Receipt className="w-4 h-4" />
            <span>{t('subtabReceipts')}</span>
            {(overview?.pendingReceiptsCount ?? 0) > 0 && (
              <span className="bg-rose-600 text-white text-[10px] font-black px-1.5 py-0.2 rounded-full">
                {overview?.pendingReceiptsCount}
              </span>
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => setActiveSubTab('direct')}
            className={cn(
              "py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
              activeSubTab === 'direct'
                ? "bg-[#14B8A6] text-[#0B0F19] hover:bg-[#14B8A6]/90"
                : "text-slate-300 hover:text-white hover:bg-white/5"
            )}
          >
            <Zap className="w-4 h-4" />
            <span>{t('subtabDirectTopup')}</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => setActiveSubTab('vouchers')}
            className={cn(
              "py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
              activeSubTab === 'vouchers'
                ? "bg-[#14B8A6] text-[#0B0F19] hover:bg-[#14B8A6]/90"
                : "text-slate-300 hover:text-white hover:bg-white/5"
            )}
          >
            <Ticket className="w-4 h-4" />
            <span>{t('subtabVouchers')}</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => setActiveSubTab('ledger')}
            className={cn(
              "py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
              activeSubTab === 'ledger'
                ? "bg-[#14B8A6] text-[#0B0F19] hover:bg-[#14B8A6]/90"
                : "text-slate-300 hover:text-white hover:bg-white/5"
            )}
          >
            <Layers className="w-4 h-4" />
            <span>{t('subtabTransactions')}</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => setActiveSubTab('rates')}
            className={cn(
              "py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
              activeSubTab === 'rates'
                ? "bg-[#14B8A6] text-[#0B0F19] hover:bg-[#14B8A6]/90"
                : "text-slate-300 hover:text-white hover:bg-white/5"
            )}
          >
            <Clock className="w-4 h-4" />
            <span>{t('subtabHourlyRates')}</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => setActiveSubTab('channels')}
            className={cn(
              "py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
              activeSubTab === 'channels'
                ? "bg-[#14B8A6] text-[#0B0F19] hover:bg-[#14B8A6]/90"
                : "text-slate-300 hover:text-white hover:bg-white/5"
            )}
          >
            <CreditCard className="w-4 h-4" />
            <span>أرقام التحويل</span>
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => setActiveSubTab('delegates')}
            className={cn(
              "py-2 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2",
              activeSubTab === 'delegates'
                ? "bg-[#14B8A6] text-[#0B0F19] hover:bg-[#14B8A6]/90"
                : "text-slate-300 hover:text-white hover:bg-white/5"
            )}
          >
            <UserCheck className="w-4 h-4" />
            <span>المناديب المالية</span>
          </Button>
        </div>

        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={onRefresh}
          disabled={loadingData || loadingOverview}
          className="border-white/10 text-slate-300 hover:bg-white/5 h-9 px-3 rounded-xl text-xs flex items-center gap-1.5"
        >
          <RefreshCw className={cn("w-3.5 h-3.5", (loadingData || loadingOverview) && "animate-spin text-teal-400")} />
          <span>{t('refresh')}</span>
        </Button>
      </div>
    </>
  );
}
