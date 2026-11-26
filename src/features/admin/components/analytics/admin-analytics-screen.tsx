'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowLeft, BarChart3, Languages, RefreshCw, ShieldAlert } from 'lucide-react';
import { useAuth } from '@/features/auth/contract';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { useAdminViewPermissions } from '@/features/admin/hooks/use-admin-view-permissions';
import { useAdminAnalytics } from '@/features/admin/hooks/use-admin-analytics';
import { RouteLoading } from '@/shared/components/layout/route-loading';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { AnalyticsFilterBar } from './parts/analytics-filter-bar';
import { AnalyticsKpiGrid } from './parts/analytics-kpi-grid';
import { AnalyticsChartsGrid } from './parts/analytics-charts-grid';
import { AnalyticsExtremesPanel } from './parts/analytics-extremes-panel';

const EMPTY_SUMMARY = {
  totalCaptains: 0,
  activeCaptains: 0,
  verifiedCaptains: 0,
  bannedCaptains: 0,
  totalRiders: 0,
  totalDelegates: 0,
  activeAds: 0,
  pendingAds: 0,
  totalTrips: 0,
  completedTrips: 0,
  activeTrips: 0,
  cancelledTrips: 0,
  completionRate: 0,
  totalCashBalance: 0,
  totalPaidHours: 0,
  totalDistanceKm: 0,
};

