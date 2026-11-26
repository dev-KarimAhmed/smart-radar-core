'use client';

import React from 'react';
import { Users, Gift, Zap, Send, RefreshCw, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { WelcomeHoursConfig } from '@/features/admin/types/driver-management';

interface DriversStatsHeaderProps {
  welcomeConfig: WelcomeHoursConfig;
  onOpenWelcomeHours: () => void;
  onOpenBulkTopup: () => void;
  onOpenBulkMessage: () => void;
  onRefresh: () => void;
  loading: boolean;
  stats: {
    total: number;
    active: number;
    flagged: number;
  };
  isArabic: boolean;
  t: (key: string, values?: Record<string, any>) => string;
}

const styles = {
  header: "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-white/10",
  kpiGrid: "grid grid-cols-1 sm:grid-cols-3 gap-3.5 mb-6",
  kpiCard: "rounded-2xl border border-white/10 bg-[#161F30]/70 p-4 backdrop-blur-xl shadow-lg relative overflow-hidden",
  kpiTitle: "text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5",
  kpiValue: "text-2xl font-black text-white font-mono",
} as const;

export function DriversStatsHeader({
  welcomeConfig,
  onOpenWelcomeHours,
  onOpenBulkTopup,
  onOpenBulkMessage,
  onRefresh,
  loading,
  stats,
  isArabic,
  t,
}: DriversStatsHeaderProps) {
  return (
    <>
      {/* 1. Header & Actions */}
      <div className={styles.header}>
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2">
            <Users className="w-6 h-6 text-[#14B8A6]" />
            {t('title')}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {t('subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Welcome Hours Config Button */}
          <Button
            type="button"
            onClick={onOpenWelcomeHours}
            className={cn(
              "font-black text-xs h-10 px-3.5 rounded-xl flex items-center gap-2 shadow-lg transition-all cursor-pointer active:scale-95 border",
              welcomeConfig.enabled
                ? "bg-gradient-to-r from-amber-500/20 via-emerald-500/20 to-teal-500/20 text-emerald-300 border-emerald-500/40 hover:border-emerald-400 hover:bg-emerald-500/30 shadow-emerald-900/20"
                : "bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 shadow-black/20"
            )}
            title={t('welcomeHoursTooltip')}
          >
            <Gift className="w-4 h-4 text-emerald-400" />
            <span>
              {welcomeConfig.enabled
                ? t('welcomeHoursBtnActive', { hours: welcomeConfig.hours })
                : t('welcomeHoursBtnDisabled')}
            </span>
            <span
              className={cn(
                "w-2 h-2 rounded-full",
                welcomeConfig.enabled ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
              )}
            />
          </Button>

          {/* Bulk Topup Button */}
          <Button
            type="button"
            onClick={onOpenBulkTopup}
            className="bg-[#14B8A6] hover:bg-[#2DD4BF] text-[#0B0F19] font-black text-xs h-10 px-3.5 rounded-xl flex items-center gap-1.5 shadow-lg shadow-[#14B8A6]/20 transition-all cursor-pointer active:scale-95"
            title={t('bulkTopupTooltip')}
          >
            <Zap className="w-4 h-4" />
            <span>{t('bulkTopupBtn')}</span>
          </Button>

          {/* Bulk Message Button */}
          <Button
            type="button"
            onClick={onOpenBulkMessage}
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs h-10 px-3.5 rounded-xl flex items-center gap-1.5 shadow-lg shadow-indigo-600/20 transition-all cursor-pointer active:scale-95"
            title={t('bulkMessageTooltip')}
          >
            <Send className={cn("w-4 h-4", isArabic ? "ml-0.5" : "mr-0.5")} />
            <span>{t('bulkMessageBtn')}</span>
          </Button>

          {/* Refresh Button */}
          <Button
            type="button"
            variant="outline"
            onClick={onRefresh}
            disabled={loading}
            className="border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 text-xs h-10 px-4 rounded-xl flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className={cn("w-4 h-4 text-[#14B8A6]", loading && "animate-spin")} />
            <span>{t('refreshBtn')}</span>
          </Button>
        </div>
      </div>

      {/* 2. KPI Summary Bar */}
      <div className={styles.kpiGrid}>
        <div className={styles.kpiCard}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#14B8A6]/5 blur-2xl rounded-full" />
          <p className={styles.kpiTitle}>
            <Users className="h-3.5 w-3.5 text-[#14B8A6]" />
            {t('kpiTotal')}
          </p>
          <p className={styles.kpiValue}>{stats.total}</p>
          <span className="text-[10px] text-slate-500 mt-1 block">{t('kpiTotalSub')}</span>
        </div>

        <div className={styles.kpiCard}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl rounded-full" />
          <p className={styles.kpiTitle}>
            <Zap className="h-3.5 w-3.5 text-emerald-400" />
            {t('kpiActive')}
          </p>
          <p className={cn(styles.kpiValue, "text-emerald-400")}>{stats.active}</p>
          <span className="text-[10px] text-slate-500 mt-1 block">{t('kpiActiveSub')}</span>
        </div>

        <div className={styles.kpiCard}>
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 blur-2xl rounded-full" />
          <p className={styles.kpiTitle}>
            <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
            {t('kpiFlagged')}
          </p>
          <p className={cn(styles.kpiValue, "text-rose-400")}>{stats.flagged}</p>
          <span className="text-[10px] text-slate-500 mt-1 block">{t('kpiFlaggedSub')}</span>
        </div>
      </div>
    </>
  );
}

