'use client';

import React, { useEffect, useState } from 'react';
import { adminFetch } from '@/features/admin/lib/admin-api-client';
import { Users, Car, Megaphone, UsersRound, ArrowUpRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

interface KPIStats {
  totalCaptains: number;
  activeCaptains: number;
  totalRiders: number;
  activeAds: number;
  pendingAds: number;
  totalDelegates: number;
  systemHealth: string;
}

const styles = {
  container: "grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6 text-right",
  card: "relative overflow-hidden rounded-2xl border border-white/10 bg-[#0B0F19]/95 p-4 transition-all duration-300 hover:border-white/20 shadow-xl backdrop-blur-xl",
  iconWrapper: "flex h-9 w-9 items-center justify-center rounded-xl",
  label: "mt-2.5 text-xs font-bold text-slate-300 tracking-wide",
  valueContainer: "mt-1.5 flex items-baseline justify-between",
  mainValue: "font-mono text-2xl font-black text-white tracking-tight",
  subBadge: "inline-flex items-center gap-1 rounded-lg px-2.5 py-0.5 text-[11px] font-bold border shadow-sm",
} as const;

export function AdminMasterKPIBar() {
  const t = useTranslations('adminKPI');
  const [stats, setStats] = useState<KPIStats>({
    totalCaptains: 0,
    activeCaptains: 0,
    totalRiders: 0,
    activeAds: 0,
    pendingAds: 0,
    totalDelegates: 0,
    systemHealth: '100%',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      try {
        const res = await adminFetch('/api/admin/kpis');
        const data = await res.json();

        if (isMounted && data?.success && data?.stats) {
          setStats(data.stats);
        }
      } catch (err) {
        console.warn('[Admin KPI Bar] Fetch error:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    void loadStats();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className={styles.container} dir="rtl">
      {/* 1. السائقون */}
      <div className={styles.card}>
        <div className={cn(styles.iconWrapper, "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20")}>
          <Car className="h-4 w-4" />
        </div>
        <p className={styles.label}>{t('captains')}</p>
        <div className={styles.valueContainer}>
          <span className={styles.mainValue}>{loading ? '...' : stats.totalCaptains}</span>
          <span className={cn(styles.subBadge, "bg-emerald-500/15 text-emerald-300 border-emerald-500/30")}>
            {stats.activeCaptains} {t('online')}
          </span>
        </div>
      </div>

      {/* 2. الركاب */}
      <div className={styles.card}>
        <div className={cn(styles.iconWrapper, "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20")}>
          <Users className="h-4 w-4" />
        </div>
        <p className={styles.label}>{t('riders')}</p>
        <div className={styles.valueContainer}>
          <span className={styles.mainValue}>{loading ? '...' : stats.totalRiders}</span>
          <span className={cn(styles.subBadge, "bg-cyan-500/15 text-cyan-300 border-cyan-500/30")}>
            <ArrowUpRight className="h-2.5 w-2.5 ml-0.5" /> {t('organic')}
          </span>
        </div>
      </div>

      {/* 3. الإعلانات */}
      <div className={styles.card}>
        <div className="flex items-center justify-between">
          <div className={cn(styles.iconWrapper, "bg-amber-500/10 text-amber-400 border border-amber-500/20")}>
            <Megaphone className="h-4 w-4" />
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-300">
            {t('underConstruction')}
          </span>
        </div>
        <p className={styles.label}>{t('ads')}</p>
        <div className={styles.valueContainer}>
          <span className={styles.mainValue}>{loading ? '...' : stats.activeAds}</span>
          <span className={cn(styles.subBadge, "bg-amber-500/15 text-amber-300 border-amber-500/30")}>
            {t('underDevelopment')}
          </span>
        </div>
      </div>

      {/* 4. المندوبون */}
      <div className={styles.card}>
        <div className="flex items-center justify-between">
          <div className={cn(styles.iconWrapper, "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20")}>
            <UsersRound className="h-4 w-4" />
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 border border-amber-500/30 px-2 py-0.5 text-[10px] font-bold text-amber-300">
            {t('underConstruction')}
          </span>
        </div>
        <p className={styles.label}>{t('delegates')}</p>
        <div className={styles.valueContainer}>
          <span className={styles.mainValue}>{loading ? '...' : stats.totalDelegates}</span>
          <span className={cn(styles.subBadge, "bg-amber-500/15 text-amber-300 border-amber-500/30")}>
            {t('underDevelopment')}
          </span>
        </div>
      </div>
    </div>
  );
}
