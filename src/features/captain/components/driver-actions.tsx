"use client";

import React from "react";
import { Award, Briefcase, History, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useDriverOperations } from "../hooks/use-driver-operations";
import { useDashboardLanguage } from "@/hooks/use-dashboard-language";

const styles = {
  style16_1: "space-y-3",
  style17_2: "flex items-center justify-end gap-2 px-1 text-white",
  style18_3: "text-sm font-bold tracking-wider",
  style24_4: "flex w-full items-center justify-center gap-2 rounded-lg border border-yellow-500/40 bg-yellow-500/15 py-3 font-bold text-yellow-300 transition hover:bg-yellow-500/25 disabled:cursor-not-allowed disabled:opacity-50",
  style26_5: "h-5 w-5 animate-spin",
  style26_6: "h-5 w-5",
  style30_7: "block w-full",
  style31_8: "h-14 w-full justify-end gap-3 rounded-xl text-white hover:bg-emerald-950/30 hover:text-emerald-300",
  style32_9: "font-bold",
  style33_10: "h-5 w-5 text-emerald-500/80",
  style37_11: "block w-full",
  style38_12: "h-14 w-full justify-end gap-3 rounded-xl text-white hover:bg-emerald-950/30 hover:text-emerald-300",
  style39_13: "font-bold",
  style40_14: "h-5 w-5 text-emerald-500/80",
  style44_15: "my-4 bg-white/10",
  style46_16: "flex items-center justify-end gap-2 px-1 text-white",
  style47_17: "text-sm font-bold tracking-wider",
  style50_18: "block w-full",
  style51_19: "h-14 w-full justify-end gap-3 rounded-xl text-white hover:bg-emerald-950/30 hover:text-emerald-300",
  style52_20: "font-bold",
  style53_21: "h-5 w-5 text-emerald-500/80",
} as const;


export function DriverActions() {
  const { language } = useDashboardLanguage();
  const copy = actionsCopy[language];
  const { requestWeeklyReport, isRequestingReport } = useDriverOperations()!;

  return (
    <div className={styles.style16_1}>
      <div className={styles.style17_2}>
        <span className={styles.style18_3}>{copy.actions}</span>
      </div>

      <button
        onClick={() => requestWeeklyReport()}
        disabled={isRequestingReport}
        className={styles.style24_4}
      >
        {isRequestingReport ? <Loader2 className={styles.style26_5} /> : <Award className={styles.style26_6} />}
        {isRequestingReport ? copy.loadingReport : copy.requestReport}
      </button>

      <a href="#history" className={styles.style30_7}>
        <Button variant="ghost" className={styles.style31_8}>
          <span className={styles.style32_9}>{copy.trips}</span>
          <History className={styles.style33_10} />
        </Button>
      </a>

      <a href="#messages" className={styles.style37_11}>
        <Button variant="ghost" className={styles.style38_12}>
          <span className={styles.style39_13}>{copy.messages}</span>
          <MessageSquare className={styles.style40_14} />
        </Button>
      </a>

      <Separator className={styles.style44_15} />

      <div className={styles.style46_16}>
        <span className={styles.style47_17}>{copy.settings}</span>
      </div>

      <a href="#settings" className={styles.style50_18}>
        <Button variant="ghost" className={styles.style51_19}>
          <span className={styles.style52_20}>{copy.workData}</span>
          <Briefcase className={styles.style53_21} />
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
