'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DriversManagementTab } from './admin/drivers-management-tab';
import { AdsManagementTab } from './admin/ads-management-tab';
import { DelegatesManagementTab } from './admin/delegates-management-tab';
import { KillSwitchPanel } from '../admin/kill-switch-panel';
import { FuelIndexPanel } from './admin/fuel-index-panel';
import { PulseHeatmap } from '../admin/pulse-heatmap';
import { useMarketPulse } from '@/hooks/use-market-pulse';
import { Shield, Megaphone, Users, Activity, UsersRound } from 'lucide-react';

export function AdminViewTab() {
  const { pulseData, loadingPulse } = useMarketPulse(true);

  return (
    <div className="space-y-8">
      <Tabs defaultValue="dashboard" className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 h-auto">
          <TabsTrigger value="dashboard" className="flex-col h-auto py-3">
             <Users className="w-5 h-5 mb-1" />
             <span>برج المراقبة</span>
          </TabsTrigger>
          <TabsTrigger value="ads" className="flex-col h-auto py-3">
            <Megaphone className="w-5 h-5 mb-1" />
             <span>إدارة الإعلانات</span>
          </TabsTrigger>
          <TabsTrigger value="delegates" className="flex-col h-auto py-3">
            <UsersRound className="w-5 h-5 mb-1 text-emerald-400" />
            <span>جيش المندوبين 📣</span>
          </TabsTrigger>
           <TabsTrigger value="pulse" className="flex-col h-auto py-3">
             <Activity className="w-5 h-5 mb-1" />
             <span>نبض السوق</span>
          </TabsTrigger>
          <TabsTrigger value="controls" className="flex-col h-auto py-3">
            <Shield className="w-5 h-5 mb-1" />
            <span>التحكم السيادي</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="mt-6">
            <DriversManagementTab />
        </TabsContent>
        <TabsContent value="ads" className="mt-6">
            <AdsManagementTab />
        </TabsContent>
        <TabsContent value="delegates" className="mt-6">
            <DelegatesManagementTab />
        </TabsContent>
        <TabsContent value="pulse" className="mt-6">
            <PulseHeatmap pulseData={pulseData} isLoading={loadingPulse} />
        </TabsContent>
        <TabsContent value="controls" className="mt-6 space-y-8">
            <KillSwitchPanel />
            <FuelIndexPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
