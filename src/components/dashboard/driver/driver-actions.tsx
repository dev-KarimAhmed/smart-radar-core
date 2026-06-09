"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Award,
  History,
  MessageSquare,
  Briefcase,
  Loader2,
} from "lucide-react";
import { useDriverOperations } from "@/hooks/use-driver-operations";

export function DriverActions() {
  const { requestWeeklyReport, isRequestingReport } = useDriverOperations();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end gap-2 text-white px-1 mb-2">
        <span className="text-sm font-bold tracking-wider">
          العمليات السيادية
        </span>
      </div>

      <div className="px-3 mt-4 mb-2">
        <button
          onClick={() => requestWeeklyReport()}
          disabled={isRequestingReport}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500/20 to-yellow-600/20 border border-yellow-500/50 hover:bg-yellow-500/30 text-yellow-400 font-bold py-3 rounded-lg transition-all shadow-[0_0_10px_rgba(234,179,8,0.1)] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRequestingReport ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Award className="w-5 h-5" />
          )}
          {isRequestingReport
            ? "جاري استدعاء المحكمة..."
            : "استحقاق الرتبة السيادية"}
        </button>
      </div>

      <a href="#history" className="block w-full">
        <Button
          variant="ghost"
          className="w-full justify-end gap-3 text-white hover:text-emerald-400 hover:bg-emerald-950/30 border border-transparent hover:border-emerald-500/20 h-14 rounded-xl transition-all shadow-sm"
        >
          <span className="font-bold text-base">أرشيف الرحلات</span>
          <History className="w-5 h-5 text-emerald-500/70" />
        </Button>
      </a>

      <a href="#messages" className="block w-full">
        <Button
          variant="ghost"
          className="w-full justify-end gap-3 text-white hover:text-emerald-400 hover:bg-emerald-950/30 border border-transparent hover:border-emerald-500/20 h-14 rounded-xl relative transition-all shadow-sm"
        >
          <span className="font-bold text-base">رسائل الرادار</span>
          <MessageSquare className="w-5 h-5 text-emerald-500/70" />
        </Button>
      </a>

      <Separator className="bg-white/10 my-4" />

      <div className="flex items-center justify-end gap-2 text-white px-1 mb-2 mt-4">
        <span className="text-sm font-bold tracking-wider">إعدادات الهوية</span>
      </div>

      <a href="#settings" className="block w-full">
        <Button
          variant="ghost"
          className="w-full justify-end gap-3 text-white hover:text-emerald-400 hover:bg-emerald-950/30 border border-transparent hover:border-emerald-500/20 h-14 rounded-xl transition-all shadow-sm"
        >
          <span className="font-bold text-base">البيانات التشغيلية</span>
          <Briefcase className="w-5 h-5 text-emerald-500/70" />
        </Button>
      </a>
    </div>
  );
}
