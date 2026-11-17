'use client';

import React from 'react';
import {
  BatteryCharging,
  Download,
  PlusSquare,
  Share2,
  ShieldCheck,
} from 'lucide-react';
import type { PwaGuidanceDetails } from '@/lib/pwaGuidance';

interface PwaInstallStepsListProps {
  guidance: PwaGuidanceDetails;
  isArabic: boolean;
  isIOS: boolean;
  scrollable?: boolean;
}

export function PwaInstallStepsList({
  guidance,
  isArabic,
  isIOS,
  scrollable = false,
}: PwaInstallStepsListProps) {
  return (
    <div
      className={
        scrollable
          ? 'mt-3 space-y-2 border-t border-white/10 pt-3 animate-in fade-in duration-200 max-h-[45vh] overflow-y-auto'
          : 'mt-3.5 space-y-2 border-t border-white/10 pt-3 animate-in fade-in duration-200'
      }
    >
      <div className="space-y-2">
        {guidance.steps.map((step) => (
          <div
            key={step.number}
            className="flex items-start gap-2.5 rounded-xl bg-black/40 border border-white/5 p-2.5"
          >
            <div className="h-6 w-6 shrink-0 rounded-full bg-[#14B8A6]/20 text-[#14F5D5] flex items-center justify-center text-xs font-black">
              {step.number}
            </div>
            <div className="space-y-0.5 text-start">
              <div className="flex items-center gap-1.5 text-xs font-black text-white">
                <span>{isArabic ? step.titleAr : step.titleEn}</span>
                {step.iconType === 'share' && <Share2 className="h-3 w-3 text-[#14F5D5]" />}
                {step.iconType === 'add' && <PlusSquare className="h-3 w-3 text-[#14F5D5]" />}
                {step.iconType === 'install' && <Download className="h-3 w-3 text-[#14F5D5]" />}
              </div>
              <p className="text-[11px] text-slate-300 font-semibold leading-relaxed">
                {isArabic ? step.instructionAr : step.instructionEn}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-2 rounded-xl bg-amber-500/10 border border-amber-500/20 p-2.5 flex items-start gap-2">
        <BatteryCharging className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-[10px] text-amber-200/90 font-bold leading-relaxed">
          {isArabic ? guidance.batteryNoticeAr : guidance.batteryNoticeEn}
        </p>
      </div>

      {guidance.webPushNoticeAr && isIOS && (
        <div className="rounded-xl bg-[#14B8A6]/10 border border-[#14B8A6]/20 p-2.5 flex items-start gap-2">
          <ShieldCheck className="h-4 w-4 text-[#14F5D5] shrink-0 mt-0.5" />
          <p className="text-[10px] text-emerald-200/90 font-bold leading-relaxed">
            {isArabic ? guidance.webPushNoticeAr : guidance.webPushNoticeEn}
          </p>
        </div>
      )}
    </div>
  );
}