export function AdminAnalyticsScreen() {
  const { loading: authLoading, user } = useAuth();
  const { isArabic, direction, toggleLanguage } = useDashboardLanguage();
  const { isGeneral, permissionsLoaded } = useAdminViewPermissions();

  const isAdmin = Boolean(
    user?.role === 'admin' ||
      (user as any)?.role === 'ADMIN' ||
      user?.adminRank === 'GENERAL_ADMIN' ||
      user?.adminRank === 'ASSISTANT_ADMIN' ||
      user?.uid === '70b4a26f-10ac-4888-8df6-c3a5ad824b8a' ||
      user?.uid === 'demo-admin-001',
  );

  const canViewAnalytics = isAdmin && permissionsLoaded && isGeneral;
  const analytics = useAdminAnalytics(canViewAnalytics);
  const BackArrow = isArabic ? ArrowRight : ArrowLeft;

  if (authLoading || (isAdmin && !permissionsLoaded)) {
    return (
      <main className="min-h-screen bg-[#070B14] flex items-center justify-center" dir={direction}>
        <RouteLoading label={isArabic ? 'جاري التحقق من صلاحيات المدير العام...' : 'Verifying General Admin access...'} />
      </main>
    );
  }

  if (!isAdmin || !isGeneral) {
    return (
      <main className="min-h-screen bg-[#070B14] flex items-center justify-center p-4" dir={direction}>
        <div className="max-w-md w-full rounded-3xl border border-rose-500/30 bg-[#0B0F19] p-6 text-center space-y-4 shadow-2xl">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-500/30 bg-rose-500/10 text-rose-400">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <h1 className="text-lg font-black text-white">
            {isArabic ? 'غير مصرح بالدخول' : 'Access Restricted'}
          </h1>
          <p className="text-xs leading-relaxed text-slate-400">
            {isArabic
              ? 'شاشة الإحصائيات والمؤشرات التحليلية متاحة حصرياً لحساب المدير العام فقط.'
              : 'Analytics & Insights screen is strictly restricted to General Admin accounts.'}
          </p>
          <Button asChild className="w-full bg-[#14B8A6] hover:bg-[#0D9488] text-slate-950 font-black rounded-xl">
            <Link href="/admin">{isArabic ? 'العودة إلى لوحة الإدارة' : 'Back to Admin Dashboard'}</Link>
          </Button>
        </div>
      </main>
    );
  }

  const payload = analytics.data;

  return (
    <main className={cn('min-h-screen bg-[#070B14] text-slate-100 p-4 sm:p-6 font-sans', isArabic ? 'text-right' : 'text-left')} dir={direction}>
      <div className="mx-auto max-w-7xl space-y-5">
        {/* Dedicated Analytics Header */}
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-teal-500/25 bg-[#0B0F19]/95 p-4 sm:p-5 shadow-2xl">
          <div className="flex items-center gap-3">
            <Button
              asChild
              variant="outline"
              className="border-white/15 bg-white/5 hover:bg-white/10 text-slate-200 rounded-xl font-bold text-xs gap-1.5"
            >
              <Link href="/admin">
                <BackArrow className="h-4 w-4 text-[#14F5D5]" />
                <span>{isArabic ? 'لوحة الإدارة' : 'Admin Panel'}</span>
              </Link>
            </Button>

            <div className="flex items-center gap-2.5">
              <div className="hidden sm:flex h-10 w-10 items-center justify-center rounded-xl border border-[#14B8A6]/35 bg-[#14B8A6]/10 text-[#14F5D5]">
                <BarChart3 className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-base sm:text-xl font-black text-white">
                  {isArabic ? 'مركز الإحصائيات والمؤشرات التحليلية' : 'General Admin Analytics Center'}
                </h1>
                <p className="text-[11px] text-slate-400">
                  {isArabic
                    ? 'تحليل تفصيلي بالفلترة الجغرافية والزمنية مع رصد أعلى وأقل المناطق نشاطاً'
                    : 'Filtered KPIs, interactive charts, and highest/lowest regional coverage insights'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              onClick={() => void analytics.refresh()}
              disabled={analytics.loading}
              className="bg-[#14B8A6]/15 hover:bg-[#14B8A6]/25 text-[#14F5D5] border border-[#14B8A6]/35 rounded-xl text-xs font-bold gap-1.5 cursor-pointer"
            >
              <RefreshCw className={cn('h-3.5 w-3.5', analytics.loading && 'animate-spin')} />
              <span>{isArabic ? 'تحديث' : 'Refresh'}</span>
            </Button>

            <Button
              type="button"
              onClick={toggleLanguage}
              className="bg-[#161F30] hover:bg-[#1C273C] text-cyan-300 border border-cyan-500/30 rounded-xl text-xs font-bold gap-1.5 cursor-pointer"
            >
              <Languages className="h-3.5 w-3.5" />
              <span>{isArabic ? 'English' : 'العربية'}</span>
            </Button>
          </div>
        </header>

        <AnalyticsFilterBar
          filters={analytics.filters}
          geoLookup={payload?.geo || { countries: [], governorates: [], districts: [] }}
          isArabic={isArabic}
          onCountryChange={analytics.setCountryId}
          onGovernorateChange={analytics.setGovernorateId}
          onDistrictChange={analytics.setDistrictId}
          onPeriodChange={analytics.setPeriod}
          onRoleFocusChange={analytics.setRoleFocus}
          onResetAll={analytics.resetFilters}
        />

        {analytics.error && (
          <div className="rounded-2xl border border-rose-500/35 bg-rose-500/10 p-4 text-xs font-bold text-rose-300">
            {analytics.error}
          </div>
        )}

        <AnalyticsKpiGrid
          summary={payload?.summary || EMPTY_SUMMARY}
          loading={analytics.loading && !payload}
          isArabic={isArabic}
        />

        <AnalyticsChartsGrid
          timeline={payload?.timeline || []}
          chartRegions={payload?.chartRegions || []}
          tripStatusDistribution={payload?.tripStatusDistribution || []}
          captainStatusDistribution={payload?.captainStatusDistribution || []}
          isArabic={isArabic}
        />

        <AnalyticsExtremesPanel
          topGovernorates={payload?.topGovernorates || []}
          bottomGovernorates={payload?.bottomGovernorates || []}
          topDistricts={payload?.topDistricts || []}
          bottomDistricts={payload?.bottomDistricts || []}
          isArabic={isArabic}
        />
      </div>
    </main>
  );
}
