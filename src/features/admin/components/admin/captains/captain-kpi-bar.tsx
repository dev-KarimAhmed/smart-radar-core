import React from 'react';
import { Users, Zap, AlertTriangle, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { styles } from './captains-types';

interface CaptainKpiBarProps {
  stats: {
    total: number;
    active: number;
    pendingVerification: number;
    flagged: number;
  };
  t: (key: string, params?: Record<string, any>) => string;
}

export const CaptainKpiBar: React.FC<CaptainKpiBarProps> = ({ stats, t }) => {
  return (
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
        <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 blur-2xl rounded-full" />
        <p className={styles.kpiTitle}>
          <AlertTriangle className="h-3.5 w-3.5 text-amber-400" />
          {t('kpiPending')}
        </p>
        <p className={cn(styles.kpiValue, "text-amber-400")}>{stats.pendingVerification}</p>
        <span className="text-[10px] text-slate-500 mt-1 block">{t('kpiPendingSub')}</span>
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
  );
};
