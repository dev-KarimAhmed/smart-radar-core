'use client';

import React from 'react';
import { Megaphone, ShieldCheck, Activity, Construction } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from "next-intl";
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';

export function AdminAdsUnderConstruction() {
  const t = useTranslations('adminTabs');
  const { isArabic } = useDashboardLanguage();

  return (
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
  );
}
