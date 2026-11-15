'use client';

import React from 'react';
import { Users, CheckCircle2, ShieldAlert, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RiderStats } from '@/features/admin/types/rider-management';

interface RidersStatsBarProps {
  stats: RiderStats;
  isArabic: boolean;
  t: (key: string, values?: any) => string;
}

export function RidersStatsBar({ stats, isArabic, t }: RidersStatsBarProps) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 mb-6">
      {/* 1. Total */}
      <div className="rounded-2xl border border-white/10 bg-[#161F30]/70 p-4 backdrop-blur-xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 blur-2xl rounded-full" />
        <p className="text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-cyan-400" />
          {t('kpiTotal')}
        </p>
        <p className="text-2xl font-black text-white font-mono">{stats.total}</p>
        <span className="text-[10px] text-slate-500 mt-1 block">{t('kpiTotalSub')}</span>
      </div>

      {/* 2. Online */}
      <div className="rounded-2xl border border-white/10 bg-[#161F30]/70 p-4 backdrop-blur-xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl rounded-full" />
        <p className="text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" />
          {isArabic ? 'النشطون بالرادار' : 'Active on Radar'}
        </p>
        <p className="text-2xl font-black text-emerald-400 font-mono">{stats.online}</p>
        <span className="text-[10px] text-slate-500 mt-1 block">{isArabic ? 'متصلون ويطلبون الآن' : 'Online & requesting now'}</span>
      </div>

      {/* 3. Completed Trips */}
      <div className="rounded-2xl border border-white/10 bg-[#161F30]/70 p-4 backdrop-blur-xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 blur-2xl rounded-full" />
        <p className="text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
          <CheckCircle2 className="h-3.5 w-3.5 text-[#14B8A6]" />
          {isArabic ? 'الرحلات المنفذة بنجاح' : 'Completed Trips'}
        </p>
        <p className="text-2xl font-black text-[#14B8A6] font-mono">{stats.completedTrips}</p>
        <span className="text-[10px] text-slate-500 mt-1 block">{isArabic ? 'إجمالي الرحلات المكتملة' : 'Total successful trips'}</span>
      </div>

      {/* 4. Suspended */}
      <div className="rounded-2xl border border-white/10 bg-[#161F30]/70 p-4 backdrop-blur-xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 blur-2xl rounded-full" />
        <p className="text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
          <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
          {isArabic ? 'حسابات معلقة وموقوفة' : 'Suspended Accounts'}
        </p>
        <p className="text-2xl font-black text-rose-400 font-mono">{stats.suspended}</p>
        <span className="text-[10px] text-slate-500 mt-1 block">{isArabic ? 'ممنوعون من بث العوامة' : 'Blocked from radar beacon'}</span>
      </div>

      {/* 5. Behavioral Watch */}
      <div className="rounded-2xl border border-white/10 bg-[#161F30]/70 p-4 backdrop-blur-xl shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-2xl rounded-full" />
        <p className="text-xs font-bold text-slate-300 mb-1.5 flex items-center gap-1.5">
          <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
          {isArabic ? 'تحت الرقابة السلوكية' : 'Under Behavioral Watch'}
        </p>
        <p className="text-2xl font-black text-amber-400 font-mono">{stats.atRisk}</p>
        <span className="text-[10px] text-slate-500 mt-1 block">{isArabic ? 'دون 4.2 أو تكرار الإلغاء' : 'Below 4.2 or high cancellations'}</span>
      </div>
    </div>
  );
}

