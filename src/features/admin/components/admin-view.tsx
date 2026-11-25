'use client';

import React from 'react';
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { DriversManagementTab } from './admin/drivers-management-tab';
import { AdminTopBar } from './admin/admin-top-bar';
import { AdminMasterKPIBar } from './admin/admin-master-kpi-bar';
import { WalletManagementTab } from './admin/wallet-management-tab';
import { RidersManagementPanel } from './admin/riders-management-panel';
import { AdminsManagementPanel } from './admin/admins-management-panel';
import { HourlyRatesManagementPanel } from './admin/hourly-rates-management-panel';
import { FinancialDelegatesPanel } from './admin/panels/financial-delegates-panel';
import { SovereignErrorBoundary } from '@/components/sovereign-error-boundary';
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { cn } from '@/lib/utils';
import { useAdminViewPermissions } from '../hooks/use-admin-view-permissions';
import { AdminViewTabsList } from './admin/parts/admin-view-tabs-list';
import { AdminAdsUnderConstruction } from './admin/parts/admin-ads-under-construction';

export { PendingAdsAuditPanel } from './admin/parts/pending-ads-audit-panel';
export { AdminPulseOverview } from './admin/parts/admin-pulse-overview';

export function AdminViewTab() {
  const { direction, isArabic } = useDashboardLanguage();
  const {
    isGeneral,
    canAccessSector,
    activeTab,
    setActiveTab,
    totalVisibleTriggers,
    permissionsLoaded,
  } = useAdminViewPermissions();

  return (
    <div className={cn("space-y-6 font-sans", isArabic ? "text-right" : "text-left")} dir={direction}>
      {/* شريط الإدارة العلوي - الملف الشخصي، تغيير كلمة السر، تسجيل الخروج */}
      <AdminTopBar />

      {/* شريط الإحصائيات السيادية الموحد - للمدير العام فقط */}
      {isGeneral && <AdminMasterKPIBar />}

      {/* المنظومة الإدارية المنظمة */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        {/* شريط التبويبات الرئيسي - تصميم ديناميكي بحسب الصلاحيات المصرح بها */}
        <AdminViewTabsList
          totalVisibleTriggers={totalVisibleTriggers}
          permissionsLoaded={permissionsLoaded}
          canAccessSector={canAccessSector}
          isGeneral={isGeneral}
        />

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
            <AdminAdsUnderConstruction />
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
