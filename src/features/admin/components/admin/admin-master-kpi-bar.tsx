'use client';

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase-client';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { Users, Car, Megaphone, UsersRound, Activity, ArrowUpRight } from 'lucide-react';
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
  container: "grid grid-cols-2 lg:grid-cols-5 gap-3.5 mb-6 text-right",
  card: "relative overflow-hidden rounded-2xl border border-white/10 bg-[#0B0F19]/90 p-4 transition-all duration-300 hover:border-white/20 shadow-lg",
  iconWrapper: "flex h-9 w-9 items-center justify-center rounded-xl",
  label: "mt-2 text-xs font-bold text-slate-400",
  valueContainer: "mt-1 flex items-baseline justify-between",
  mainValue: "font-mono text-2xl font-black text-white",
  subBadge: "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold",
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
    systemHealth: '100% مستقر',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function loadStats() {
      try {
        const [driversRes, ridersRes, delegatesRes] = await Promise.all([
          supabase.from('profiles').select('id, status', { count: 'exact' }).in('role', ['driver', 'DRIVER', 'CAPTAIN', 'captain']),
          supabase.from('profiles').select('id', { count: 'exact', head: true }).in('role', ['rider', 'RIDER']),
          supabase.from('profiles').select('id', { count: 'exact', head: true }).in('role', ['delegate', 'DELEGATE']),
        ]);

        let activeAdsCount = 0;
        let pendingAdsCount = 0;

        try {
          const promosSnap = await getDocs(collection(db, 'promos'));
          promosSnap.forEach((doc) => {
            const data = doc.data();
            const status = String(data.status || '').toLowerCase();
            if (status === 'active') activeAdsCount++;
            else if (status === 'pending') pendingAdsCount++;
          });
        } catch {
          // Ignore ads count failure
        }

        if (isMounted) {
          const allDrivers = driversRes.data || [];
          const activeCount = allDrivers.filter((d: any) => {
            const s = String(d.status || '').toLowerCase();
            return s === 'active' || s === 'busy';
          }).length;

          setStats({
            totalCaptains: driversRes.count ?? allDrivers.length,
            activeCaptains: activeCount,
            totalRiders: ridersRes.count ?? 0,
            activeAds: activeAdsCount,
            pendingAds: pendingAdsCount,
            totalDelegates: delegatesRes.count ?? 0,
            systemHealth: '100% مستقر',
          });
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
          <span className={cn(styles.subBadge, "bg-emerald-500/15 text-emerald-300")}>
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
          <span className={cn(styles.subBadge, "bg-cyan-500/15 text-cyan-300")}>
            <ArrowUpRight className="h-2.5 w-2.5 ml-0.5" /> مسجل
          </span>
        </div>
      </div>

      {/* 3. الإعلانات */}
      <div className={styles.card}>
        <div className={cn(styles.iconWrapper, "bg-amber-500/10 text-amber-400 border border-amber-500/20")}>
          <Megaphone className="h-4 w-4" />
        </div>
        <p className={styles.label}>{t('ads')}</p>
        <div className={styles.valueContainer}>
          <span className={styles.mainValue}>{loading ? '...' : stats.activeAds}</span>
          {stats.pendingAds > 0 ? (
            <span className={cn(styles.subBadge, "bg-red-500/20 text-red-300 animate-pulse border border-red-500/30")}>
              {stats.pendingAds} معلق
            </span>
          ) : (
            <span className={cn(styles.subBadge, "bg-slate-800 text-slate-400")}>
              0 معلق
            </span>
          )}
        </div>
      </div>

      {/* 4. المندوبون */}
      <div className={styles.card}>
        <div className={cn(styles.iconWrapper, "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20")}>
          <UsersRound className="h-4 w-4" />
        </div>
        <p className={styles.label}>{t('delegates')}</p>
        <div className={styles.valueContainer}>
          <span className={styles.mainValue}>{loading ? '...' : stats.totalDelegates}</span>
          <span className={cn(styles.subBadge, "bg-indigo-500/15 text-indigo-300")}>
            الميدان
          </span>
        </div>
      </div>

      {/* 5. حالة النظام */}
      <div className={styles.card}>
        <div className={cn(styles.iconWrapper, "bg-teal-500/10 text-[#14F5D5] border border-teal-500/20")}>
          <Activity className="h-4 w-4" />
        </div>
        <p className={styles.label}>{t('systemStatus')}</p>
        <div className={styles.valueContainer}>
          <span className="font-mono text-base font-bold text-[#14F5D5]">{stats.systemHealth}</span>
          <span className={cn(styles.subBadge, "bg-teal-500/15 text-teal-300")}>
            الرادار الحافة
          </span>
        </div>
      </div>
    </div>
  );
}
