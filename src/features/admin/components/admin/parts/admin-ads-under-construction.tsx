'use client';

import React, { useEffect, useState } from 'react';
import { Megaphone, ShieldCheck, Activity, Construction, FileSpreadsheet, Loader2, Store, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from "next-intl";
import { useDashboardLanguage } from '@/hooks/use-dashboard-language';
import { adminFetch } from '@/features/admin/lib/admin-api-client';
import { useToast } from '@/hooks/use-toast';

interface EarlyLaunchSummary {
  commercialCount: number;
  commercialVisitors: number;
  craftsCount: number;
  craftsVisitors: number;
}

export function AdminAdsUnderConstruction() {
  const t = useTranslations('adminTabs');
  const { isArabic } = useDashboardLanguage();
  const { toast } = useToast();
  const [summary, setSummary] = useState<EarlyLaunchSummary>({
    commercialCount: 0,
    commercialVisitors: 0,
    craftsCount: 0,
    craftsVisitors: 0,
  });
  const [downloadingType, setDownloadingType] = useState<'COMMERCIAL' | 'CRAFTS' | null>(null);

  useEffect(() => {
    let active = true;
    adminFetch('/api/admin/early-launch-ads/export?summary=1')
      .then((res) => res.json())
      .then((data) => {
        if (active && data?.success && data?.summary) {
          setSummary(data.summary);
        }
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const handleDownloadExcel = async (cardType: 'COMMERCIAL' | 'CRAFTS') => {
    setDownloadingType(cardType);
    try {
      const res = await adminFetch(`/api/admin/early-launch-ads/export?cardType=${cardType}`);
      if (!res.ok) throw new Error('export_failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = cardType === 'COMMERCIAL'
        ? 'commercial-establishments-leads.xlsx'
        : 'handcrafts-artisans-leads.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      toast({
        variant: 'destructive',
        title: isArabic ? 'فشل التحميل' : 'Download Failed',
        description: isArabic ? 'تعذر تحميل ملف الإكسل، حاول مرة أخرى.' : 'Could not download Excel file.',
      });
    } finally {
      setDownloadingType(null);
    }
  };

  return (
    <div dir={isArabic ? 'rtl' : 'ltr'} className="space-y-6">
      {/* Early Launch Ads Excel Export Section */}
      <div className="relative overflow-hidden rounded-3xl border border-teal-500/25 bg-[#0B0F19]/95 p-6 sm:p-8 shadow-2xl backdrop-blur-xl text-start">
        <div className="flex flex-col gap-2 mb-6">
          <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-[#14F5D5]" />
            <span>{isArabic ? 'بيانات حجز الإطلاق المبكر (30 يوم مجاناً)' : 'Early Launch Ad Leads (30 Days Free)'}</span>
          </h3>
          <p className="text-xs sm:text-sm text-slate-400">
            {isArabic
              ? 'تحميل ملف Excel منفصل لكل فئة شاملاً بيانات المسجلين وروابط المشاركة وعدد الزائرين الفعليين من كل رابط.'
              : 'Download a dedicated Excel sheet per category including registered details, share links, and actual visitor counts.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col justify-between gap-4 rounded-2xl border border-teal-500/25 bg-teal-500/5 p-5">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="inline-flex items-center gap-2 text-sm font-black text-white">
                  <Megaphone className="h-4 w-4 text-[#14F5D5]" />
                  {isArabic ? 'إعلانات منشآت تجارية' : 'Commercial Establishments Ads'}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="rounded-full bg-teal-500/15 border border-teal-400/30 px-2.5 py-0.5 text-[11px] font-bold text-[#14F5D5]">
                    {isArabic ? `المسجلين: ${summary.commercialCount}` : `Leads: ${summary.commercialCount}`}
                  </span>
                  <span className="rounded-full bg-teal-500/15 border border-teal-400/30 px-2.5 py-0.5 text-[11px] font-bold text-[#14F5D5]">
                    {isArabic ? `الزائرين: ${summary.commercialVisitors}` : `Visits: ${summary.commercialVisitors}`}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-400">
                {isArabic ? 'اسم المنشأة، التخصص، الهاتف، المحافظة، اللواء، وعدد الزائرين.' : 'Establishment name, specialty, phone, governorate, district, and visits.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleDownloadExcel('COMMERCIAL')}
              disabled={downloadingType !== null}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-teal-500 to-[#14F5D5] py-2.5 px-4 text-xs sm:text-sm font-black text-slate-950 shadow-md hover:brightness-110 active:scale-[0.99] transition cursor-pointer disabled:opacity-60"
            >
              {downloadingType === 'COMMERCIAL' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
              <span>{isArabic ? 'تحميل Excel — المنشآت التجارية' : 'Download Excel — Commercial'}</span>
            </button>
          </div>

          <div className="flex flex-col justify-between gap-4 rounded-2xl border border-amber-500/25 bg-amber-500/5 p-5">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="inline-flex items-center gap-2 text-sm font-black text-white">
                  <Store className="h-4 w-4 text-amber-400" />
                  {isArabic ? 'إعلانات مهن يدوية والحرفيين' : 'Handcrafts & Artisans Ads'}
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="rounded-full bg-amber-500/15 border border-amber-400/30 px-2.5 py-0.5 text-[11px] font-bold text-amber-300">
                    {isArabic ? `المسجلين: ${summary.craftsCount}` : `Leads: ${summary.craftsCount}`}
                  </span>
                  <span className="rounded-full bg-amber-500/15 border border-amber-400/30 px-2.5 py-0.5 text-[11px] font-bold text-amber-300">
                    {isArabic ? `الزائرين: ${summary.craftsVisitors}` : `Visits: ${summary.craftsVisitors}`}
                  </span>
                </div>
              </div>
              <p className="text-xs text-slate-400">
                {isArabic ? 'التصنيف، التخصص، الهاتف، المحافظة، اللواء، وعدد الزائرين.' : 'Category, specialty, phone, governorate, district, and visits.'}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void handleDownloadExcel('CRAFTS')}
              disabled={downloadingType !== null}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 py-2.5 px-4 text-xs sm:text-sm font-black text-slate-950 shadow-md hover:brightness-110 active:scale-[0.99] transition cursor-pointer disabled:opacity-60"
            >
              {downloadingType === 'CRAFTS' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
              <span>{isArabic ? 'تحميل Excel — المهن اليدوية والحرفيين' : 'Download Excel — Handcrafts'}</span>
            </button>
          </div>
        </div>
      </div>

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
    </div>
  );
}
