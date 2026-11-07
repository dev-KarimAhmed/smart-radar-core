'use client';

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DriversManagementTab } from './admin/drivers-management-tab';
import { AdminTopBar } from './admin/admin-top-bar';
import { AdminMasterKPIBar } from './admin/admin-master-kpi-bar';
import { WalletManagementTab } from './admin/wallet-management-tab';
import { RidersManagementPanel } from './admin/riders-management-panel';
import { AdminsManagementPanel, PRIMARY_SOVEREIGN_ADMIN_ID, PRIMARY_SOVEREIGN_ADMIN_PHONE } from './admin/admins-management-panel';
import { HourlyRatesManagementPanel } from './admin/hourly-rates-management-panel';
import { FinancialDelegatesPanel } from './admin/panels/financial-delegates-panel';
import { useAuth } from '@/hooks/use-auth';
import { ALL_SECTOR_IDS } from '@/features/admin/lib/admin-permissions';
import {
  Users,
  Activity,
  UsersRound,
  ShieldAlert,
  Megaphone,
  ShieldCheck,
  UserCheck,
  Wallet,
  Construction,
  Clock,
} from 'lucide-react';
import { adminFetch } from '../lib/admin-api-client';
import { SovereignErrorBoundary } from '@/components/sovereign-error-boundary';
import { cn } from '@/lib/utils';
import { useTranslations } from "next-intl";
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { styles } from './admin-view-styles';
import { PendingAdReviewCard, PendingAdsAuditPanel } from './admin/panels/pending-ads-audit-panel';
import { AdminPulseOverview } from './admin/panels/admin-pulse-overview';

export {
  styles,
  PendingAdReviewCard,
  PendingAdsAuditPanel,
  AdminPulseOverview,
};

