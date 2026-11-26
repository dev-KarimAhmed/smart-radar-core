'use client';

import React from 'react';
import { TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  UserCheck,
  Wallet,
  Clock,
  ShieldCheck,
  Megaphone,
  Construction,
  UsersRound,
  ShieldAlert,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from "next-intl";
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';

interface AdminViewTabsListProps {
  totalVisibleTriggers: number;
  permissionsLoaded: boolean;
  canAccessSector: (sectorId: string) => boolean;
  isGeneral: boolean;
}

export function AdminViewTabsList({
  totalVisibleTriggers,
  permissionsLoaded,
  canAccessSector,
  isGeneral,
}: AdminViewTabsListProps) {
  const t = useTranslations('adminTabs');
  const { isArabic } = useDashboardLanguage();

  return (
    <>
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
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all data-[state=active]:bg-[#14B8A6] data-[state=active]:text-[#0B0F19] text-slate-300 hover:text-white cursor-pointer"
            >
              <Megaphone className="w-4 h-4" />
              <span>{t('ads')}</span>
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
    </>
  );
}
