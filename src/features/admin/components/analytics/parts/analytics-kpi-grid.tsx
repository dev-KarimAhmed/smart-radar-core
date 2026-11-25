'use client';

import React from 'react';
import { Car, Users, Navigation, Wallet, Megaphone, UsersRound, CheckCircle2, Route } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { AnalyticsSummary } from '@/features/admin/types/admin-analytics';

interface AnalyticsKpiGridProps {
  summary: AnalyticsSummary;
  loading: boolean;
  isArabic: boolean;
}

export function AnalyticsKpiGrid({ summary, loading, isArabic }: AnalyticsKpiGridProps) {
  const val = (n: number | string) => (loading ? '...' : n);

  const cards = [
    {
      title: isArabic ? 'السائقين المسجلين' : 'Registered Captains',
      main: val(summary.totalCaptains),
      sub: `${summary.activeCaptains} ${isArabic ? 'نشط الآن' : 'online'} · ${summary.verifiedCaptains} ${isArabic ? 'موثق' : 'verified'}`,
      icon: Car,
      accent: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400',
      badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    },
    {
      title: isArabic ? 'المستخدمين (الركاب)' : 'Registered Users',
      main: val(summary.totalRiders),
      sub: `${summary.totalDelegates} ${isArabic ? 'مندوب' : 'delegates'} · ${summary.activeAds} ${isArabic ? 'إعلان نشط' : 'active ads'}`,
      icon: Users,
      accent: 'border-cyan-500/25 bg-cyan-500/10 text-cyan-400',
      badge: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    },
    {
      title: isArabic ? 'إجمالي الرحلات' : 'Total Trips',
      main: val(summary.totalTrips),
      sub: `${summary.completedTrips} ${isArabic ? 'مكتملة' : 'done'} (${summary.completionRate}%) · ${summary.cancelledTrips} ${isArabic ? 'ملغاة' : 'cancelled'}`,
      icon: Navigation,
      accent: 'border-teal-500/25 bg-teal-500/10 text-[#14F5D5]',
      badge: 'bg-teal-500/15 text-[#14F5D5] border-teal-500/30',
    },
    {
      title: isArabic ? 'ساعات التشغيل والمسافات' : 'Flight Hours & Distance',
      main: loading ? '...' : `${summary.totalPaidHours}h`,
      sub: `${summary.totalDistanceKm} ${isArabic ? 'كم مقدرة' : 'km est.'} · ${summary.activeTrips} ${isArabic ? 'رحلة نشطة' : 'active trips'}`,
      icon: Wallet,
      accent: 'border-amber-500/25 bg-amber-500/10 text-amber-400',
      badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
    },
  ];

  const miniStats = [
    { icon: CheckCircle2, label: isArabic ? 'نسبة إتمام الرحلات' : 'Completion Rate', value: `${summary.completionRate}%`, tone: 'text-emerald-400' },
    { icon: Route, label: isArabic ? 'إجمالي المسافات' : 'Total Distance', value: `${summary.totalDistanceKm} km`, tone: 'text-cyan-400' },
    { icon: Megaphone, label: isArabic ? 'الإعلانات النشطة' : 'Active Ads', value: `${summary.activeAds}`, tone: 'text-amber-400' },
    { icon: UsersRound, label: isArabic ? 'المناديب' : 'Delegates', value: `${summary.totalDelegates}`, tone: 'text-indigo-400' },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <div
              key={c.title}
              className="rounded-2xl border border-white/10 bg-[#0B0F19]/95 p-4 shadow-xl backdrop-blur-xl transition-all hover:border-white/20"
            >
              <div className="flex items-center justify-between gap-2">
                <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl border', c.accent)}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className={cn('rounded-lg border px-2.5 py-0.5 text-[11px] font-bold', c.badge)}>
                  {c.sub}
                </span>
              </div>
              <p className="mt-3 text-xs font-bold text-slate-300">{c.title}</p>
              <div className="mt-1 font-mono text-2xl sm:text-3xl font-black text-white tracking-tight">
                {c.main}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {miniStats.map((m) => {
          const Icon = m.icon;
          return (
            <div
              key={m.label}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-[#080C16]/90 px-3.5 py-2.5"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Icon className={cn('h-4 w-4 shrink-0', m.tone)} />
                <span className="text-[11px] font-bold text-slate-400 truncate">{m.label}</span>
              </div>
              <span className="font-mono text-xs font-black text-white shrink-0 ms-2">
                {loading ? '...' : m.value}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