export function AdminViewTab() {
  const t = useTranslations('adminTabs');
  const { direction, isArabic } = useDashboardLanguage();
  const { user } = useAuth();

  const isCallerPrimary =
    user?.uid === PRIMARY_SOVEREIGN_ADMIN_ID ||
    user?.phone === PRIMARY_SOVEREIGN_ADMIN_PHONE;

  const [callerAllowedSectors, setCallerAllowedSectors] = React.useState<string[]>(() => {
    if (isCallerPrimary || user?.adminRank === 'GENERAL_ADMIN') {
      return [...ALL_SECTOR_IDS];
    }
    return Array.isArray(user?.allowedSectors) ? user.allowedSectors : [...ALL_SECTOR_IDS];
  });
  const [callerRank, setCallerRank] = React.useState<string | null>(() => {
    if (isCallerPrimary || user?.adminRank === 'GENERAL_ADMIN') {
      return 'GENERAL_ADMIN';
    }
    return user?.adminRank || null;
  });
  const [permissionsLoaded, setPermissionsLoaded] = React.useState<boolean>(
    isCallerPrimary || user?.adminRank === 'GENERAL_ADMIN'
  );

  React.useEffect(() => {
    if (isCallerPrimary || user?.adminRank === 'GENERAL_ADMIN') {
      setPermissionsLoaded(true);
      return;
    }
    let active = true;
    adminFetch('/api/admin/list-admins')
      .then((res) => res.json())
      .then((data) => {
        if (!active) return;
        if (data?.success) {
          if (data.callerRank === 'GENERAL_ADMIN') {
            setCallerRank('GENERAL_ADMIN');
            setCallerAllowedSectors([...ALL_SECTOR_IDS]);
          } else if (Array.isArray(data.callerAllowedSectors)) {
            setCallerRank(data.callerRank || 'ASSISTANT_ADMIN');
            setCallerAllowedSectors(data.callerAllowedSectors);
          }
        }
      })
      .catch((err) => {
        console.warn('[AdminViewTab] Failed to fetch caller permissions:', err);
      })
      .finally(() => {
        if (active) setPermissionsLoaded(true);
      });
    return () => {
      active = false;
    };
  }, [isCallerPrimary, user?.adminRank]);

  const isGeneral = isCallerPrimary || callerRank === 'GENERAL_ADMIN' || user?.adminRank === 'GENERAL_ADMIN';

  const canAccessSector = React.useCallback(
    (sectorId: string) => {
      if (isGeneral) return true;
      return callerAllowedSectors.includes(sectorId);
    },
    [isGeneral, callerAllowedSectors]
  );

  const [activeTab, setActiveTab] = React.useState<string>(() => {
    if (isCallerPrimary || user?.adminRank === 'GENERAL_ADMIN') return 'captains';
    if (Array.isArray(user?.allowedSectors) && user.allowedSectors.length > 0) {
      return user.allowedSectors[0];
    }
    return 'captains';
  });

  // Switch to first permitted sector if active tab is unauthorized
  React.useEffect(() => {
    if (!permissionsLoaded) return;
    if (!canAccessSector(activeTab)) {
      const firstAllowed = ALL_SECTOR_IDS.find((id) => canAccessSector(id));
      if (firstAllowed) {
        setActiveTab(firstAllowed);
      }
    }
  }, [permissionsLoaded, canAccessSector, activeTab]);

  React.useEffect(() => {
    const handleSwitch = (e: any) => {
      if (e.detail?.tab && canAccessSector(e.detail.tab)) {
        setActiveTab(e.detail.tab);
      }
    };
    window.addEventListener('admin-switch-tab', handleSwitch);
    return () => window.removeEventListener('admin-switch-tab', handleSwitch);
  }, [canAccessSector]);

  const totalVisibleTriggers = ALL_SECTOR_IDS.filter((id) => canAccessSector(id)).length + (isGeneral ? 1 : 0);

  return (
    <div className={cn("space-y-6 font-sans", isArabic ? "text-right" : "text-left")} dir={direction}>
      {/* شريط الإدارة العلوي - الملف الشخصي، تغيير كلمة السر، تسجيل الخروج */}
      <AdminTopBar />

      {/* شريط الإحصائيات السيادية الموحد - Master Supervisor KPI Bar */}
      <AdminMasterKPIBar />

      {/* المنظومة الإدارية المنظمة */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* شريط التبويبات الرئيسي - تصميم ديناميكي بحسب الصلاحيات المصرح بها */}
        {totalVisibleTriggers > 0 && (
          <TabsList
            className={cn(
              "grid gap-2 bg-[#050A0F]/90 border border-white/10 p-2 rounded-2xl h-auto",
              totalVisibleTriggers === 1
                ? "grid-cols-1"
                : totalVisibleTriggers === 2
                  ? "grid-cols-2"
                  : totalVisibleTriggers <= 4
                    ? "grid-cols-2 sm:grid-cols-4"
                    : "grid-cols-2 sm:grid-cols-4 lg:grid-cols-7"
            )}
          >
            {canAccessSector('captains') && (
              <TabsTrigger
                value="captains"
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all data-[state=active]:bg-[#14B8A6] data-[state=active]:text-[#0B0F19] text-slate-300 hover:text-white"
              >
                <Users className="w-4 h-4" />
                <span>{t('captains')}</span>
              </TabsTrigger>
            )}

            {canAccessSector('riders') && (
              <TabsTrigger
                value="riders"
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all data-[state=active]:bg-[#14B8A6] data-[state=active]:text-[#0B0F19] text-slate-300 hover:text-white"
              >
                <UserCheck className="w-4 h-4" />
                <span>{t('riders')}</span>
              </TabsTrigger>
            )}

            {canAccessSector('wallet') && (
              <TabsTrigger
                value="wallet"
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all data-[state=active]:bg-[#14B8A6] data-[state=active]:text-[#0B0F19] text-slate-300 hover:text-white"
              >
                <Wallet className="w-4 h-4" />
                <span>{t('wallet')}</span>
              </TabsTrigger>
            )}

            {canAccessSector('hourly_rates') && (
              <TabsTrigger
                value="hourly_rates"
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all data-[state=active]:bg-[#14B8A6] data-[state=active]:text-[#0B0F19] text-slate-300 hover:text-white"
              >
                <Clock className="w-4 h-4" />
                <span>{t('hourlyRates')}</span>
              </TabsTrigger>
            )}

            {canAccessSector('admins') && (
              <TabsTrigger
                value="admins"
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all data-[state=active]:bg-[#14B8A6] data-[state=active]:text-[#0B0F19] text-slate-300 hover:text-white"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{t('admins')}</span>
              </TabsTrigger>
            )}

            {isGeneral && (
              <TabsTrigger
                value="ads"
                disabled
                className="flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all text-slate-500 cursor-not-allowed opacity-50 bg-black/20 hover:text-slate-500 pointer-events-none select-none border border-white/5"
              >
                <Megaphone className="w-4 h-4 text-slate-500" />
                <span>{t('ads')}</span>
                <span className="text-[9px] font-black px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1 shadow-[0_0_8px_rgba(245,158,11,0.15)]">
                  <Construction className="w-2.5 h-2.5 text-amber-400" />
                  <span>{t('underDevelopment')}</span>
                </span>
              </TabsTrigger>
            )}

            {canAccessSector('delegates') && (
              <TabsTrigger
                value="delegates"
                className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all data-[state=active]:bg-[#14B8A6] data-[state=active]:text-[#0B0F19] text-slate-300 hover:text-white"
              >
                <UsersRound className="w-4 h-4" />
                <span>{t('delegates')}</span>
              </TabsTrigger>
            )}
          </TabsList>
        )}

        {/* تنبيه في حال عدم وجود أي قطاع مصرح به */}
        {totalVisibleTriggers === 0 && permissionsLoaded && (
          <div className="p-8 rounded-2xl border border-amber-500/30 bg-amber-500/5 text-center text-amber-300 space-y-2">
            <ShieldAlert className="w-8 h-8 text-amber-400 mx-auto" />
            <h3 className="font-bold text-sm text-white">
              {isArabic ? 'لا توجد قطاعات مصرح لك بالوصول إليها حالياً' : 'No Authorized Sectors Assigned'}
            </h3>
            <p className="text-xs text-slate-400">
              {isArabic
                ? 'يرجى التواصل مع المشرف العام لمنحك صلاحيات الوصول للأقسام والقطاعات المناسبة.'
                : 'Please contact the General Admin to grant you access permissions to the relevant sectors.'}
            </p>
          </div>
        )}

        {/* ================= حاويات المحتوى ================= */}

        {/* 1. الكباتن */}
        {canAccessSector('captains') && (
          <TabsContent value="captains" className="space-y-6">
            <SovereignErrorBoundary>
              <DriversManagementTab />
            </SovereignErrorBoundary>
          </TabsContent>
        )}

        {/* 2. الركاب */}
        {canAccessSector('riders') && (
          <TabsContent value="riders" className="space-y-6">
            <SovereignErrorBoundary>
              <RidersManagementPanel />
            </SovereignErrorBoundary>
          </TabsContent>
        )}

        {/* 3. المالية والشحن */}
        {canAccessSector('wallet') && (
          <TabsContent value="wallet" className="space-y-6">
            <SovereignErrorBoundary>
              <WalletManagementTab />
            </SovereignErrorBoundary>
          </TabsContent>
        )}

        {/* 4. تسعير الساعة والمناطق */}
        {canAccessSector('hourly_rates') && (
          <TabsContent value="hourly_rates" className="space-y-6">
            <SovereignErrorBoundary>
              <HourlyRatesManagementPanel />
            </SovereignErrorBoundary>
          </TabsContent>
        )}

        {/* 5. الإعلانات */}
        {isGeneral && (
          <TabsContent value="ads" className="space-y-6">
            <div className="relative overflow-hidden rounded-3xl border border-amber-500/20 bg-[#0B0F19]/90 p-8 sm:p-12 text-center shadow-2xl backdrop-blur-xl">
              <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-amber-500/10 blur-3xl pointer-events-none rounded-full" />
              <div className="absolute -bottom-24 left-1/2 -translate-x-1/2 w-96 h-96 bg-teal-500/5 blur-3xl pointer-events-none rounded-full" />

              <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
                <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-amber-500/40 bg-gradient-to-br from-amber-500/20 to-amber-500/5 text-amber-400 shadow-[0_0_35px_rgba(245,158,11,0.25)]">
                  <Construction className="h-10 w-10 animate-pulse" />
                  <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500" />
                  </span>
                </div>

                <div className="flex items-center gap-2 mb-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 px-3.5 py-1 text-xs font-black text-amber-300">
                    {t('underConstructionBanner')}
                  </span>
                  <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs font-mono text-slate-400 font-bold">
                    {t('underConstructionTag')}
                  </span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-wide mb-3">
                  {t('adsTitle')}
                </h2>

                <p className="text-sm sm:text-base text-slate-300 leading-relaxed mb-8">
                  {t('adsDesc')}
                </p>

                <div className={cn("grid grid-cols-1 sm:grid-cols-3 gap-3 w-full mb-8", isArabic ? "text-right" : "text-left")}>
                  <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md">
                    <div className="flex items-center gap-2 text-amber-300 font-bold text-xs mb-1">
                      <Megaphone className="w-4 h-4" />
                      <span>{t('campaignsBoxTitle')}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{t('campaignsBoxDesc')}</p>
                  </div>
                  <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md">
                    <div className="flex items-center gap-2 text-teal-300 font-bold text-xs mb-1">
                      <ShieldCheck className="w-4 h-4" />
                      <span>{t('auditBoxTitle')}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{t('auditBoxDesc')}</p>
                  </div>
                  <div className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-md">
                    <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs mb-1">
                      <Activity className="w-4 h-4" />
                      <span>{t('statsBoxTitle')}</span>
                    </div>
                    <p className="text-[11px] text-slate-400">{t('statsBoxDesc')}</p>
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 text-xs text-slate-400 bg-white/5 border border-white/10 px-4 py-2 rounded-xl">
                  <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                  <span>{t('statusDeveloping')}</span>
                </div>
              </div>
            </div>
          </TabsContent>
        )}

        {/* 6. المناديب */}
        {canAccessSector('delegates') && (
          <TabsContent value="delegates" className="space-y-6">
            <SovereignErrorBoundary>
              <FinancialDelegatesPanel />
            </SovereignErrorBoundary>
          </TabsContent>
        )}

        {/* 7. المشرفين */}
        {canAccessSector('admins') && (
          <TabsContent value="admins" className="space-y-6">
            <SovereignErrorBoundary>
              <AdminsManagementPanel />
            </SovereignErrorBoundary>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
