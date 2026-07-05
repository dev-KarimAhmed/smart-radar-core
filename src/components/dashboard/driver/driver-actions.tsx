"use client";

import React from "react";
import { Award, Briefcase, History, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useDriverOperations } from "@/hooks/use-driver-operations";
import { useDashboardLanguage } from "@/hooks/use-dashboard-language";

export function DriverActions() {
  const { language } = useDashboardLanguage();
  const copy = actionsCopy[language];
  const { requestWeeklyReport, isRequestingReport } = useDriverOperations()!;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-2 px-1 text-white">
        <span className="text-sm font-bold tracking-wider">{copy.actions}</span>
      </div>

      <button
        onClick={() => requestWeeklyReport()}
        disabled={isRequestingReport}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-yellow-500/40 bg-yellow-500/15 py-3 font-bold text-yellow-300 transition hover:bg-yellow-500/25 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isRequestingReport ? <Loader2 className="h-5 w-5 animate-spin" /> : <Award className="h-5 w-5" />}
        {isRequestingReport ? copy.loadingReport : copy.requestReport}
      </button>

      <a href="#history" className="block w-full">
        <Button variant="ghost" className="h-14 w-full justify-end gap-3 rounded-xl text-white hover:bg-emerald-950/30 hover:text-emerald-300">
          <span className="font-bold">{copy.trips}</span>
          <History className="h-5 w-5 text-emerald-500/80" />
        </Button>
      </a>

      <a href="#messages" className="block w-full">
        <Button variant="ghost" className="h-14 w-full justify-end gap-3 rounded-xl text-white hover:bg-emerald-950/30 hover:text-emerald-300">
          <span className="font-bold">{copy.messages}</span>
          <MessageSquare className="h-5 w-5 text-emerald-500/80" />
        </Button>
      </a>

      <Separator className="my-4 bg-white/10" />

      <div className="flex items-center justify-end gap-2 px-1 text-white">
        <span className="text-sm font-bold tracking-wider">{copy.settings}</span>
      </div>

      <a href="#settings" className="block w-full">
        <Button variant="ghost" className="h-14 w-full justify-end gap-3 rounded-xl text-white hover:bg-emerald-950/30 hover:text-emerald-300">
          <span className="font-bold">{copy.workData}</span>
          <Briefcase className="h-5 w-5 text-emerald-500/80" />
        </Button>
      </a>
    </div>
  );
}

const actionsCopy = {
  ar: {
    actions: 'الإجراءات',
    loadingReport: 'جاري تجهيز التقرير...',
    requestReport: 'طلب تقرير الأداء',
    trips: 'رحلاتي',
    messages: 'الرسائل',
    settings: 'إعدادات الحساب',
    workData: 'بيانات العمل',
  },
  en: {
    actions: 'Actions',
    loadingReport: 'Preparing report...',
    requestReport: 'Request performance report',
    trips: 'Trips',
    messages: 'Messages',
    settings: 'Account settings',
    workData: 'Work data',
  },
} as const;
