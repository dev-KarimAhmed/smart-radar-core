"use client";

import React from "react";
import { Award, Briefcase, History, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useDriverOperations } from "@/hooks/use-driver-operations";

export function DriverActions() {
  const { requestWeeklyReport, isRequestingReport } = useDriverOperations()!;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-2 px-1 text-white">
        <span className="text-sm font-bold tracking-wider">الإجراءات</span>
      </div>

      <button
        onClick={() => requestWeeklyReport()}
        disabled={isRequestingReport}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-yellow-500/40 bg-yellow-500/15 py-3 font-bold text-yellow-300 transition hover:bg-yellow-500/25 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isRequestingReport ? <Loader2 className="h-5 w-5 animate-spin" /> : <Award className="h-5 w-5" />}
        {isRequestingReport ? "جار تجهيز التقرير..." : "طلب تقرير الأداء"}
      </button>

      <a href="#history" className="block w-full">
        <Button variant="ghost" className="h-14 w-full justify-end gap-3 rounded-xl text-white hover:bg-emerald-950/30 hover:text-emerald-300">
          <span className="font-bold">رحلاتي</span>
          <History className="h-5 w-5 text-emerald-500/80" />
        </Button>
      </a>

      <a href="#messages" className="block w-full">
        <Button variant="ghost" className="h-14 w-full justify-end gap-3 rounded-xl text-white hover:bg-emerald-950/30 hover:text-emerald-300">
          <span className="font-bold">الرسائل</span>
          <MessageSquare className="h-5 w-5 text-emerald-500/80" />
        </Button>
      </a>

      <Separator className="my-4 bg-white/10" />

      <div className="flex items-center justify-end gap-2 px-1 text-white">
        <span className="text-sm font-bold tracking-wider">إعدادات الحساب</span>
      </div>

      <a href="#settings" className="block w-full">
        <Button variant="ghost" className="h-14 w-full justify-end gap-3 rounded-xl text-white hover:bg-emerald-950/30 hover:text-emerald-300">
          <span className="font-bold">بيانات العمل</span>
          <Briefcase className="h-5 w-5 text-emerald-500/80" />
        </Button>
      </a>
    </div>
  );
}
