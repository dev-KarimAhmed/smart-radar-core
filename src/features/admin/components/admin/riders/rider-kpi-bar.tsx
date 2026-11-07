'use client';

import React from 'react';
import {
  Users,
  CheckCircle2,
  ShieldAlert,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { styles } from './riders-types';

interface RiderKpiBarProps {
  stats: {
    total: number;
    online: number;
    idle: number;
    suspended: number;
    atRisk: number;
    completedTrips: number;
  };
  isArabic: boolean;
  t: (key: any, values?: any) => string;
}

export function RiderKpiBar({ stats, isArabic, t }: RiderKpiBarProps) {
  return (
    <div className={styles.kpiGrid}>
      <div className={styles.kpiCard}>
        <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 blur-2xl rounded-full" />
        <p className={styles.kpiTitle}>
          <Users className="h-3.5 w-3.5 text-cyan-400" />
          {t('kpiTotal')}
        </p>
        <p className={styles.kpiValue}>{stats.total}</p>
        <span className="text-[10px] text-slate-500 mt-1 block">{t('kpiTotalSub')}</span>
      </div>

      <div className={styles.kpiCard}>
        <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl rounded-full" />
        <p className={styles.kpiTitle}>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse ml-1" />
          {isArabic ? 'النشطون بالرادار' : 'Active on Radar'}
        </p>
        <p className={cn(styles.kpiValue, "text-emerald-400")}>{stats.online}</p>
        <span className="text-[10px] text-slate-500 mt-1 block">
          {isArabic ? 'متصلون ويطلبون الآن' : 'Online & requesting now'}
        </span>
      </div>

      <div className={styles.kpiCard}>
        <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 blur-2xl rounded-full" />
        <p className={styles.kpiTitle}>
          <CheckCircle2 className="h-3.5 w-3.5 text-[#14B8A6]" />
          {isArabic ? 'الرحلات المنفذة بنجاح' : 'Completed Trips'}
        </p>
        <p className={cn(styles.kpiValue, "text-[#14B8A6]")}>{stats.completedTrips}</p>
        <span className="text-[10px] text-slate-500 mt-1 block">
          {isArabic ? 'إجمالي الرحلات المكتملة' : 'Total successful trips'}
        </span>
      </div>

      <div className={styles.kpiCard}>
        <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 blur-2xl rounded-full" />
        <p className={styles.kpiTitle}>
          <ShieldAlert className="h-3.5 w-3.5 text-rose-400" />
          {isArabic ? 'حسابات معلقة وموقوفة' : 'Suspended Accounts'}
        </p>
        <p className={cn(styles.kpiValue, "text-rose-400")}>{stats.suspended}</p>
        <span className="text-[10px] text-slate-500 mt-1 block">
          {isArabic ? 'ممنوعون من بث العوامة' : 'Blocked from radar beacon'}
        </span>
      </div>

      <div className={styles.kpiCard}>
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-2xl rounded-full" />
        <p className={styles.kpiTitle}>
          <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
          {isArabic ? 'تحت الرقابة السلوكية' : 'Under Behavioral Watch'}
        </p>
        <p className={cn(styles.kpiValue, "text-amber-400")}>{stats.atRisk}</p>
        <span className="text-[10px] text-slate-500 mt-1 block">
          {isArabic ? 'دون 4.2 أو تكرار الإلغاء' : 'Below 4.2 or high cancellations'}
        </span>
      </div>
    </div>
  );
}
