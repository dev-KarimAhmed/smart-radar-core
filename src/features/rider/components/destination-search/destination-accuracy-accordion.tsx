import React from 'react';
import { ChevronDown, ShieldAlert, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DestinationAccuracyAccordionProps {
  isArabic: boolean;
}

export function DestinationAccuracyAccordion({ isArabic }: DestinationAccuracyAccordionProps) {
  const [isAccordionOpen, setIsAccordionOpen] = React.useState(false);

  return (
    <div
      className="relative mt-3.5 overflow-hidden rounded-2xl border border-rose-500/35 bg-gradient-to-r from-[#170914] via-[#0A0F1E] to-[#170914] shadow-[0_4px_20px_rgba(0,0,0,0.5),0_0_15px_rgba(244,63,94,0.12)] transition-all duration-300 hover:border-rose-500/50 hover:shadow-[0_0_22px_rgba(244,63,94,0.22)]"
      dir={isArabic ? 'rtl' : 'ltr'}
    >
      {/* Top ambient glowing hairline */}
      <div className="pointer-events-none absolute top-0 inset-x-0 h-[1.5px] bg-gradient-to-r from-transparent via-rose-500/60 to-transparent" />

      <button
        type="button"
        onClick={() => setIsAccordionOpen((prev) => !prev)}
        className="group flex w-full items-center justify-between gap-2.5 px-3.5 py-2.5 transition-colors hover:bg-white/[0.03] cursor-pointer select-none"
      >
        {/* Right side: Pulsing badge & full readable text */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1 text-start">
          <span className="relative flex h-2 w-2 shrink-0">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-rose-500" />
          </span>

          <span className="inline-flex items-center gap-1 rounded-full border border-rose-500/40 bg-gradient-to-r from-rose-500/25 to-rose-600/35 px-2.5 py-0.5 text-[11px] font-black text-rose-200 shadow-[0_0_10px_rgba(244,63,94,0.35)] shrink-0">
            <ShieldAlert className="h-3 w-3 text-rose-300" />
            <span>{isArabic ? 'تنبيه' : 'Alert'}</span>
          </span>

          <span className="text-xs font-bold text-slate-200 group-hover:text-white transition-colors leading-snug">
            {isArabic ? 'دقة الإحداثيات 90% تجنباً للخلاف' : '90% GPS Accuracy Guidance'}
          </span>
        </div>

        {/* Left side: Squircle glowing chevron */}
        <div className="flex h-6 w-6 items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-300 transition-all duration-300 group-hover:border-rose-500/60 group-hover:bg-rose-500/20 group-hover:scale-105 shrink-0">
          <ChevronDown
            className={cn(
              "h-3.5 w-3.5 transition-transform duration-300",
              isAccordionOpen && "rotate-180"
            )}
          />
        </div>
      </button>

      {isAccordionOpen && (
        <div className="border-t border-rose-500/20 bg-gradient-to-b from-[#1C091A]/80 via-[#0A0D1A]/90 to-[#040711] p-4 text-center space-y-2.5 animate-in fade-in slide-in-from-top-2 duration-200">
          {/* Accuracy Highlight Pill */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/40 bg-amber-500/15 px-3 py-1 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
            <Sparkles className="h-3.5 w-3.5 text-amber-400" />
            <span className="text-xs font-black text-amber-300">
              {isArabic ? 'النظام يحقق نتائج 90% من الدقة' : 'System achieves 90% accuracy results'}
            </span>
          </div>

          {/* Dispute prevention explanation */}
          <p className="text-xs sm:text-sm font-bold text-slate-200 leading-snug">
            {isArabic ? 'تجنباً للخلاف مع الكابتن المعلن في نقطة الوصول' : 'To avoid disputes with the advertiser captain on arrival'}
          </p>

          {/* Google Maps verification tip */}
          <div className="rounded-xl border border-rose-500/25 bg-rose-500/10 p-2.5 text-xs font-bold text-rose-200 leading-relaxed shadow-inner">
            {isArabic
              ? 'إذا رغبت، تحقق من الإحداثيات عبر خرائط Google قبل تأكيد الطلب'
              : 'If you wish, please verify the coordinates on Google Maps before confirming'}
          </div>
        </div>
      )}
    </div>
  );
}

